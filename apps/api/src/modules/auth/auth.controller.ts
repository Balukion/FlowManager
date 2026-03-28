import type { FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "./auth.service.js";
import { UserRepository, TokenRepository } from "./auth.repository.js";

const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();
const authService = new AuthService(userRepo, tokenRepo);

export async function register(
  request: FastifyRequest<{ Body: { name: string; email: string; password: string } }>,
  reply: FastifyReply,
) {
  const result = await authService.register(request.body);
  return reply.status(201).send({ data: result });
}

export async function login(
  request: FastifyRequest<{ Body: { email: string; password: string } }>,
  reply: FastifyReply,
) {
  const result = await authService.login(request.body);
  return reply.send({ data: result });
}

export async function refresh(
  request: FastifyRequest<{ Body: { refresh_token: string } }>,
  reply: FastifyReply,
) {
  const result = await authService.refresh(request.body.refresh_token);
  return reply.send({ data: result });
}

export async function logout(
  request: FastifyRequest<{ Body: { refresh_token: string } }>,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization ?? "";
  const access_token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  await authService.logout({ refresh_token: request.body.refresh_token, access_token });
  return reply.status(204).send();
}

export async function verifyEmail(
  request: FastifyRequest<{ Body: { token: string } }>,
  reply: FastifyReply,
) {
  await authService.verifyEmail(request.body.token);
  return reply.send({ data: { message: "Email verificado com sucesso" } });
}

export async function forgotPassword(
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply,
) {
  await authService.forgotPassword(request.body.email);
  return reply.send({ data: { message: "Se o email existir, você receberá as instruções" } });
}

export async function resetPassword(
  request: FastifyRequest<{ Body: { token: string; password: string } }>,
  reply: FastifyReply,
) {
  await authService.resetPassword(request.body.token, request.body.password);
  return reply.send({ data: { message: "Senha redefinida com sucesso" } });
}
