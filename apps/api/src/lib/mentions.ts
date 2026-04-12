import { type NotificationType } from "@prisma/client";
import { sendEmail } from "./resend.js";
import { env } from "../config/env.js";

const MENTION_REGEX = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

interface MentionDeps {
  workspacesRepo: {
    findMemberWithUser: (workspaceId: string, userId: string) => Promise<unknown>;
  };
  commentsRepo: {
    createMention: (commentId: string, userId: string) => Promise<unknown>;
  };
  notifRepo?: {
    create: (data: {
      user_id: string;
      type: NotificationType;
      title: string;
      body: string;
      entity_type: string;
      entity_id: string;
    }) => Promise<{ id: string } | undefined | null>;
    markAsSent: (id: string) => Promise<unknown>;
  };
}

export async function processMentions(
  content: string,
  workspaceId: string,
  taskId: string,
  commentId: string,
  commenterId: string,
  task: { title: string; project_id: string },
  deps: MentionDeps,
): Promise<void> {
  const mentionedUserIds = [...content.matchAll(MENTION_REGEX)].map((m) => m[1]);

  for (const mentionedUserId of mentionedUserIds) {
    const member = await deps.workspacesRepo.findMemberWithUser(workspaceId, mentionedUserId);
    if (!member) continue;

    await deps.commentsRepo.createMention(commentId, mentionedUserId);

    try {
      const notif = await deps.notifRepo?.create({
        user_id: mentionedUserId,
        type: "COMMENT_MENTION",
        title: "Você foi mencionado",
        body: `Você foi mencionado em um comentário na tarefa "${task.title}"`,
        entity_type: "task",
        entity_id: taskId,
      });

      const memberUser = (member as { user?: { email?: string | null; name?: string } }).user;

      if (notif?.id && memberUser?.email) {
        try {
          await sendEmail({
            to: memberUser.email,
            subject: `Você foi mencionado na tarefa "${task.title}"`,
            template: "comment-mention",
            data: {
              user_name: memberUser.name,
              task_title: task.title,
              commenter_name: commenterId,
              task_url: `${env.FRONTEND_URL}/workspaces/${workspaceId}/projects/${task.project_id}/tasks/${taskId}`,
            },
          });
          await deps.notifRepo?.markAsSent(notif.id);
        } catch {
          // Email falhou — retry job irá tentar novamente
        }
      }
    } catch {
      // Criação de notificação falhou — continuar silenciosamente
    }
  }
}
