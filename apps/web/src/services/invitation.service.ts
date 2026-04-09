import { api } from "./api.client";

export const invitationService = {
  create(workspaceId: string, email: string, token: string) {
    return api.post(`/workspaces/${workspaceId}/invitations`, { email }, token);
  },

  list(workspaceId: string, token: string) {
    return api.get(`/workspaces/${workspaceId}/invitations`, token);
  },

  cancel(workspaceId: string, invitationId: string, token: string) {
    return api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`, token);
  },

  accept(inviteToken: string, token: string) {
    return api.post(`/invitations/${inviteToken}/accept`, {}, token);
  },
};
