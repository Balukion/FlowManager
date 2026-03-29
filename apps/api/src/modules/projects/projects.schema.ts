import type { FastifySchema } from "fastify";

export const createProjectSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateProjectSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};
