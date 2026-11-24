import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import { account, session, user, verification } from "./schema";
import { magicLinkEmail, sendEmail } from "./email";
import { rememberMagicLink } from "./magic-link-store";
import {
  shouldCaptureMagicLink,
  shouldSkipMagicLinkEmail,
} from "./dev-test-auth";
import { assertMagicLinkIntentAllowed } from "./auth-intent";
import { env, isProductionDeployment, requireEnv } from "./env";
import { checkMagicLinkSend, clientIp } from "./abuse-guard";

const REJECTION = {
  400: ["BAD_REQUEST", "Проверь почту: что-то в адресе не так."],
  429: ["TOO_MANY_REQUESTS", "Слишком много писем. Попробуй позже."],
  503: ["SERVICE_UNAVAILABLE", "Вход по почте временно выключен."],
} as const;

function honeypotFrom(metadata: unknown): unknown {
  return metadata && typeof metadata === "object" && "website" in metadata
    ? metadata.website
    : undefined;
}

export function createAuth() {
  return betterAuth({
    baseURL: isProductionDeployment()
      ? requireEnv("BETTER_AUTH_URL")
      : env().BETTER_AUTH_URL,
    secret: requireEnv("BETTER_AUTH_SECRET"),
    advanced: {
      // Production always gets Secure cookies (Better Auth then adds the
      // __Secure- prefix); elsewhere it follows the base URL's protocol.
      ...(isProductionDeployment() ? { useSecureCookies: true } : {}),
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    },
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    plugins: [
      magicLink({
        expiresIn: 60 * 15,
        allowedAttempts: 1,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url, token, metadata }, ctx) => {
          await assertMagicLinkIntentAllowed(email, metadata, ctx?.body?.name);
          if (shouldCaptureMagicLink()) rememberMagicLink(email, url, token);
          if (shouldSkipMagicLinkEmail(email)) return;
          // Every real send passes the durable abuse guard first; see
          // docs/security-guardrails.md.
          const decision = await checkMagicLinkSend({
            email,
            ip: clientIp(ctx?.headers ?? ctx?.request?.headers),
            honeypot: honeypotFrom(metadata),
          });
          if (decision.action === "fake-success") return;
          if (decision.action === "reject") {
            const [status, message] = REJECTION[decision.status];
            throw new APIError(status, { message });
          }
          const { subject, html, text } = magicLinkEmail(url);
          await sendEmail({ to: decision.email, subject, html, text });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

// Built on first request, so missing auth config fails that request (closed)
// instead of the build that imports this module.
export function getAuth(): Auth {
  return (instance ??= createAuth());
}
