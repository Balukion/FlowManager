import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../app.js";

vi.mock("../../lib/resend.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "fake-email-id" }),
}));

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("auth OpenAPI docs", () => {
  it("documents auth request bodies and stable success responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/auth/register"].post.requestBody).toBeDefined();
    expect(paths["/auth/register"].post.responses["201"]).toBeDefined();

    expect(paths["/auth/login"].post.requestBody).toBeDefined();
    expect(paths["/auth/login"].post.responses["200"]).toBeDefined();

    expect(paths["/auth/refresh"].post.requestBody).toBeDefined();
    expect(paths["/auth/refresh"].post.responses["200"]).toBeDefined();

    expect(paths["/auth/logout"].post.requestBody).toBeDefined();
    expect(paths["/auth/logout"].post.security).toEqual([{ bearerAuth: [] }]);

    expect(paths["/auth/verify-email"].post.requestBody).toBeDefined();
    expect(paths["/auth/verify-email"].post.responses["200"]).toBeDefined();

    expect(paths["/auth/forgot-password"].post.requestBody).toBeDefined();
    expect(paths["/auth/forgot-password"].post.responses["200"]).toBeDefined();

    expect(paths["/auth/reset-password"].post.requestBody).toBeDefined();
    expect(paths["/auth/reset-password"].post.responses["200"]).toBeDefined();
  });
});
