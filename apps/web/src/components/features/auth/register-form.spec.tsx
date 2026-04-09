import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../tests/utils.js";
import { RegisterForm } from "./register-form.js";

const mockRegister = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

vi.mock("../../../hooks/use-auth.js", () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

beforeEach(() => vi.clearAllMocks());

describe("RegisterForm", () => {
  it("should render name, email and password fields with submit button", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("should call register with name, email and password on submit", async () => {
    mockRegister.mockResolvedValue(undefined);
    renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/nome/i), "João Silva");
    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("João Silva", "joao@test.com", "senha123");
    });
  });

  it("should show error when name is empty", async () => {
    renderWithProviders(<RegisterForm />);
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));
    await waitFor(() => {
      expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should show error when password is too short", async () => {
    renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/nome/i), "João");
    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "123");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText("Senha deve ter pelo menos 8 caracteres")).toBeInTheDocument();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should show error message when registration fails", async () => {
    mockRegister.mockRejectedValue({ message: "Email já cadastrado" });
    renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText(/nome/i), "João");
    await userEvent.type(screen.getByLabelText(/email/i), "joao@test.com");
    await userEvent.type(screen.getByLabelText(/senha/i), "senha123");
    await userEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText(/email já cadastrado/i)).toBeInTheDocument();
    });
  });
});
