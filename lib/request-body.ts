const POSTGRES_INT_MAX = 2_147_483_647;

// Requiring application/json keeps plain cross-site HTML forms out of the
// write endpoints, on top of the SameSite=Lax session cookie.
export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return null;

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  return parsed as Record<string, unknown>;
}

export function isQuoteId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= POSTGRES_INT_MAX
  );
}
