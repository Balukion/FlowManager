import fp from "fastify-plugin";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../errors/index.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export default fp(async (app) => {
  app.decorateRequest("userId", "");

  app.decorate("authenticate", async function (request: import("fastify").FastifyRequest) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token não fornecido");
    }

    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      request.userId = payload.sub;
    } catch {
      throw new UnauthorizedError("Token inválido ou expirado");
    }
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: import("fastify").FastifyRequest) => Promise<void>;
  }
}
