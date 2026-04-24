import type { FastifySchema } from "fastify";
import { paramsSchema, querySchema, strictObjectSchema } from "../../lib/api-docs.js";

const activityLogsTag = ["Activity Logs"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const workspaceParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const projectParams = paramsSchema({
  required: ["id", "projectId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
  },
});

const taskParams = paramsSchema({
  required: ["id", "projectId", "taskId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
  },
});

const activityLogUserSchema = strictObjectSchema({
  required: ["id", "name", "email", "avatar_url"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    avatar_url: { type: ["string", "null"] },
  },
});

const activityLogSchema = strictObjectSchema({
  required: [
    "id",
    "workspace_id",
    "project_id",
    "task_id",
    "user_id",
    "action",
    "entity_type",
    "entity_id",
    "metadata",
    "created_at",
    "user",
  ],
  properties: {
    id: { type: "string" },
    workspace_id: { type: ["string", "null"] },
    project_id: { type: ["string", "null"] },
    task_id: { type: ["string", "null"] },
    user_id: { type: "string" },
    action: { type: "string" },
    entity_type: { type: ["string", "null"] },
    entity_id: { type: ["string", "null"] },
    metadata: {},
    created_at: { type: "string" },
    user: activityLogUserSchema,
  },
});

const activityLogsEnvelopeSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: strictObjectSchema({
      required: ["logs"],
      properties: {
        logs: {
          type: "array",
          items: activityLogSchema,
        },
      },
    }),
    meta: strictObjectSchema({
      properties: {
        next_cursor: { type: ["string", "null"] },
      },
    }),
  },
  additionalProperties: false,
} as const;

const paginationQuerySchema = querySchema({
  properties: {
    limit: { type: "integer", minimum: 1 },
    cursor: { type: "string" },
  },
});

export const listWorkspaceActivityLogsSchema: FastifySchema = {
  tags: [...activityLogsTag],
  summary: "Listar activity logs do workspace",
  security: [...bearerSecurity],
  ...workspaceParams,
  ...querySchema({
    properties: {
      limit: { type: "integer", minimum: 1 },
      cursor: { type: "string" },
      user_id: { type: "string" },
      action: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
    },
  }),
  response: {
    200: activityLogsEnvelopeSchema,
  },
};

export const listProjectActivityLogsSchema: FastifySchema = {
  tags: [...activityLogsTag],
  summary: "Listar activity logs das tarefas de um projeto",
  security: [...bearerSecurity],
  ...projectParams,
  ...paginationQuerySchema,
  response: {
    200: activityLogsEnvelopeSchema,
  },
};

export const listTaskActivityLogsSchema: FastifySchema = {
  tags: [...activityLogsTag],
  summary: "Listar activity logs de uma tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  ...paginationQuerySchema,
  response: {
    200: activityLogsEnvelopeSchema,
  },
};
