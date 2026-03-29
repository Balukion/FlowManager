import type { FastifyInstance } from "fastify";
import * as controller from "./projects.controller.js";
import { createProjectSchema, updateProjectSchema } from "./projects.schema.js";

export async function projectsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post("/workspaces/:id/projects", { ...auth, schema: createProjectSchema }, controller.createProject);
  app.get("/workspaces/:id/projects", auth, controller.listProjects);
  app.get("/workspaces/:id/projects/archived", auth, controller.listArchivedProjects);
  app.get("/workspaces/:id/projects/:projectId", auth, controller.getProject);
  app.patch("/workspaces/:id/projects/:projectId", { ...auth, schema: updateProjectSchema }, controller.updateProject);
  app.patch("/workspaces/:id/projects/:projectId/archive", auth, controller.archiveProject);
  app.patch("/workspaces/:id/projects/:projectId/unarchive", auth, controller.unarchiveProject);
  app.delete("/workspaces/:id/projects/:projectId", auth, controller.deleteProject);
}
