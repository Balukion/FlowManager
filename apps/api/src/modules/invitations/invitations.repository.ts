import { type InvitationStatus, type Role } from "@prisma/client";
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
    role: Role;
    token_hash: string;
    expires_at: Date;
  }) {
    return prisma.invitation.create({ data });
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

  async updateStatus(id: string, status: InvitationStatus, extra?: { accepted_at?: Date; declined_at?: Date }) {
    return prisma.invitation.update({ where: { id }, data: { status, ...extra } });
  }

  async resendToken(id: string, tokenHash: string, expiresAt: Date) {
    return prisma.invitation.update({
      where: { id },
      data: { token_hash: tokenHash, expires_at: expiresAt, status: "PENDING" },
    });
  }

  async createWorkspaceMember(workspaceId: string, userId: string, role: Role) {
    return prisma.workspaceMember.create({
      data: { workspace_id: workspaceId, user_id: userId, role, joined_at: new Date() },
    });
  }

  async expireOverdue(): Promise<number> {
    const result = await prisma.invitation.updateMany({
      where: {
        status: "PENDING",
        expires_at: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });
    return result.count;
  }
}
