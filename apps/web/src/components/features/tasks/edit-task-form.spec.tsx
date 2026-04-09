import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditTaskForm } from "./edit-task-form";

const defaultTask = {
  title: "Tarefa original",
  description: "Descrição original",
  priority: "LOW" as const,
  deadline: null,
};

describe("EditTaskForm", () => {
  it("renders pre-filled fields with current task values", () => {
    render(<EditTaskForm task={defaultTask} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByDisplayValue("Tarefa original")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Descrição original")).toBeInTheDocument();
  });

  it("shows validation error when title is cleared", async () => {
    render(<EditTaskForm task={defaultTask} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    const titleInput = screen.getByDisplayValue("Tarefa original");
    await userEvent.clear(titleInput);
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(screen.getByText(/título é obrigatório/i)).toBeInTheDocument();
  });

  it("calls onSubmit with updated values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EditTaskForm task={defaultTask} onSubmit={onSubmit} onCancel={vi.fn()} />);

    const titleInput = screen.getByDisplayValue("Tarefa original");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Novo título");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Novo título" }),
      );
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(<EditTaskForm task={defaultTask} onSubmit={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows error message when onSubmit throws", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Erro ao salvar"));
    render(<EditTaskForm task={defaultTask} onSubmit={onSubmit} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText("Erro ao salvar")).toBeInTheDocument();
    });
  });

  it("allows changing priority", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EditTaskForm task={defaultTask} onSubmit={onSubmit} onCancel={vi.fn()} />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "HIGH");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ priority: "HIGH" }));
    });
  });
});
