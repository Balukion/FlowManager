import type { FastifyRequest, FastifyReply } from "fastify";
import { NotificationsService } from "./notifications.service.js";
import { notificationsRepository } from "../../lib/registry.js";

const service = new NotificationsService(notificationsRepository);

export async function listNotifications(
  request: FastifyRequest<{ Querystring: { limit?: number; cursor?: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listNotifications(request.userId, request.query);
  return reply.status(200).send(result);
}

export async function markAsRead(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await service.markAsRead(request.params.id, request.userId);
  return reply.status(200).send({ data: {} });
}

export async function markAllAsRead(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  await service.markAllAsRead(request.userId);
  return reply.status(200).send({ data: {} });
}

export async function deleteNotification(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await service.deleteNotification(request.params.id, request.userId);
  return reply.status(204).send();
}
