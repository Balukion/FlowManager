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

describe("comments OpenAPI docs", () => {
  it("documents comment routes with security, params, query, bodies and safe responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;
    const base = "/workspaces/{id}/projects/{projectId}/tasks/{taskId}/comments";
    const commentPath = `${base}/{commentId}`;

    expect(paths[base].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[base].post.parameters).toBeDefined();
    expect(paths[base].post.requestBody).toBeDefined();
    expect(paths[base].post.responses["201"]).toBeDefined();

    expect(paths[base].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[base].get.parameters).toBeDefined();
    expect(paths[base].get.responses["200"]).toBeDefined();

    expect(paths[commentPath].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[commentPath].patch.parameters).toBeDefined();
    expect(paths[commentPath].patch.requestBody).toBeDefined();
    expect(paths[commentPath].patch.responses["200"]).toBeDefined();

    expect(paths[commentPath].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths[commentPath].delete.parameters).toBeDefined();
  });
});
