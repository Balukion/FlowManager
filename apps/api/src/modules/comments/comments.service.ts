import { BadRequestError, ForbiddenError, NotFoundError } from "../../errors/index.js";
import { sendEmail } from "../../lib/resend.js";
import { env } from "../../config/env.js";
import { WorkspaceGuard } from "../../lib/workspace-guard.js";
import type { CommentsRepository } from "./comments.repository.js";
import type { TasksRepository } from "../tasks/tasks.repository.js";
import type { WorkspacesRepository } from "../workspaces/workspaces.repository.js";
import type { ActivityLogsRepository } from "../activity-logs/activity-logs.repository.js";
import type { NotificationsRepository } from "../notifications/notifications.repository.js";

const MENTION_REGEX = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class CommentsService {
  private guard: WorkspaceGuard;

  constructor(
    private repo: CommentsRepository,
    private tasksRepo: TasksRepository,
    private workspacesRepo: WorkspacesRepository,
    private activityRepo?: ActivityLogsRepository,
    private notifRepo?: NotificationsRepository,
  ) {
    this.guard = new WorkspaceGuard(workspacesRepo);
  }

  async createComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    data: { content: string; parent_id?: string | null },
  ) {
    await this.guard.requireMember(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    if (data.parent_id) {
      const parent = await this.repo.findById(data.parent_id);
      if (!parent) throw new BadRequestError("Comentário pai não encontrado", "PARENT_NOT_FOUND");
      if (parent.task_id !== taskId) {
        throw new BadRequestError("Comentário pai pertence a outra tarefa", "PARENT_WRONG_TASK");
      }
    }

    const comment = await this.repo.create({
      task_id: taskId,
      user_id: userId,
      content: data.content,
      parent_id: data.parent_id ?? null,
    });

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "COMMENT_CREATED",
      task_id: taskId,
    });

    const mentionedUserIds = [...data.content.matchAll(MENTION_REGEX)].map((m) => m[1]);
    for (const mentionedUserId of mentionedUserIds) {
      const member = await this.workspacesRepo.findMemberWithUser(workspaceId, mentionedUserId);
      if (member) {
        await this.repo.createMention(comment.id, mentionedUserId);
        try {
          const notif = await this.notifRepo?.create({
            user_id: mentionedUserId,
            type: "COMMENT_MENTION",
            title: "Você foi mencionado",
            body: `Você foi mencionado em um comentário na tarefa "${task.title}"`,
            entity_type: "task",
            entity_id: taskId,
          });
          if (notif?.id && (member as any).user?.email) {
            try {
              await sendEmail({
                to: (member as any).user.email,
                subject: `Você foi mencionado na tarefa "${task.title}"`,
                template: "comment-mention",
                data: {
                  user_name: (member as any).user.name,
                  task_title: task.title,
                  commenter_name: userId,
                  task_url: `${env.FRONTEND_URL}/workspaces/${workspaceId}/projects/${task.project_id}/tasks/${taskId}`,
                },
              });
              await this.notifRepo?.markAsSent(notif.id);
            } catch {
              // Email falhou — retry job irá tentar novamente
            }
          }
        } catch {
          // Criação de notificação falhou — continuar silenciosamente
        }
      }
    }

    return { comment: { ...comment, author_id: comment.user_id } };
  }

  async listComments(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userId: string,
    query: { limit?: number; cursor?: string },
  ) {
    await this.guard.requireMember(workspaceId, userId);

    const task = await this.tasksRepo.findById(taskId);
    if (!task || task.project_id !== projectId) throw new NotFoundError("Tarefa não encontrada");

    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const items = await this.repo.findByTask(taskId, { limit, cursor: query.cursor });
    const hasMore = items.length > limit;
    const comments = hasMore ? items.slice(0, limit) : items;
    const next_cursor = hasMore ? comments[comments.length - 1].id : undefined;

    return {
      data: { comments },
      meta: { next_cursor },
    };
  }

  async updateComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
    content: string,
  ) {
    await this.guard.requireMember(workspaceId, userId);

    const comment = await this.repo.findById(commentId);
    if (!comment || comment.task_id !== taskId) throw new NotFoundError("Comentário não encontrado");

    if (comment.user_id !== userId) throw new ForbiddenError("Apenas o autor pode editar o comentário");

    const previousContent = comment.content;
    const updated = await this.repo.update(commentId, content);

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "COMMENT_EDITED",
      task_id: taskId,
      metadata: { previous_content: previousContent },
    });

    return { comment: updated };
  }

  async deleteComment(
    workspaceId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
  ) {
    const { workspace, member } = await this.guard.requireMember(workspaceId, userId);
    const isOwner = workspace.owner_id === userId;
    const isAdmin = member.role === "ADMIN";

    const comment = await this.repo.findById(commentId);
    if (!comment || comment.task_id !== taskId) throw new NotFoundError("Comentário não encontrado");

    const isAuthor = comment.user_id === userId;
    if (!isAuthor && !isAdmin && !isOwner) {
      throw new ForbiddenError("Sem permissão para deletar este comentário");
    }

    await this.repo.softDelete(commentId, userId);

    await this.activityRepo?.createLog({
      workspace_id: workspaceId,
      user_id: userId,
      action: "COMMENT_DELETED",
      task_id: taskId,
    });
  }
}
