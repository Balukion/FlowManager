import Fastify from "fastify";
import * as Sentry from "@sentry/node";
import { env } from "./config/env.js";
import { loggerConfig } from "./config/logger.js";
import { AppError } from "./errors/index.js";

if (env.SENTRY_DSN) {
  Sentry.init({ dsn: env.SENTRY_DSN });
}

import corsPlugin from "./plugins/cors.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import swaggerPlugin from "./plugins/swagger.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/index.js";
import { usersRoutes } from "./modules/users/index.js";
import { workspacesRoutes } from "./modules/workspaces/index.js";
import { projectsRoutes } from "./modules/projects/index.js";
import { tasksRoutes } from "./modules/tasks/index.js";
import { stepsRoutes } from "./modules/steps/index.js";
import { labelsRoutes } from "./modules/labels/index.js";
import { notificationsRoutes } from "./modules/notifications/index.js";
import { commentsRoutes } from "./modules/comments/index.js";
import { invitationsRoutes } from "./modules/invitations/index.js";
import { dashboardRoutes } from "./modules/dashboard/index.js";
import { activityLogsRoutes } from "./modules/activity-logs/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: loggerConfig[env.NODE_ENV],
  });

  // Global error handler — must be set before routes
  app.setErrorHandler((error: AppError | Error, _request, reply) => {
    // Any error with statusCode is an HTTP error (AppError subclasses, @fastify/rate-limit, etc.)
    // instanceof can fail across ESM module boundaries, so we use duck-typing
    const appError = error as AppError;
    if (typeof appError.statusCode === "number") {
      return reply.status(appError.statusCode).send({
        error: {
          code: typeof appError.code === "string" ? appError.code : "HTTP_ERROR",
          message: appError.message,
        },
      });
    }

    // Fastify schema validation errors (no statusCode yet at this point)
    const fastifyError = error as { validation?: unknown; message: string };
    if (fastifyError.validation) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: fastifyError.message },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" },
    });
  });

  // Plugins (order matters — see CLAUDE.md initialization sequence)
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Routes
  await app.register(authRoutes);
  await app.register(usersRoutes);
  await app.register(workspacesRoutes);
  await app.register(projectsRoutes);
  await app.register(tasksRoutes);
  await app.register(stepsRoutes);
  await app.register(labelsRoutes);
  await app.register(notificationsRoutes);
  await app.register(commentsRoutes);
  await app.register(invitationsRoutes);
  await app.register(dashboardRoutes);
  await app.register(activityLogsRoutes);

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
