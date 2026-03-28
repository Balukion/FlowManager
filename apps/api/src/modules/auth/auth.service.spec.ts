import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service.js";
import { ConflictError, UnauthorizedError } from "../../errors/index.js";
import { makeUser } from "../../../tests/helpers/factories/user.factory.js";

// ─── Mocks do repository ──────────────────────────────────────────────────────
//
// Em vez de usar o banco de verdade, criamos objetos falsos que simulam
// o comportamento do repository. O vi.fn() cria uma função falsa que
// podemos controlar — dizendo o que ela deve retornar em cada teste.

const mockUserRepo = {
  findByEmail: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockTokenRepo = {
  createRefreshToken: vi.fn(),
  findRefreshToken: vi.fn(),
  deleteRefreshToken: vi.fn(),
  createRevokedToken: vi.fn(),
  isTokenRevoked: vi.fn(),
};

// ─── Setup ────────────────────────────────────────────────────────────────────

let authService: AuthService;

beforeEach(() => {
  // Antes de cada teste: limpa todos os mocks e recria o service.
  // Isso garante que um teste não interfere no outro.
  vi.clearAllMocks();
  authService = new AuthService(mockUserRepo as any, mockTokenRepo as any);
});

// ─── Register ─────────────────────────────────────────────────────────────────

describe("register", () => {
  it("deve lançar ConflictError se o email já está cadastrado", async () => {
    // Arrange — simula que o banco já tem um usuário com esse email
    mockUserRepo.findByEmail.mockResolvedValue(makeUser());

    // Act — tenta registrar com o mesmo email
    const promise = authService.register({
      name: "João Silva",
      email: "joao@test.com",
      password: "minhasenha123",
    });

    // Assert — esperamos que a promise rejeite com ConflictError
    await expect(promise).rejects.toThrow(ConflictError);
  });

  it("deve normalizar o email para lowercase antes de verificar duplicata", async () => {
    // Arrange — banco não tem ninguém com esse email
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(makeUser({ email: "joao@test.com" }));

    // Act
    await authService.register({
      name: "João Silva",
      email: "JOAO@TEST.COM",
      password: "minhasenha123",
    });

    // Assert — o repository deve ter sido chamado com o email em lowercase
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("joao@test.com");
  });

  it("deve criar o usuário com senha hasheada — nunca em texto puro", async () => {
    // Arrange
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(makeUser());

    // Act
    await authService.register({
      name: "João Silva",
      email: "joao@test.com",
      password: "minhasenha123",
    });

    // Assert — verifica que o campo salvo não é a senha original
    const chamada = mockUserRepo.create.mock.calls[0][0];
    expect(chamada.password_hash).toBeDefined();
    expect(chamada.password_hash).not.toBe("minhasenha123");
  });

  it("deve retornar o usuário sem o password_hash", async () => {
    // Arrange
    const usuario = makeUser({ name: "João Silva", email: "joao@test.com" });
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(usuario);

    // Act
    const resultado = await authService.register({
      name: "João Silva",
      email: "joao@test.com",
      password: "minhasenha123",
    });

    // Assert — password_hash nunca deve vazar na resposta
    expect(resultado.user).not.toHaveProperty("password_hash");
    expect(resultado.user.email).toBe("joao@test.com");
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe("login", () => {
  it("deve lançar UnauthorizedError se o email não existe", async () => {
    // Arrange — banco não encontra ninguém com esse email
    mockUserRepo.findByEmail.mockResolvedValue(null);

    // Act
    const promise = authService.login({
      email: "naoexiste@test.com",
      password: "qualquercoisa",
    });

    // Assert
    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("deve lançar UnauthorizedError se a senha está errada", async () => {
    // Arrange — usuário existe mas a senha não vai bater
    const usuario = makeUser({ password_hash: "$2b$10$hash_de_outra_senha" });
    mockUserRepo.findByEmail.mockResolvedValue(usuario);

    // Act
    const promise = authService.login({
      email: "joao@test.com",
      password: "senhaerrada",
    });

    // Assert
    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("deve lançar UnauthorizedError se a conta está bloqueada", async () => {
    // Arrange — locked_until no futuro significa conta bloqueada
    const futuro = new Date(Date.now() + 1000 * 60 * 30); // 30 minutos no futuro
    const usuario = makeUser({ locked_until: futuro });
    mockUserRepo.findByEmail.mockResolvedValue(usuario);

    // Act
    const promise = authService.login({
      email: "joao@test.com",
      password: "qualquercoisa",
    });

    // Assert
    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("deve retornar access_token e refresh_token em caso de sucesso", async () => {
    // Arrange — usamos bcrypt real para gerar um hash válido
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("senhaCorreta123", 10);
    const usuario = makeUser({ password_hash: hash, email_verified: true });

    mockUserRepo.findByEmail.mockResolvedValue(usuario);
    mockUserRepo.update.mockResolvedValue(usuario);
    mockTokenRepo.createRefreshToken.mockResolvedValue(undefined);

    // Act
    const resultado = await authService.login({
      email: "joao@test.com",
      password: "senhaCorreta123",
    });

    // Assert
    expect(resultado.access_token).toBeDefined();
    expect(resultado.refresh_token).toBeDefined();
  });

  it("deve resetar failed_login_attempts após login bem-sucedido", async () => {
    // Arrange
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("senhaCorreta123", 10);
    const usuario = makeUser({
      password_hash: hash,
      failed_login_attempts: 3,
      email_verified: true,
    });

    mockUserRepo.findByEmail.mockResolvedValue(usuario);
    mockUserRepo.update.mockResolvedValue(usuario);
    mockTokenRepo.createRefreshToken.mockResolvedValue(undefined);

    // Act
    await authService.login({ email: "joao@test.com", password: "senhaCorreta123" });

    // Assert — deve ter chamado update com failed_login_attempts zerado
    expect(mockUserRepo.update).toHaveBeenCalledWith(
      usuario.id,
      expect.objectContaining({ failed_login_attempts: 0 }),
    );
  });

  it("deve incrementar failed_login_attempts após senha errada", async () => {
    // Arrange
    const usuario = makeUser({
      password_hash: "$2b$10$hash_invalido",
      failed_login_attempts: 1,
    });
    mockUserRepo.findByEmail.mockResolvedValue(usuario);
    mockUserRepo.update.mockResolvedValue(usuario);

    // Act — senha errada
    const promise = authService.login({
      email: "joao@test.com",
      password: "senhaerrada",
    });

    // Assert
    await expect(promise).rejects.toThrow(UnauthorizedError);
    expect(mockUserRepo.update).toHaveBeenCalledWith(
      usuario.id,
      expect.objectContaining({ failed_login_attempts: 2 }),
    );
  });
});

// ─── Refresh token ────────────────────────────────────────────────────────────

describe("refresh", () => {
  it("deve lançar UnauthorizedError se o refresh token não existe no banco", async () => {
    // Arrange — banco não encontra esse token
    mockTokenRepo.findRefreshToken.mockResolvedValue(null);

    // Act
    const promise = authService.refresh("token_invalido");

    // Assert
    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("deve lançar UnauthorizedError se o refresh token está expirado", async () => {
    // Arrange — token existe mas expirou
    const passado = new Date(Date.now() - 1000);
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: "token-id",
      user_id: "user-id",
      expires_at: passado,
    });

    // Act
    const promise = authService.refresh("token_expirado");

    // Assert
    await expect(promise).rejects.toThrow(UnauthorizedError);
  });

  it("deve retornar novo par de tokens se o refresh token é válido", async () => {
    // Arrange
    const futuro = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const usuario = makeUser();
    mockTokenRepo.findRefreshToken.mockResolvedValue({
      id: "token-id",
      user_id: usuario.id,
      expires_at: futuro,
    });
    mockUserRepo.findById.mockResolvedValue(usuario);
    mockTokenRepo.deleteRefreshToken.mockResolvedValue(undefined);
    mockTokenRepo.createRefreshToken.mockResolvedValue(undefined);

    // Act
    const resultado = await authService.refresh("token_valido");

    // Assert
    expect(resultado.access_token).toBeDefined();
    expect(resultado.refresh_token).toBeDefined();
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe("logout", () => {
  it("deve deletar o refresh token do banco", async () => {
    // Arrange
    mockTokenRepo.deleteRefreshToken.mockResolvedValue(undefined);
    mockTokenRepo.createRevokedToken.mockResolvedValue(undefined);

    // Act
    await authService.logout({
      refresh_token: "meu_refresh_token",
      access_token: "meu_access_token",
    });

    // Assert
    expect(mockTokenRepo.deleteRefreshToken).toHaveBeenCalledOnce();
  });

  it("deve adicionar o access token na blacklist de tokens revogados", async () => {
    // Arrange
    mockTokenRepo.deleteRefreshToken.mockResolvedValue(undefined);
    mockTokenRepo.createRevokedToken.mockResolvedValue(undefined);

    // Act
    await authService.logout({
      refresh_token: "meu_refresh_token",
      access_token: "meu_access_token",
    });

    // Assert
    expect(mockTokenRepo.createRevokedToken).toHaveBeenCalledOnce();
  });
});
