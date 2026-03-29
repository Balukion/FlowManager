import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.client.js", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from "./api.client.js";
import { commentService } from "./comment.service.js";

const TOKEN = "bearer-token";
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const COMMENT_ID = "comment-1";
const BASE = `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/comments`;

beforeEach(() => vi.clearAllMocks());

describe("commentService.list", () => {
  it("should GET comments for a task with token", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { comments: [] } });
    await commentService.list(WS_ID, PROJ_ID, TASK_ID, TOKEN);
    expect(api.get).toHaveBeenCalledWith(BASE, TOKEN);
  });
});

describe("commentService.create", () => {
  it("should POST to comments endpoint with content and token", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { comment: {} } });
    await commentService.create(WS_ID, PROJ_ID, TASK_ID, "Olá mundo", TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { content: "Olá mundo" }, TOKEN);
  });
});

describe("commentService.update", () => {
  it("should PATCH comment with new content and token", async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { comment: {} } });
    await commentService.update(WS_ID, PROJ_ID, TASK_ID, COMMENT_ID, "Editado", TOKEN);
    expect(api.patch).toHaveBeenCalledWith(`${BASE}/${COMMENT_ID}`, { content: "Editado" }, TOKEN);
  });
});

describe("commentService.delete", () => {
  it("should DELETE comment with token", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await commentService.delete(WS_ID, PROJ_ID, TASK_ID, COMMENT_ID, TOKEN);
    expect(api.delete).toHaveBeenCalledWith(`${BASE}/${COMMENT_ID}`, TOKEN);
  });
});
