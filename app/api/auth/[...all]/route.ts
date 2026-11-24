import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { checkMagicLinkVerify, clientIp } from "@/lib/abuse-guard";
import { getAuth } from "@/lib/auth";

export async function GET(request: Request) {
  if (new URL(request.url).pathname.endsWith("/magic-link/verify")) {
    const allowed = await checkMagicLinkVerify(clientIp(request.headers));
    if (!allowed) {
      return NextResponse.json(
        { error: "Слишком много попыток входа. Попробуй позже." },
        { status: 429 },
      );
    }
  }
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
