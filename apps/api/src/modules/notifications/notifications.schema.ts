import type { FastifySchema } from "fastify";
import { paramsSchema, querySchema, strictObjectSchema } from "../../lib/api-docs.js";

const notificationsTag = ["Notifications"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const notificationParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const notificationSchema = strictObjectSchema({
  required: [
    "id",
    "user_id",
    "type",
    "title",
    "body",
    "entity_type",
    "entity_id",
    "read_at",
    "sent_at",
    "failed_at",
    "error_message",
    "attempt_count",
    "created_at",
  ],
  properties: {
    id: { type: "string" },
    user_id: { type: "string" },
    type: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    entity_type: { type: ["string", "null"] },
    entity_id: { type: ["string", "null"] },
    read_at: { type: ["string", "null"] },
    sent_at: { type: ["string", "null"] },
    failed_at: { type: ["string", "null"] },
    error_message: { type: ["string", "null"] },
    attempt_count: { type: "integer", minimum: 0 },
    created_at: { type: "string" },
  },
});

const notificationsEnvelopeSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: strictObjectSchema({
      required: ["notifications"],
      properties: {
        notifications: {
          type: "array",
          items: notificationSchema,
        },
      },
    }),
    meta: strictObjectSchema({
      required: ["unread_count"],
      properties: {
        unread_count: { type: "integer", minimum: 0 },
        next_cursor: { type: ["string", "null"] },
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

export const listNotificationsSchema: FastifySchema = {
  tags: [...notificationsTag],
  summary: "Listar notificações do usuário autenticado",
  security: [...bearerSecurity],
  ...querySchema({
    properties: {
      limit: { type: "integer", minimum: 1 },
      cursor: { type: "string" },
    },
  }),
  response: {
    200: notificationsEnvelopeSchema,
  },
};

export const markAllNotificationsAsReadSchema: FastifySchema = {
  tags: [...notificationsTag],
  summary: "Marcar todas as notificações como lidas",
  security: [...bearerSecurity],
  response: {
    200: emptyDataEnvelopeSchema,
  },
};

export const markNotificationAsReadSchema: FastifySchema = {
  tags: [...notificationsTag],
  summary: "Marcar notificação como lida",
  security: [...bearerSecurity],
  ...notificationParams,
  response: {
    200: emptyDataEnvelopeSchema,
  },
};

export const deleteNotificationSchema: FastifySchema = {
  tags: [...notificationsTag],
  summary: "Deletar notificação",
  security: [...bearerSecurity],
  ...notificationParams,
};
