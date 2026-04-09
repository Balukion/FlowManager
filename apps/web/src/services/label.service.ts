import { api } from "./api.client";

export const labelService = {
  list(workspaceId: string, token: string) {
    return api.get(`/workspaces/${workspaceId}/labels`, token);
  },

  create(workspaceId: string, data: { name: string; color: string }, token: string) {
    return api.post(`/workspaces/${workspaceId}/labels`, data, token);
  },

  update(
    workspaceId: string,
    labelId: string,
    data: { name?: string; color?: string },
    token: string,
  ) {
    return api.patch(`/workspaces/${workspaceId}/labels/${labelId}`, data, token);
  },

  delete(workspaceId: string, labelId: string, token: string) {
    return api.delete(`/workspaces/${workspaceId}/labels/${labelId}`, token);
  },

  applyToTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelId: string,
    token: string,
  ) {
    return api.post(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/labels`,
      { label_id: labelId },
      token,
    );
  },

  removeFromTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    labelId: string,
    token: string,
  ) {
    return api.delete(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/labels/${labelId}`,
      token,
    );
  },
};
