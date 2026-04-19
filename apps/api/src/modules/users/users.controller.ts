import type { FastifyRequest, FastifyReply } from "fastify";
import { UsersService } from "./users.service.js";
import { usersRepository } from "../../lib/registry.js";

const service = new UsersService(usersRepository);

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const result = await service.getMe(request.userId);
  return reply.status(200).send({ data: result });
}

export async function updateMe(
  request: FastifyRequest<{ Body: { name?: string; timezone?: string } }>,
  reply: FastifyReply,
) {
  const result = await service.updateMe(request.userId, request.body);
  return reply.status(200).send({ data: result });
}

export async function changePassword(
  request: FastifyRequest<{ Body: { current_password: string; new_password: string } }>,
  reply: FastifyReply,
) {
  await service.changePassword(request.userId, request.body);
  return reply.status(200).send({ data: { message: "Senha atualizada com sucesso" } });
}

export async function presignAvatar(
  request: FastifyRequest<{ Body: { content_type: string; file_size_bytes: number } }>,
  reply: FastifyReply,
) {
  const result = await service.presignAvatar(request.userId, request.body);
  return reply.status(200).send({ data: result });
}

export async function updateAvatar(
  request: FastifyRequest<{ Body: { avatar_url: string } }>,
  reply: FastifyReply,
) {
  const result = await service.updateAvatar(request.userId, request.body.avatar_url);
  return reply.status(200).send({ data: result });
}

export async function deleteAvatar(request: FastifyRequest, reply: FastifyReply) {
  const result = await service.deleteAvatar(request.userId);
  return reply.status(200).send({ data: result });
}
