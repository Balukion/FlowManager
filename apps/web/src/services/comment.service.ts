import type { AuthenticatedClient } from "./api.client";

function base(workspaceId: string, projectId: string, taskId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`;
}

export function commentService(client: AuthenticatedClient) {
  return {
    list: (workspaceId: string, projectId: string, taskId: string) =>
      client.get(base(workspaceId, projectId, taskId)),

    create: (workspaceId: string, projectId: string, taskId: string, content: string, mentions: string[]) =>
      client.post(base(workspaceId, projectId, taskId), { content, mention_ids: mentions }),

    update: (workspaceId: string, projectId: string, taskId: string, commentId: string, content: string) =>
      client.patch(`${base(workspaceId, projectId, taskId)}/${commentId}`, { content }),

    delete: (workspaceId: string, projectId: string, taskId: string, commentId: string) =>
      client.delete(`${base(workspaceId, projectId, taskId)}/${commentId}`),

    reply: (workspaceId: string, projectId: string, taskId: string, content: string, parentId: string, mentions: string[]) =>
      client.post(base(workspaceId, projectId, taskId), { content, parent_id: parentId, mention_ids: mentions }),
  };
}
