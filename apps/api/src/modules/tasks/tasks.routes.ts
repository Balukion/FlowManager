import type { FastifyInstance } from "fastify";
import * as controller from "./tasks.controller.js";
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  reorderTasksSchema,
} from "./tasks.schema.js";

const BASE = "/workspaces/:id/projects/:projectId/tasks";

export async function tasksRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post(BASE, { ...auth, schema: createTaskSchema }, controller.createTask);
  app.get(BASE, auth, controller.listTasks);
  app.patch(`${BASE}/reorder`, { ...auth, schema: reorderTasksSchema }, controller.reorderTasks);
  app.get(`${BASE}/:taskId`, auth, controller.getTask);
  app.patch(`${BASE}/:taskId`, { ...auth, schema: updateTaskSchema }, controller.updateTask);
  app.patch(`${BASE}/:taskId/status`, { ...auth, schema: updateStatusSchema }, controller.updateStatus);
  app.patch(`${BASE}/:taskId/assign`, auth, controller.assignTask);
  app.post(`${BASE}/:taskId/watch`, auth, controller.watchTask);
  app.delete(`${BASE}/:taskId/watch`, auth, controller.unwatchTask);
  app.delete(`${BASE}/:taskId`, auth, controller.deleteTask);
}
