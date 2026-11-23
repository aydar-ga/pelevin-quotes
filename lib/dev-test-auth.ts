import { env, isProductionDeployment } from "./env";

export const DEV_TEST_USER_NAME = "Dev Tester";

export function devTestUserEmail() {
  return env().DEV_TEST_USER_EMAIL ?? "dev@test.local";
}

// A test flag set by mistake in Production must never open dev-only paths.
export function isDevTestAuthEnabled() {
  return !isProductionDeployment() && env().DEV_TEST_AUTH;
}

export function isE2eTestModeEnabled() {
  return !isProductionDeployment() && env().E2E_TEST_MODE;
}

export function shouldCaptureMagicLink() {
  return isDevTestAuthEnabled() || isE2eTestModeEnabled();
}

export function shouldSkipMagicLinkEmail(email: string) {
  return (
    isDevTestAuthEnabled() &&
    email.toLowerCase() === devTestUserEmail().toLowerCase()
  );
}
