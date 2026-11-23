import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ShareQuoteButton from "@/components/ShareQuoteButton";

describe("ShareQuoteButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the quote permalink when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
      share: undefined,
    });

    render(<ShareQuoteButton quoteId={42} quote="Test quote" book="Book" />);

    await userEvent.click(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    );

    expect(writeText).toHaveBeenCalledWith(
      `"Test quote"\n- Book\n\n${window.location.origin}/q/42`,
    );
    expect(
      await screen.findByRole("button", { name: /ссылка скопирована/i }),
    ).toBeInTheDocument();
  });

  it("uses Web Share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      clipboard: { writeText: vi.fn() },
    });

    render(<ShareQuoteButton quoteId={7} quote="Share me" book="Book" />);

    await userEvent.click(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    );

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: "Цитатка из Пелевина",
        text: "\"Share me\"\n- Book",
        url: `${window.location.origin}/q/7`,
      });
    });
  });

  it("does nothing when the user cancels the share sheet", async () => {
    const writeText = vi.fn();
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("cancelled", "AbortError"));
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      clipboard: { writeText },
    });

    render(<ShareQuoteButton quoteId={7} quote="Share me" book="Book" />);
    await userEvent.click(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    );

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(writeText).not.toHaveBeenCalled();
  });

  it("falls back to copying when Web Share is refused", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    vi.stubGlobal("navigator", {
      ...navigator,
      share,
      clipboard: { writeText },
    });

    render(<ShareQuoteButton quoteId={7} quote="Share me" book="Book" />);
    await userEvent.click(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    );

    expect(
      await screen.findByRole("button", { name: /ссылка скопирована/i }),
    ).toBeInTheDocument();
    expect(writeText).toHaveBeenCalled();
  });

  it("opens the permalink when clipboard is unavailable", async () => {
    const open = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      share: undefined,
      clipboard: undefined,
    });
    vi.stubGlobal("open", open);

    render(<ShareQuoteButton quoteId={5} quote="Share me" book="" />);

    await userEvent.click(
      screen.getByRole("button", { name: /поделиться цитатой/i }),
    );

    expect(open).toHaveBeenCalledWith(
      `${window.location.origin}/q/5`,
      "_blank",
      "noopener,noreferrer",
    );
  });
});
