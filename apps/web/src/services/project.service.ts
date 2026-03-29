import { api } from "./api.client.js";

export const projectService = {
  list(workspaceId: string, token: string) {
    return api.get(`/workspaces/${workspaceId}/projects`, token);
  },

  get(workspaceId: string, projectId: string, token: string) {
    return api.get(`/workspaces/${workspaceId}/projects/${projectId}`, token);
  },

  create(workspaceId: string, data: { name: string; description?: string | null; color?: string | null }, token: string) {
    return api.post(`/workspaces/${workspaceId}/projects`, data, token);
  },

  update(workspaceId: string, projectId: string, data: Record<string, unknown>, token: string) {
    return api.patch(`/workspaces/${workspaceId}/projects/${projectId}`, data, token);
  },

  delete(workspaceId: string, projectId: string, token: string) {
    return api.delete(`/workspaces/${workspaceId}/projects/${projectId}`, token);
  },
};
