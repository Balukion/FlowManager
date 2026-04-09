import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => (key === "token" ? "valid-token-123" : null) }),
}));

vi.mock("@web/services/auth.service", () => ({
  authService: { resetPassword: vi.fn() },
}));

import { authService } from "@web/services/auth.service";
import { ResetPasswordForm } from "./reset-password-form";

beforeEach(() => vi.clearAllMocks());

describe("ResetPasswordForm", () => {
  it("renders password and confirm inputs", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /redefinir/i })).toBeInTheDocument();
  });

  it("shows validation error when password is too short", async () => {
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText(/nova senha/i), "1234567");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "1234567");
    await userEvent.click(screen.getByRole("button", { name: /redefinir/i }));
    await waitFor(() => {
      expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
    });
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText(/nova senha/i), "senha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "senha456");
    await userEvent.click(screen.getByRole("button", { name: /redefinir/i }));
    await waitFor(() => {
      expect(screen.getByText(/senhas não coincidem/i)).toBeInTheDocument();
    });
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("calls authService.resetPassword with token and password", async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined as never);
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText(/nova senha/i), "novaSenha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha123");
    await userEvent.click(screen.getByRole("button", { name: /redefinir/i }));
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith("valid-token-123", "novaSenha123");
    });
  });

  it("redirects to /login after success", async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined as never);
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText(/nova senha/i), "novaSenha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha123");
    await userEvent.click(screen.getByRole("button", { name: /redefinir/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error message when resetPassword throws", async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(new Error("Token expirado"));
    render(<ResetPasswordForm />);
    await userEvent.type(screen.getByLabelText(/nova senha/i), "novaSenha123");
    await userEvent.type(screen.getByLabelText(/confirmar/i), "novaSenha123");
    await userEvent.click(screen.getByRole("button", { name: /redefinir/i }));
    await waitFor(() => {
      expect(screen.getByText("Token expirado")).toBeInTheDocument();
    });
  });
});
