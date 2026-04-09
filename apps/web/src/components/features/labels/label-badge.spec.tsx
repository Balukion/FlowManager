import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LabelBadge } from "./label-badge";

describe("LabelBadge", () => {
  it("renders the label name", () => {
    render(<LabelBadge name="Bug" color="#ef4444" />);
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("applies the color as background", () => {
    render(<LabelBadge name="Feature" color="#22c55e" />);
    const badge = screen.getByText("Feature");
    expect(badge).toHaveStyle({ backgroundColor: "#22c55e" });
  });

  it("renders remove button when onRemove is provided", () => {
    render(<LabelBadge name="Bug" color="#ef4444" onRemove={() => {}} />);
    expect(screen.getByRole("button", { name: /remover/i })).toBeInTheDocument();
  });

  it("does not render remove button when onRemove is not provided", () => {
    render(<LabelBadge name="Bug" color="#ef4444" />);
    expect(screen.queryByRole("button", { name: /remover/i })).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", async () => {
    const onRemove = vi.fn();
    const { getByRole } = render(<LabelBadge name="Bug" color="#ef4444" onRemove={onRemove} />);
    getByRole("button", { name: /remover/i }).click();
    expect(onRemove).toHaveBeenCalled();
  });
});
