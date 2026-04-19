import { type StepStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export class StepsRepository {
  async findLastOrder(taskId: string) {
    return prisma.step.findFirst({
      where: { task_id: taskId, deleted_at: null },
      orderBy: { order: "desc" },
      select: { order: true },
    });
  }

  async create(data: {
    task_id: string;
    title: string;
    description?: string | null;
    order: number;
    deadline?: Date | null;
    created_by: string;
  }) {
    return prisma.step.create({ data });
  }

  async findById(id: string) {
    return prisma.step.findFirst({ where: { id, deleted_at: null } });
  }

  async findByTask(taskId: string) {
    return prisma.step.findMany({
      where: { task_id: taskId, deleted_at: null },
      orderBy: { order: "asc" },
      include: {
        assignments: {
          where: { unassigned_at: null },
          include: {
            user: { select: { id: true, name: true, avatar_url: true } },
          },
        },
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    description?: string | null;
    deadline?: Date | null;
  }) {
    return prisma.step.update({ where: { id }, data });
  }

  async updateOrder(id: string, order: number) {
    return prisma.step.updateMany({ where: { id, deleted_at: null }, data: { order } });
  }

  async countByTask(taskId: string, ids: string[]): Promise<number> {
    return prisma.step.count({
      where: { id: { in: ids }, task_id: taskId, deleted_at: null },
    });
  }

  async updateStatus(id: string, status: StepStatus) {
    return prisma.step.update({ where: { id }, data: { status } });
  }

  async softDelete(id: string) {
    return prisma.step.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async findAssignedToUser(workspaceId: string, userId: string) {
    return prisma.step.findMany({
      where: {
        deleted_at: null,
        assignments: {
          some: { user_id: userId, unassigned_at: null },
        },
        task: {
          deleted_at: null,
          project: {
            deleted_at: null,
            workspace_id: workspaceId,
          },
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            number: true,
            project_id: true,
            project: { select: { id: true, name: true } },
          },
        },
        assignments: {
          where: { unassigned_at: null },
          include: { user: { select: { id: true, name: true, avatar_url: true } } },
        },
      },
      orderBy: { deadline: "asc" },
    });
  }

  // Assignments

  async findActiveAssignment(stepId: string, userId: string) {
    return prisma.stepAssignment.findFirst({
      where: { step_id: stepId, user_id: userId, unassigned_at: null },
    });
  }

  async createAssignment(data: { step_id: string; user_id: string; assigned_by: string }) {
    return prisma.stepAssignment.create({ data });
  }

  async unassign(stepId: string, userId: string, unassignedBy: string) {
    return prisma.stepAssignment.update({
      where: { step_id_user_id: { step_id: stepId, user_id: userId } },
      data: { unassigned_at: new Date(), unassigned_by: unassignedBy },
    });
  }

  async findStepsDueForReminder(cutoff: Date) {
    const now = new Date();
    return prisma.step.findMany({
      where: {
        deleted_at: null,
        status: { not: "DONE" },
        due_reminder_sent_at: null,
        deadline: { gte: now, lte: cutoff },
      },
      include: {
        assignments: {
          where: { unassigned_at: null },
          select: { user_id: true },
        },
        task: {
          select: {
            id: true,
            project: { select: { workspace_id: true } },
          },
        },
      },
    });
  }

  async markReminderSent(stepId: string) {
    return prisma.step.update({
      where: { id: stepId },
      data: { due_reminder_sent_at: new Date() },
    });
  }

  async softDeleteByWorkspace(workspaceId: string) {
    return prisma.step.updateMany({
      where: { task: { project: { workspace_id: workspaceId } }, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }
}
