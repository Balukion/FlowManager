import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {
    constructor(public code: string, message: string, public status: number) { super(message); }
  },
}));

import { api } from "./api.client.js";
import { authService } from "./auth.service.js";

beforeEach(() => vi.clearAllMocks());

describe("authService.login", () => {
  it("should POST to /auth/login with credentials", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { user: {}, access_token: "tok", refresh_token: "ref" } });
    await authService.login("user@test.com", "senha123");
    expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "user@test.com", password: "senha123" });
  });

  it("should return the API response", async () => {
    const mockResponse = { data: { user: { id: "1" }, access_token: "tok", refresh_token: "ref" } };
    vi.mocked(api.post).mockResolvedValue(mockResponse);
    const result = await authService.login("u@test.com", "p");
    expect(result).toEqual(mockResponse);
  });
});

describe("authService.register", () => {
  it("should POST to /auth/register with name, email and password", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await authService.register("João", "joao@test.com", "senha123");
    expect(api.post).toHaveBeenCalledWith("/auth/register", {
      name: "João",
      email: "joao@test.com",
      password: "senha123",
    });
  });
});

describe("authService.logout", () => {
  it("should POST to /auth/logout with token", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    await authService.logout("my-token");
    expect(api.post).toHaveBeenCalledWith("/auth/logout", {}, "my-token");
  });
});

describe("authService.refreshToken", () => {
  it("should POST to /auth/refresh with refresh_token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { access_token: "new-tok", refresh_token: "new-ref" } });
    await authService.refreshToken("old-refresh-token");
    expect(api.post).toHaveBeenCalledWith("/auth/refresh", { refresh_token: "old-refresh-token" });
  });
});

describe("authService.forgotPassword", () => {
  it("should POST to /auth/forgot-password with email", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    await authService.forgotPassword("user@test.com");
    expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "user@test.com" });
  });
});

describe("authService.resetPassword", () => {
  it("should POST to /auth/reset-password with token and password", async () => {
    vi.mocked(api.post).mockResolvedValue(undefined);
    await authService.resetPassword("reset-token-abc", "nova-senha123");
    expect(api.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "reset-token-abc",
      password: "nova-senha123",
    });
  });
});
