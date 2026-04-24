import type { FastifyInstance } from "fastify";
import * as controller from "./labels.controller.js";
import {
  applyLabelSchema,
  createLabelSchema,
  deleteLabelSchema,
  listLabelsSchema,
  removeLabelSchema,
  updateLabelSchema,
} from "./labels.schema.js";

const WORKSPACE_BASE = "/workspaces/:id/labels";
const TASK_BASE = "/workspaces/:id/projects/:projectId/tasks/:taskId/labels";

export async function labelsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post(WORKSPACE_BASE, { ...auth, schema: createLabelSchema }, controller.createLabel);
  app.get(WORKSPACE_BASE, { ...auth, schema: listLabelsSchema }, controller.listLabels);
  app.patch(`${WORKSPACE_BASE}/:labelId`, { ...auth, schema: updateLabelSchema }, controller.updateLabel);
  app.delete(`${WORKSPACE_BASE}/:labelId`, { ...auth, schema: deleteLabelSchema }, controller.deleteLabel);

  app.post(TASK_BASE, { ...auth, schema: applyLabelSchema }, controller.applyLabel);
  app.delete(`${TASK_BASE}/:labelId`, { ...auth, schema: removeLabelSchema }, controller.removeLabel);
}
