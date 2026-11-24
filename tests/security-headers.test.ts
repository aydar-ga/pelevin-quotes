import { describe, expect, it } from "vitest";
import nextConfig from "../next.config.mjs";

async function headersForAllRoutes() {
  const rules = (await nextConfig.headers?.()) ?? [];
  const rule = rules.find((r) => r.source === "/:path*");
  expect(rule).toBeDefined();
  return Object.fromEntries(
    (rule?.headers ?? []).map((h) => [h.key.toLowerCase(), h.value]),
  ) as Record<string, string>;
}

describe("security headers (next.config)", () => {
  it("does not advertise the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("sets the OWASP baseline on every route", async () => {
    const headers = await headersForAllRoutes();
    expect(headers["strict-transport-security"]).toMatch(/max-age=63072000/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(headers["x-frame-options"]).toBe("DENY");
  });

  it("enforces the CSP (it ran clean as report-only in e2e and Production)", async () => {
    const headers = await headersForAllRoutes();
    expect(headers["content-security-policy-report-only"]).toBeUndefined();
    const csp = headers["content-security-policy"];
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ]) {
      expect(csp).toContain(directive);
    }
  });
});
