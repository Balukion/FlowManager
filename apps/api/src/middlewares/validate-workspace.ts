import type { FastifyRequest } from "fastify";
import type { Workspace, WorkspaceMember } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../errors/index.js";

declare module "fastify" {
  interface FastifyRequest {
    workspace: Workspace;
    member: WorkspaceMember;
  }
}

/**
 * Fastify preHandler que valida se o usuário autenticado é membro do workspace
 * referenciado em `request.params.id`. Injeta `request.workspace` e `request.member`.
 *
 * Uso: { preHandler: [app.authenticate, validateWorkspace] }
 */
export async function validateWorkspace(request: FastifyRequest): Promise<void> {
  const { id: workspaceId } = request.params as { id: string };

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId, deleted_at: null },
  });

  if (!workspace) throw new NotFoundError("Workspace não encontrado");

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspace_id_user_id: { workspace_id: workspaceId, user_id: request.userId },
    },
  });

  if (!member) throw new ForbiddenError("Acesso negado ao workspace");

  request.workspace = workspace;
  request.member = member;
}
