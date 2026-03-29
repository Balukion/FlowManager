import type { FastifyInstance } from "fastify";
import * as controller from "./workspaces.controller.js";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from "./workspaces.schema.js";

export async function workspacesRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post("/workspaces", { ...auth, schema: createWorkspaceSchema }, controller.createWorkspace);
  app.get("/workspaces", auth, controller.listWorkspaces);
  app.get("/workspaces/:id", auth, controller.getWorkspace);
  app.patch("/workspaces/:id", { ...auth, schema: updateWorkspaceSchema }, controller.updateWorkspace);
  app.delete("/workspaces/:id", auth, controller.deleteWorkspace);

  app.get("/workspaces/:id/members", auth, controller.listMembers);
  app.patch("/workspaces/:id/members/:userId", { ...auth, schema: updateMemberRoleSchema }, controller.updateMemberRole);
  app.delete("/workspaces/:id/members/:userId", auth, controller.removeMember);

  app.patch("/workspaces/:id/transfer", { ...auth, schema: transferOwnershipSchema }, controller.transferOwnership);
}
