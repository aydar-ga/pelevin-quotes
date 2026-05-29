import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import QuoteActions from "@/components/QuoteActions";

describe("QuoteActions", () => {
  it("copies quote text to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <QuoteActions quote="Жить надо чисто." book="Generation П" quoteId={1} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /копировать/i }));
    expect(writeText).toHaveBeenCalledWith(
      '"Жить надо чисто." — Generation П',
    );
    expect(await screen.findByRole("button", { name: /скопировано/i }))
      .toBeInTheDocument();
  });

  it("ignores duplicate share calls while a share sheet is open", async () => {
    let resolveShare: (() => void) | undefined;
    const share = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveShare = resolve;
        }),
    );
    Object.assign(navigator, { share, clipboard: { writeText: vi.fn() } });

    render(
      <QuoteActions quote="Жить надо чисто." book="Generation П" quoteId={1} />,
    );

    const shareButton = screen.getByRole("button", { name: /поделиться/i });
    await userEvent.click(shareButton);
    await userEvent.click(shareButton);

    expect(share).toHaveBeenCalledTimes(1);
    resolveShare?.();
  });

  it("swallows InvalidStateError when share is already in progress", async () => {
    const share = vi.fn().mockRejectedValue(
      new DOMException("share() is already in progress", "InvalidStateError"),
    );
    Object.assign(navigator, { share, clipboard: { writeText: vi.fn() } });

    render(
      <QuoteActions quote="Жить надо чисто." book="Generation П" quoteId={1} />,
    );

    await expect(
      userEvent.click(screen.getByRole("button", { name: /поделиться/i })),
    ).resolves.not.toThrow();
  });
});
