import Fastify from "fastify";
import { env } from "./config/env.js";
import { loggerConfig } from "./config/logger.js";
import { AppError } from "./errors/index.js";

import corsPlugin from "./plugins/cors.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import swaggerPlugin from "./plugins/swagger.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/index.js";

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

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
