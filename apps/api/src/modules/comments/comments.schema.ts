import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema, querySchema, strictObjectSchema } from "../../lib/api-docs.js";

const commentsTag = ["Comments"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const baseCommentParams = paramsSchema({
  required: ["id", "projectId", "taskId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
  },
});

const commentParams = paramsSchema({
  required: ["id", "projectId", "taskId", "commentId"],
  properties: {
    id: { type: "string" },
    projectId: { type: "string" },
    taskId: { type: "string" },
    commentId: { type: "string" },
  },
});

const commentSchema = strictObjectSchema({
  required: [
    "id",
    "task_id",
    "user_id",
    "parent_id",
    "content",
    "edited_at",
    "deleted_by",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  properties: {
    id: { type: "string" },
    task_id: { type: "string" },
    user_id: { type: "string" },
    parent_id: { type: ["string", "null"] },
    content: { type: "string" },
    edited_at: { type: ["string", "null"] },
    deleted_by: { type: ["string", "null"] },
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted_at: { type: ["string", "null"] },
  },
});

const commentWithAuthorSchema = strictObjectSchema({
  required: [
    "id",
    "task_id",
    "user_id",
    "parent_id",
    "content",
    "edited_at",
    "deleted_by",
    "created_at",
    "updated_at",
    "deleted_at",
    "author",
  ],
  properties: {
    ...commentSchema.properties,
    author: strictObjectSchema({
      required: ["id", "name", "email", "avatar_url"],
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        email: { type: "string", format: "email" },
        avatar_url: { type: ["string", "null"] },
      },
    }),
  },
});

const createCommentEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["comment"],
      properties: {
        comment: strictObjectSchema({
          required: ["author_id"],
          properties: {
            ...commentSchema.properties,
            author_id: { type: "string" },
          },
        }),
      },
    }),
  },
  additionalProperties: false,
} as const;

const listCommentsEnvelopeSchema = {
  type: "object",
  required: ["data", "meta"],
  properties: {
    data: strictObjectSchema({
      required: ["comments"],
      properties: {
        comments: {
          type: "array",
          items: commentWithAuthorSchema,
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

const updateCommentEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["comment"],
      properties: {
        comment: commentSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

export const createCommentSchema: FastifySchema = {
  tags: [...commentsTag],
  summary: "Criar comentário em uma tarefa",
  security: [...bearerSecurity],
  ...baseCommentParams,
  ...bodySchema({
    required: ["content"],
    properties: {
      content: { type: "string", minLength: 1 },
      parent_id: { type: ["string", "null"] },
    },
  }),
  response: {
    201: createCommentEnvelopeSchema,
  },
};

export const listCommentsSchema: FastifySchema = {
  tags: [...commentsTag],
  summary: "Listar comentários de uma tarefa",
  security: [...bearerSecurity],
  ...baseCommentParams,
  ...querySchema({
    properties: {
      limit: { type: "integer", minimum: 1 },
      cursor: { type: "string" },
    },
  }),
  response: {
    200: listCommentsEnvelopeSchema,
  },
};

export const updateCommentSchema: FastifySchema = {
  tags: [...commentsTag],
  summary: "Editar comentário",
  security: [...bearerSecurity],
  ...commentParams,
  ...bodySchema({
    required: ["content"],
    properties: {
      content: { type: "string", minLength: 1 },
    },
  }),
  response: {
    200: updateCommentEnvelopeSchema,
  },
};

export const deleteCommentSchema: FastifySchema = {
  tags: [...commentsTag],
  summary: "Deletar comentário",
  security: [...bearerSecurity],
  ...commentParams,
};
