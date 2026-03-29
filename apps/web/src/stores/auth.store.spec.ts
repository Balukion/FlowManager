import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./auth.store.js";
import type { PublicUser } from "@flowmanager/types";

const mockUser: PublicUser = {
  id: "user-1",
  name: "João Silva",
  email: "joao@test.com",
  avatar_url: null,
  timezone: "America/Sao_Paulo",
  email_verified: true,
  created_at: new Date("2026-01-01"),
};

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null });
});

describe("useAuthStore", () => {
  it("should start with null user and token", () => {
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it("setAuth should set user and accessToken", () => {
    useAuthStore.getState().setAuth(mockUser, "access-token-123");
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(accessToken).toBe("access-token-123");
  });

  it("clearAuth should reset user and token to null", () => {
    useAuthStore.getState().setAuth(mockUser, "token");
    useAuthStore.getState().clearAuth();
    const { user, accessToken } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(accessToken).toBeNull();
  });

  it("isAuthenticated is true when user and token are set", () => {
    useAuthStore.getState().setAuth(mockUser, "token");
    const { user, accessToken } = useAuthStore.getState();
    expect(user !== null && accessToken !== null).toBe(true);
  });
});
