import type { FastifyInstance } from "fastify";
import * as controller from "./steps.controller.js";
import {
  createStepSchema,
  updateStepSchema,
  updateStepStatusSchema,
  assignStepSchema,
  reorderStepsSchema,
} from "./steps.schema.js";

const BASE = "/workspaces/:id/projects/:projectId/tasks/:taskId/steps";

export async function stepsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post(BASE, { ...auth, schema: createStepSchema }, controller.createStep);
  app.get(BASE, auth, controller.listSteps);
  app.patch(`${BASE}/reorder`, { ...auth, schema: reorderStepsSchema }, controller.reorderSteps);
  app.patch(`${BASE}/:stepId`, { ...auth, schema: updateStepSchema }, controller.updateStep);
  app.patch(`${BASE}/:stepId/status`, { ...auth, schema: updateStepStatusSchema }, controller.updateStatus);
  app.patch(`${BASE}/:stepId/assign`, { ...auth, schema: assignStepSchema }, controller.assignMember);
  app.delete(`${BASE}/:stepId/assign/:userId`, auth, controller.unassignMember);
  app.delete(`${BASE}/:stepId`, auth, controller.deleteStep);
}
