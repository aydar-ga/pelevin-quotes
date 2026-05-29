import { expect, test } from "@playwright/test";

const testUserEmail =
  process.env.E2E_TEST_USER_EMAIL ?? "aydarcyber@gmail.com";

test.describe("auth (magic link)", () => {
  test("user lands on the home dashboard after magic link sign-in", async ({
    page,
    request,
    baseURL,
  }) => {
    test.info().annotations.push({
      type: "email",
      description: testUserEmail,
    });

    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\?signIn=1/);
    await page.getByLabel(/почта/i).fill(testUserEmail);
    await page.getByRole("button", { name: /прислать/i }).click();
    await expect(page.getByText(/проверь почту/i)).toBeVisible();

    let magicUrl: string | undefined;
    for (let i = 0; i < 30; i++) {
      const res = await request.get(
        `${baseURL}/api/test/last-magic-link?email=${encodeURIComponent(
          testUserEmail,
        )}`,
      );
      if (res.ok()) {
        const body = (await res.json()) as { url?: string; found?: boolean };
        if (body.found && body.url) {
          magicUrl = body.url;
          break;
        }
      }
      await page.waitForTimeout(500);
    }
    expect(magicUrl, "magic link should be captured").toBeDefined();

    await page.goto(magicUrl as string);
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /цитатки из пелевина/i }),
    ).toBeVisible();

    await page.getByTestId("auth-menu-trigger").click();
    await expect(page.getByTestId("signed-in-email")).toHaveText(testUserEmail);

    await page.getByRole("menuitem", { name: /выйти/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /войти/i })).toBeVisible();
  });
});
