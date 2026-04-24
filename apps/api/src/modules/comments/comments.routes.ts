import type { FastifyInstance } from "fastify";
import * as controller from "./comments.controller.js";
import {
  createCommentSchema,
  deleteCommentSchema,
  listCommentsSchema,
  updateCommentSchema,
} from "./comments.schema.js";

const BASE = "/workspaces/:id/projects/:projectId/tasks/:taskId/comments";

export async function commentsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post(BASE, { ...auth, schema: createCommentSchema }, controller.createComment);
  app.get(BASE, { ...auth, schema: listCommentsSchema }, controller.listComments);
  app.patch(`${BASE}/:commentId`, { ...auth, schema: updateCommentSchema }, controller.updateComment);
  app.delete(`${BASE}/:commentId`, { ...auth, schema: deleteCommentSchema }, controller.deleteComment);
}
