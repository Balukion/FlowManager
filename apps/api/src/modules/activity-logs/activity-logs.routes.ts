import type { FastifyInstance } from "fastify";
import * as controller from "./activity-logs.controller.js";

export async function activityLogsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/workspaces/:id/activity-logs", auth, controller.listByWorkspace);
  app.get(
    "/workspaces/:id/projects/:projectId/tasks/:taskId/activity-logs",
    auth,
    controller.listByTask,
  );
}
