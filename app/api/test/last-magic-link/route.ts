import { NextResponse } from "next/server";
import { isE2eTestModeEnabled } from "@/lib/dev-test-auth";
import { readMagicLink } from "@/lib/magic-link-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Checked here as well as in the flag helper, so one wrong env var in
  // Production cannot expose live sign-in links.
  if (process.env.VERCEL_ENV === "production" || !isE2eTestModeEnabled()) {
    return NextResponse.json(
      { error: "not found" },
      { status: 404 },
    );
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "email query param required" },
      { status: 400 },
    );
  }

  const entry = readMagicLink(email);
  if (!entry) {
    return NextResponse.json({ found: false }, { status: 404 });
  }

  return NextResponse.json({ found: true, ...entry });
}
