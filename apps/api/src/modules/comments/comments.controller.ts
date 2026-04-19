import type { FastifyRequest, FastifyReply } from "fastify";
import { CommentsService } from "./comments.service.js";
import { commentsRepository, tasksRepository, workspacesRepository, activityLogsRepository, notificationsRepository } from "../../lib/registry.js";

const service = new CommentsService(
  commentsRepository,
  tasksRepository,
  workspacesRepository,
  activityLogsRepository,
  notificationsRepository,
);

type CommentParams = { id: string; projectId: string; taskId: string; commentId: string };

export async function createComment(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string };
    Body: { content: string; parent_id?: string | null };
  }>,
  reply: FastifyReply,
) {
  const result = await service.createComment(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.userId,
    request.body,
  );
  return reply.status(201).send({ data: result });
}

export async function listComments(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string };
    Querystring: { limit?: number; cursor?: string };
  }>,
  reply: FastifyReply,
) {
  const result = await service.listComments(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.userId,
    request.query,
  );
  return reply.status(200).send(result);
}

export async function updateComment(
  request: FastifyRequest<{ Params: CommentParams; Body: { content: string } }>,
  reply: FastifyReply,
) {
  const result = await service.updateComment(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.commentId,
    request.userId,
    request.body.content,
  );
  return reply.status(200).send({ data: result });
}

export async function deleteComment(
  request: FastifyRequest<{ Params: CommentParams }>,
  reply: FastifyReply,
) {
  await service.deleteComment(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.commentId,
    request.userId,
  );
  return reply.status(204).send();
}
