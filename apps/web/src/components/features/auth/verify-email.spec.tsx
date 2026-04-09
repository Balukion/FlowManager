import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { VerifyEmail } from "./verify-email";

const mockVerifyEmail = vi.fn();

vi.mock("@web/services/auth.service", () => ({
  authService: { verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args) },
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => (key === "token" ? "valid-token-123" : null) }),
}));

beforeEach(() => vi.clearAllMocks());

describe("VerifyEmail", () => {
  it("shows loading state while verifying", () => {
    mockVerifyEmail.mockReturnValue(new Promise(() => {}));
    render(<VerifyEmail />);
    expect(screen.getByText(/verificando/i)).toBeInTheDocument();
  });

  it("calls verifyEmail with token from URL on mount", async () => {
    mockVerifyEmail.mockResolvedValue(undefined);
    render(<VerifyEmail />);
    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith("valid-token-123");
    });
  });

  it("shows success message and redirects to login after verification", async () => {
    mockVerifyEmail.mockResolvedValue(undefined);
    render(<VerifyEmail />);
    await waitFor(() => {
      expect(screen.getByText(/email confirmado/i)).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    }, { timeout: 4000 });
  });

  it("shows error message when token is invalid", async () => {
    mockVerifyEmail.mockRejectedValue(new Error("Token inválido ou expirado"));
    render(<VerifyEmail />);
    await waitFor(() => {
      expect(screen.getByText("Token inválido ou expirado")).toBeInTheDocument();
    });
  });

  it("shows error when no token in URL", async () => {
    vi.doMock("next/navigation", () => ({
      useRouter: () => ({ push: mockPush }),
      useSearchParams: () => ({ get: () => null }),
    }));
    mockVerifyEmail.mockRejectedValue(new Error("Token não encontrado"));
    render(<VerifyEmail />);
    await waitFor(() => {
      expect(screen.getByText(/token/i)).toBeInTheDocument();
    });
  });
});
