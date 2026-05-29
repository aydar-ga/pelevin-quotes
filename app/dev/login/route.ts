import { NextResponse } from "next/server";
import {
  DEV_TEST_USER_EMAIL,
  DEV_TEST_USER_NAME,
  isDevTestAuthEnabled,
} from "@/lib/dev-test-auth";
import { readMagicLink } from "@/lib/magic-link-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDevTestAuthEnabled()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;

  const signInResponse = await fetch(
    `${origin}/api/auth/sign-in/magic-link`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: DEV_TEST_USER_EMAIL,
        name: DEV_TEST_USER_NAME,
        callbackURL: "/?welcome=1",
      }),
    },
  );

  if (!signInResponse.ok) {
    return NextResponse.json(
      { error: "Failed to create dev session" },
      { status: 500 },
    );
  }

  const entry = readMagicLink(DEV_TEST_USER_EMAIL);
  if (!entry) {
    return NextResponse.json(
      { error: "Magic link not captured" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(entry.url);
}
