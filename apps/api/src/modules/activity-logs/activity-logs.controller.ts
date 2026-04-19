import type { FastifyRequest, FastifyReply } from "fastify";
import { type ActivityAction } from "@prisma/client";
import { ActivityLogsService } from "./activity-logs.service.js";
import { activityLogsRepository, workspacesRepository } from "../../lib/registry.js";

const service = new ActivityLogsService(
  activityLogsRepository,
  workspacesRepository,
);

export async function listByWorkspace(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { cursor?: string; limit?: number; user_id?: string; action?: ActivityAction; from?: string; to?: string };
  }>,
  reply: FastifyReply,
) {
  const result = await service.listByWorkspace(request.params.id, request.userId, request.query);
  return reply.status(200).send(result);
}

export async function listByProject(
  request: FastifyRequest<{
    Params: { id: string; projectId: string };
    Querystring: { cursor?: string; limit?: number };
  }>,
  reply: FastifyReply,
) {
  const result = await service.listByProject(
    request.params.id,
    request.params.projectId,
    request.userId,
    request.query,
  );
  return reply.status(200).send(result);
}

export async function listByTask(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string };
    Querystring: { cursor?: string; limit?: number };
  }>,
  reply: FastifyReply,
) {
  const result = await service.listByTask(
    request.params.id,
    request.params.taskId,
    request.userId,
    request.query,
  );
  return reply.status(200).send(result);
}
