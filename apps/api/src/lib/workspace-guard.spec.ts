import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspaceGuard } from "./workspace-guard.js";
import { NotFoundError } from "../errors/index.js";
import { ForbiddenError } from "../errors/index.js";

// ─── Doubles ─────────────────────────────────────────────────────────────────

const mockRepo = {
  findById: vi.fn(),
  findMember: vi.fn(),
};

const guard = new WorkspaceGuard(mockRepo as any);

const workspace = { id: "ws-1", owner_id: "owner-1", name: "Meu WS" };
const memberAdmin = { user_id: "admin-1", role: "ADMIN" };
const memberRegular = { user_id: "member-1", role: "MEMBER" };

beforeEach(() => vi.clearAllMocks());

// ─── requireMember ────────────────────────────────────────────────────────────

describe("WorkspaceGuard.requireMember", () => {
  it("lança NotFoundError quando workspace não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(guard.requireMember("ws-1", "user-1")).rejects.toThrow(NotFoundError);
  });

  it("lança ForbiddenError quando usuário não é membro nem owner", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(null);

    await expect(guard.requireMember("ws-1", "user-1")).rejects.toThrow(ForbiddenError);
  });

  it("retorna workspace e member quando válido", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberRegular);

    const result = await guard.requireMember("ws-1", "member-1");

    expect(result.workspace).toBe(workspace);
    expect(result.member).toBe(memberRegular);
  });
});

// ─── requireAdminOrOwner ──────────────────────────────────────────────────────

describe("WorkspaceGuard.requireAdminOrOwner", () => {
  it("lança ForbiddenError quando usuário é MEMBER simples", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberRegular);

    await expect(guard.requireAdminOrOwner("ws-1", "member-1")).rejects.toThrow(ForbiddenError);
  });

  it("passa e retorna workspace quando usuário é ADMIN", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberAdmin);

    const result = await guard.requireAdminOrOwner("ws-1", "admin-1");

    expect(result.workspace).toBe(workspace);
  });

  it("passa quando usuário é owner — mesmo sem role ADMIN", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberRegular); // role MEMBER, mas é o owner

    const result = await guard.requireAdminOrOwner("ws-1", "owner-1");

    expect(result.workspace).toBe(workspace);
  });
});

// ─── requireOwner ─────────────────────────────────────────────────────────────

describe("WorkspaceGuard.requireOwner", () => {
  it("lança ForbiddenError quando usuário é ADMIN mas não é owner", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberAdmin);

    await expect(guard.requireOwner("ws-1", "admin-1")).rejects.toThrow(ForbiddenError);
  });

  it("passa e retorna workspace quando usuário é o owner", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberRegular);

    const result = await guard.requireOwner("ws-1", "owner-1");

    expect(result.workspace).toBe(workspace);
  });
});

// ─── requireMemberOrOwner ─────────────────────────────────────────────────────

describe("WorkspaceGuard.requireMemberOrOwner", () => {
  it("lança NotFoundError quando workspace não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(guard.requireMemberOrOwner("ws-1", "user-1")).rejects.toThrow(NotFoundError);
  });

  it("lança ForbiddenError quando usuário não é membro nem owner", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(null);

    await expect(guard.requireMemberOrOwner("ws-1", "user-1")).rejects.toThrow(ForbiddenError);
  });

  it("passa quando usuário é membro comum", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(memberRegular);

    const result = await guard.requireMemberOrOwner("ws-1", "member-1");

    expect(result.workspace).toBe(workspace);
    expect(result.member).toBe(memberRegular);
  });

  it("passa quando usuário é owner mesmo sem registro em workspace_members", async () => {
    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(null); // sem registro em workspace_members

    const result = await guard.requireMemberOrOwner("ws-1", "owner-1");

    expect(result.workspace).toBe(workspace);
    expect(result.member).toBeNull();
  });
});
