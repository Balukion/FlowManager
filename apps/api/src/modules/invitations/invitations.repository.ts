import { prisma } from "../../lib/prisma.js";

export class InvitationsRepository {
  async findPendingByEmail(workspaceId: string, email: string) {
    return prisma.invitation.findFirst({
      where: { workspace_id: workspaceId, email, status: "PENDING" },
    });
  }

  async findActiveByEmail(workspaceId: string, email: string) {
    return prisma.invitation.findFirst({
      where: { workspace_id: workspaceId, email, status: { in: ["PENDING"] } },
    });
  }

  async create(data: {
    workspace_id: string;
    invited_by: string;
    email: string;
    role: string;
    token_hash: string;
    expires_at: Date;
  }) {
    return prisma.invitation.create({ data: data as any });
  }

  async findByWorkspace(workspaceId: string) {
    return prisma.invitation.findMany({
      where: { workspace_id: workspaceId, status: { in: ["PENDING", "EXPIRED"] } },
      include: {
        inviter: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async findById(id: string) {
    return prisma.invitation.findUnique({ where: { id } });
  }

  async findByTokenHash(tokenHash: string) {
    return prisma.invitation.findFirst({ where: { token_hash: tokenHash } });
  }

  async findByTokenHashWithDetails(tokenHash: string) {
    return prisma.invitation.findFirst({
      where: { token_hash: tokenHash },
      include: {
        workspace: { select: { name: true } },
        inviter: { select: { name: true } },
      },
    });
  }

  async delete(id: string) {
    return prisma.invitation.delete({ where: { id } });
  }

  async updateStatus(id: string, status: string, extra?: { accepted_at?: Date; declined_at?: Date }) {
    return prisma.invitation.update({ where: { id }, data: { status: status as any, ...extra } });
  }

  async resendToken(id: string, tokenHash: string, expiresAt: Date) {
    return prisma.invitation.update({
      where: { id },
      data: { token_hash: tokenHash, expires_at: expiresAt, status: "PENDING" },
    });
  }

  async findUserById(userId: string) {
    return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  }

  async findMemberByEmail(workspaceId: string, email: string) {
    return prisma.user.findFirst({
      where: { email, workspace_members: { some: { workspace_id: workspaceId } } },
    });
  }

  async createWorkspaceMember(workspaceId: string, userId: string, role: string) {
    return prisma.workspaceMember.create({
      data: { workspace_id: workspaceId, user_id: userId, role: role as any, joined_at: new Date() },
    });
  }
}
