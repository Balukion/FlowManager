import type { FastifyInstance } from "fastify";
import * as controller from "./steps.controller.js";
import {
  listAssignedToMeSchema,
  createStepSchema,
  deleteStepSchema,
  listStepsSchema,
  unassignStepSchema,
  updateStepSchema,
  updateStepStatusSchema,
  assignStepSchema,
  reorderStepsSchema,
} from "./steps.schema.js";

const BASE = "/workspaces/:id/projects/:projectId/tasks/:taskId/steps";

export async function stepsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.get("/workspaces/:id/steps/assigned", { ...auth, schema: listAssignedToMeSchema }, controller.listAssignedToMe);
  app.post(BASE, { ...auth, schema: createStepSchema }, controller.createStep);
  app.get(BASE, { ...auth, schema: listStepsSchema }, controller.listSteps);
  app.patch(`${BASE}/reorder`, { ...auth, schema: reorderStepsSchema }, controller.reorderSteps);
  app.patch(`${BASE}/:stepId`, { ...auth, schema: updateStepSchema }, controller.updateStep);
  app.patch(`${BASE}/:stepId/status`, { ...auth, schema: updateStepStatusSchema }, controller.updateStatus);
  app.patch(`${BASE}/:stepId/assign`, { ...auth, schema: assignStepSchema }, controller.assignMember);
  app.delete(`${BASE}/:stepId/assign/:userId`, { ...auth, schema: unassignStepSchema }, controller.unassignMember);
  app.delete(`${BASE}/:stepId`, { ...auth, schema: deleteStepSchema }, controller.deleteStep);
}
