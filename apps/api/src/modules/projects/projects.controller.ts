import type { FastifyRequest, FastifyReply } from "fastify";
import { ProjectsService } from "./projects.service.js";
import { ProjectsRepository } from "./projects.repository.js";
import { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

const service = new ProjectsService(new ProjectsRepository(), new WorkspacesRepository());

type WorkspaceParams = { id: string };
type ProjectParams = { id: string; projectId: string };

export async function createProject(
  request: FastifyRequest<{ Params: WorkspaceParams; Body: { name: string; description?: string | null; color?: string | null; deadline?: string | null } }>,
  reply: FastifyReply,
) {
  const result = await service.createProject(request.params.id, request.userId, request.body);
  return reply.status(201).send({ data: result });
}

export async function listProjects(
  request: FastifyRequest<{ Params: WorkspaceParams }>,
  reply: FastifyReply,
) {
  const result = await service.listProjects(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function listArchivedProjects(
  request: FastifyRequest<{ Params: WorkspaceParams }>,
  reply: FastifyReply,
) {
  const result = await service.listArchivedProjects(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}

export async function getProject(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const result = await service.getProject(request.params.id, request.params.projectId, request.userId);
  return reply.status(200).send({ data: result });
}

export async function updateProject(
  request: FastifyRequest<{ Params: ProjectParams; Body: { name?: string; description?: string | null; color?: string | null; deadline?: string | null } }>,
  reply: FastifyReply,
) {
  const result = await service.updateProject(request.params.id, request.params.projectId, request.userId, request.body);
  return reply.status(200).send({ data: result });
}

export async function archiveProject(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const result = await service.archiveProject(request.params.id, request.params.projectId, request.userId);
  return reply.status(200).send({ data: result });
}

export async function unarchiveProject(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  const result = await service.unarchiveProject(request.params.id, request.params.projectId, request.userId);
  return reply.status(200).send({ data: result });
}

export async function deleteProject(
  request: FastifyRequest<{ Params: ProjectParams }>,
  reply: FastifyReply,
) {
  await service.deleteProject(request.params.id, request.params.projectId, request.userId);
  return reply.status(204).send();
}
