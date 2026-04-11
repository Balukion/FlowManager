import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskWatchButton } from "./task-watch-button";

describe("TaskWatchButton", () => {
  it("shows 'Seguir' when not watching", () => {
    render(<TaskWatchButton isWatching={false} onWatch={vi.fn()} onUnwatch={vi.fn()} />);
    expect(screen.getByRole("button", { name: /seguir/i })).toBeInTheDocument();
  });

  it("shows 'Deixar de seguir' when watching", () => {
    render(<TaskWatchButton isWatching={true} onWatch={vi.fn()} onUnwatch={vi.fn()} />);
    expect(screen.getByRole("button", { name: /deixar de seguir/i })).toBeInTheDocument();
  });

  it("calls onWatch when clicked and not watching", async () => {
    const onWatch = vi.fn();
    render(<TaskWatchButton isWatching={false} onWatch={onWatch} onUnwatch={vi.fn()} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onWatch).toHaveBeenCalledTimes(1);
  });

  it("calls onUnwatch when clicked and already watching", async () => {
    const onUnwatch = vi.fn();
    render(<TaskWatchButton isWatching={true} onWatch={vi.fn()} onUnwatch={onUnwatch} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onUnwatch).toHaveBeenCalledTimes(1);
  });
});
