import { afterEach, describe, expect, it, vi } from "vitest";
import { magicLinkEmail, sendEmail } from "@/lib/email";

describe("magicLinkEmail", () => {
  it("includes the URL in both html and text bodies", () => {
    const out = magicLinkEmail("https://example.com/verify?token=xyz");
    expect(out.text).toContain("https://example.com/verify?token=xyz");
    expect(out.html).toContain("https://example.com/verify?token=xyz");
    expect(out.subject).toMatch(/пелевин/i);
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
});
