import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";

vi.mock("../../lib/s3.js", () => ({
  generatePresignedUploadUrl: vi
    .fn()
    .mockResolvedValue("https://fake-s3.amazonaws.com/upload?token=fake"),
  getPublicUrl: vi
    .fn()
    .mockReturnValue("https://fake-s3.amazonaws.com/logos/ws-id.jpg"),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("workspaces OpenAPI docs", () => {
  it("documents workspace routes with security, params, bodies and stable responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/workspaces"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces"].post.requestBody).toBeDefined();
    expect(paths["/workspaces"].post.responses["201"]).toBeDefined();

    expect(paths["/workspaces"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/me"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/me"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/me"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}"].patch.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}"].delete.parameters).toBeDefined();

    expect(paths["/workspaces/{id}/members"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/members"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/members"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/members/{userId}"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/members/{userId}"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/members/{userId}"].patch.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/members/{userId}"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/members/{userId}"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/members/{userId}"].delete.parameters).toBeDefined();

    expect(paths["/workspaces/{id}/transfer"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/transfer"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/transfer"].patch.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/transfer"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/logo/presign"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/logo/presign"].post.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/logo/presign"].post.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/logo/presign"].post.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/logo"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/logo"].patch.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/logo"].patch.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/logo"].patch.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/logo"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/logo"].delete.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/logo"].delete.responses["200"]).toBeDefined();
  });
});
