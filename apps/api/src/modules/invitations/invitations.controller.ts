import type { FastifyRequest, FastifyReply } from "fastify";
import { InvitationsService } from "./invitations.service.js";
import { invitationsRepository, workspacesRepository, usersRepository } from "../../lib/registry.js";

const service = new InvitationsService(
  invitationsRepository,
  workspacesRepository,
  usersRepository,
);

export async function createInvitation(
  request: FastifyRequest<{ Params: { id: string }; Body: { email: string } }>,
  reply: FastifyReply,
) {
  const result = await service.createInvitation(request.params.id, request.userId, request.body.email);
  return reply.status(201).send({ data: result });
}

export async function listInvitations(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listInvitations(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function cancelInvitation(
  request: FastifyRequest<{ Params: { id: string; invitationId: string } }>,
  reply: FastifyReply,
) {
  await service.cancelInvitation(request.params.id, request.params.invitationId, request.userId);
  return reply.status(204).send();
}

export async function acceptInvitation(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply,
) {
  await service.acceptInvitation(request.params.token, request.userId);
  return reply.status(200).send({ data: {} });
}

export async function resendInvitation(
  request: FastifyRequest<{ Params: { id: string; invitationId: string } }>,
  reply: FastifyReply,
) {
  const result = await service.resendInvitation(
    request.params.id,
    request.params.invitationId,
    request.userId,
  );
  return reply.status(200).send({ data: result });
}

export async function getInvitationPreview(
  request: FastifyRequest<{ Querystring: { token: string } }>,
  reply: FastifyReply,
) {
  const result = await service.getInvitationPreview(request.query.token);
  return reply.status(200).send({ data: result });
}

export async function declineInvitation(
  request: FastifyRequest<{ Params: { token: string } }>,
  reply: FastifyReply,
) {
  await service.declineInvitation(request.params.token, request.userId);
  return reply.status(200).send({ data: {} });
}
