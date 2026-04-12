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
  softDeleteProjectsByWorkspace: vi.fn(),
  softDeleteTasksByWorkspace: vi.fn(),
  softDeleteStepsByWorkspace: vi.fn(),
  deleteWithCascade: vi.fn(),
};

let service: WorkspacesService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new WorkspacesService(mockRepo as any);
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

  it("deve chamar deleteWithCascade com o workspaceId correto quando o dono deleta", async () => {
    mockRepo.findById.mockResolvedValue(
      makeWorkspace({ id: WORKSPACE_ID, owner_id: OWNER_ID }),
    );
    mockRepo.deleteWithCascade.mockResolvedValue(undefined);

    await service.deleteWorkspace(WORKSPACE_ID, OWNER_ID);

    expect(mockRepo.deleteWithCascade).toHaveBeenCalledOnce();
    expect(mockRepo.deleteWithCascade).toHaveBeenCalledWith(WORKSPACE_ID);
  });

  it("não deve chamar deleteWithCascade quando o usuário não é dono", async () => {
    mockRepo.findById.mockResolvedValue(
      makeWorkspace({ id: WORKSPACE_ID, owner_id: OWNER_ID }),
    );

    await expect(
      service.deleteWorkspace(WORKSPACE_ID, OTHER_USER_ID),
    ).rejects.toThrow(ForbiddenError);

    expect(mockRepo.deleteWithCascade).not.toHaveBeenCalled();
  });

  it("não deve chamar deleteWithCascade quando o workspace não existe", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      service.deleteWorkspace(WORKSPACE_ID, OWNER_ID),
    ).rejects.toThrow(NotFoundError);

    expect(mockRepo.deleteWithCascade).not.toHaveBeenCalled();
  });
});
