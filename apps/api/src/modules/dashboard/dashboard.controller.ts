import type { FastifyRequest, FastifyReply } from "fastify";
import { DashboardService } from "./dashboard.service.js";
import { DashboardRepository } from "./dashboard.repository.js";
import { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

const service = new DashboardService(new DashboardRepository(), new WorkspacesRepository());

export async function getDashboard(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.getDashboard(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}
