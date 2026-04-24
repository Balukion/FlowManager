import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema, strictObjectSchema } from "../../lib/api-docs.js";

const HEX_COLOR_PATTERN = "^#[0-9a-fA-F]{6}$";
const labelsTag = ["Labels"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const workspaceParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const labelParams = paramsSchema({
  required: ["id", "labelId"],
  properties: {
    id: { type: "string" },
    labelId: { type: "string" },
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

const taskLabelParams = paramsSchema({
  required: ["id", "projectId", "taskId", "labelId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
    labelId: { type: "string" },
  },
});

const labelSchema = strictObjectSchema({
  required: ["id", "workspace_id", "name", "color", "created_by", "created_at", "deleted_at"],
  properties: {
    id: { type: "string" },
    workspace_id: { type: "string" },
    name: { type: "string" },
    color: { type: "string", pattern: HEX_COLOR_PATTERN },
    created_by: { type: "string" },
    created_at: { type: "string" },
    deleted_at: { type: ["string", "null"] },
  },
});

const labelEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["label"],
      properties: {
        label: labelSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

const labelsEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["labels"],
      properties: {
        labels: {
          type: "array",
          items: labelSchema,
        },
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

export const createLabelSchema: FastifySchema = {
  tags: [...labelsTag],
  summary: "Criar label do workspace",
  security: [...bearerSecurity],
  ...workspaceParams,
  ...bodySchema({
    required: ["name", "color"],
    properties: {
      name: { type: "string", minLength: 1 },
      color: { type: "string", pattern: HEX_COLOR_PATTERN },
    },
  }),
  response: {
    201: labelEnvelopeSchema,
  },
};

export const listLabelsSchema: FastifySchema = {
  tags: [...labelsTag],
  summary: "Listar labels do workspace",
  security: [...bearerSecurity],
  ...workspaceParams,
  response: {
    200: labelsEnvelopeSchema,
  },
};

export const updateLabelSchema: FastifySchema = {
  tags: [...labelsTag],
  summary: "Editar label do workspace",
  security: [...bearerSecurity],
  ...labelParams,
  ...bodySchema({
    properties: {
      name: { type: "string", minLength: 1 },
      color: { type: "string", pattern: HEX_COLOR_PATTERN },
    },
  }),
  body: {
    ...bodySchema({
      properties: {
        name: { type: "string", minLength: 1 },
        color: { type: "string", pattern: HEX_COLOR_PATTERN },
      },
    }).body,
    minProperties: 1,
  },
  response: {
    200: labelEnvelopeSchema,
  },
};

export const deleteLabelSchema: FastifySchema = {
  tags: [...labelsTag],
  summary: "Deletar label do workspace",
  security: [...bearerSecurity],
  ...labelParams,
};

export const applyLabelSchema: FastifySchema = {
  tags: [...labelsTag],
  summary: "Aplicar label a uma tarefa",
  security: [...bearerSecurity],
  ...taskParams,
  ...bodySchema({
    required: ["label_id"],
    properties: {
      label_id: { type: "string" },
    },
  }),
  response: {
    201: emptyDataEnvelopeSchema,
  },
};

export const removeLabelSchema: FastifySchema = {
  tags: [...labelsTag],
  summary: "Remover label de uma tarefa",
  security: [...bearerSecurity],
  ...taskLabelParams,
};
