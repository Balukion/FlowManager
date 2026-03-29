import { api } from "./api.client.js";

export const dashboardService = {
  get(workspaceId: string, token: string) {
    return api.get(`/workspaces/${workspaceId}/dashboard`, token);
  },
};
