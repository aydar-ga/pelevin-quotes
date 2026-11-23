export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBuckets = new Map<string, Bucket>();
export const MAX_IN_MEMORY_BUCKETS = 5_000;
const DEFAULT_RANDOM_QUOTE_LIMIT = 60;
const DEFAULT_RANDOM_QUOTE_WINDOW_MS = 60_000;
const DEFAULT_VOTE_LIMIT = 30;
const DEFAULT_VOTE_WINDOW_MS = 60_000;

function positiveIntFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function resetInMemoryRateLimit() {
  memoryBuckets.clear();
}

export function inMemoryRateLimitSize() {
  return memoryBuckets.size;
}

// One bucket per client IP would otherwise grow for the lifetime of a warm
// serverless instance. Map iteration order is insertion order, so the
// overflow loop drops the oldest buckets first.
function evictBuckets(now: number) {
  if (memoryBuckets.size < MAX_IN_MEMORY_BUCKETS) return;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
  for (const key of memoryBuckets.keys()) {
    if (memoryBuckets.size < MAX_IN_MEMORY_BUCKETS) break;
    memoryBuckets.delete(key);
  }
}

export function checkInMemoryRateLimit(
  key: string,
  options: RateLimitOptions,
  now = Date.now(),
): RateLimitResult {
  const existing = memoryBuckets.get(key);
  if (!existing) evictBuckets(now);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + options.windowMs };

  bucket.count += 1;
  memoryBuckets.set(key, bucket);

  const remaining = Math.max(options.limit - bucket.count, 0);

  return {
    allowed: bucket.count <= options.limit,
    limit: options.limit,
    remaining,
    resetAt: bucket.resetAt,
  };
}

export function rateLimitKeyFromHeaders(headers: Headers, scope: string) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  return `${scope}:${forwardedFor || realIp || "anonymous"}`;
}

async function checkUpstashRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return checkInMemoryRateLimit(key, options);
  }

  const now = Date.now();
  const windowId = Math.floor(now / options.windowMs);
  const redisKey = `rate:${key}:${windowId}`;
  const windowSeconds = Math.ceil(options.windowMs / 1000);

  let count: number;
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSeconds],
      ]),
    });
    if (!response.ok) return checkInMemoryRateLimit(key, options);

    const payload = (await response.json()) as Array<{
      result?: number;
      error?: string;
    }>;
    count = Number(payload[0]?.result);
  } catch {
    return checkInMemoryRateLimit(key, options);
  }
  if (!Number.isFinite(count)) return checkInMemoryRateLimit(key, options);

  return {
    allowed: count <= options.limit,
    limit: options.limit,
    remaining: Math.max(options.limit - count, 0),
    resetAt: (windowId + 1) * options.windowMs,
  };
}

export async function checkRandomQuoteRateLimit(headers: Headers) {
  const options = {
    limit: positiveIntFromEnv(
      process.env.RANDOM_QUOTE_RATE_LIMIT,
      DEFAULT_RANDOM_QUOTE_LIMIT,
    ),
    windowMs:
      positiveIntFromEnv(
        process.env.RANDOM_QUOTE_RATE_LIMIT_WINDOW_SECONDS,
        DEFAULT_RANDOM_QUOTE_WINDOW_MS / 1000,
      ) * 1000,
  };
  return checkUpstashRateLimit(
    rateLimitKeyFromHeaders(headers, "randomQuote"),
    options,
  );
}

export async function checkVoteRateLimit(userId: string) {
  return checkUpstashRateLimit(`votes:${userId}`, {
    limit: positiveIntFromEnv(process.env.VOTE_RATE_LIMIT, DEFAULT_VOTE_LIMIT),
    windowMs:
      positiveIntFromEnv(
        process.env.VOTE_RATE_LIMIT_WINDOW_SECONDS,
        DEFAULT_VOTE_WINDOW_MS / 1000,
      ) * 1000,
  });
}

export function rateLimitHeaders(result: RateLimitResult) {
  const resetSeconds = Math.max(Math.ceil((result.resetAt - Date.now()) / 1000), 0);
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { "Retry-After": String(resetSeconds) }),
  };
}
