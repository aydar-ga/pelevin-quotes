import { betterAuth } from "better-auth";
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

function createAuth() {
  return betterAuth({
    baseURL: isProductionDeployment()
      ? requireEnv("BETTER_AUTH_URL")
      : env().BETTER_AUTH_URL,
    secret: requireEnv("BETTER_AUTH_SECRET"),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    plugins: [
      magicLink({
        expiresIn: 60 * 15,
        sendMagicLink: async ({ email, url, token, metadata }, ctx) => {
          await assertMagicLinkIntentAllowed(email, metadata, ctx?.body?.name);
          if (shouldCaptureMagicLink()) rememberMagicLink(email, url, token);
          if (shouldSkipMagicLinkEmail(email)) return;
          const { subject, html, text } = magicLinkEmail(url);
          await sendEmail({ to: email, subject, html, text });
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
