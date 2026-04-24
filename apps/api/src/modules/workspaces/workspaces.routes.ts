import type { FastifyInstance } from "fastify";
import * as controller from "./workspaces.controller.js";
import {
  createWorkspaceSchema,
  listWorkspacesSchema,
  getWorkspaceSchema,
  getWorkspaceMemberSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  listMembersSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  transferOwnershipSchema,
  presignLogoSchema,
  updateLogoSchema,
  deleteLogoSchema,
} from "./workspaces.schema.js";

export async function workspacesRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post("/workspaces", { ...auth, schema: createWorkspaceSchema }, controller.createWorkspace);
  app.get("/workspaces", { ...auth, schema: listWorkspacesSchema }, controller.listWorkspaces);
  app.get("/workspaces/:id", { ...auth, schema: getWorkspaceSchema }, controller.getWorkspace);
  app.get("/workspaces/:id/me", { ...auth, schema: getWorkspaceMemberSchema }, controller.getWorkspaceMember);
  app.patch("/workspaces/:id", { ...auth, schema: updateWorkspaceSchema }, controller.updateWorkspace);
  app.delete("/workspaces/:id", { ...auth, schema: deleteWorkspaceSchema }, controller.deleteWorkspace);

  app.get("/workspaces/:id/members", { ...auth, schema: listMembersSchema }, controller.listMembers);
  app.patch("/workspaces/:id/members/:userId", { ...auth, schema: updateMemberRoleSchema }, controller.updateMemberRole);
  app.delete("/workspaces/:id/members/:userId", { ...auth, schema: removeMemberSchema }, controller.removeMember);

  app.patch("/workspaces/:id/transfer", { ...auth, schema: transferOwnershipSchema }, controller.transferOwnership);

  app.post("/workspaces/:id/logo/presign", { ...auth, schema: presignLogoSchema }, controller.presignLogo);
  app.patch("/workspaces/:id/logo", { ...auth, schema: updateLogoSchema }, controller.updateLogo);
  app.delete("/workspaces/:id/logo", { ...auth, schema: deleteLogoSchema }, controller.deleteLogo);
}
