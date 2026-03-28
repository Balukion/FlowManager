import type { FastifyBaseLogger } from "fastify";

export const loggerConfig = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
        colorize: true,
      },
    },
    level: "debug",
  },
  test: {
    level: "silent",
  },
  production: {
    level: "info",
  },
} as const;

export type AppLogger = FastifyBaseLogger;
