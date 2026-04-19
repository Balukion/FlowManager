import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuthStore } from "../stores/auth.store.js";

vi.mock("../services/api.client.js", () => ({
  createAuthenticatedClient: vi.fn().mockReturnValue({
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }),
}));

import { createAuthenticatedClient } from "../services/api.client.js";
import { useApiClient } from "./use-api-client.js";

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ accessToken: null });
});

describe("useApiClient", () => {
  it("cria um cliente autenticado com o token do store", () => {
    useAuthStore.setState({ accessToken: "my-token" });
    renderHook(() => useApiClient());
    expect(createAuthenticatedClient).toHaveBeenCalledWith("my-token");
  });

  it("retorna um objeto com os métodos get, post, patch, delete", () => {
    useAuthStore.setState({ accessToken: "tok" });
    const { result } = renderHook(() => useApiClient());
    expect(result.current.get).toBeDefined();
    expect(result.current.post).toBeDefined();
    expect(result.current.patch).toBeDefined();
    expect(result.current.delete).toBeDefined();
  });

  it("recria o cliente quando o token muda", () => {
    useAuthStore.setState({ accessToken: "token-1" });
    const { rerender } = renderHook(() => useApiClient());

    useAuthStore.setState({ accessToken: "token-2" });
    rerender();

    expect(createAuthenticatedClient).toHaveBeenCalledTimes(2);
    expect(createAuthenticatedClient).toHaveBeenLastCalledWith("token-2");
  });
});
