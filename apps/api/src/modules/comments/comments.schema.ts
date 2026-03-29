import type { FastifySchema } from "fastify";

export const createCommentSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["content"],
    properties: {
      content: { type: "string", minLength: 1 },
      parent_id: { type: ["string", "null"] },
    },
    additionalProperties: false,
  },
};

export const updateCommentSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["content"],
    properties: {
      content: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
};
