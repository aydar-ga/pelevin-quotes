import { expect, test } from "@playwright/test";
import { DEV_TEST_USER_EMAIL, signInForE2E } from "./helpers/auth";

test.describe("quote API (public)", () => {
  test("GET /api/randomQuote returns one quote", async ({ request }) => {
    const response = await request.get("/api/randomQuote");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      id: expect.any(Number),
      text: expect.any(String),
      book: expect.any(String),
      author: expect.any(String),
    });
    expect(response.headers()["cache-control"]).toContain("no-store");
  });

  test("GET /api/allQuotes returns a quote array", async ({ request }) => {
    const response = await request.get("/api/allQuotes");
    expect(response.status()).toBe(200);

    const body = (await response.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toMatchObject({
      id: expect.any(Number),
      text: expect.any(String),
    });
  });

  test("GET /api/quotes/:id rejects invalid ids", async ({ request }) => {
    const response = await request.get("/api/quotes/not-a-number");
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Invalid id" });
  });

  test("GET /api/quotes/:id returns 404 for missing quotes", async ({
    request,
  }) => {
    const response = await request.get("/api/quotes/2147483647");
    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ error: "Not found" });
  });

  test("GET /api/quotes/:id returns detail with bookmark flag for guests", async ({
    request,
  }) => {
    const random = await request.get("/api/randomQuote");
    const { id } = (await random.json()) as { id: number };

    const response = await request.get(`/api/quotes/${id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      id,
      text: expect.any(String),
      book: expect.any(String),
      author: expect.any(String),
      bookmarked: false,
    });
  });
});

test.describe("bookmarks API (auth)", () => {
  test("GET /api/bookmarks returns 401 without a session", async ({
    request,
  }) => {
    const response = await request.get("/api/bookmarks");
    expect(response.status()).toBe(401);
  });

  test("POST /api/bookmarks returns 401 without a session", async ({
    request,
  }) => {
    const response = await request.post("/api/bookmarks", {
      data: { quoteId: 1 },
    });
    expect(response.status()).toBe(401);
  });

  test("authenticated user can list and toggle bookmarks", async ({ page }) => {
    await signInForE2E(page);
    const request = page.request;

    const random = await request.get("/api/randomQuote");
    const { id: quoteId } = (await random.json()) as { id: number };

    const add = await request.post("/api/bookmarks", {
      data: { quoteId },
    });
    expect(add.status()).toBe(200);
    expect(await add.json()).toMatchObject({
      bookmarked: true,
      quoteId,
      total: expect.any(Number),
    });

    const list = await request.get("/api/bookmarks");
    expect(list.status()).toBe(200);
    const listed = (await list.json()) as {
      items: { id: number }[];
      total: number;
    };
    expect(listed.items.some((item) => item.id === quoteId)).toBe(true);
    expect(listed.total).toBeGreaterThan(0);

    const detail = await request.get(`/api/quotes/${quoteId}`);
    expect((await detail.json()).bookmarked).toBe(true);

    const remove = await request.post("/api/bookmarks", {
      data: { quoteId },
    });
    expect(remove.status()).toBe(200);
    expect(await remove.json()).toMatchObject({ bookmarked: false, quoteId });
  });

  test("POST /api/bookmarks returns 400 for invalid quoteId", async ({
    page,
  }) => {
    await signInForE2E(page);

    const response = await page.request.post("/api/bookmarks", {
      data: { quoteId: "bad" },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Invalid quoteId" });
  });
});

test.describe("Better Auth session API", () => {
  test("GET /api/auth/get-session is null for guests", async ({ request }) => {
    const response = await request.get("/api/auth/get-session");
    expect(response.status()).toBe(200);
    expect(await response.json()).toBeNull();
  });

  test("GET /api/auth/get-session returns user after dev login", async ({
    page,
  }) => {
    await signInForE2E(page);

    const response = await page.request.get("/api/auth/get-session");
    expect(response.status()).toBe(200);
    expect((await response.json())?.user?.email).toBe(DEV_TEST_USER_EMAIL);
  });
});
