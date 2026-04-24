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

describe("labels OpenAPI docs", () => {
  it("documents label routes with security, params, bodies and stable responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;
    const workspaceBase = "/workspaces/{id}/labels";
    const labelPath = `${workspaceBase}/{labelId}`;
    const taskBase = "/workspaces/{id}/projects/{projectId}/tasks/{taskId}/labels";

    expect(paths[workspaceBase].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[workspaceBase].post.parameters).toBeDefined();
    expect(paths[workspaceBase].post.requestBody).toBeDefined();
    expect(paths[workspaceBase].post.responses["201"]).toBeDefined();

    expect(paths[workspaceBase].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[workspaceBase].get.parameters).toBeDefined();
    expect(paths[workspaceBase].get.responses["200"]).toBeDefined();

    expect(paths[labelPath].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[labelPath].patch.parameters).toBeDefined();
    expect(paths[labelPath].patch.requestBody).toBeDefined();
    expect(paths[labelPath].patch.responses["200"]).toBeDefined();

    expect(paths[labelPath].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[labelPath].delete.parameters).toBeDefined();

    expect(paths[taskBase].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[taskBase].post.parameters).toBeDefined();
    expect(paths[taskBase].post.requestBody).toBeDefined();
    expect(paths[taskBase].post.responses["201"]).toBeDefined();

    expect(paths[`${taskBase}/{labelId}`].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${taskBase}/{labelId}`].delete.parameters).toBeDefined();
  });
});
