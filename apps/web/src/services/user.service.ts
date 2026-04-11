import { api } from "./api.client";

export const userService = {
  getMe(token: string) {
    return api.get("/users/me", token);
  },

  updateMe(data: { name?: string; avatar_url?: string; timezone?: string }, token: string) {
    return api.patch("/users/me", data, token);
  },

  updatePassword(data: { current_password: string; new_password: string }, token: string) {
    return api.patch("/users/me/password", data, token);
  },

  presignAvatar(data: { content_type: string; file_size_bytes: number }, token: string) {
    return api.post("/users/me/avatar/presign", data, token);
  },

  updateAvatar(avatar_url: string, token: string) {
    return api.patch("/users/me", { avatar_url }, token);
  },

  deleteAvatar(token: string) {
    return api.delete("/users/me/avatar", token);
  },
};
