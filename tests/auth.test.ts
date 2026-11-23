import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuth } from "@/lib/auth";

describe("lib/auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails closed at request time when BETTER_AUTH_SECRET is missing", () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    expect(() => getAuth()).toThrow(
      "Missing required environment variable: BETTER_AUTH_SECRET",
    );
  });
});
