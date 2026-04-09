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
    return prisma.step.create({ data: data as any });
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
    order?: number;
  }) {
    return prisma.step.update({ where: { id }, data: data as any });
  }

  async updateStatus(id: string, status: string) {
    return prisma.step.update({ where: { id }, data: { status: status as any } });
  }

  async softDelete(id: string) {
    return prisma.step.update({ where: { id }, data: { deleted_at: new Date() } });
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
}
