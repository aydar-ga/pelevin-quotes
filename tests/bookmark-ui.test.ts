import { describe, expect, it } from "vitest";
import { emailInitial, sourceLabel } from "@/lib/bookmark-ui";

describe("emailInitial", () => {
  it("returns the first letter of the local part", () => {
    expect(emailInitial("pelevin@test.local")).toBe("P");
  });

  it("returns ? for malformed emails", () => {
    expect(emailInitial("@")).toBe("?");
  });
});

describe("sourceLabel", () => {
  it("returns a trimmed book title", () => {
    expect(sourceLabel("  S.N.U.F.F. ")).toBe("S.N.U.F.F.");
  });

  it("uses a fallback label when book is empty", () => {
    expect(sourceLabel("  ")).toBe("Без названия");
  });
});
