import type { FastifySchema } from "fastify";

export const createStepSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["title"],
    properties: {
      title: { type: "string", minLength: 1 },
      deadline: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateStepSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateStepStatusSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "DONE"] },
    },
    additionalProperties: false,
  },
};

export const assignStepSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["user_id"],
    properties: {
      user_id: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const reorderStepsSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["order"],
    properties: {
      order: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  },
};
