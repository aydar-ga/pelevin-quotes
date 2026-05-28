import { NextResponse } from "next/server";
import { readMagicLink } from "@/lib/magic-link-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.E2E_TEST_MODE !== "true") {
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
