import type { FastifyInstance } from "fastify";
import * as controller from "./dashboard.controller.js";

export async function dashboardRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/workspaces/:id/dashboard", auth, controller.getDashboard);
}
