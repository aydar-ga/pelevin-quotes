import { z } from "zod";

// The only module that reads process.env (CFG-1). It parses on every call and
// never at import, so a missing variable fails the request that needs it
// instead of the build, and tests can stub variables between calls.

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(blankToUndefined, schema.optional());

const flag = z
  .string()
  .optional()
  .transform((value) => value === "true");

const schema = z.object({
  VERCEL_ENV: optional(z.string()),
  DATABASE_URL: optional(z.string()),
  BETTER_AUTH_URL: optional(z.url()),
  BETTER_AUTH_SECRET: optional(
    z.string().min(32, "must be at least 32 characters"),
  ),
  RESEND_API_KEY: optional(z.string()),
  AUTH_EMAIL_FROM: optional(z.string()),
  UPSTASH_REDIS_REST_URL: optional(z.url()),
  UPSTASH_REDIS_REST_TOKEN: optional(z.string()),
  RANDOM_QUOTE_RATE_LIMIT: optional(z.string()),
  RANDOM_QUOTE_RATE_LIMIT_WINDOW_SECONDS: optional(z.string()),
  VOTE_RATE_LIMIT: optional(z.string()),
  VOTE_RATE_LIMIT_WINDOW_SECONDS: optional(z.string()),
  AUTH_EMAIL_ENABLED: optional(z.string()),
  DEV_TEST_AUTH: flag,
  DEV_TEST_USER_EMAIL: optional(z.email()),
  E2E_TEST_MODE: flag,
});

export type Env = z.infer<typeof schema>;

export function env(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // Names and rules only: values may be secrets.
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${problems}`);
  }
  return parsed.data;
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env()[key];
  if (value === undefined || value === null) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as NonNullable<Env[K]>;
}

export function isProductionDeployment() {
  return env().VERCEL_ENV === "production";
}
