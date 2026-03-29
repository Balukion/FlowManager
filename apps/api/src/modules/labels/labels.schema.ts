import type { FastifySchema } from "fastify";

const HEX_COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";

export const createLabelSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["name", "color"],
    properties: {
      name: { type: "string", minLength: 1 },
      color: { type: "string", pattern: HEX_COLOR_PATTERN },
    },
    additionalProperties: false,
  },
};

export const updateLabelSchema: FastifySchema = {
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      name: { type: "string", minLength: 1 },
      color: { type: "string", pattern: HEX_COLOR_PATTERN },
    },
    additionalProperties: false,
  },
};

export const applyLabelSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["label_id"],
    properties: {
      label_id: { type: "string" },
    },
    additionalProperties: false,
  },
};
