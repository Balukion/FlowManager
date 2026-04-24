import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema, strictObjectSchema } from "../../lib/api-docs.js";

const projectsTag = ["Projects"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const projectSchema = strictObjectSchema({
  required: [
    "id",
    "workspace_id",
    "owner_id",
    "name",
    "slug",
    "description",
    "color",
    "status",
    "deadline",
    "created_by",
    "archived_at",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  properties: {
    id: { type: "string" },
    workspace_id: { type: "string" },
    owner_id: { type: ["string", "null"] },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: ["string", "null"] },
    color: { type: ["string", "null"] },
    status: { type: "string", enum: ["ACTIVE", "ARCHIVED"] },
    deadline: { type: ["string", "null"] },
    created_by: { type: "string" },
    archived_at: { type: ["string", "null"] },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted_at: { type: ["string", "null"] },
  },
});

const workspaceIdParams = paramsSchema({
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

const projectEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["project"],
      properties: {
        project: projectSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

const projectsEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["projects"],
      properties: {
        projects: {
          type: "array",
          items: projectSchema,
        },
      },
    }),
  },
  additionalProperties: false,
} as const;

export const createProjectSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Criar projeto",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  ...bodySchema({
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
  }),
  response: {
    201: projectEnvelopeSchema,
  },
};

export const listProjectsSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Listar projetos ativos",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: projectsEnvelopeSchema,
  },
};

export const listArchivedProjectsSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Listar projetos arquivados",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: projectsEnvelopeSchema,
  },
};

export const getProjectSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Obter projeto",
  security: [...bearerSecurity],
  ...projectParams,
  response: {
    200: projectEnvelopeSchema,
  },
};

export const updateProjectSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Atualizar projeto",
  security: [...bearerSecurity],
  ...projectParams,
  ...bodySchema({
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
      deadline: { type: ["string", "null"] },
    },
  }),
  response: {
    200: projectEnvelopeSchema,
  },
};

export const archiveProjectSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Arquivar projeto",
  security: [...bearerSecurity],
  ...projectParams,
  response: {
    200: projectEnvelopeSchema,
  },
};

export const unarchiveProjectSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Desarquivar projeto",
  security: [...bearerSecurity],
  ...projectParams,
  response: {
    200: projectEnvelopeSchema,
  },
};

export const deleteProjectSchema: FastifySchema = {
  tags: [...projectsTag],
  summary: "Deletar projeto",
  security: [...bearerSecurity],
  ...projectParams,
};
