import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema } from "../../lib/api-docs.js";

const stepsTag = ["Steps"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const workspaceIdParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const baseStepParams = paramsSchema({
  required: ["id", "projectId", "taskId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
  },
});

const stepParams = paramsSchema({
  required: ["id", "projectId", "taskId", "stepId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
    stepId: { type: "string" },
  },
});

const unassignStepParams = paramsSchema({
  required: ["id", "projectId", "taskId", "stepId", "userId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
    stepId: { type: "string" },
    userId: { type: "string" },
  },
});

const dataEnvelopeSchema = {
  type: "object",
  properties: {
    data: {},
  },
} as const;

export const listAssignedToMeSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Listar passos atribuídos a mim",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: dataEnvelopeSchema,
  },
};

export const createStepSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Criar passo",
  security: [...bearerSecurity],
  ...baseStepParams,
  ...bodySchema({
    required: ["title"],
    properties: {
      title: { type: "string", minLength: 1 },
      deadline: { type: ["string", "null"] },
    },
  }),
  response: {
    201: dataEnvelopeSchema,
  },
};

export const listStepsSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Listar passos da tarefa",
  security: [...bearerSecurity],
  ...baseStepParams,
  response: {
    200: dataEnvelopeSchema,
  },
};

export const updateStepSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Atualizar passo",
  security: [...bearerSecurity],
  ...stepParams,
  ...bodySchema({
    properties: {
      title: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const updateStepStatusSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Alterar status do passo",
  security: [...bearerSecurity],
  ...stepParams,
  ...bodySchema({
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "DONE"] },
    },
  }),
  response: {
    200: dataEnvelopeSchema,
  },
};

export const assignStepSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Atribuir membro ao passo",
  security: [...bearerSecurity],
  ...stepParams,
  ...bodySchema({
    required: ["user_id"],
    properties: {
      user_id: { type: "string" },
    },
  }),
  response: {
    201: dataEnvelopeSchema,
  },
};

export const unassignStepSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Remover atribuição de membro do passo",
  security: [...bearerSecurity],
  ...unassignStepParams,
};

export const reorderStepsSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Reordenar passos",
  security: [...bearerSecurity],
  ...baseStepParams,
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

export const deleteStepSchema: FastifySchema = {
  tags: [...stepsTag],
  summary: "Deletar passo",
  security: [...bearerSecurity],
  ...stepParams,
};
