import Fastify from "fastify";
import { env } from "./config/env.js";
import { loggerConfig } from "./config/logger.js";
import { AppError } from "./errors/index.js";

import corsPlugin from "./plugins/cors.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import swaggerPlugin from "./plugins/swagger.js";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";

export async function buildApp() {
  const app = Fastify({
    logger: loggerConfig[env.NODE_ENV],
  });

  // Plugins (order matters — see CLAUDE.md initialization sequence)
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);
  await app.register(swaggerPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Global error handler
  app.setErrorHandler((error: AppError | Error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    // Fastify validation errors
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

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
