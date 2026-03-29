import { api } from "./api.client.js";

function base(workspaceId: string, projectId: string, taskId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/steps`;
}

export const stepService = {
  list(workspaceId: string, projectId: string, taskId: string, token: string) {
    return api.get(base(workspaceId, projectId, taskId), token);
  },

  create(workspaceId: string, projectId: string, taskId: string, data: { title: string; description?: string | null; deadline?: string | null }, token: string) {
    return api.post(base(workspaceId, projectId, taskId), data, token);
  },

  update(workspaceId: string, projectId: string, taskId: string, stepId: string, data: Record<string, unknown>, token: string) {
    return api.patch(`${base(workspaceId, projectId, taskId)}/${stepId}`, data, token);
  },

  updateStatus(workspaceId: string, projectId: string, taskId: string, stepId: string, status: string, token: string) {
    return api.patch(`${base(workspaceId, projectId, taskId)}/${stepId}/status`, { status }, token);
  },

  delete(workspaceId: string, projectId: string, taskId: string, stepId: string, token: string) {
    return api.delete(`${base(workspaceId, projectId, taskId)}/${stepId}`, token);
  },

  assign(workspaceId: string, projectId: string, taskId: string, stepId: string, user_id: string, token: string) {
    return api.post(`${base(workspaceId, projectId, taskId)}/${stepId}/assignments`, { user_id }, token);
  },

  unassign(workspaceId: string, projectId: string, taskId: string, stepId: string, userId: string, token: string) {
    return api.delete(`${base(workspaceId, projectId, taskId)}/${stepId}/assignments/${userId}`, token);
  },
};
