import type { FastifyInstance } from "fastify";
import * as controller from "./projects.controller.js";
import {
  archiveProjectSchema,
  createProjectSchema,
  deleteProjectSchema,
  getProjectSchema,
  listArchivedProjectsSchema,
  listProjectsSchema,
  unarchiveProjectSchema,
  updateProjectSchema,
} from "./projects.schema.js";

export async function projectsRoutes(app: FastifyInstance) {
  const auth = { preHandler: [app.authenticate] };

  app.post("/workspaces/:id/projects", { ...auth, schema: createProjectSchema }, controller.createProject);
  app.get("/workspaces/:id/projects", { ...auth, schema: listProjectsSchema }, controller.listProjects);
  app.get("/workspaces/:id/projects/archived", { ...auth, schema: listArchivedProjectsSchema }, controller.listArchivedProjects);
  app.get("/workspaces/:id/projects/:projectId", { ...auth, schema: getProjectSchema }, controller.getProject);
  app.patch("/workspaces/:id/projects/:projectId", { ...auth, schema: updateProjectSchema }, controller.updateProject);
  app.patch("/workspaces/:id/projects/:projectId/archive", { ...auth, schema: archiveProjectSchema }, controller.archiveProject);
  app.patch("/workspaces/:id/projects/:projectId/unarchive", { ...auth, schema: unarchiveProjectSchema }, controller.unarchiveProject);
  app.delete("/workspaces/:id/projects/:projectId", { ...auth, schema: deleteProjectSchema }, controller.deleteProject);
}
