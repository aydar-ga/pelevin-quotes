export type BookmarkItem = {
  id: number;
  text: string;
  book: string;
  author: string;
};

export function sourceLabel(book: string): string {
  return book.trim() || "Без названия";
}

export function emailInitial(email: string): string {
  const local = email.split("@")[0]?.trim();
  if (!local) return "?";
  return local.charAt(0).toUpperCase();
}
