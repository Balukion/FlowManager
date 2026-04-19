import type { AuthenticatedClient } from "./api.client";

export function projectService(client: AuthenticatedClient) {
  return {
    list: (workspaceId: string) =>
      client.get(`/workspaces/${workspaceId}/projects`),

    get: (workspaceId: string, projectId: string) =>
      client.get(`/workspaces/${workspaceId}/projects/${projectId}`),

    create: (workspaceId: string, data: { name: string; description?: string | null; color?: string | null }) =>
      client.post(`/workspaces/${workspaceId}/projects`, data),

    update: (workspaceId: string, projectId: string, data: Record<string, unknown>) =>
      client.patch(`/workspaces/${workspaceId}/projects/${projectId}`, data),

    delete: (workspaceId: string, projectId: string) =>
      client.delete(`/workspaces/${workspaceId}/projects/${projectId}`),

    archive: (workspaceId: string, projectId: string) =>
      client.patch(`/workspaces/${workspaceId}/projects/${projectId}/archive`, {}),

    unarchive: (workspaceId: string, projectId: string) =>
      client.patch(`/workspaces/${workspaceId}/projects/${projectId}/unarchive`, {}),

    listArchived: (workspaceId: string) =>
      client.get(`/workspaces/${workspaceId}/projects/archived`),
  };
}
