const MAILTM = "https://api.mail.tm";

type Domain = { id: string; domain: string; isActive: boolean };
type Account = { address: string; password: string; token: string };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`mail.tm ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function getActiveDomain(): Promise<string> {
  const data = await fetchJson<Domain[] | { "hydra:member": Domain[] }>(
    `${MAILTM}/domains?page=1`,
  );
  const list = Array.isArray(data) ? data : data["hydra:member"];
  const domain = list.find((d) => d.isActive);
  if (!domain) throw new Error("mail.tm has no active domain");
  return domain.domain;
}

export async function createTempAccount(): Promise<Account> {
  const domain = await getActiveDomain();
  const local = `pelevin-e2e-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const address = `${local}@${domain}`;
  const password = `Pw-${Math.random().toString(36).slice(2, 12)}!`;

  await fetchJson(`${MAILTM}/accounts`, {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });

  const { token } = await fetchJson<{ token: string }>(`${MAILTM}/token`, {
    method: "POST",
    body: JSON.stringify({ address, password }),
  });

  return { address, password, token };
}
