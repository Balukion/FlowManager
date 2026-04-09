import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordForm } from "./password-form";

const mockOnSubmit = vi.fn();

beforeEach(() => vi.clearAllMocks());

describe("PasswordForm", () => {
  it("renders current password, new password and confirm inputs", () => {
    render(<PasswordForm onSubmit={mockOnSubmit} />);
    expect(screen.getByLabelText(/senha atual/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar/i)).toBeInTheDocument();
  });

  it("shows error when new password is too short", async () => {
    render(<PasswordForm onSubmit={mockOnSubmit} />);
    await userEvent.type(screen.getByLabelText(/senha atual/i), "senhaAtual");
    await userEvent.type(screen.getByLabelText("Nova senha"), "curta");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "curta");
    await userEvent.click(screen.getByRole("button", { name: /alterar/i }));
    await waitFor(() => {
      expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("shows error when passwords do not match", async () => {
    render(<PasswordForm onSubmit={mockOnSubmit} />);
    await userEvent.type(screen.getByLabelText(/senha atual/i), "senhaAtual");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novaSenha1");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha2");
    await userEvent.click(screen.getByRole("button", { name: /alterar/i }));
    await waitFor(() => {
      expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with current and new password", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<PasswordForm onSubmit={mockOnSubmit} />);
    await userEvent.type(screen.getByLabelText(/senha atual/i), "senhaAtual");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novaSenha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha123");
    await userEvent.click(screen.getByRole("button", { name: /alterar/i }));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        current_password: "senhaAtual",
        new_password: "novaSenha123",
      });
    });
  });

  it("shows success message after save", async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    render(<PasswordForm onSubmit={mockOnSubmit} />);
    await userEvent.type(screen.getByLabelText(/senha atual/i), "senhaAtual");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novaSenha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha123");
    await userEvent.click(screen.getByRole("button", { name: /alterar/i }));
    await waitFor(() => {
      expect(screen.getByText(/senha alterada com sucesso/i)).toBeInTheDocument();
    });
  });

  it("shows error message when onSubmit throws", async () => {
    mockOnSubmit.mockRejectedValue(new Error("Senha atual incorreta"));
    render(<PasswordForm onSubmit={mockOnSubmit} />);
    await userEvent.type(screen.getByLabelText(/senha atual/i), "errada");
    await userEvent.type(screen.getByLabelText("Nova senha"), "novaSenha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha123");
    await userEvent.click(screen.getByRole("button", { name: /alterar/i }));
    await waitFor(() => {
      expect(screen.getByText("Senha atual incorreta")).toBeInTheDocument();
    });
  });
});
