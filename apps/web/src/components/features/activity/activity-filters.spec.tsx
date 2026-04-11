import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityFilters } from "./activity-filters";

const members = [
  { id: "user-1", name: "João Silva" },
  { id: "user-2", name: "Maria Souza" },
];

const emptyFilters = { user_id: "", action: "", from: "", to: "" };

describe("ActivityFilters", () => {
  it("renders a select with all workspace members as options", () => {
    render(<ActivityFilters members={members} filters={emptyFilters} onChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "João Silva" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Maria Souza" })).toBeInTheDocument();
  });

  it("renders an action type select with common action labels", () => {
    render(<ActivityFilters members={members} filters={emptyFilters} onChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: /tarefa criada/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /status alterado/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /passo atribuído/i })).toBeInTheDocument();
  });

  it("renders from and to date inputs", () => {
    render(<ActivityFilters members={members} filters={emptyFilters} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/de/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/até/i)).toBeInTheDocument();
  });

  it("calls onChange with updated user_id when member is selected", async () => {
    const onChange = vi.fn();
    render(<ActivityFilters members={members} filters={emptyFilters} onChange={onChange} />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /membro/i }),
      "user-1",
    );
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1" }));
  });

  it("calls onChange with updated action when action type is selected", async () => {
    const onChange = vi.fn();
    render(<ActivityFilters members={members} filters={emptyFilters} onChange={onChange} />);
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /tipo/i }),
      "TASK_CREATED",
    );
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ action: "TASK_CREATED" }));
  });

  it("calls onChange with updated from date", async () => {
    const onChange = vi.fn();
    render(<ActivityFilters members={members} filters={emptyFilters} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/de/i), "2026-01-01");
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ from: "2026-01-01" }));
  });

  it("renders a reset button that clears all filters", async () => {
    const onChange = vi.fn();
    const filledFilters = { user_id: "user-1", action: "TASK_CREATED", from: "2026-01-01", to: "" };
    render(<ActivityFilters members={members} filters={filledFilters} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /limpar/i }));
    expect(onChange).toHaveBeenCalledWith(emptyFilters);
  });
});
