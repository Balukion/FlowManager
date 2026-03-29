import type { FastifyRequest, FastifyReply } from "fastify";
import { WorkspacesService } from "./workspaces.service.js";
import { WorkspacesRepository } from "./workspaces.repository.js";
import { ActivityLogsRepository } from "../activity-logs/activity-logs.repository.js";

const service = new WorkspacesService(new WorkspacesRepository(), new ActivityLogsRepository());

export async function createWorkspace(
  request: FastifyRequest<{ Body: { name: string; description?: string | null; color?: string | null } }>,
  reply: FastifyReply,
) {
  const result = await service.createWorkspace(request.userId, request.body);
  return reply.status(201).send({ data: result });
}

export async function listWorkspaces(request: FastifyRequest, reply: FastifyReply) {
  const result = await service.listWorkspaces(request.userId);
  return reply.status(200).send({ data: result });
}

export async function getWorkspace(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.getWorkspace(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function updateWorkspace(
  request: FastifyRequest<{ Params: { id: string }; Body: { name?: string; description?: string | null; color?: string | null } }>,
  reply: FastifyReply,
) {
  const result = await service.updateWorkspace(request.params.id, request.userId, request.body);
  return reply.status(200).send({ data: result });
}

export async function deleteWorkspace(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  await service.deleteWorkspace(request.params.id, request.userId);
  return reply.status(204).send();
}

export async function listMembers(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.listMembers(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function updateMemberRole(
  request: FastifyRequest<{ Params: { id: string; userId: string }; Body: { role: "ADMIN" | "MEMBER" } }>,
  reply: FastifyReply,
) {
  await service.updateMemberRole(request.params.id, request.userId, request.params.userId, request.body.role);
  return reply.status(200).send({ data: {} });
}

export async function removeMember(
  request: FastifyRequest<{ Params: { id: string; userId: string } }>,
  reply: FastifyReply,
) {
  await service.removeMember(request.params.id, request.userId, request.params.userId);
  return reply.status(204).send();
}

export async function transferOwnership(
  request: FastifyRequest<{ Params: { id: string }; Body: { new_owner_id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.transferOwnership(request.params.id, request.userId, request.body.new_owner_id);
  return reply.status(200).send({ data: result });
}

export async function presignLogo(
  request: FastifyRequest<{ Params: { id: string }; Body: { content_type: string; file_size_bytes: number } }>,
  reply: FastifyReply,
) {
  const result = await service.presignLogo(request.params.id, request.userId, request.body);
  return reply.status(200).send({ data: result });
}

export async function updateLogo(
  request: FastifyRequest<{ Params: { id: string }; Body: { logo_url: string } }>,
  reply: FastifyReply,
) {
  const result = await service.updateLogo(request.params.id, request.userId, request.body.logo_url);
  return reply.status(200).send({ data: result });
}

export async function deleteLogo(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.deleteLogo(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}
