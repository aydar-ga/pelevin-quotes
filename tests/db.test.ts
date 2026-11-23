import { afterEach, describe, expect, it, vi } from "vitest";

describe("lib/db", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("imports without DATABASE_URL, so the build never needs it", async () => {
    vi.stubEnv("DATABASE_URL", "");
    await expect(import("@/lib/db")).resolves.toHaveProperty("db");
  });

  it("fails closed when a request first uses the database without DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { db } = await import("@/lib/db");
    expect(() => db.select()).toThrow(
      "Missing required environment variable: DATABASE_URL",
    );
  });
});
