import { api } from "./api.client";

function base(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks`;
}

export const taskService = {
  list(workspaceId: string, projectId: string, token: string, filters?: { label_id?: string }) {
    const params = new URLSearchParams();
    if (filters?.label_id) params.set("label_id", filters.label_id);
    const qs = params.toString();
    return api.get(`${base(workspaceId, projectId)}${qs ? `?${qs}` : ""}`, token);
  },

  get(workspaceId: string, projectId: string, taskId: string, token: string) {
    return api.get(`${base(workspaceId, projectId)}/${taskId}`, token);
  },

  create(workspaceId: string, projectId: string, data: { title: string; priority: string; description?: string | null; deadline?: string | null }, token: string) {
    return api.post(base(workspaceId, projectId), data, token);
  },

  update(workspaceId: string, projectId: string, taskId: string, data: Record<string, unknown>, token: string) {
    return api.patch(`${base(workspaceId, projectId)}/${taskId}`, data, token);
  },

  updateStatus(workspaceId: string, projectId: string, taskId: string, status: string, token: string) {
    return api.patch(`${base(workspaceId, projectId)}/${taskId}/status`, { status }, token);
  },

  delete(workspaceId: string, projectId: string, taskId: string, token: string) {
    return api.delete(`${base(workspaceId, projectId)}/${taskId}`, token);
  },

  watch(workspaceId: string, projectId: string, taskId: string, token: string) {
    return api.post(`${base(workspaceId, projectId)}/${taskId}/watch`, {}, token);
  },

  unwatch(workspaceId: string, projectId: string, taskId: string, token: string) {
    return api.delete(`${base(workspaceId, projectId)}/${taskId}/watch`, token);
  },

  reorder(workspaceId: string, projectId: string, order: string[], token: string) {
    return api.patch(`${base(workspaceId, projectId)}/reorder`, { order }, token);
  },

  assign(workspaceId: string, projectId: string, taskId: string, user_id: string | null, token: string) {
    return api.patch(`${base(workspaceId, projectId)}/${taskId}/assign`, { user_id }, token);
  },
};
