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

describe("invitations OpenAPI docs", () => {
  it("documents invitation routes with security, params, query and safe responses", async () => {
    const document = (app as FastifyInstance & { swagger: () => Record<string, any> }).swagger();
    const paths = document.paths;

    expect(paths["/workspaces/{id}/invitations"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/invitations"].post.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/invitations"].post.requestBody).toBeDefined();
    expect(paths["/workspaces/{id}/invitations"].post.responses["201"]).toBeDefined();

    expect(paths["/workspaces/{id}/invitations"].get.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/invitations"].get.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/invitations"].get.responses["200"]).toBeDefined();

    expect(paths["/workspaces/{id}/invitations/{invitationId}"].delete.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/invitations/{invitationId}"].delete.parameters).toBeDefined();

    expect(paths["/workspaces/{id}/invitations/{invitationId}/resend"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/workspaces/{id}/invitations/{invitationId}/resend"].post.parameters).toBeDefined();
    expect(paths["/workspaces/{id}/invitations/{invitationId}/resend"].post.responses["200"]).toBeDefined();

    expect(paths["/invitations/preview"].get.parameters).toBeDefined();
    expect(paths["/invitations/preview"].get.responses["200"]).toBeDefined();

    expect(paths["/invitations/{token}/accept"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/invitations/{token}/accept"].post.parameters).toBeDefined();
    expect(paths["/invitations/{token}/accept"].post.responses["200"]).toBeDefined();

    expect(paths["/invitations/{token}/decline"].post.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/invitations/{token}/decline"].post.parameters).toBeDefined();
    expect(paths["/invitations/{token}/decline"].post.responses["200"]).toBeDefined();
  });
});
