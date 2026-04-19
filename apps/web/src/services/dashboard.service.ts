import type { AuthenticatedClient } from "./api.client";

export function dashboardService(client: AuthenticatedClient) {
  return {
    get: (workspaceId: string) =>
      client.get(`/workspaces/${workspaceId}/dashboard`),
  };
}
