import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import { account, session, user, verification } from "./schema";
import { magicLinkEmail, sendEmail } from "./email";
import { rememberMagicLink } from "./magic-link-store";
import { shouldSkipMagicLinkEmail } from "./dev-test-auth";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url, token }) => {
        rememberMagicLink(email, url, token);
        if (shouldSkipMagicLinkEmail(email)) return;
        const { subject, html, text } = magicLinkEmail(url);
        await sendEmail({ to: email, subject, html, text });
      },
    }),
  ],
});

export type Auth = typeof auth;
