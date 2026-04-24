import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema, querySchema } from "../../lib/api-docs.js";

const tasksTag = ["Tasks"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const baseTaskParams = paramsSchema({
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

const dataEnvelopeSchema = {
  type: "object",
  properties: {
    data: {},
    warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;

export const createTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Criar tarefa",
  security: [...bearerSecurity],
  ...baseTaskParams,
  ...bodySchema({
    required: ["title", "priority"],
    properties: {
      title: { type: "string", minLength: 1 },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
      description: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
  }),
  response: {
    201: dataEnvelopeSchema,
  },
};

export const listTasksSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Listar tarefas do projeto",
  security: [...bearerSecurity],
  ...baseTaskParams,
  ...querySchema({
    properties: {
      status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
      label_id: { type: "string" },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const getTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Obter tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  response: {
    200: dataEnvelopeSchema,
  },
};

export const updateTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Atualizar tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  ...bodySchema({
    properties: {
      title: { type: "string", minLength: 1 },
      priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
      description: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const updateStatusSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Alterar status manual da tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  ...bodySchema({
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const reorderTasksSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Reordenar tarefas",
  security: [...bearerSecurity],
  ...baseTaskParams,
  ...bodySchema({
    required: ["order"],
    properties: {
      order: { type: "array", items: { type: "string" } },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const assignTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Atribuir responsável da tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  ...bodySchema({
    required: ["user_id"],
    properties: {
      user_id: { type: ["string", "null"] },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const watchTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Seguir tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  response: {
    201: dataEnvelopeSchema,
  },
};

export const unwatchTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Parar de seguir tarefa",
  security: [...bearerSecurity],
  ...taskParams,
};

export const deleteTaskSchema: FastifySchema = {
  tags: [...tasksTag],
  summary: "Deletar tarefa",
  security: [...bearerSecurity],
  ...taskParams,
};
