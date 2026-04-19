import type { AuthenticatedClient } from "./api.client";

export interface ActivityFilters {
  user_id?: string;
  action?: string;
  from?: string;
  to?: string;
}

function buildQueryString(filters?: ActivityFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.action) params.set("action", filters.action);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function activityService(client: AuthenticatedClient) {
  return {
    listByWorkspace: (workspaceId: string, filters?: ActivityFilters) =>
      client.get(`/workspaces/${workspaceId}/activity-logs${buildQueryString(filters)}`),

    listByProject: (workspaceId: string, projectId: string) =>
      client.get(`/workspaces/${workspaceId}/projects/${projectId}/activity-logs`),

    listByTask: (workspaceId: string, projectId: string, taskId: string) =>
      client.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/activity-logs`),
  };
}
