import type { FastifySchema } from "fastify";

export const createTaskSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["title", "priority"],
    properties: {
      title: { type: "string", minLength: 1 },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
      description: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateTaskSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1 },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
      description: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateStatusSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
    },
    additionalProperties: false,
  },
};

export const reorderTasksSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["order"],
    properties: {
      order: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  },
};
