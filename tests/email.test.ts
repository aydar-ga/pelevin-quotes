import { afterEach, describe, expect, it, vi } from "vitest";
import { magicLinkEmail, sendEmail } from "@/lib/email";

describe("magicLinkEmail", () => {
  it("includes the URL in both html and text bodies", () => {
    const out = magicLinkEmail("https://example.com/verify?token=xyz");
    expect(out.text).toContain("https://example.com/verify?token=xyz");
    expect(out.html).toContain("https://example.com/verify?token=xyz");
    expect(out.subject).toMatch(/пелевин/i);
    expect(out.html).toContain("background:#0a0a0a");
    expect(out.html).toContain("Нырнуть внутрь");
  });
});

describe("sendEmail", () => {
  const originalKey = process.env.RESEND_API_KEY;
  const originalE2E = process.env.E2E_TEST_MODE;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }
    if (originalE2E === undefined) {
      delete process.env.E2E_TEST_MODE;
    } else {
      process.env.E2E_TEST_MODE = originalE2E;
    }
  });

  it("no-ops with mocked:true when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.E2E_TEST_MODE;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await sendEmail({
      to: "a@b.c",
      subject: "x",
      html: "<p>x</p>",
      text: "x",
    });
    expect(result.mocked).toBe(true);
    warn.mockRestore();
  });

  it("never sends via Resend when E2E_TEST_MODE is true", async () => {
    process.env.E2E_TEST_MODE = "true";
    process.env.RESEND_API_KEY = "re_test_key";

    const result = await sendEmail({
      to: "a@b.c",
      subject: "x",
      html: "<p>x</p>",
      text: "x",
    });

    expect(result.mocked).toBe(true);
  });

  it("fails closed in Vercel Production when RESEND_API_KEY is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("AUTH_EMAIL_FROM", "noreply@example.com");
    await expect(
      sendEmail({ to: "a@b.c", subject: "x", html: "<p>x</p>", text: "x" }),
    ).rejects.toThrow("Missing required environment variable: RESEND_API_KEY");
    vi.unstubAllEnvs();
  });

  it("ignores E2E_TEST_MODE in Vercel Production and still requires a real sender", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("E2E_TEST_MODE", "true");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("AUTH_EMAIL_FROM", "");
    await expect(
      sendEmail({ to: "a@b.c", subject: "x", html: "<p>x</p>", text: "x" }),
    ).rejects.toThrow("Missing required environment variable: AUTH_EMAIL_FROM");
    vi.unstubAllEnvs();
  });
});
