import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const DEV_TEST_USER_EMAIL =
  process.env.DEV_TEST_USER_EMAIL ?? "dev@test.local";

async function waitForSessionEmail(page: Page, email: string) {
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/get-session");
      const session = (await res.json()) as { user?: { email?: string } } | null;
      return session?.user?.email ?? null;
    })
    .toBe(email);
}

/** Signs in via /dev/login — no magic link UI, no Resend emails (see playwright.config.ts). */
export async function signInForE2E(page: Page) {
  if (process.env.DEV_TEST_AUTH !== "true") {
    throw new Error(
      "Playwright E2E requires DEV_TEST_AUTH=true on the webServer (see playwright.config.ts)",
    );
  }

  await page.goto("/dev/login");
  await page.waitForURL(/\/(\?welcome=1)?$/);
  await waitForSessionEmail(page, DEV_TEST_USER_EMAIL);
}

export async function signOutViaUI(page: Page) {
  const logout = page.getByRole("button", { name: /выйти/i });
  if (!(await logout.isVisible())) {
    await page.getByTestId("auth-menu-trigger").click();
  }
  await logout.click();
  await page.waitForURL(/\/$/);
}
