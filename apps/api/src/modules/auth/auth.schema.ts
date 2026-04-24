import { bodySchema, strictObjectSchema } from "../../lib/api-docs.js";

const authTag = ["Auth"] as const;

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

const authTokensDataSchema = strictObjectSchema({
  required: ["user", "access_token", "refresh_token"],
  properties: {
    user: userSchema,
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
});

const authSuccessResponseSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: authTokensDataSchema,
  },
  additionalProperties: false,
} as const;

const refreshTokensDataSchema = strictObjectSchema({
  required: ["access_token", "refresh_token"],
  properties: {
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
});

const refreshSuccessResponseSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: refreshTokensDataSchema,
  },
  additionalProperties: false,
} as const;

const messageDataSchema = {
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

export const registerSchema = {
  tags: authTag,
  summary: "Registrar usuário",
  ...bodySchema({
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
    },
  }),
  response: {
    201: authSuccessResponseSchema,
  },
} as const;

export const loginSchema = {
  tags: authTag,
  summary: "Autenticar usuário",
  ...bodySchema({
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
  }),
  response: {
    200: authSuccessResponseSchema,
  },
} as const;

export const refreshSchema = {
  tags: authTag,
  summary: "Renovar sessão",
  ...bodySchema({
    required: ["refresh_token"],
    properties: {
      refresh_token: { type: "string", minLength: 1 },
    },
  }),
  response: {
    200: refreshSuccessResponseSchema,
  },
} as const;

export const logoutSchema = {
  tags: authTag,
  summary: "Encerrar sessão",
  security: [{ bearerAuth: [] }],
  ...bodySchema({
    required: ["refresh_token"],
    properties: {
      refresh_token: { type: "string", minLength: 1 },
    },
  }),
} as const;

export const verifyEmailSchema = {
  tags: authTag,
  summary: "Verificar email",
  ...bodySchema({
    required: ["token"],
    properties: {
      token: { type: "string", minLength: 1 },
    },
  }),
  response: {
    200: messageDataSchema,
  },
} as const;

export const forgotPasswordSchema = {
  tags: authTag,
  summary: "Solicitar redefinição de senha",
  ...bodySchema({
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
  }),
  response: {
    200: messageDataSchema,
  },
} as const;

export const resetPasswordSchema = {
  tags: authTag,
  summary: "Redefinir senha",
  ...bodySchema({
    required: ["token", "password"],
    properties: {
      token: { type: "string", minLength: 1 },
      password: { type: "string", minLength: 8 },
    },
  }),
  response: {
    200: messageDataSchema,
  },
} as const;
