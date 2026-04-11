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
    await commentService.create(WS_ID, PROJ_ID, TASK_ID, "Olá mundo", [], TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { content: "Olá mundo", mention_ids: [] }, TOKEN);
  });

  it("should include mention_ids when mentions are provided", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { comment: {} } });
    await commentService.create(WS_ID, PROJ_ID, TASK_ID, "@Alice confere isso", ["u-1"], TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { content: "@Alice confere isso", mention_ids: ["u-1"] }, TOKEN);
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

describe("commentService.reply", () => {
  it("should POST with content and parent_id to create a reply", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { comment: {} } });
    await commentService.reply(WS_ID, PROJ_ID, TASK_ID, "Boa ideia!", COMMENT_ID, [], TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { content: "Boa ideia!", parent_id: COMMENT_ID, mention_ids: [] }, TOKEN);
  });

  it("should include mention_ids in reply when mentions are provided", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { comment: {} } });
    await commentService.reply(WS_ID, PROJ_ID, TASK_ID, "@João veja!", COMMENT_ID, ["u-1"], TOKEN);
    expect(api.post).toHaveBeenCalledWith(BASE, { content: "@João veja!", parent_id: COMMENT_ID, mention_ids: ["u-1"] }, TOKEN);
  });
});
