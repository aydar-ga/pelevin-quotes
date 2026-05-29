import { expect, test } from "@playwright/test";
import { DEV_TEST_USER_EMAIL, signInForE2E, signOutViaUI } from "./helpers/auth";

test.describe("auth (dev test login)", () => {
  test("user lands on home, sees account panel, and can sign out", async ({
    page,
  }) => {
    await signInForE2E(page);

    await expect(
      page.getByRole("heading", { name: /цитатки из пелевина/i }),
    ).toBeVisible();

    await page.getByTestId("auth-menu-trigger").click();
    await expect(page.getByTestId("account-panel-email")).toHaveText(
      DEV_TEST_USER_EMAIL,
    );

    await signOutViaUI(page);
    await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  });
});
