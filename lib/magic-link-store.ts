type Entry = { url: string; token: string; createdAt: number };

declare global {
  var __magicLinkStore: Map<string, Entry> | undefined;
}

const store = (globalThis.__magicLinkStore ??= new Map<string, Entry>());

export function rememberMagicLink(email: string, url: string, token: string) {
  store.set(email.toLowerCase(), { url, token, createdAt: Date.now() });
}

export function readMagicLink(email: string): Entry | undefined {
  return store.get(email.toLowerCase());
}

export function clearMagicLinks() {
  store.clear();
}
