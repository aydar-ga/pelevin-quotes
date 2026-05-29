import { describe, expect, it } from "vitest";
import { shouldRunMigrations } from "@/lib/vercel-build";

describe("shouldRunMigrations", () => {
  it("runs on Vercel when DATABASE_URL is set", () => {
    expect(
      shouldRunMigrations({ VERCEL: "1", DATABASE_URL: "postgres://x" }),
    ).toBe(true);
  });

  it("skips during local CI build", () => {
    expect(
      shouldRunMigrations({
        DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      }),
    ).toBe(false);
  });

  it("skips on Vercel when DATABASE_URL is missing", () => {
    expect(shouldRunMigrations({ VERCEL: "1" })).toBe(false);
  });
});
