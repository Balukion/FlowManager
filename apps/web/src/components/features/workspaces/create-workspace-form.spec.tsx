import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateWorkspaceForm } from "./create-workspace-form";

const mockOnSubmit = vi.fn();
const mockOnCancel = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("CreateWorkspaceForm", () => {
  it("renders name input and submit button", () => {
    render(<CreateWorkspaceForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar/i })).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    render(<CreateWorkspaceForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with name and description", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<CreateWorkspaceForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Nova Startup");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nova Startup" }),
      );
    });
  });

  it("disables submit button while loading", async () => {
    mockOnSubmit.mockReturnValue(new Promise(() => {}));
    render(<CreateWorkspaceForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Nova Startup");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /criar/i })).toBeDisabled();
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Já existe um workspace com este nome"));
    render(<CreateWorkspaceForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.type(screen.getByLabelText(/nome/i), "Nova Startup");
    await userEvent.click(screen.getByRole("button", { name: /criar/i }));
    await waitFor(() => {
      expect(screen.getByText("Já existe um workspace com este nome")).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<CreateWorkspaceForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    await userEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
