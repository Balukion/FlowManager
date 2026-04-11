import { api } from "./api.client";

function base(workspaceId: string, projectId: string, taskId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`;
}

export const commentService = {
  list(workspaceId: string, projectId: string, taskId: string, token: string) {
    return api.get(base(workspaceId, projectId, taskId), token);
  },

  create(workspaceId: string, projectId: string, taskId: string, content: string, mentions: string[], token: string) {
    return api.post(base(workspaceId, projectId, taskId), { content, mention_ids: mentions }, token);
  },

  update(workspaceId: string, projectId: string, taskId: string, commentId: string, content: string, token: string) {
    return api.patch(`${base(workspaceId, projectId, taskId)}/${commentId}`, { content }, token);
  },

  delete(workspaceId: string, projectId: string, taskId: string, commentId: string, token: string) {
    return api.delete(`${base(workspaceId, projectId, taskId)}/${commentId}`, token);
  },

  reply(workspaceId: string, projectId: string, taskId: string, content: string, parentId: string, mentions: string[], token: string) {
    return api.post(base(workspaceId, projectId, taskId), { content, parent_id: parentId, mention_ids: mentions }, token);
  },
};
