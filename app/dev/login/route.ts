import { NextResponse } from "next/server";
import {
  DEV_TEST_USER_NAME,
  devTestUserEmail,
  isDevTestAuthEnabled,
} from "@/lib/dev-test-auth";
import { env } from "@/lib/env";
import { readMagicLink } from "@/lib/magic-link-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Checked here as well as in the flag helper, so one wrong env var in
  // Production cannot open this route.
  if (env().VERCEL_ENV === "production" || !isDevTestAuthEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  const signInResponse = await fetch(
    `${origin}/api/auth/sign-in/magic-link`,
    {
      method: "POST",
      // Better Auth 1.7+ rejects POSTs that carry fetch metadata (Node's
      // fetch sends Sec-Fetch-Mode) but no Origin.
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({
        email: devTestUserEmail(),
        name: DEV_TEST_USER_NAME,
        callbackURL: "/?welcome=1",
        metadata: { intent: "sign-up" },
      }),
    },
  );

  if (!signInResponse.ok) {
    return NextResponse.json(
      { error: "Failed to create dev session" },
      { status: 500 },
    );
  }

  const entry = readMagicLink(devTestUserEmail());
  if (!entry) {
    return NextResponse.json(
      { error: "Magic link not captured" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(entry.url);
}
