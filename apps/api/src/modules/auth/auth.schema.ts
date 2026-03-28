export const registerSchema = {
  body: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", minLength: 1 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
    },
    additionalProperties: false,
  },
} as const;

export const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
} as const;

export const refreshSchema = {
  body: {
    type: "object",
    required: ["refresh_token"],
    properties: {
      refresh_token: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
} as const;

export const logoutSchema = {
  body: {
    type: "object",
    required: ["refresh_token"],
    properties: {
      refresh_token: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
} as const;

export const verifyEmailSchema = {
  body: {
    type: "object",
    required: ["token"],
    properties: {
      token: { type: "string", minLength: 1 },
    },
    additionalProperties: false,
  },
} as const;

export const forgotPasswordSchema = {
  body: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
    additionalProperties: false,
  },
} as const;

export const resetPasswordSchema = {
  body: {
    type: "object",
    required: ["token", "password"],
    properties: {
      token: { type: "string", minLength: 1 },
      password: { type: "string", minLength: 8 },
    },
    additionalProperties: false,
  },
} as const;
