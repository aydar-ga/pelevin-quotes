import { z } from "zod";

const POSTGRES_INT_MAX = 2_147_483_647;

// Write bodies are tiny ({ quoteId, value }); anything larger is abuse.
export const MAX_JSON_BODY_BYTES = 2_048;

export const quoteIdSchema = z.number().int().min(1).max(POSTGRES_INT_MAX);

export const quoteIdParamSchema = z
  .string()
  .regex(/^[1-9]\d{0,9}$/)
  .transform(Number)
  .pipe(quoteIdSchema);

export const bookmarkBodySchema = z.object({ quoteId: quoteIdSchema });

export const voteBodySchema = z.object({
  quoteId: quoteIdSchema,
  value: z.union([z.literal(1), z.literal(-1)]),
});

// Requiring application/json keeps plain cross-site HTML forms out of the
// write endpoints, on top of the SameSite=Lax session cookie.
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return null;

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_JSON_BODY_BYTES) return null;

  let parsed: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
      return null;
    }
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

export function isQuoteId(value: unknown): value is number {
  return quoteIdSchema.safeParse(value).success;
}
