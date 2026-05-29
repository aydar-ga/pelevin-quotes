import { expect, test } from "@playwright/test";
import { E2E_TEST_USER_EMAIL, signInViaMagicLink } from "./helpers/auth";

test.describe("auth (magic link)", () => {
  test("user lands on the home dashboard after magic link sign-in", async ({
    page,
    baseURL,
  }) => {
    test.info().annotations.push({
      type: "email",
      description: E2E_TEST_USER_EMAIL,
    });

    await signInViaMagicLink(page, baseURL!);

    await expect(
      page.getByRole("heading", { name: /цитатки из пелевина/i }),
    ).toBeVisible();

    await page.getByTestId("auth-menu-trigger").click();
    await expect(page.getByTestId("account-panel-email")).toHaveText(
      E2E_TEST_USER_EMAIL,
    );

    await page.getByRole("button", { name: /выйти/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  });
});
