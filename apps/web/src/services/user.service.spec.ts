import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from "./api.client";
import { userService } from "./user.service";

beforeEach(() => vi.clearAllMocks());

describe("userService", () => {
  it("getMe calls GET /users/me with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { user: {} } } as never);
    await userService.getMe("my-token");
    expect(api.get).toHaveBeenCalledWith("/users/me", "my-token");
  });

  it("updateMe calls PATCH /users/me with data and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { user: {} } } as never);
    await userService.updateMe({ name: "Novo Nome" }, "my-token");
    expect(api.patch).toHaveBeenCalledWith("/users/me", { name: "Novo Nome" }, "my-token");
  });

  it("updatePassword calls PATCH /users/me/password with data and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({} as never);
    await userService.updatePassword(
      { current_password: "old", new_password: "new123456" },
      "my-token",
    );
    expect(api.patch).toHaveBeenCalledWith(
      "/users/me/password",
      { current_password: "old", new_password: "new123456" },
      "my-token",
    );
  });
});
