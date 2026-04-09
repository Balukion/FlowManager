import { api } from "./api.client";

export const workspaceService = {
  list(token: string) {
    return api.get("/workspaces", token);
  },

  get(id: string, token: string) {
    return api.get(`/workspaces/${id}`, token);
  },

  create(data: { name: string; description?: string | null; color?: string | null }, token: string) {
    return api.post("/workspaces", data, token);
  },

  update(id: string, data: { name?: string; description?: string | null; color?: string | null }, token: string) {
    return api.patch(`/workspaces/${id}`, data, token);
  },

  delete(id: string, token: string) {
    return api.delete(`/workspaces/${id}`, token);
  },

  updateLogo(id: string, logo_url: string, token: string) {
    return api.patch(`/workspaces/${id}/logo`, { logo_url }, token);
  },

  deleteLogo(id: string, token: string) {
    return api.delete(`/workspaces/${id}/logo`, token);
  },

  listMembers(id: string, token: string) {
    return api.get(`/workspaces/${id}/members`, token);
  },

  removeMember(id: string, userId: string, token: string) {
    return api.delete(`/workspaces/${id}/members/${userId}`, token);
  },

  updateMemberRole(id: string, userId: string, role: string, token: string) {
    return api.patch(`/workspaces/${id}/members/${userId}`, { role }, token);
  },
};
