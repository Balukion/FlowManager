import type { FastifyRequest, FastifyReply } from "fastify";
import { LabelsService } from "./labels.service.js";
import { labelsRepository, tasksRepository, workspacesRepository } from "../../lib/registry.js";

const service = new LabelsService(
  labelsRepository,
  tasksRepository,
  workspacesRepository,
);

export async function createLabel(
  request: FastifyRequest<{ Params: { id: string }; Body: { name: string; color: string } }>,
  reply: FastifyReply,
) {
  const result = await service.createLabel(request.params.id, request.userId, request.body);
  return reply.status(201).send({ data: result });
}

export async function listLabels(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listLabels(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function updateLabel(
  request: FastifyRequest<{
    Params: { id: string; labelId: string };
    Body: { name?: string; color?: string };
  }>,
  reply: FastifyReply,
) {
  const result = await service.updateLabel(
    request.params.id,
    request.params.labelId,
    request.userId,
    request.body,
  );
  return reply.status(200).send({ data: result });
}

export async function deleteLabel(
  request: FastifyRequest<{ Params: { id: string; labelId: string } }>,
  reply: FastifyReply,
) {
  await service.deleteLabel(request.params.id, request.params.labelId, request.userId);
  return reply.status(204).send();
}

export async function applyLabel(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string };
    Body: { label_id: string };
  }>,
  reply: FastifyReply,
) {
  await service.applyLabel(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.body.label_id,
    request.userId,
  );
  return reply.status(201).send({ data: {} });
}

export async function removeLabel(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string; labelId: string };
  }>,
  reply: FastifyReply,
) {
  await service.removeLabel(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.labelId,
    request.userId,
  );
  return reply.status(204).send();
}
