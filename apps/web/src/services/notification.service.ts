import { api } from "./api.client";

export const notificationService = {
  list(token: string) {
    return api.get("/notifications", token);
  },

  markAsRead(id: string, token: string) {
    return api.patch(`/notifications/${id}/read`, {}, token);
  },

  markAllAsRead(token: string) {
    return api.patch("/notifications/read-all", {}, token);
  },

  delete(id: string, token: string) {
    return api.delete(`/notifications/${id}`, token);
  },
};
