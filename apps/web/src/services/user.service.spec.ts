import { describe, it, expect, vi, beforeEach } from "vitest";
import { userService } from "./user.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };

beforeEach(() => vi.clearAllMocks());

describe("userService.getMe", () => {
  it("should GET /users/me", async () => {
    mockClient.get.mockResolvedValue({ data: { user: {} } });
    await userService(mockClient).getMe();
    expect(mockClient.get).toHaveBeenCalledWith("/users/me");
  });
});

describe("userService.updateMe", () => {
  it("should PATCH /users/me with data", async () => {
    mockClient.patch.mockResolvedValue({ data: { user: {} } });
    await userService(mockClient).updateMe({ name: "Novo Nome" });
    expect(mockClient.patch).toHaveBeenCalledWith("/users/me", { name: "Novo Nome" });
  });
});

describe("userService.updatePassword", () => {
  it("should PATCH /users/me/password with data", async () => {
    mockClient.patch.mockResolvedValue({});
    await userService(mockClient).updatePassword({ current_password: "old", new_password: "new123456" });
    expect(mockClient.patch).toHaveBeenCalledWith(
      "/users/me/password",
      { current_password: "old", new_password: "new123456" },
    );
  });
});

describe("userService.presignAvatar", () => {
  it("should POST /users/me/avatar/presign with data", async () => {
    mockClient.post.mockResolvedValue({ data: { upload_url: "https://s3.example.com/presign" } });
    await userService(mockClient).presignAvatar({ content_type: "image/jpeg", file_size_bytes: 1024 });
    expect(mockClient.post).toHaveBeenCalledWith("/users/me/avatar/presign", {
      content_type: "image/jpeg",
      file_size_bytes: 1024,
    });
  });
});

describe("userService.updateAvatar", () => {
  it("should PATCH /users/me with avatar_url", async () => {
    mockClient.patch.mockResolvedValue({ data: { user: {} } });
    await userService(mockClient).updateAvatar("https://s3.example.com/avatar.png");
    expect(mockClient.patch).toHaveBeenCalledWith("/users/me", { avatar_url: "https://s3.example.com/avatar.png" });
  });
});

describe("userService.deleteAvatar", () => {
  it("should DELETE /users/me/avatar", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await userService(mockClient).deleteAvatar();
    expect(mockClient.delete).toHaveBeenCalledWith("/users/me/avatar");
  });
});
