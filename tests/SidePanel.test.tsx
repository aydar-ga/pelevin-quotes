import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SidePanel from "@/components/SidePanel";

describe("SidePanel", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <SidePanel
        open={false}
        onClose={vi.fn()}
        title="Title"
        titleId="panel-title"
      >
        content
      </SidePanel>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows title, hint, and children when open", () => {
    render(
      <SidePanel
        open
        onClose={vi.fn()}
        title="Заголовок"
        titleId="panel-title"
        hint="Подсказка"
      >
        <p>Panel body</p>
      </SidePanel>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Заголовок")).toBeInTheDocument();
    expect(screen.getByText("Подсказка")).toBeInTheDocument();
    expect(screen.getByText("Panel body")).toBeInTheDocument();
  });

  it("calls onClose from backdrop and close button", async () => {
    const onClose = vi.fn();
    render(
      <SidePanel
        open
        onClose={onClose}
        title="Title"
        titleId="panel-title"
      >
        body
      </SidePanel>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole("button", { name: "Закрыть панель" }),
    );
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
