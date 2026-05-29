export type BookmarkItem = {
  id: number;
  text: string;
  book: string;
  author: string;
};

export function groupBookmarksByBook(
  items: BookmarkItem[],
): { book: string; items: BookmarkItem[] }[] {
  const map = new Map<string, BookmarkItem[]>();
  for (const item of items) {
    const key = item.book.trim() || "Без названия";
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map.entries()).map(([book, grouped]) => ({
    book,
    items: grouped,
  }));
}

export function emailInitial(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "?";
  return local.charAt(0).toUpperCase();
}
