import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateProjectForm } from "./create-project-form";

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("CreateProjectForm", () => {
  it("renders name input and submit button", () => {
    render(<CreateProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar/i })).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    render(<CreateProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with project data", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<CreateProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Novo Projeto");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Novo Projeto" }),
      );
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Já existe um projeto com este nome"));
    render(<CreateProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Novo Projeto");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Já existe um projeto com este nome")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel is clicked", async () => {
    render(<CreateProjectForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
