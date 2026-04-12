import { ForbiddenError, NotFoundError } from "../errors/index.js";
import type { WorkspacesRepository } from "../modules/workspaces/workspaces.repository.js";

/**
 * WorkspaceGuard centraliza as verificações de acesso ao workspace.
 *
 * Usado por todos os services que precisam validar se um usuário
 * tem permissão para operar em um workspace. Elimina a duplicação
 * dos métodos requireMember / requireAdminOrOwner / requireOwner
 * que existiam copiados em cada service.
 */
export class WorkspaceGuard {
  constructor(private workspacesRepo: WorkspacesRepository) {}

  /**
   * Garante que o workspace existe e que o usuário é membro (ou owner).
   * Lança NotFoundError se o workspace não existir.
   * Lança ForbiddenError se o usuário não for membro.
   */
  async requireMember(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.workspacesRepo.findMember(workspaceId, userId);
    if (!member) throw new ForbiddenError("Acesso negado ao workspace");

    return { workspace, member };
  }

  /**
   * Garante que o usuário é admin ou owner do workspace.
   * Lança ForbiddenError se for apenas membro.
   */
  async requireAdminOrOwner(workspaceId: string, userId: string) {
    const { workspace, member } = await this.requireMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    const isAdmin = member.role === "ADMIN";
    if (!isOwner && !isAdmin) throw new ForbiddenError("Apenas admins podem realizar esta ação");
    return { workspace, member };
  }

  /**
   * Garante que o usuário é o dono (super admin) do workspace.
   * Lança ForbiddenError se for apenas admin ou membro.
   */
  async requireOwner(workspaceId: string, userId: string) {
    const { workspace, member } = await this.requireMember(workspaceId, userId);
    if (workspace.owner_id !== userId)
      throw new ForbiddenError("Apenas o dono pode realizar esta ação");
    return { workspace, member };
  }

  /**
   * Variante permissiva: passa se o usuário é membro OU é o owner do workspace.
   * Usada em módulos onde o owner pode operar mesmo sem registro em workspace_members.
   */
  async requireMemberOrOwner(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) throw new NotFoundError("Workspace não encontrado");

    const member = await this.workspacesRepo.findMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    if (!member && !isOwner) throw new ForbiddenError("Acesso negado ao workspace");

    return { workspace, member };
  }
}
