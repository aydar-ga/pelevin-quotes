import type { Page } from "@playwright/test";

export const E2E_TEST_USER_EMAIL =
  process.env.E2E_TEST_USER_EMAIL ?? "aydarcyber@gmail.com";

export async function waitForMagicLink(
  page: Page,
  baseURL: string,
  email: string,
): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await page.request.get(
      `${baseURL}/api/test/last-magic-link?email=${encodeURIComponent(email)}`,
    );
    if (res.ok()) {
      const body = (await res.json()) as { url?: string; found?: boolean };
      if (body.found && body.url) return body.url;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`magic link not captured for ${email}`);
}

export async function signInViaMagicLink(
  page: Page,
  baseURL: string,
  email = E2E_TEST_USER_EMAIL,
) {
  await page.goto("/sign-in");
  await page.getByLabel(/почта/i).fill(email);
  await page.getByRole("button", { name: /прислать/i }).click();
  await page.getByText(/проверь почту/i).waitFor();

  const magicUrl = await waitForMagicLink(page, baseURL, email);
  await page.goto(magicUrl);
  await page.waitForURL(/\/(\?welcome=1)?$/);
}
