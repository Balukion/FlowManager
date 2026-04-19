import type { AuthenticatedClient } from "./api.client";

export function labelService(client: AuthenticatedClient) {
  return {
    list: (workspaceId: string) =>
      client.get(`/workspaces/${workspaceId}/labels`),

    create: (workspaceId: string, data: { name: string; color: string }) =>
      client.post(`/workspaces/${workspaceId}/labels`, data),

    update: (workspaceId: string, labelId: string, data: { name?: string; color?: string }) =>
      client.patch(`/workspaces/${workspaceId}/labels/${labelId}`, data),

    delete: (workspaceId: string, labelId: string) =>
      client.delete(`/workspaces/${workspaceId}/labels/${labelId}`),

    applyToTask: (workspaceId: string, projectId: string, taskId: string, labelId: string) =>
      client.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/labels`, { label_id: labelId }),

    removeFromTask: (workspaceId: string, projectId: string, taskId: string, labelId: string) =>
      client.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/labels/${labelId}`),
  };
}
