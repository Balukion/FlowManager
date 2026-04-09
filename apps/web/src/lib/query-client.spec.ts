import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@web/services/api.client.js";

const mockClearAuth = vi.fn();
const mockSetCurrentWorkspace = vi.fn();
const mockReplace = vi.fn();

vi.mock("@web/stores/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ clearAuth: mockClearAuth }),
  },
}));

vi.mock("@web/stores/workspace.store", () => ({
  useWorkspaceStore: {
    getState: () => ({ setCurrentWorkspace: mockSetCurrentWorkspace }),
  },
}));

Object.defineProperty(window, "location", {
  value: { replace: mockReplace },
  writable: true,
});

// Import after mocks
const { makeQueryClient } = await import("./query-client.js");

describe("makeQueryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não deve repetir requisições com erro 4xx", () => {
    const client = makeQueryClient();
    const retryFn = client.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean;

    expect(retryFn(0, new ApiError("FORBIDDEN", "Sem permissão", 403))).toBe(false);
    expect(retryFn(0, new ApiError("NOT_FOUND", "Não encontrado", 404))).toBe(false);
    expect(retryFn(0, new ApiError("UNAUTHORIZED", "Não autorizado", 401))).toBe(false);
  });

  it("deve repetir requisições com erro 5xx até 1 vez", () => {
    const client = makeQueryClient();
    const retryFn = client.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean;

    expect(retryFn(0, new ApiError("SERVER_ERROR", "Erro interno", 500))).toBe(true);
    expect(retryFn(1, new ApiError("SERVER_ERROR", "Erro interno", 500))).toBe(false);
  });

  it("deve limpar o auth e redirecionar para /login em caso de 401", () => {
    const client = makeQueryClient();
    client.getQueryCache().config.onError?.(
      new ApiError("UNAUTHORIZED", "Token inválido ou expirado", 401),
      {} as any,
    );

    expect(mockClearAuth).toHaveBeenCalled();
    expect(mockSetCurrentWorkspace).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("não deve redirecionar para login em erros não-401", () => {
    const client = makeQueryClient();
    client.getQueryCache().config.onError?.(
      new ApiError("NOT_FOUND", "Não encontrado", 404),
      {} as any,
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockClearAuth).not.toHaveBeenCalled();
  });
});
