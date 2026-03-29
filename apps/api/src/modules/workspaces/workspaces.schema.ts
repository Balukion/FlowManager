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
