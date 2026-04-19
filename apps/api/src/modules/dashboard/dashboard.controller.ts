import type { FastifyRequest, FastifyReply } from "fastify";
import { DashboardService } from "./dashboard.service.js";
import { dashboardRepository, workspacesRepository } from "../../lib/registry.js";

const service = new DashboardService(dashboardRepository, workspacesRepository);

export async function getDashboard(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const result = await service.getDashboard(request.params.id, request.userId);
  return reply.status(200).send({ data: result });
}
