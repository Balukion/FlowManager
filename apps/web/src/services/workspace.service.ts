import type { AuthenticatedClient } from "./api.client";

export function workspaceService(client: AuthenticatedClient) {
  return {
    list: () => client.get("/workspaces"),

    get: (id: string) => client.get(`/workspaces/${id}`),

    create: (data: { name: string; description?: string | null; color?: string | null }) =>
      client.post("/workspaces", data),

    update: (id: string, data: { name?: string; description?: string | null; color?: string | null }) =>
      client.patch(`/workspaces/${id}`, data),

    delete: (id: string) => client.delete(`/workspaces/${id}`),

    updateLogo: (id: string, logo_url: string) =>
      client.patch(`/workspaces/${id}/logo`, { logo_url }),

    deleteLogo: (id: string) => client.delete(`/workspaces/${id}/logo`),

    listMembers: (id: string) => client.get(`/workspaces/${id}/members`),

    getMe: (id: string) => client.get(`/workspaces/${id}/me`),

    removeMember: (id: string, userId: string) =>
      client.delete(`/workspaces/${id}/members/${userId}`),

    updateMemberRole: (id: string, userId: string, role: string) =>
      client.patch(`/workspaces/${id}/members/${userId}`, { role }),
  };
}
