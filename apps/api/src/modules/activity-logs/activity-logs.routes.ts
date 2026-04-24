import type { FastifyInstance } from "fastify";
import * as controller from "./activity-logs.controller.js";
import {
  listProjectActivityLogsSchema,
  listTaskActivityLogsSchema,
  listWorkspaceActivityLogsSchema,
} from "./activity-logs.schema.js";

export async function activityLogsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get(
    "/workspaces/:id/activity-logs",
    { ...auth, schema: listWorkspaceActivityLogsSchema },
    controller.listByWorkspace,
  );
  app.get(
    "/workspaces/:id/projects/:projectId/activity-logs",
    { ...auth, schema: listProjectActivityLogsSchema },
    controller.listByProject,
  );
  app.get(
    "/workspaces/:id/projects/:projectId/tasks/:taskId/activity-logs",
    { ...auth, schema: listTaskActivityLogsSchema },
    controller.listByTask,
  );
}
