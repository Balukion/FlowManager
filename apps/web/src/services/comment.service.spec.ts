import { describe, it, expect, vi, beforeEach } from "vitest";
import { commentService } from "./comment.service.js";

const mockClient = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
const WS_ID = "ws-1";
const PROJ_ID = "proj-1";
const TASK_ID = "task-1";
const COMMENT_ID = "comment-1";
const BASE = `/workspaces/${WS_ID}/projects/${PROJ_ID}/tasks/${TASK_ID}/comments`;

beforeEach(() => vi.clearAllMocks());

describe("commentService.list", () => {
  it("should GET comments for a task", async () => {
    mockClient.get.mockResolvedValue({ data: { comments: [] } });
    await commentService(mockClient).list(WS_ID, PROJ_ID, TASK_ID);
    expect(mockClient.get).toHaveBeenCalledWith(BASE);
  });
});

describe("commentService.create", () => {
  it("should POST to comments endpoint with content", async () => {
    mockClient.post.mockResolvedValue({ data: { comment: {} } });
    await commentService(mockClient).create(WS_ID, PROJ_ID, TASK_ID, "Olá mundo", []);
    expect(mockClient.post).toHaveBeenCalledWith(BASE, { content: "Olá mundo", mention_ids: [] });
  });

  it("should include mention_ids when mentions are provided", async () => {
    mockClient.post.mockResolvedValue({ data: { comment: {} } });
    await commentService(mockClient).create(WS_ID, PROJ_ID, TASK_ID, "@Alice confere isso", ["u-1"]);
    expect(mockClient.post).toHaveBeenCalledWith(BASE, { content: "@Alice confere isso", mention_ids: ["u-1"] });
  });
});

describe("commentService.update", () => {
  it("should PATCH comment with new content", async () => {
    mockClient.patch.mockResolvedValue({ data: { comment: {} } });
    await commentService(mockClient).update(WS_ID, PROJ_ID, TASK_ID, COMMENT_ID, "Editado");
    expect(mockClient.patch).toHaveBeenCalledWith(`${BASE}/${COMMENT_ID}`, { content: "Editado" });
  });
});

describe("commentService.delete", () => {
  it("should DELETE comment", async () => {
    mockClient.delete.mockResolvedValue(undefined);
    await commentService(mockClient).delete(WS_ID, PROJ_ID, TASK_ID, COMMENT_ID);
    expect(mockClient.delete).toHaveBeenCalledWith(`${BASE}/${COMMENT_ID}`);
  });
});

describe("commentService.reply", () => {
  it("should POST with content and parent_id to create a reply", async () => {
    mockClient.post.mockResolvedValue({ data: { comment: {} } });
    await commentService(mockClient).reply(WS_ID, PROJ_ID, TASK_ID, "Boa ideia!", COMMENT_ID, []);
    expect(mockClient.post).toHaveBeenCalledWith(BASE, { content: "Boa ideia!", parent_id: COMMENT_ID, mention_ids: [] });
  });

  it("should include mention_ids in reply when mentions are provided", async () => {
    mockClient.post.mockResolvedValue({ data: { comment: {} } });
    await commentService(mockClient).reply(WS_ID, PROJ_ID, TASK_ID, "@João veja!", COMMENT_ID, ["u-1"]);
    expect(mockClient.post).toHaveBeenCalledWith(BASE, { content: "@João veja!", parent_id: COMMENT_ID, mention_ids: ["u-1"] });
  });
});
