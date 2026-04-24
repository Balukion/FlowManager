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

describe("dashboard OpenAPI docs", () => {
  it("documents dashboard route with security, params and safe response", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/workspaces/{id}/dashboard"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/dashboard"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/dashboard"].get.responses["200"]).toBeDefined();
  });
});
