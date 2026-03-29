import type { FastifyRequest, FastifyReply } from "fastify";
import { ActivityLogsService } from "./activity-logs.service.js";
import { ActivityLogsRepository } from "./activity-logs.repository.js";
import { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

const service = new ActivityLogsService(
  new ActivityLogsRepository(),
  new WorkspacesRepository(),
);

export async function listByWorkspace(
  request: FastifyRequest<{
    Params: { id: string };
    Querystring: { cursor?: string; limit?: number };
  }>,
  reply: FastifyReply,
) {
  const result = await service.listByWorkspace(request.params.id, request.userId, request.query);
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
