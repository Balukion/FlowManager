import type { FastifySchema } from "fastify";

export const createInvitationSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
    additionalProperties: false,
  },
};
