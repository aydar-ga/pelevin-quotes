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

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }
  });

  it("no-ops with mocked:true when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
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
});
