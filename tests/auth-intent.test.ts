import { beforeEach, describe, expect, it, vi } from "vitest";

const where = vi.fn();
const limit = vi.fn();
const from = vi.fn();
const select = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

const eq = vi.fn((column: unknown, value: unknown) => ({ column, value }));

vi.mock("drizzle-orm", () => ({
  eq: (column: unknown, value: unknown) => eq(column, value),
}));

vi.mock("@/lib/schema", () => ({
  user: {
    id: "id",
    email: "email",
  },
}));

import {
  assertMagicLinkIntentAllowed,
  magicLinkIntent,
} from "@/lib/auth-intent";

describe("magicLinkIntent", () => {
  beforeEach(() => {
    limit.mockReset();
    eq.mockClear();
    where.mockReset();
    from.mockReset();
    select.mockReset();

    limit.mockResolvedValue([{ id: "user-1" }]);
    where.mockReturnValue({ limit });
    from.mockReturnValue({ where });
    select.mockReturnValue({ from });
  });

  it("defaults to sign-in intent", () => {
    expect(magicLinkIntent(undefined)).toBe("sign-in");
  });

  it("detects sign-up intent", () => {
    expect(magicLinkIntent({ intent: "sign-up" })).toBe("sign-up");
  });

  it("allows sign-up without checking for an existing user", async () => {
    await assertMagicLinkIntentAllowed(
      "new@example.com",
      { intent: "sign-up" },
      "Ада",
    );
    expect(select).not.toHaveBeenCalled();
  });

  it("rejects sign-up without a name, even when the client skips the form", async () => {
    await expect(
      assertMagicLinkIntentAllowed("new@example.com", { intent: "sign-up" }),
    ).rejects.toThrow("MAGIC_LINK_SIGN_UP_REQUIRES_NAME");
    await expect(
      assertMagicLinkIntentAllowed(
        "new@example.com",
        { intent: "sign-up" },
        "   ",
      ),
    ).rejects.toThrow("MAGIC_LINK_SIGN_UP_REQUIRES_NAME");
  });

  it("looks up existing users by lowercased email, as Better Auth stores them", async () => {
    await assertMagicLinkIntentAllowed(" Old@Example.com ", {
      intent: "sign-in",
    });
    expect(eq).toHaveBeenCalledWith("email", "old@example.com");
  });

  it("allows login for an existing user", async () => {
    await expect(
      assertMagicLinkIntentAllowed("old@example.com", { intent: "sign-in" }),
    ).resolves.toBeUndefined();
  });

  it("rejects login for an unknown user", async () => {
    limit.mockResolvedValueOnce([]);

    await expect(
      assertMagicLinkIntentAllowed("new@example.com", { intent: "sign-in" }),
    ).rejects.toThrow("MAGIC_LINK_LOGIN_REQUIRES_EXISTING_USER");
  });
});
