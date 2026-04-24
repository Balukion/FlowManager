import type { FastifySchema } from "fastify";
import { paramsSchema, strictObjectSchema } from "../../lib/api-docs.js";

const dashboardTag = ["Dashboard"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const workspaceParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const recentTaskSchema = strictObjectSchema({
  required: ["id", "title", "status", "priority", "deadline", "created_at"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    status: { type: "string" },
    priority: { type: "string" },
    deadline: { type: ["string", "null"] },
    created_at: { type: "string" },
  },
});

const projectCompletionSchema = strictObjectSchema({
  required: ["project_id", "project_name", "total", "done", "rate"],
  properties: {
    project_id: { type: "string" },
    project_name: { type: "string" },
    total: { type: "integer", minimum: 0 },
    done: { type: "integer", minimum: 0 },
    rate: { type: "integer", minimum: 0 },
  },
});

const memberWorkloadSchema = strictObjectSchema({
  required: ["user_id", "user_name", "avatar_url", "open_tasks"],
  properties: {
    user_id: { type: "string" },
    user_name: { type: "string" },
    avatar_url: { type: ["string", "null"] },
    open_tasks: { type: "integer", minimum: 0 },
  },
});

const dashboardEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: [
        "tasks",
        "members_count",
        "recent_tasks",
        "project_completion",
        "member_workload",
      ],
      properties: {
        tasks: strictObjectSchema({
          required: ["total", "todo", "in_progress", "done", "overdue"],
          properties: {
            total: { type: "integer", minimum: 0 },
            todo: { type: "integer", minimum: 0 },
            in_progress: { type: "integer", minimum: 0 },
            done: { type: "integer", minimum: 0 },
            overdue: { type: "integer", minimum: 0 },
          },
        }),
        members_count: { type: "integer", minimum: 0 },
        recent_tasks: {
          type: "array",
          items: recentTaskSchema,
        },
        project_completion: {
          type: "array",
          items: projectCompletionSchema,
        },
        member_workload: {
          type: "array",
          items: memberWorkloadSchema,
        },
      },
    }),
  },
  additionalProperties: false,
} as const;

export const getDashboardSchema: FastifySchema = {
  tags: [...dashboardTag],
  summary: "Obter métricas agregadas do dashboard do workspace",
  security: [...bearerSecurity],
  ...workspaceParams,
  response: {
    200: dashboardEnvelopeSchema,
  },
};
