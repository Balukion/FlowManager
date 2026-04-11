import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskStatusSelect } from "./task-status-select";

describe("TaskStatusSelect", () => {
  it("renders the current status as selected value", () => {
    render(<TaskStatusSelect status="TODO" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue("TODO");
  });

  it("renders all three status options with portuguese labels", () => {
    render(<TaskStatusSelect status="TODO" onChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: /a fazer/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /em progresso/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /concluída/i })).toBeInTheDocument();
  });

  it("calls onChange with the new status value when changed", async () => {
    const onChange = vi.fn();
    render(<TaskStatusSelect status="TODO" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "DONE");
    expect(onChange).toHaveBeenCalledWith("DONE");
  });

  it("is disabled when disabled prop is true", () => {
    render(<TaskStatusSelect status="TODO" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("is enabled by default", () => {
    render(<TaskStatusSelect status="IN_PROGRESS" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });
});
