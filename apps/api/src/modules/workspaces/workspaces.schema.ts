import type { FastifySchema } from "fastify";

export const createWorkspaceSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateWorkspaceSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateMemberRoleSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["ADMIN", "MEMBER"] },
    },
    additionalProperties: false,
  },
};

export const transferOwnershipSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["new_owner_id"],
    properties: {
      new_owner_id: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const presignLogoSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["content_type", "file_size_bytes"],
    properties: {
      content_type: { type: "string" },
      file_size_bytes: { type: "number" },
    },
    additionalProperties: false,
  },
};

export const updateLogoSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["logo_url"],
    properties: {
      logo_url: { type: "string" },
    },
    additionalProperties: false,
  },
};
