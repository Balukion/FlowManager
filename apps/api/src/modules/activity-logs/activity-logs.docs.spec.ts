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

describe("activity logs OpenAPI docs", () => {
  it("documents activity log routes with security, params, query and safe responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/workspaces/{id}/activity-logs"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/activity-logs"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/activity-logs"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/projects/{projectId}/activity-logs"].get.security).toEqual([
      { bearerAuth: [] },
    ]);
    expect(paths["/workspaces/{id}/projects/{projectId}/activity-logs"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/projects/{projectId}/activity-logs"].get.responses["200"]).toBeDefined();

    expect(
      paths["/workspaces/{id}/projects/{projectId}/tasks/{taskId}/activity-logs"].get.security,
    ).toEqual([{ bearerAuth: [] }]);
    expect(
      paths["/workspaces/{id}/projects/{projectId}/tasks/{taskId}/activity-logs"].get.parameters,
    ).toBeDefined();
    expect(
      paths["/workspaces/{id}/projects/{projectId}/tasks/{taskId}/activity-logs"].get.responses["200"],
    ).toBeDefined();
  });
});
