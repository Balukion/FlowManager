import type { FastifySchema } from "fastify";

export const getMeSchema: FastifySchema = {};

export const updateMeSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1 },
      timezone: { type: "string" },
    },
    additionalProperties: false,
  },
};

export const changePasswordSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["current_password", "new_password"],
    properties: {
      current_password: { type: "string" },
      new_password: { type: "string", minLength: 8 },
    },
    additionalProperties: false,
  },
};

export const presignAvatarSchema: FastifySchema = {
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

export const updateAvatarSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["avatar_url"],
    properties: {
      avatar_url: { type: "string", format: "uri" },
    },
    additionalProperties: false,
  },
};

export const deleteAvatarSchema: FastifySchema = {};
