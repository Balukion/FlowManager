import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("projects OpenAPI docs", () => {
  it("documents project routes with security, params, bodies and stable responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/workspaces/{id}/projects"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects"].post.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects"].post.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/projects"].post.responses["201"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/archived"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects/archived"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects/archived"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/{projectId}"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects/{projectId}"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects/{projectId}"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/{projectId}"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects/{projectId}"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects/{projectId}"].patch.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/projects/{projectId}"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/{projectId}/archive"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects/{projectId}/archive"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects/{projectId}/archive"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/{projectId}/unarchive"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects/{projectId}/unarchive"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects/{projectId}/unarchive"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/{projectId}"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/projects/{projectId}"].delete.parameters).toBeDefined();
  });
});
