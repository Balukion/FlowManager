import type { AuthenticatedClient } from "./api.client";

export function userService(client: AuthenticatedClient) {
  return {
    getMe: () => client.get("/users/me"),

    updateMe: (data: { name?: string; avatar_url?: string; timezone?: string }) =>
      client.patch("/users/me", data),

    updatePassword: (data: { current_password: string; new_password: string }) =>
      client.patch("/users/me/password", data),

    presignAvatar: (data: { content_type: string; file_size_bytes: number }) =>
      client.post("/users/me/avatar/presign", data),

    updateAvatar: (avatar_url: string) =>
      client.patch("/users/me", { avatar_url }),

    deleteAvatar: () => client.delete("/users/me/avatar"),
  };
}
