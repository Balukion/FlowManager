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

describe("steps OpenAPI docs", () => {
  it("documents step routes with security, params, bodies and stable responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;
    const base = "/workspaces/{id}/projects/{projectId}/tasks/{taskId}/steps";
    const stepPath = `${base}/{stepId}`;

    expect(paths["/workspaces/{id}/steps/assigned"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/steps/assigned"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/steps/assigned"].get.responses["200"]).toBeDefined();

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

    expect(paths[stepPath].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[stepPath].patch.parameters).toBeDefined();
    expect(paths[stepPath].patch.requestBody).toBeDefined();
    expect(paths[stepPath].patch.responses["200"]).toBeDefined();

    expect(paths[`${stepPath}/status`].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${stepPath}/status`].patch.parameters).toBeDefined();
    expect(paths[`${stepPath}/status`].patch.requestBody).toBeDefined();
    expect(paths[`${stepPath}/status`].patch.responses["200"]).toBeDefined();

    expect(paths[`${stepPath}/assign`].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${stepPath}/assign`].patch.parameters).toBeDefined();
    expect(paths[`${stepPath}/assign`].patch.requestBody).toBeDefined();
    expect(paths[`${stepPath}/assign`].patch.responses["201"]).toBeDefined();

    expect(paths[`${stepPath}/assign/{userId}`].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[`${stepPath}/assign/{userId}`].delete.parameters).toBeDefined();

    expect(paths[stepPath].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[stepPath].delete.parameters).toBeDefined();
  });
});
