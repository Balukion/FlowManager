import type { AuthenticatedClient } from "./api.client";

function base(workspaceId: string, projectId: string, taskId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/steps`;
}

export function stepService(client: AuthenticatedClient) {
  return {
    list: (workspaceId: string, projectId: string, taskId: string) =>
      client.get(base(workspaceId, projectId, taskId)),

    create: (workspaceId: string, projectId: string, taskId: string, data: { title: string; description?: string | null; deadline?: string | null }) =>
      client.post(base(workspaceId, projectId, taskId), data),

    update: (workspaceId: string, projectId: string, taskId: string, stepId: string, data: Record<string, unknown>) =>
      client.patch(`${base(workspaceId, projectId, taskId)}/${stepId}`, data),

    updateStatus: (workspaceId: string, projectId: string, taskId: string, stepId: string, status: string) =>
      client.patch(`${base(workspaceId, projectId, taskId)}/${stepId}/status`, { status }),

    delete: (workspaceId: string, projectId: string, taskId: string, stepId: string) =>
      client.delete(`${base(workspaceId, projectId, taskId)}/${stepId}`),

    assign: (workspaceId: string, projectId: string, taskId: string, stepId: string, user_id: string) =>
      client.patch(`${base(workspaceId, projectId, taskId)}/${stepId}/assign`, { user_id }),

    unassign: (workspaceId: string, projectId: string, taskId: string, stepId: string, userId: string) =>
      client.delete(`${base(workspaceId, projectId, taskId)}/${stepId}/assign/${userId}`),

    reorder: (workspaceId: string, projectId: string, taskId: string, order: string[]) =>
      client.patch(`${base(workspaceId, projectId, taskId)}/reorder`, { order }),

    listAssigned: (workspaceId: string) =>
      client.get(`/workspaces/${workspaceId}/steps/assigned`),
  };
}
