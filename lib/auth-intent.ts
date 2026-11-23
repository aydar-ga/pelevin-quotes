import { eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "./schema";

type MagicLinkIntent = "sign-in" | "sign-up";

export function magicLinkIntent(metadata: unknown): MagicLinkIntent {
  if (
    metadata &&
    typeof metadata === "object" &&
    "intent" in metadata &&
    metadata.intent === "sign-up"
  ) {
    return "sign-up";
  }
  return "sign-in";
}

// The intent and name arrive from the client, so the server re-checks both:
// a hand-made request must not create a nameless account either.
export async function assertMagicLinkIntentAllowed(
  email: string,
  metadata: unknown,
  name?: unknown,
) {
  if (magicLinkIntent(metadata) === "sign-up") {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("MAGIC_LINK_SIGN_UP_REQUIRES_NAME");
    }
    return;
  }

  // Better Auth stores emails lowercased but passes the raw input here.
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()))
    .limit(1);

  if (existing.length === 0) {
    throw new Error("MAGIC_LINK_LOGIN_REQUIRES_EXISTING_USER");
  }
}
