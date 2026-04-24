import type { FastifyInstance } from "fastify";
import * as controller from "./dashboard.controller.js";
import { getDashboardSchema } from "./dashboard.schema.js";

export async function dashboardRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get(
    "/workspaces/:id/dashboard",
    { ...auth, schema: getDashboardSchema },
    controller.getDashboard,
  );
}
