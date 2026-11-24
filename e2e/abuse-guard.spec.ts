import { expect, test } from "@playwright/test";
import { DEV_TEST_USER_EMAIL, signInForE2E } from "./helpers/auth";

// Unique per run, so the durable counters in a reused local DB start empty.
const run = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
let ipSeq = 0;
const freshIp = () => {
  ipSeq += 1;
  return `10.${Math.floor(Math.random() * 200)}.${Math.floor(ipSeq / 250)}.${ipSeq % 250}`;
};
const asIp = (ip: string) => ({ "x-real-ip": ip, "x-forwarded-for": ip });

test.describe("abuse guardrails (durable counters)", () => {
  test("a recipient gets at most 3 sign-in emails per hour, even from new IPs", async ({
    request,
    baseURL,
  }) => {
    const email = `cap-${run}@example.com`;
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      const response = await request.post("/api/auth/sign-in/magic-link", {
        headers: { Origin: baseURL!, ...asIp(freshIp()) },
        data: {
          email,
          name: "Cap Test",
          callbackURL: "/",
          metadata: { intent: "sign-up" },
        },
      });
      statuses.push(response.status());
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
  });

  test("magic-link verification is capped at 20 per IP per 10 minutes", async ({
    request,
  }) => {
    const ip = freshIp();
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      const response = await request.get(
        `/api/auth/magic-link/verify?token=bogus-${run}-${i}&callbackURL=/`,
        { headers: asIp(ip), maxRedirects: 0 },
      );
      statuses.push(response.status());
    }
    expect(statuses.slice(0, 20)).not.toContain(429);
    expect(statuses[20]).toBe(429);
  });
});

test.describe("sign-out", () => {
  test("is POST-only and refuses a cross-site origin", async ({ page }) => {
    await signInForE2E(page);

    const viaGet = await page.request.get("/api/auth/sign-out");
    expect(viaGet.status()).not.toBe(200);

    const crossSite = await page.request.post("/api/auth/sign-out", {
      headers: { Origin: "https://evil.example" },
    });
    expect(crossSite.status()).toBe(403);

    const session = await page.request.get("/api/auth/get-session");
    expect((await session.json())?.user?.email).toBe(DEV_TEST_USER_EMAIL);
  });
});
