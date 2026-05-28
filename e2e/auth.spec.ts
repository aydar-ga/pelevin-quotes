import { expect, test } from "@playwright/test";
import { createTempAccount } from "./helpers/mailtm";

test.describe("auth (magic link)", () => {
  test("user can sign in via magic link with a real temp inbox", async ({
    page,
    request,
    baseURL,
  }) => {
    const account = await createTempAccount();
    test.info().annotations.push({ type: "email", description: account.address });

    await page.goto("/sign-in");
    await page.getByLabel(/почта/i).fill(account.address);
    await page.getByRole("button", { name: /прислать/i }).click();
    await expect(page.getByText(/проверь почту/i)).toBeVisible();

    let magicUrl: string | undefined;
    for (let i = 0; i < 30; i++) {
      const res = await request.get(
        `${baseURL}/api/test/last-magic-link?email=${encodeURIComponent(
          account.address,
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
    await expect(page).toHaveURL(/\/me$/);
    await expect(page.getByTestId("signed-in-email")).toHaveText(
      account.address,
    );

    await page.getByRole("button", { name: /выйти/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
