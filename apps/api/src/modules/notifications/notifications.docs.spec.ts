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

describe("notifications OpenAPI docs", () => {
  it("documents notification routes with security, params, query and safe responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/notifications"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/notifications"].get.parameters).toBeDefined();
    expect(paths["/notifications"].get.responses["200"]).toBeDefined();

    expect(paths["/notifications/read-all"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/notifications/read-all"].patch.responses["200"]).toBeDefined();

    expect(paths["/notifications/{id}/read"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/notifications/{id}/read"].patch.parameters).toBeDefined();
    expect(paths["/notifications/{id}/read"].patch.responses["200"]).toBeDefined();

    expect(paths["/notifications/{id}"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/notifications/{id}"].delete.parameters).toBeDefined();
  });
});
