import type { FastifyInstance } from "fastify";
import * as controller from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { env } from "../../config/env.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", { schema: registerSchema }, controller.register);

  app.post(
    "/auth/login",
    {
      schema: loginSchema,
      config: {
        rateLimit: { max: process.env.DISABLE_RATE_LIMIT ? 10000 : env.MAX_LOGIN_ATTEMPTS, timeWindow: "1 minute" },
      },
    },
    controller.login,
  );

  app.post("/auth/refresh", { schema: refreshSchema }, controller.refresh);

  app.post(
    "/auth/logout",
    {
      schema: logoutSchema,
      preHandler: [app.authenticate],
    },
    controller.logout,
  );

  app.post("/auth/verify-email", { schema: verifyEmailSchema }, controller.verifyEmail);

  app.post(
    "/auth/forgot-password",
    {
      schema: forgotPasswordSchema,
      config: { rateLimit: { max: process.env.DISABLE_RATE_LIMIT ? 10000 : 3, timeWindow: "1 hour", hook: "preHandler", keyGenerator: (req: any) => req.body?.email ?? req.ip } },
    },
    controller.forgotPassword,
  );

  app.post("/auth/reset-password", { schema: resetPasswordSchema }, controller.resetPassword);
}
