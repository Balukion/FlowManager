import { api } from "./api.client";
import type { AuthenticatedClient } from "./api.client";

export function invitationService(client: AuthenticatedClient) {
  return {
    create: (workspaceId: string, email: string) =>
      client.post(`/workspaces/${workspaceId}/invitations`, { email }),

    list: (workspaceId: string) =>
      client.get(`/workspaces/${workspaceId}/invitations`),

    cancel: (workspaceId: string, invitationId: string) =>
      client.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),

    accept: (inviteToken: string) =>
      client.post(`/invitations/${inviteToken}/accept`, {}),

    resend: (workspaceId: string, invitationId: string) =>
      client.post(`/workspaces/${workspaceId}/invitations/${invitationId}/resend`, {}),
  };
}

// public endpoint — sem autenticação
export const previewInvitation = (inviteToken: string) =>
  api.get(`/invitations/preview?token=${encodeURIComponent(inviteToken)}`);
