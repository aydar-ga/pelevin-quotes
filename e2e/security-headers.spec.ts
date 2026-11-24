import { expect, test } from "@playwright/test";

test.describe("security headers", () => {
  test("home sends the baseline headers and an enforced CSP", async ({
    request,
  }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["strict-transport-security"]).toContain("max-age=");
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("browsing the public pages raises no CSP violations", async ({
    page,
  }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/Content Security Policy/i.test(message.text())) {
        violations.push(message.text());
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: /Давай цитатку/ }).click();
    await expect(page.getByText(/^".+"$/).first()).toBeVisible();
    await page.goto("/top");
    await page.goto("/q/1");
    await page.waitForLoadState("networkidle");

    expect(violations).toEqual([]);
  });

  test("publishes security.txt with a contact", async ({ request }) => {
    const response = await request.get("/.well-known/security.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toMatch(/^Contact: https:\/\/github\.com\/aydar-ga\/pelevin-quotes\/security\/advisories/m);
    expect(body).toMatch(/^Expires: /m);
  });
});
