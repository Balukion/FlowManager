import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@web/services/auth.service", () => ({
  authService: { forgotPassword: vi.fn() },
}));

import { authService } from "@web/services/auth.service";
import { ForgotPasswordForm } from "./forgot-password-form";

beforeEach(() => vi.clearAllMocks());

describe("ForgotPasswordForm", () => {
  it("renders email input and submit button", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar/i })).toBeInTheDocument();
  });

  it("disables submit button when email is empty", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByRole("button", { name: /enviar/i })).toBeDisabled();
  });

  it("enables submit button when email is filled", async () => {
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "teste@email.com");
    expect(screen.getByRole("button", { name: /enviar/i })).toBeEnabled();
  });

  it("calls authService.forgotPassword with email on submit", async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue(undefined as never);
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "teste@email.com");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith("teste@email.com");
    });
  });

  it("shows success message after submit", async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue(undefined as never);
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "teste@email.com");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await waitFor(() => {
      expect(screen.getByText(/email enviado/i)).toBeInTheDocument();
    });
  });

  it("shows error message when forgotPassword throws", async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(new Error("Rate limit exceeded"));
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "teste@email.com");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await waitFor(() => {
      expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    vi.mocked(authService.forgotPassword).mockReturnValue(new Promise(() => {}));
    render(<ForgotPasswordForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "teste@email.com");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /enviando/i })).toBeDisabled();
    });
  });
});
