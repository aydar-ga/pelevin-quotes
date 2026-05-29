export const DEV_TEST_USER_EMAIL =
  process.env.DEV_TEST_USER_EMAIL ?? "dev@test.local";

export const DEV_TEST_USER_NAME = "Dev Tester";

export function isDevTestAuthEnabled() {
  return process.env.DEV_TEST_AUTH === "true";
}

export function shouldSkipMagicLinkEmail(email: string) {
  return (
    isDevTestAuthEnabled() &&
    email.toLowerCase() === DEV_TEST_USER_EMAIL.toLowerCase()
  );
}
