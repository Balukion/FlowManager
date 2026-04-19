import type { FastifyRequest, FastifyReply } from "fastify";
import { type StepStatus } from "@prisma/client";
import { StepsService } from "./steps.service.js";
import { TasksService } from "../tasks/tasks.service.js";
import {
  stepsRepository,
  tasksRepository,
  workspacesRepository,
  activityLogsRepository,
  notificationsRepository,
} from "../../lib/registry.js";

const tasksService = new TasksService(tasksRepository, workspacesRepository, activityLogsRepository, notificationsRepository);
const service = new StepsService(
  stepsRepository,
  tasksRepository,
  workspacesRepository,
  tasksService,
  activityLogsRepository,
  notificationsRepository,
);

type StepParams = { id: string; projectId: string; taskId: string; stepId: string };

export async function createStep(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string };
    Body: { title: string; deadline?: string | null };
  }>,
  reply: FastifyReply,
) {
  const result = await service.createStep(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.userId,
    request.body,
  );
  return reply.status(201).send({ data: result });
}

export async function listSteps(
  request: FastifyRequest<{ Params: { id: string; projectId: string; taskId: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listSteps(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.userId,
  );
  return reply.status(200).send({ data: result });
}

export async function updateStep(
  request: FastifyRequest<{
    Params: StepParams;
    Body: { title?: string; description?: string | null; deadline?: string | null };
  }>,
  reply: FastifyReply,
) {
  const result = await service.updateStep(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.stepId,
    request.userId,
    request.body,
  );
  return reply.status(200).send({ data: result });
}

export async function updateStatus(
  request: FastifyRequest<{ Params: StepParams; Body: { status: StepStatus } }>,
  reply: FastifyReply,
) {
  const result = await service.updateStatus(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.stepId,
    request.userId,
    request.body.status,
  );
  return reply.status(200).send({ data: result });
}

export async function assignMember(
  request: FastifyRequest<{ Params: StepParams; Body: { user_id: string } }>,
  reply: FastifyReply,
) {
  await service.assignMember(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.stepId,
    request.userId,
    request.body.user_id,
  );
  return reply.status(201).send({ data: {} });
}

export async function unassignMember(
  request: FastifyRequest<{ Params: StepParams & { userId: string } }>,
  reply: FastifyReply,
) {
  await service.unassignMember(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.stepId,
    request.userId,
    request.params.userId,
  );
  return reply.status(204).send();
}

export async function reorderSteps(
  request: FastifyRequest<{
    Params: { id: string; projectId: string; taskId: string };
    Body: { order: string[] };
  }>,
  reply: FastifyReply,
) {
  await service.reorderSteps(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.userId,
    request.body.order,
  );
  return reply.status(200).send({ data: {} });
}

export async function listAssignedToMe(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listAssignedToMe(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function deleteStep(
  request: FastifyRequest<{ Params: StepParams }>,
  reply: FastifyReply,
) {
  await service.deleteStep(
    request.params.id,
    request.params.projectId,
    request.params.taskId,
    request.params.stepId,
    request.userId,
  );
  return reply.status(204).send();
}
