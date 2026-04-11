import { Resend } from "resend";
import { env } from "../config/env.js";
import { verifyEmailTemplate } from "../email/templates/verify-email.js";
import { resetPasswordTemplate } from "../email/templates/reset-password.js";
import { invitationTemplate } from "../email/templates/invitation.js";
import { stepAssignedTemplate } from "../email/templates/step-assigned.js";
import { deadlineReminderTemplate } from "../email/templates/deadline-reminder.js";
import { taskStatusChangedTemplate } from "../email/templates/task-status-changed.js";
import { commentMentionTemplate } from "../email/templates/comment-mention.js";

const resend = new Resend(env.RESEND_API_KEY);
const EMAIL_FROM = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

type TemplateData = Record<string, unknown>;

function renderTemplate(template: string, data: TemplateData): string {
  switch (template) {
    case "verify-email":
      return verifyEmailTemplate(data as any);
    case "reset-password":
      return resetPasswordTemplate(data as any);
    case "invitation":
      return invitationTemplate(data as any);
    case "step-assigned":
      return stepAssignedTemplate(data as any);
    case "deadline-reminder":
      return deadlineReminderTemplate(data as any);
    case "task-status-changed":
      return taskStatusChangedTemplate(data as any);
    case "comment-mention":
      return commentMentionTemplate(data as any);
    default:
      return `<p>${data["body"] ?? data["subject"] ?? ""}</p>`;
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  template: string;
  data?: TemplateData;
}) {
  const html = renderTemplate(options.template, options.data ?? {});
  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html,
  });
  if (error) {
    console.error("[Resend] Falha ao enviar email:", JSON.stringify(error));
    return;
  }
  console.info("[Resend] Email enviado:", data?.id, "→", options.to);
}
