import { beforeEach, describe, expect, it } from "vitest";
import {
  clearMagicLinks,
  readMagicLink,
  rememberMagicLink,
} from "@/lib/magic-link-store";

describe("magic-link-store", () => {
  beforeEach(() => {
    clearMagicLinks();
  });

  it("remembers a magic link keyed by lowercased email", () => {
    rememberMagicLink("Foo@Example.com", "https://app/verify?token=abc", "abc");
    expect(readMagicLink("foo@example.com")?.token).toBe("abc");
    expect(readMagicLink("FOO@EXAMPLE.COM")?.url).toBe(
      "https://app/verify?token=abc",
    );
  });

  it("overwrites the previous entry for the same email", () => {
    rememberMagicLink("a@b.c", "u1", "t1");
    rememberMagicLink("a@b.c", "u2", "t2");
    expect(readMagicLink("a@b.c")?.token).toBe("t2");
  });

  it("returns undefined for unknown emails", () => {
    expect(readMagicLink("nobody@example.com")).toBeUndefined();
  });
});
