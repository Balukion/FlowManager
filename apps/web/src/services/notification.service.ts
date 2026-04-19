import type { AuthenticatedClient } from "./api.client";

export function notificationService(client: AuthenticatedClient) {
  return {
    list: () => client.get("/notifications"),

    markAsRead: (id: string) => client.patch(`/notifications/${id}/read`, {}),

    markAllAsRead: () => client.patch("/notifications/read-all", {}),

    delete: (id: string) => client.delete(`/notifications/${id}`),
  };
}
