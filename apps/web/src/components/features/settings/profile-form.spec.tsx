import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "./profile-form";

const mockOnSubmit = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("ProfileForm", () => {
  it("renders name input pre-filled with initialName", () => {
    render(<ProfileForm initialName="João Silva" onSubmit={mockOnSubmit} />);
    expect(screen.getByDisplayValue("João Silva")).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    render(<ProfileForm initialName="João" onSubmit={mockOnSubmit} />);
    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with new name", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<ProfileForm initialName="João" onSubmit={mockOnSubmit} />);
    await userEvent.clear(screen.getByLabelText(/nome/i));
    await userEvent.type(screen.getByLabelText(/nome/i), "Maria");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith("Maria");
    });
  });

  it("shows success message after save", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<ProfileForm initialName="João" onSubmit={mockOnSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText(/salvo com sucesso/i)).toBeInTheDocument();
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Algo deu errado no servidor"));
    render(<ProfileForm initialName="João" onSubmit={mockOnSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByText("Algo deu errado no servidor")).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    mockOnSubmit.mockReturnValue(new Promise(() => {}));
    render(<ProfileForm initialName="João" onSubmit={mockOnSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /salvando/i })).toBeDisabled();
    });
  });
});
