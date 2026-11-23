import { expect, test, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { DEV_TEST_USER_EMAIL, signInForE2E } from "./helpers/auth";

type Summary = {
  quoteId: number;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: number;
};

async function randomQuoteId(request: APIRequestContext) {
  const response = await request.get("/api/randomQuote");
  return ((await response.json()) as { id: number }).id;
}

async function vote(request: APIRequestContext, quoteId: number, value: number) {
  return request.post("/api/votes", { data: { quoteId, value } });
}

async function clearOwnVote(request: APIRequestContext, quoteId: number) {
  const detail = await request.get(`/api/quotes/${quoteId}`);
  const current = ((await detail.json()) as { vote: Summary }).vote.userVote;
  if (current !== 0) await vote(request, quoteId, current);
}

test.describe("votes API", () => {
  test("rejects guests with 401", async ({ request }) => {
    const response = await vote(request, 1, 1);
    expect(response.status()).toBe(401);
  });

  test("rejects malformed bodies with 400 and unknown quotes with 404", async ({
    page,
  }) => {
    await signInForE2E(page);

    const malformed = await page.request.post("/api/votes", {
      headers: { "Content-Type": "application/json" },
      data: "{oops",
    });
    expect(malformed.status()).toBe(400);

    const overflow = await vote(page.request, 2 ** 31, 1);
    expect(overflow.status()).toBe(400);

    const missing = await vote(page.request, 2147483647, 1);
    expect(missing.status()).toBe(404);
  });

  test("switching from up to down moves the score by two", async ({ page }) => {
    await signInForE2E(page);
    const quoteId = await randomQuoteId(page.request);
    await clearOwnVote(page.request, quoteId);

    const up = (await (await vote(page.request, quoteId, 1)).json()) as Summary;
    expect(up.userVote).toBe(1);

    const downResponse = await vote(page.request, quoteId, -1);
    expect(downResponse.status()).toBe(200);
    const down = (await downResponse.json()) as Summary;
    expect(down.userVote).toBe(-1);
    expect(down.score).toBe(up.score - 2);

    const cleared = (await (await vote(page.request, quoteId, -1)).json()) as Summary;
    expect(cleared.userVote).toBe(0);
    expect(cleared.score).toBe(up.score - 1);
  });

  test("two identical votes at once never fail", async ({ page }) => {
    await signInForE2E(page);
    const quoteId = await randomQuoteId(page.request);
    await clearOwnVote(page.request, quoteId);

    const responses = await Promise.all([
      vote(page.request, quoteId, 1),
      vote(page.request, quoteId, 1),
    ]);
    expect(responses.map((r) => r.status())).toEqual([200, 200]);

    await clearOwnVote(page.request, quoteId);
  });
});

test.describe("/top page", () => {
  const OTHER_USER_ID = "e2e-top-other-voter";

  test("keeps an older own vote pressed on the weekly board", async ({
    page,
  }) => {
    test.skip(!process.env.DATABASE_URL, "needs direct database access");

    await signInForE2E(page);
    const quoteId = await randomQuoteId(page.request);
    await clearOwnVote(page.request, quoteId);
    expect((await vote(page.request, quoteId, 1)).status()).toBe(200);

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      await client.query(
        `update quote_votes set updated_at = now() - interval '8 days'
         where quote_id = $1
           and user_id = (select id from "user" where email = $2)`,
        [quoteId, DEV_TEST_USER_EMAIL],
      );
      await client.query(
        `insert into "user" (id, name, email, email_verified)
         values ($1, 'E2E Other', 'e2e-top-other@test.local', true)
         on conflict (id) do nothing`,
        [OTHER_USER_ID],
      );
      await client.query(
        `insert into quote_votes (user_id, quote_id, value)
         values ($1, $2, 1)
         on conflict (user_id, quote_id) do update set value = 1, updated_at = now()`,
        [OTHER_USER_ID, quoteId],
      );

      await page.goto("/top?range=week");
      await expect(
        page.getByRole("heading", { name: "Топ цитат" }),
      ).toBeVisible();
      const row = page.locator("li", {
        has: page.locator(`a[href="/q/${quoteId}"]`),
      });
      await expect(row).toBeVisible();
      await expect(row.getByRole("button", { name: "В плюс" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );

      const allTime = await page.goto("/top?range=all");
      expect(allTime?.status()).toBe(200);
      await expect(row).toBeVisible();
    } finally {
      await client.query(`delete from "user" where id = $1`, [OTHER_USER_ID]);
      await client.end();
      await clearOwnVote(page.request, quoteId);
    }
  });
});
