import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTaskForm } from "./create-task-form";

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("CreateTaskForm", () => {
  it("renders title input and submit button", () => {
    render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar/i })).toBeInTheDocument();
  });

  it("renders priority select", () => {
    render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText(/prioridade/i)).toBeInTheDocument();
  });

  it("shows validation error when title is empty", async () => {
    render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Título é obrigatório")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with title and priority", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/título/i), "Nova Tarefa");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Nova Tarefa", priority: "LOW" }),
      );
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Rate limit exceeded, retry in 50 minutes"));
    render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/título/i), "Nova Tarefa");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Rate limit exceeded, retry in 50 minutes")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel is clicked", async () => {
    render(<CreateTaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
