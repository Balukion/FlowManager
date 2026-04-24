import type { FastifySchema } from "fastify";
import { bodySchema, strictObjectSchema } from "../../lib/api-docs.js";

const usersTag = ["Users"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const userSchema = strictObjectSchema({
  required: [
    "id",
    "name",
    "email",
    "avatar_url",
    "timezone",
    "email_verified",
    "email_verified_at",
    "password_reset_token",
    "password_reset_expires_at",
    "password_changed_at",
    "failed_login_attempts",
    "locked_until",
    "settings",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    avatar_url: { type: ["string", "null"] },
    timezone: { type: "string" },
    email_verified: { type: "boolean" },
    email_verified_at: { type: ["string", "null"] },
    password_reset_token: { type: ["string", "null"] },
    password_reset_expires_at: { type: ["string", "null"] },
    password_changed_at: { type: ["string", "null"] },
    failed_login_attempts: { type: "integer" },
    locked_until: { type: ["string", "null"] },
    settings: {},
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted_at: { type: ["string", "null"] },
  },
});

const userEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["user"],
      properties: {
        user: userSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

const messageEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["message"],
      properties: {
        message: { type: "string" },
      },
    }),
  },
  additionalProperties: false,
} as const;

const presignEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["upload_url", "final_url"],
      properties: {
        upload_url: { type: "string", format: "uri" },
        final_url: { type: "string", format: "uri" },
      },
    }),
  },
  additionalProperties: false,
} as const;

export const getMeSchema: FastifySchema = {
  tags: [...usersTag],
  summary: "Obter perfil do usuário autenticado",
  security: [...bearerSecurity],
  response: {
    200: userEnvelopeSchema,
  },
};

export const updateMeSchema: FastifySchema = {
  tags: [...usersTag],
  summary: "Atualizar perfil do usuário autenticado",
  security: [...bearerSecurity],
  ...bodySchema({
    properties: {
      name: { type: "string", minLength: 1 },
      timezone: { type: "string" },
    },
  }),
  response: {
    200: userEnvelopeSchema,
  },
};

export const changePasswordSchema: FastifySchema = {
  tags: [...usersTag],
  summary: "Alterar senha do usuário autenticado",
  security: [...bearerSecurity],
  ...bodySchema({
    required: ["current_password", "new_password"],
    properties: {
      current_password: { type: "string" },
      new_password: { type: "string", minLength: 8 },
    },
  }),
  response: {
    200: messageEnvelopeSchema,
  },
};

export const presignAvatarSchema: FastifySchema = {
  tags: [...usersTag],
  summary: "Gerar presigned URL para upload de avatar",
  security: [...bearerSecurity],
  ...bodySchema({
    required: ["content_type", "file_size_bytes"],
    properties: {
      content_type: { type: "string" },
      file_size_bytes: { type: "number" },
    },
  }),
  response: {
    200: presignEnvelopeSchema,
  },
};

export const updateAvatarSchema: FastifySchema = {
  tags: [...usersTag],
  summary: "Atualizar avatar do usuário autenticado",
  security: [...bearerSecurity],
  ...bodySchema({
    required: ["avatar_url"],
    properties: {
      avatar_url: { type: "string", format: "uri" },
    },
  }),
  response: {
    200: userEnvelopeSchema,
  },
};

export const deleteAvatarSchema: FastifySchema = {
  tags: [...usersTag],
  summary: "Remover avatar do usuário autenticado",
  security: [...bearerSecurity],
  response: {
    200: userEnvelopeSchema,
  },
};
