import { Resend } from "resend";
import { env } from "../config/env.js";

export const resend = new Resend(env.RESEND_API_KEY);

export const EMAIL_FROM = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;
