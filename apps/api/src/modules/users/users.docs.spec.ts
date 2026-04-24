import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";

vi.mock("../../lib/s3.js", () => ({
  generatePresignedUploadUrl: vi
    .fn()
    .mockResolvedValue("https://fake-s3.amazonaws.com/upload?token=fake"),
  getPublicUrl: vi
    .fn()
    .mockReturnValue("https://fake-s3.amazonaws.com/avatars/user-id.jpg"),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("users OpenAPI docs", () => {
  it("documents users request bodies, security and stable success responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/users/me"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/users/me"].get.responses["200"]).toBeDefined();

    expect(paths["/users/me"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/users/me"].patch.requestBody).toBeDefined();
    expect(paths["/users/me"].patch.responses["200"]).toBeDefined();

    expect(paths["/users/me/password"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/users/me/password"].patch.requestBody).toBeDefined();
    expect(paths["/users/me/password"].patch.responses["200"]).toBeDefined();

    expect(paths["/users/me/avatar/presign"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/users/me/avatar/presign"].post.requestBody).toBeDefined();
    expect(paths["/users/me/avatar/presign"].post.responses["200"]).toBeDefined();

    expect(paths["/users/me/avatar"].patch.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/users/me/avatar"].patch.requestBody).toBeDefined();
    expect(paths["/users/me/avatar"].patch.responses["200"]).toBeDefined();

    expect(paths["/users/me/avatar"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/users/me/avatar"].delete.responses["200"]).toBeDefined();
  });
});
