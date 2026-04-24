import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema, querySchema, strictObjectSchema } from "../../lib/api-docs.js";

const invitationsTag = ["Invitations"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const workspaceParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const invitationParams = paramsSchema({
  required: ["id", "invitationId"],
  properties: {
    id: { type: "string" },
    invitationId: { type: "string" },
  },
});

const tokenParams = paramsSchema({
  required: ["token"],
  properties: {
    token: { type: "string" },
  },
});

const invitationSchema = strictObjectSchema({
  required: [
    "id",
    "workspace_id",
    "invited_by",
    "email",
    "role",
    "status",
    "expires_at",
    "viewed_at",
    "accepted_at",
    "declined_at",
    "created_at",
  ],
  properties: {
    id: { type: "string" },
    workspace_id: { type: "string" },
    invited_by: {},
    email: { type: "string", format: "email" },
    role: { type: "string", enum: ["ADMIN", "MEMBER"] },
    status: { type: "string", enum: ["PENDING", "VIEWED", "ACCEPTED", "EXPIRED", "DECLINED"] },
    expires_at: { type: "string" },
    viewed_at: { type: ["string", "null"] },
    accepted_at: { type: ["string", "null"] },
    declined_at: { type: ["string", "null"] },
    created_at: { type: "string" },
  },
});

const invitationEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["invitation"],
      properties: {
        invitation: invitationSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

const invitationsEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["invitations"],
      properties: {
        invitations: {
          type: "array",
          items: invitationSchema,
        },
      },
    }),
  },
  additionalProperties: false,
} as const;

const invitationPreviewEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["workspace_name", "email", "invited_by_name"],
      properties: {
        workspace_name: { type: "string" },
        email: { type: "string", format: "email" },
        invited_by_name: { type: "string" },
      },
    }),
  },
  additionalProperties: false,
} as const;

const emptyDataEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export const createInvitationSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Criar convite para o workspace",
  security: [...bearerSecurity],
  ...workspaceParams,
  ...bodySchema({
    required: ["email"],
    properties: {
      email: { type: "string", format: "email" },
    },
  }),
  response: {
    201: invitationEnvelopeSchema,
  },
};

export const listInvitationsSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Listar convites pendentes do workspace",
  security: [...bearerSecurity],
  ...workspaceParams,
  response: {
    200: invitationsEnvelopeSchema,
  },
};

export const cancelInvitationSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Cancelar convite do workspace",
  security: [...bearerSecurity],
  ...invitationParams,
};

export const resendInvitationSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Reenviar convite expirado",
  security: [...bearerSecurity],
  ...invitationParams,
  response: {
    200: invitationEnvelopeSchema,
  },
};

export const getInvitationPreviewSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Obter preview de convite por token",
  ...querySchema({
    required: ["token"],
    properties: {
      token: { type: "string", minLength: 1 },
    },
  }),
  response: {
    200: invitationPreviewEnvelopeSchema,
  },
};

export const acceptInvitationSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Aceitar convite",
  security: [...bearerSecurity],
  ...tokenParams,
  response: {
    200: emptyDataEnvelopeSchema,
  },
};

export const declineInvitationSchema: FastifySchema = {
  tags: [...invitationsTag],
  summary: "Recusar convite",
  security: [...bearerSecurity],
  ...tokenParams,
  response: {
    200: emptyDataEnvelopeSchema,
  },
};
