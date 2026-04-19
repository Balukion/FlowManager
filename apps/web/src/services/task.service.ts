import type { AuthenticatedClient } from "./api.client";

function base(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks`;
}

export function taskService(client: AuthenticatedClient) {
  return {
    list: (workspaceId: string, projectId: string, filters?: { label_id?: string }) => {
      const params = new URLSearchParams();
      if (filters?.label_id) params.set("label_id", filters.label_id);
      const qs = params.toString();
      return client.get(`${base(workspaceId, projectId)}${qs ? `?${qs}` : ""}`);
    },

    get: (workspaceId: string, projectId: string, taskId: string) =>
      client.get(`${base(workspaceId, projectId)}/${taskId}`),

    create: (workspaceId: string, projectId: string, data: { title: string; priority: string; description?: string | null; deadline?: string | null }) =>
      client.post(base(workspaceId, projectId), data),

    update: (workspaceId: string, projectId: string, taskId: string, data: Record<string, unknown>) =>
      client.patch(`${base(workspaceId, projectId)}/${taskId}`, data),

    updateStatus: (workspaceId: string, projectId: string, taskId: string, status: string) =>
      client.patch(`${base(workspaceId, projectId)}/${taskId}/status`, { status }),

    delete: (workspaceId: string, projectId: string, taskId: string) =>
      client.delete(`${base(workspaceId, projectId)}/${taskId}`),

    watch: (workspaceId: string, projectId: string, taskId: string) =>
      client.post(`${base(workspaceId, projectId)}/${taskId}/watch`, {}),

    unwatch: (workspaceId: string, projectId: string, taskId: string) =>
      client.delete(`${base(workspaceId, projectId)}/${taskId}/watch`),

    reorder: (workspaceId: string, projectId: string, order: string[]) =>
      client.patch(`${base(workspaceId, projectId)}/reorder`, { order }),

    assign: (workspaceId: string, projectId: string, taskId: string, user_id: string | null) =>
      client.patch(`${base(workspaceId, projectId)}/${taskId}/assign`, { user_id }),
  };
}
