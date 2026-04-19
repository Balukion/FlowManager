import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "../stores/auth.store.js";
import { useWorkspaceStore } from "../stores/workspace.store.js";

vi.mock("../services/auth.service.js", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

const mockPost = vi.fn();
vi.mock("../services/api.client.js", () => ({
  createAuthenticatedClient: vi.fn(() => ({ post: mockPost })),
}));

const mockClear = vi.fn();
vi.mock("../lib/query-client.js", () => ({
  getQueryClient: () => ({ clear: mockClear }),
}));

import { authService } from "../services/auth.service.js";
import { useAuth } from "./use-auth.js";

const mockUser = {
  id: "user-1",
  name: "João",
  email: "joao@test.com",
  avatar_url: null,
  timezone: "UTC",
  email_verified: true,
  created_at: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, accessToken: null });
  useWorkspaceStore.setState({ currentWorkspace: null });
});

describe("useAuth", () => {
  it("should expose user and accessToken from the store", () => {
    useAuthStore.setState({ user: mockUser, accessToken: "tok" });
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe("tok");
  });

  it("login() should call authService.login and update the store", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      data: { user: mockUser, access_token: "new-tok", refresh_token: "ref" },
    } as any);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.login("joao@test.com", "senha123");
    });

    expect(authService.login).toHaveBeenCalledWith("joao@test.com", "senha123");
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe("new-tok");
  });

  it("logout() should POST to /auth/logout and clear the store", async () => {
    useAuthStore.setState({ user: mockUser, accessToken: "tok" });
    mockPost.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.logout();
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/logout", {});
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("logout() should clear the query cache and current workspace", async () => {
    const mockWorkspace = { id: "ws-1", name: "Workspace A" } as any;
    useAuthStore.setState({ user: mockUser, accessToken: "tok" });
    useWorkspaceStore.setState({ currentWorkspace: mockWorkspace });
    mockPost.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.logout();
    });

    expect(mockClear).toHaveBeenCalled();
    expect(useWorkspaceStore.getState().currentWorkspace).toBeNull();
  });

  it("isAuthenticated should be true when user is logged in", () => {
    useAuthStore.setState({ user: mockUser, accessToken: "tok" });
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("isAuthenticated should be false when user is not logged in", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });
});
