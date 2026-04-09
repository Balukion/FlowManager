import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../tests/utils.js";
import { LoginForm } from "./login-form.js";

const mockLogin = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("../../../hooks/use-auth.js", () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    logout: vi.fn(),
  }),
}));

beforeEach(() => vi.clearAllMocks());

describe("LoginForm", () => {
  it("should render email and password fields with submit button", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("should call login with email and password on submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("joao@test.com", "senha123");
    });
  });

  it("should show validation error when email is empty", async () => {
    renderWithProviders(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));
    await waitFor(() => {
      expect(screen.getByText("Email é obrigatório")).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("should disable submit button while loading", async () => {
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /entrar/i })).toBeDisabled();
    });
  });

  it("should show error message when login fails", async () => {
    mockLogin.mockRejectedValue({ message: "Credenciais inválidas" });
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "errada");
    await userEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});
