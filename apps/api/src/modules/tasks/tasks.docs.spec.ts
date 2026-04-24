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

describe("tasks OpenAPI docs", () => {
  it("documents task routes with security, params, query, bodies and stable responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;
    const base = "/workspaces/{id}/projects/{projectId}/tasks";
    const taskPath = `${base}/{taskId}`;

    expect(paths[base].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[base].post.parameters).toBeDefined();
    expect(paths[base].post.requestBody).toBeDefined();
    expect(paths[base].post.responses["201"]).toBeDefined();

    expect(paths[base].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[base].get.parameters).toBeDefined();
    expect(paths[base].get.responses["200"]).toBeDefined();

    expect(paths[`${base}/reorder`].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${base}/reorder`].patch.parameters).toBeDefined();
    expect(paths[`${base}/reorder`].patch.requestBody).toBeDefined();
    expect(paths[`${base}/reorder`].patch.responses["200"]).toBeDefined();

    expect(paths[taskPath].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[taskPath].get.parameters).toBeDefined();
    expect(paths[taskPath].get.responses["200"]).toBeDefined();

    expect(paths[taskPath].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[taskPath].patch.parameters).toBeDefined();
    expect(paths[taskPath].patch.requestBody).toBeDefined();
    expect(paths[taskPath].patch.responses["200"]).toBeDefined();

    expect(paths[`${taskPath}/status`].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${taskPath}/status`].patch.parameters).toBeDefined();
    expect(paths[`${taskPath}/status`].patch.requestBody).toBeDefined();
    expect(paths[`${taskPath}/status`].patch.responses["200"]).toBeDefined();

    expect(paths[`${taskPath}/assign`].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${taskPath}/assign`].patch.parameters).toBeDefined();
    expect(paths[`${taskPath}/assign`].patch.requestBody).toBeDefined();
    expect(paths[`${taskPath}/assign`].patch.responses["200"]).toBeDefined();

    expect(paths[`${taskPath}/watch`].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${taskPath}/watch`].post.parameters).toBeDefined();
    expect(paths[`${taskPath}/watch`].post.responses["201"]).toBeDefined();

    expect(paths[`${taskPath}/watch`].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${taskPath}/watch`].delete.parameters).toBeDefined();

    expect(paths[taskPath].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[taskPath].delete.parameters).toBeDefined();
  });
});
