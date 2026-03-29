import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateWorkspace } from "./validate-workspace.js";
import { NotFoundError, ForbiddenError } from "../errors/index.js";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma.js";

const makeRequest = (overrides: object = {}) =>
  ({
    params: { id: "ws-123" },
    userId: "user-abc",
    ...overrides,
  }) as any;

describe("validateWorkspace middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should inject workspace and member into request when valid", async () => {
    const workspace = { id: "ws-123", deleted_at: null, owner_id: "owner-1" };
    const member = { workspace_id: "ws-123", user_id: "user-abc", role: "MEMBER" };
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(workspace as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(member as any);

    const req = makeRequest();
    await validateWorkspace(req);

    expect(req.workspace).toEqual(workspace);
    expect(req.member).toEqual(member);
  });

  it("should throw NotFoundError when workspace does not exist", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

    await expect(validateWorkspace(makeRequest())).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when workspace is soft-deleted", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);

    await expect(validateWorkspace(makeRequest())).rejects.toThrow(NotFoundError);
  });

  it("should throw ForbiddenError when user is not a member", async () => {
    const workspace = { id: "ws-123", deleted_at: null };
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(workspace as any);
    vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

    await expect(validateWorkspace(makeRequest())).rejects.toThrow(ForbiddenError);
  });
});
