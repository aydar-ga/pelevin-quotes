import { describe, expect, it } from "vitest";
import {
  emailInitial,
  groupBookmarksByBook,
  type BookmarkItem,
} from "@/lib/bookmark-ui";

const sample: BookmarkItem[] = [
  { id: 1, text: "A", book: "S.N.U.F.F.", author: "Пелевин" },
  { id: 2, text: "B", book: "S.N.U.F.F.", author: "Пелевин" },
  { id: 3, text: "C", book: "Generation П", author: "Пелевин" },
];

describe("groupBookmarksByBook", () => {
  it("groups items by book title", () => {
    const groups = groupBookmarksByBook(sample);
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.book === "S.N.U.F.F.")?.items).toHaveLength(2);
    expect(groups.find((g) => g.book === "Generation П")?.items).toHaveLength(1);
  });

  it("uses a fallback label when book is empty", () => {
    const groups = groupBookmarksByBook([
      { id: 1, text: "A", book: "  ", author: "Пелевин" },
    ]);
    expect(groups[0]?.book).toBe("Без названия");
  });
});

describe("emailInitial", () => {
  it("returns the first letter of the local part", () => {
    expect(emailInitial("pelevin@test.local")).toBe("P");
  });

  it("returns ? for malformed emails", () => {
    expect(emailInitial("@")).toBe("?");
  });
});
