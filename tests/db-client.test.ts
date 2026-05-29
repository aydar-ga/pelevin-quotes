import { describe, expect, it } from "vitest";
import { isLocalPostgresUrl } from "@/lib/db-client";

describe("db-client", () => {
  it("detects localhost Postgres URLs for CI", () => {
    expect(
      isLocalPostgresUrl("postgresql://postgres:postgres@localhost:5432/pelevin_ci"),
    ).toBe(true);
    expect(
      isLocalPostgresUrl("postgres://postgres:postgres@127.0.0.1:5432/db"),
    ).toBe(true);
  });

  it("treats Neon URLs as remote", () => {
    expect(
      isLocalPostgresUrl(
        "postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require",
      ),
    ).toBe(false);
  });
});
