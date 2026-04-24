import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkspacesService } from "./workspaces.service.js";
import { ForbiddenError, NotFoundError } from "../../errors/index.js";
import { makeWorkspace } from "../../../tests/helpers/factories/workspace.factory.js";

vi.mock("../../lib/s3.js", () => ({
  generatePresignedUploadUrl: vi.fn(),
  getPublicUrl: vi.fn(),
}));

vi.mock("../../config/env.js", () => ({
  env: { S3_MAX_LOGO_SIZE_MB: 5 },
}));

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findById: vi.fn(),
  findByUserId: vi.fn(),
  findSlugsByBase: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  createMember: vi.fn(),
  findMember: vi.fn(),
  findMemberWithUser: vi.fn(),
  findAllMembers: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  deleteAllMembers: vi.fn(),
  deleteAllInvitations: vi.fn(),
  deleteExpiredWorkspaces: vi.fn(),
};

const mockProjectsRepo = { softDeleteByWorkspace: vi.fn() };
const mockTasksRepo = { softDeleteByWorkspace: vi.fn() };
const mockStepsRepo = { softDeleteByWorkspace: vi.fn() };

let service: WorkspacesService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new WorkspacesService(
    mockRepo as any,
    undefined,
    mockProjectsRepo as any,
    mockTasksRepo as any,
    mockStepsRepo as any,
  );
});

// ─── getWorkspaceMember ───────────────────────────────────────────────────────

describe("getWorkspaceMember", () => {
  const WORKSPACE_ID = "ws-1";
  const USER_ID = "user-1";

  it("deve retornar o membro atual quando usuário participa do workspace", async () => {
    const workspace = makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner-1" });
    const member = {
      id: "member-1",
      workspace_id: WORKSPACE_ID,
      user_id: USER_ID,
      role: "ADMIN",
      position: null,
      last_seen_at: null,
      joined_at: new Date("2026-01-01T00:00:00.000Z"),
    };

    mockRepo.findById.mockResolvedValue(workspace);
    mockRepo.findMember.mockResolvedValue(member);

    await expect(service.getWorkspaceMember(WORKSPACE_ID, USER_ID)).resolves.toEqual({
      member,
    });
  });

  it("deve lançar NotFoundError quando o workspace não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(service.getWorkspaceMember(WORKSPACE_ID, USER_ID)).rejects.toThrow(
      NotFoundError,
    );
  });

  it("deve lançar ForbiddenError quando usuário não participa do workspace", async () => {
    mockRepo.findById.mockResolvedValue(
      makeWorkspace({ id: WORKSPACE_ID, owner_id: "owner-1" }),
    );
    mockRepo.findMember.mockResolvedValue(null);

    await expect(service.getWorkspaceMember(WORKSPACE_ID, USER_ID)).rejects.toThrow(
      ForbiddenError,
    );
  });
});

// ─── deleteWorkspace ──────────────────────────────────────────────────────────

describe("deleteWorkspace", () => {
  const WORKSPACE_ID = "ws-1";
  const OWNER_ID = "owner-1";
  const OTHER_USER_ID = "other-1";

  it("deve lançar NotFoundError quando o workspace não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteWorkspace(WORKSPACE_ID, OWNER_ID),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lançar ForbiddenError quando o usuário não é dono", async () => {
    mockRepo.findById.mockResolvedValue(
      makeWorkspace({ id: WORKSPACE_ID, owner_id: OWNER_ID }),
    );

    await expect(
      service.deleteWorkspace(WORKSPACE_ID, OTHER_USER_ID),
    ).rejects.toThrow(ForbiddenError);
  });

  it("deve soft-delete steps, tasks, projects, membros, convites e workspace em cascata", async () => {
    mockRepo.findById.mockResolvedValue(
      makeWorkspace({ id: WORKSPACE_ID, owner_id: OWNER_ID }),
    );

    await service.deleteWorkspace(WORKSPACE_ID, OWNER_ID);

    expect(mockStepsRepo.softDeleteByWorkspace).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(mockTasksRepo.softDeleteByWorkspace).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(mockProjectsRepo.softDeleteByWorkspace).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(mockRepo.deleteAllMembers).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(mockRepo.deleteAllInvitations).toHaveBeenCalledWith(WORKSPACE_ID);
    expect(mockRepo.softDelete).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it("não deve executar o cascade quando o usuário não é dono", async () => {
    mockRepo.findById.mockResolvedValue(
      makeWorkspace({ id: WORKSPACE_ID, owner_id: OWNER_ID }),
    );

    await expect(
      service.deleteWorkspace(WORKSPACE_ID, OTHER_USER_ID),
    ).rejects.toThrow(ForbiddenError);

    expect(mockStepsRepo.softDeleteByWorkspace).not.toHaveBeenCalled();
    expect(mockRepo.softDelete).not.toHaveBeenCalled();
  });

  it("não deve executar o cascade quando o workspace não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteWorkspace(WORKSPACE_ID, OWNER_ID),
    ).rejects.toThrow(NotFoundError);

    expect(mockStepsRepo.softDeleteByWorkspace).not.toHaveBeenCalled();
    expect(mockRepo.softDelete).not.toHaveBeenCalled();
  });
});
