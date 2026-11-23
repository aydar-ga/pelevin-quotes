import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const readMagicLink = vi.fn();

vi.mock("@/lib/magic-link-store", () => ({
  readMagicLink: (...args: unknown[]) => readMagicLink(...args),
}));

import { GET } from "@/app/api/test/last-magic-link/route";

const request = (email = "dev@test.local") =>
  new Request(
    `http://localhost/api/test/last-magic-link?email=${encodeURIComponent(email)}`,
  );

describe("/api/test/last-magic-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("E2E_TEST_MODE", "true");
    vi.stubEnv("VERCEL_ENV", "");
    readMagicLink.mockReturnValue({
      url: "http://localhost/api/auth/magic-link/verify?token=t",
      token: "t",
      createdAt: 1,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is hidden unless e2e test mode is on", async () => {
    vi.stubEnv("E2E_TEST_MODE", "false");
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(readMagicLink).not.toHaveBeenCalled();
  });

  it("is hidden in Vercel Production even when the flag is set by mistake", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const response = await GET(request());
    expect(response.status).toBe(404);
    expect(readMagicLink).not.toHaveBeenCalled();
  });

  it("returns the captured link in test mode", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      found: true,
      token: "t",
    });
  });
});
