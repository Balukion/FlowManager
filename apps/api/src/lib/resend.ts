import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);
const EMAIL_FROM = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

export async function sendEmail(options: {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, unknown>;
}) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: `<p>${options.subject}</p>`,
  });
}
