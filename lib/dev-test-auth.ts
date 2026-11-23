export const DEV_TEST_USER_EMAIL =
  process.env.DEV_TEST_USER_EMAIL ?? "dev@test.local";

export const DEV_TEST_USER_NAME = "Dev Tester";

// A test flag set by mistake in Production must never open dev-only paths.
export function isProductionDeployment() {
  return process.env.VERCEL_ENV === "production";
}

export function isDevTestAuthEnabled() {
  return !isProductionDeployment() && process.env.DEV_TEST_AUTH === "true";
}

export function isE2eTestModeEnabled() {
  return !isProductionDeployment() && process.env.E2E_TEST_MODE === "true";
}

export function shouldCaptureMagicLink() {
  return isDevTestAuthEnabled() || isE2eTestModeEnabled();
}

export function shouldSkipMagicLinkEmail(email: string) {
  return (
    isDevTestAuthEnabled() &&
    email.toLowerCase() === DEV_TEST_USER_EMAIL.toLowerCase()
  );
}
