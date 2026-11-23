import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-geist-test" }),
}));

vi.mock("@vercel/analytics/next", () => ({
  Analytics: () => null,
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => null,
}));

describe("root metadata", () => {
  it("uses the production domain as the metadata base", async () => {
    const { metadata } = await import("@/app/layout");

    expect(metadata.metadataBase?.toString()).toBe("https://pelevin-like.app/");
  });
});
