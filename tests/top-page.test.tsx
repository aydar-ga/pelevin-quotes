import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-server", () => ({
  getServerSession: vi.fn(async () => null),
}));

vi.mock("@/lib/votes", () => ({
  listTopQuotes: vi.fn(async () => [
    {
      id: 11,
      text: "Рейтинг — это зеркало, которое просит лайк.",
      book: "S.N.U.F.F.",
      author: "Виктор Пелевин",
      score: 8,
      upvotes: 9,
      downvotes: 1,
      userVote: 0,
    },
  ]),
}));

import TopPage from "@/app/top/page";

describe("/top", () => {
  it("renders the public leaderboard", async () => {
    render(await TopPage({ searchParams: Promise.resolve({ range: "week" }) }));

    expect(
      screen.getByRole("heading", { name: "Топ цитат" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Рейтинг — это зеркало/i)).toBeInTheDocument();
    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "За неделю" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
