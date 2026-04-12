import { addHours } from "@flowmanager/shared";
import { generateToken, hashToken } from "../../lib/crypto.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../errors/index.js";
import { sendEmail } from "../../lib/resend.js";
import { env } from "../../config/env.js";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { InvitationsRepository } from "./invitations.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";

const INVITATION_EXPIRES_HOURS = 48;

export class InvitationsService {
  private guard: WorkspaceGuard;

  constructor(
    private repo: InvitationsRepository,
    private workspacesRepo: WorkspacesRepository,
  ) {
    this.guard = new WorkspaceGuard(workspacesRepo);
  }

  async createInvitation(workspaceId: string, userId: string, email: string) {
    const { workspace } = await this.guard.requireAdminOrOwner(workspaceId, userId);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already a member
    const existingMember = await this.repo.findMemberByEmail(workspaceId, normalizedEmail);
    if (existingMember) throw new ConflictError("ALREADY_A_MEMBER", "Este usuário já é membro do workspace");

    // Check if there's a pending invitation
    const pending = await this.repo.findPendingByEmail(workspaceId, normalizedEmail);
    if (pending) throw new ConflictError("INVITATION_ALREADY_PENDING", "Já existe um convite pendente para este email");

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = addHours(new Date(), INVITATION_EXPIRES_HOURS);

    const invitation = await this.repo.create({
      workspace_id: workspaceId,
      invited_by: userId,
      email: normalizedEmail,
      role: "MEMBER",
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    await sendEmail({
      to: normalizedEmail,
      subject: `Você foi convidado para ${workspace.name}`,
      template: "invitation",
      data: { workspace_name: workspace.name, token, frontend_url: env.FRONTEND_URL },
    });

    // Never expose token_hash in response
    const { token_hash: _, ...invitationData } = invitation as any;
    return { invitation: invitationData };
  }

  async listInvitations(workspaceId: string, userId: string) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const invitations = await this.repo.findByWorkspace(workspaceId);
    // Remove token_hash from each invitation
    return {
      invitations: invitations.map(({ token_hash: _, inviter, ...inv }: any) => ({
        ...inv,
        invited_by: inviter,
      })),
    };
  }

  async cancelInvitation(workspaceId: string, invitationId: string, userId: string) {
    await this.guard.requireAdminOrOwner(workspaceId, userId);

    const invitation = await this.repo.findById(invitationId);
    if (!invitation || invitation.workspace_id !== workspaceId) {
      throw new NotFoundError("Convite não encontrado");
    }

    await this.repo.delete(invitationId);
  }

  async acceptInvitation(token: string, userId: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.repo.findByTokenHash(tokenHash);

    if (!invitation) throw new BadRequestError("Token inválido", "INVALID_TOKEN");
    if (invitation.status !== "PENDING" && invitation.status !== "VIEWED") {
      throw new BadRequestError("Este convite já foi usado", "TOKEN_ALREADY_USED");
    }

    if (invitation.expires_at < new Date()) {
      throw new BadRequestError("Este convite expirou", "TOKEN_EXPIRED");
    }

    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    if (user.email !== invitation.email) {
      throw new ForbiddenError("Este convite não é para você");
    }

    await this.repo.createWorkspaceMember(invitation.workspace_id, userId, invitation.role);
    await this.repo.updateStatus(invitation.id, "ACCEPTED", { accepted_at: new Date() });
  }

  async resendInvitation(workspaceId: string, invitationId: string, userId: string) {
    const { workspace } = await this.guard.requireAdminOrOwner(workspaceId, userId);

    const invitation = await this.repo.findById(invitationId);
    if (!invitation || invitation.workspace_id !== workspaceId) {
      throw new NotFoundError("Convite não encontrado");
    }

    if (invitation.status !== "EXPIRED") {
      throw new BadRequestError("Apenas convites expirados podem ser reenviados", "INVITATION_NOT_EXPIRED");
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = addHours(new Date(), INVITATION_EXPIRES_HOURS);

    const updated = await this.repo.resendToken(invitationId, tokenHash, expiresAt);

    await sendEmail({
      to: invitation.email,
      subject: `Você foi convidado para ${workspace.name}`,
      template: "invitation",
      data: { workspace_name: workspace.name, token, frontend_url: env.FRONTEND_URL },
    });

    const { token_hash: _, ...invitationData } = updated as any;
    return { invitation: invitationData };
  }

  async getInvitationPreview(token: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.repo.findByTokenHashWithDetails(tokenHash);

    if (!invitation) throw new BadRequestError("Token inválido", "INVALID_TOKEN");
    if (invitation.status !== "PENDING" && invitation.status !== "VIEWED") {
      throw new BadRequestError("Este convite já foi usado", "TOKEN_ALREADY_USED");
    }
    if (invitation.expires_at < new Date()) throw new BadRequestError("Este convite expirou", "TOKEN_EXPIRED");

    if (invitation.status === "PENDING") {
      await this.repo.updateStatus(invitation.id, "VIEWED");
    }

    return {
      workspace_name: (invitation as any).workspace.name,
      email: invitation.email,
      invited_by_name: (invitation as any).inviter.name,
    };
  }

  async declineInvitation(token: string, userId: string) {
    const tokenHash = hashToken(token);
    const invitation = await this.repo.findByTokenHash(tokenHash);

    if (!invitation) throw new BadRequestError("Token inválido", "INVALID_TOKEN");
    if (invitation.status !== "PENDING" && invitation.status !== "VIEWED") {
      throw new BadRequestError("Este convite já foi usado", "TOKEN_ALREADY_USED");
    }
    if (invitation.expires_at < new Date()) throw new BadRequestError("Este convite expirou", "TOKEN_EXPIRED");

    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    if (user.email !== invitation.email) {
      throw new ForbiddenError("Este convite não é para você");
    }

    await this.repo.updateStatus(invitation.id, "DECLINED", { declined_at: new Date() });
  }
}
