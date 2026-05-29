import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const fromMock = vi.fn();
const whereMock = vi.fn();
const limitMock = vi.fn();
const insertMock = vi.fn();
const deleteMock = vi.fn();
const innerJoinMock = vi.fn();
const orderByMock = vi.fn();
const valuesMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => {
      selectMock(...args);
      return {
        from: (...fromArgs: unknown[]) => {
          fromMock(...fromArgs);
          return {
            where: (...whereArgs: unknown[]) => {
              whereMock(...whereArgs);
              return {
                limit: (...limitArgs: unknown[]) => limitMock(...limitArgs),
                orderBy: (...orderArgs: unknown[]) => {
                  orderByMock(...orderArgs);
                  return Promise.resolve([]);
                },
              };
            },
            innerJoin: (...joinArgs: unknown[]) => {
              innerJoinMock(...joinArgs);
              return {
                where: () => ({
                  orderBy: () => Promise.resolve([]),
                }),
              };
            },
          };
        },
      };
    },
    insert: (...args: unknown[]) => {
      insertMock(...args);
      return { values: valuesMock };
    },
    delete: (...args: unknown[]) => {
      deleteMock(...args);
      return { where: () => Promise.resolve(undefined) };
    },
  },
}));

import { toggleBookmark } from "@/lib/bookmarks";

describe("toggleBookmark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limitMock.mockResolvedValue([]);
    valuesMock.mockResolvedValue(undefined);
  });

  it("creates a bookmark when none exists", async () => {
    const result = await toggleBookmark("user-1", 7);
    expect(result).toBe(true);
    expect(insertMock).toHaveBeenCalled();
    expect(valuesMock).toHaveBeenCalledWith({ userId: "user-1", quoteId: 7 });
  });

  it("removes a bookmark when one exists", async () => {
    limitMock.mockImplementationOnce(async () => [{ id: 99 }]);
    const result = await toggleBookmark("user-1", 7);
    expect(result).toBe(false);
    expect(deleteMock).toHaveBeenCalled();
  });
});
