import type { FastifySchema } from "fastify";
import { bodySchema, paramsSchema, strictObjectSchema } from "../../lib/api-docs.js";

const workspacesTag = ["Workspaces"] as const;
const bearerSecurity = [{ bearerAuth: [] }] as const;

const workspaceSchema = strictObjectSchema({
  required: [
    "id",
    "name",
    "slug",
    "description",
    "color",
    "logo_url",
    "owner_id",
    "settings",
    "created_at",
    "updated_at",
    "deleted_at",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: ["string", "null"] },
    color: { type: ["string", "null"] },
    logo_url: { type: ["string", "null"] },
    owner_id: { type: "string" },
    settings: {},
    created_at: { type: "string" },
    updated_at: { type: "string" },
    deleted_at: { type: ["string", "null"] },
  },
});

const memberSchema = strictObjectSchema({
  required: ["id", "workspace_id", "user_id", "role", "position", "last_seen_at", "joined_at"],
  properties: {
    id: { type: "string" },
    workspace_id: { type: "string" },
    user_id: { type: "string" },
    role: { type: "string", enum: ["ADMIN", "MEMBER"] },
    position: { type: ["integer", "null"] },
    last_seen_at: { type: ["string", "null"] },
    joined_at: { type: "string" },
  },
});

const memberWithUserSchema = strictObjectSchema({
  required: ["id", "workspace_id", "user_id", "role", "position", "last_seen_at", "joined_at", "user"],
  properties: {
    id: { type: "string" },
    workspace_id: { type: "string" },
    user_id: { type: "string" },
    role: { type: "string", enum: ["ADMIN", "MEMBER"] },
    position: { type: ["integer", "null"] },
    last_seen_at: { type: ["string", "null"] },
    joined_at: { type: "string" },
    user: strictObjectSchema({
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

const workspaceIdParams = paramsSchema({
  required: ["id"],
  properties: {
    id: { type: "string" },
  },
});

const workspaceMemberParams = paramsSchema({
  required: ["id", "userId"],
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
  },
});

const workspaceEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["workspace"],
      properties: {
        workspace: workspaceSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

const workspacesEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["workspaces"],
      properties: {
        workspaces: {
          type: "array",
          items: workspaceSchema,
        },
      },
    }),
  },
  additionalProperties: false,
} as const;

const memberEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["member"],
      properties: {
        member: memberSchema,
      },
    }),
  },
  additionalProperties: false,
} as const;

const membersEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["members"],
      properties: {
        members: {
          type: "array",
          items: memberWithUserSchema,
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

const presignEnvelopeSchema = {
  type: "object",
  required: ["data"],
  properties: {
    data: strictObjectSchema({
      required: ["upload_url", "final_url"],
      properties: {
        upload_url: { type: "string", format: "uri" },
        final_url: { type: "string", format: "uri" },
      },
    }),
  },
  additionalProperties: false,
} as const;

export const createWorkspaceSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Criar workspace",
  security: [...bearerSecurity],
  ...bodySchema({
    required: ["name"],
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
    },
  }),
  response: {
    201: workspaceEnvelopeSchema,
  },
};

export const listWorkspacesSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Listar workspaces do usuário",
  security: [...bearerSecurity],
  response: {
    200: workspacesEnvelopeSchema,
  },
};

export const getWorkspaceSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Obter workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: workspaceEnvelopeSchema,
  },
};

export const getWorkspaceMemberSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Obter membership do usuário no workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: memberEnvelopeSchema,
  },
};

export const updateWorkspaceSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Atualizar workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  ...bodySchema({
    properties: {
      name: { type: "string", minLength: 1 },
      description: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
    },
  }),
  response: {
    200: workspaceEnvelopeSchema,
  },
};

export const deleteWorkspaceSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Deletar workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
};

export const listMembersSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Listar membros do workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: membersEnvelopeSchema,
  },
};

export const updateMemberRoleSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Alterar papel de membro",
  security: [...bearerSecurity],
  ...workspaceMemberParams,
  ...bodySchema({
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["ADMIN", "MEMBER"] },
    },
  }),
  response: {
    200: emptyDataEnvelopeSchema,
  },
};

export const removeMemberSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Remover membro do workspace",
  security: [...bearerSecurity],
  ...workspaceMemberParams,
};

export const transferOwnershipSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Transferir ownership do workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  ...bodySchema({
    required: ["new_owner_id"],
    properties: {
      new_owner_id: { type: "string" },
    },
  }),
  response: {
    200: workspaceEnvelopeSchema,
  },
};

export const presignLogoSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Gerar presigned URL para upload de logo",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  ...bodySchema({
    required: ["content_type", "file_size_bytes"],
    properties: {
      content_type: { type: "string" },
      file_size_bytes: { type: "number" },
    },
  }),
  response: {
    200: presignEnvelopeSchema,
  },
};

export const updateLogoSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Atualizar logo do workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  ...bodySchema({
    required: ["logo_url"],
    properties: {
      logo_url: { type: "string", format: "uri" },
    },
  }),
  response: {
    200: workspaceEnvelopeSchema,
  },
};

export const deleteLogoSchema: FastifySchema = {
  tags: [...workspacesTag],
  summary: "Remover logo do workspace",
  security: [...bearerSecurity],
  ...workspaceIdParams,
  response: {
    200: workspaceEnvelopeSchema,
  },
};
