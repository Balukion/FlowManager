import type { FastifyRequest, FastifyReply } from "fastify";
import { TasksService } from "./tasks.service.js";
import { TasksRepository } from "./tasks.repository.js";
import { WorkspacesRepository } from "../workspaces/workspaces.repository.js";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository.js";
import { NotificationsRepository } from "../notifications/notifications.repository.js";

const service = new TasksService(
  new TasksRepository(),
  new WorkspacesRepository(),
  new ActivityLogsRepository(),
  new NotificationsRepository(),
);

type TaskParams = { id: string; projectId: string; taskId: string };

export async function createTask(
  request: FastifyRequest<{
    Params: { id: string; projectId: string };
    Body: { title: string; priority: string; description?: string | null; deadline?: string | null };
  }>,
  reply: FastifyReply,
) {
  const result = await service.createTask(request.params.id, request.params.projectId, request.userId, request.body);
  return reply.status(201).send({ data: result });
}

export async function listTasks(
  request: FastifyRequest<{ Params: { id: string; projectId: string }; Querystring: { status?: string; priority?: string; label_id?: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listTasks(request.params.id, request.params.projectId, request.userId, request.query);
  return reply.status(200).send({ data: result });
}

export async function getTask(
  request: FastifyRequest<{ Params: TaskParams }>,
  reply: FastifyReply,
) {
  const result = await service.getTask(request.params.id, request.params.projectId, request.params.taskId, request.userId);
  return reply.status(200).send({ data: result });
}

export async function updateTask(
  request: FastifyRequest<{ Params: TaskParams; Body: { title?: string; description?: string | null; priority?: string; deadline?: string | null } }>,
  reply: FastifyReply,
) {
  const { warnings, ...data } = await service.updateTask(request.params.id, request.params.projectId, request.params.taskId, request.userId, request.body);
  return reply.status(200).send({ data, ...(warnings ? { warnings } : {}) });
}

export async function updateStatus(
  request: FastifyRequest<{ Params: TaskParams; Body: { status: string } }>,
  reply: FastifyReply,
) {
  const result = await service.updateStatus(request.params.id, request.params.projectId, request.params.taskId, request.userId, request.body.status);
  return reply.status(200).send({ data: result });
}

export async function reorderTasks(
  request: FastifyRequest<{ Params: { id: string; projectId: string }; Body: { order: string[] } }>,
  reply: FastifyReply,
) {
  await service.reorderTasks(request.params.id, request.params.projectId, request.userId, request.body.order);
  return reply.status(200).send({ data: {} });
}

export async function watchTask(
  request: FastifyRequest<{ Params: TaskParams }>,
  reply: FastifyReply,
) {
  await service.watchTask(request.params.id, request.params.projectId, request.params.taskId, request.userId);
  return reply.status(201).send({ data: {} });
}

export async function unwatchTask(
  request: FastifyRequest<{ Params: TaskParams }>,
  reply: FastifyReply,
) {
  await service.unwatchTask(request.params.id, request.params.projectId, request.params.taskId, request.userId);
  return reply.status(204).send();
}

export async function deleteTask(
  request: FastifyRequest<{ Params: TaskParams }>,
  reply: FastifyReply,
) {
  await service.deleteTask(request.params.id, request.params.projectId, request.params.taskId, request.userId);
  return reply.status(204).send();
}
