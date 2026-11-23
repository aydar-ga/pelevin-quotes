export const AUTH_CHANGED_EVENT = "pelevin:auth-changed";
export const BOOKMARKS_CHANGED_EVENT = "pelevin:bookmarks-changed";

type AuthStatus = "signed-in" | "signed-out";

export type AuthChange = {
  status: AuthStatus;
  at: number;
};

export type BookmarkChange = {
  total: number;
  quoteId?: number;
  bookmarked?: boolean;
  at: number;
};

function emitLocal<T>(key: string, detail: T) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<T>(key, { detail }));
  try {
    window.localStorage.setItem(key, JSON.stringify(detail));
  } catch {}
}

function readStorageDetail<T>(event: StorageEvent, key: string): T | null {
  if (event.key !== key || !event.newValue) return null;
  try {
    return JSON.parse(event.newValue) as T;
  } catch {
    return null;
  }
}

function publishBetterAuthSessionRefresh(status: AuthStatus) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      "better-auth.message",
      JSON.stringify({
        event: "session",
        data: { trigger: status === "signed-out" ? "signout" : "getSession" },
        clientId: "pelevin-quotes",
        timestamp: Math.floor(Date.now() / 1000),
      }),
    );
  } catch {}
}

export function publishAuthChange(status: AuthStatus) {
  const detail = { status, at: Date.now() };
  emitLocal(AUTH_CHANGED_EVENT, detail);
  publishBetterAuthSessionRefresh(status);
}

export function subscribeAuthChange(callback: (detail: AuthChange) => void) {
  const onCustom = (event: Event) => {
    callback((event as CustomEvent<AuthChange>).detail);
  };
  const onStorage = (event: StorageEvent) => {
    const detail = readStorageDetail<AuthChange>(event, AUTH_CHANGED_EVENT);
    if (detail) callback(detail);
  };

  window.addEventListener(AUTH_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function publishBookmarkChange(
  change: Omit<BookmarkChange, "at">,
) {
  emitLocal(BOOKMARKS_CHANGED_EVENT, { ...change, at: Date.now() });
}

export function subscribeBookmarkChange(
  callback: (detail: BookmarkChange) => void,
) {
  const onCustom = (event: Event) => {
    callback((event as CustomEvent<BookmarkChange>).detail);
  };
  const onStorage = (event: StorageEvent) => {
    const detail = readStorageDetail<BookmarkChange>(
      event,
      BOOKMARKS_CHANGED_EVENT,
    );
    if (detail) callback(detail);
  };

  window.addEventListener(BOOKMARKS_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(BOOKMARKS_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
