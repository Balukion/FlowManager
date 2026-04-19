import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockTaskGet = vi.fn();
const mockStepList = vi.fn();
const mockCommentList = vi.fn();
const mockLabelList = vi.fn();
const mockListMembers = vi.fn();
const mockActivityListByTask = vi.fn();

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock("@web/services/task.service", () => ({
  taskService: vi.fn(() => ({ get: mockTaskGet })),
}));
vi.mock("@web/services/step.service", () => ({
  stepService: vi.fn(() => ({ list: mockStepList })),
}));
vi.mock("@web/services/comment.service", () => ({
  commentService: vi.fn(() => ({ list: mockCommentList })),
}));
vi.mock("@web/services/label.service", () => ({
  labelService: vi.fn(() => ({ list: mockLabelList })),
}));
vi.mock("@web/services/workspace.service", () => ({
  workspaceService: vi.fn(() => ({ listMembers: mockListMembers })),
}));
vi.mock("@web/services/activity.service", () => ({
  activityService: vi.fn(() => ({ listByTask: mockActivityListByTask })),
}));
vi.mock("@web/stores/auth.store", () => ({
  useAuthStore: () => ({ accessToken: "token-123" }),
}));

import { useTaskPageData } from "./use-task-page-data";

const PARAMS = { workspaceId: "ws-1", projectId: "proj-1", taskId: "task-1" };

const makeTask = () => ({
  title: "Implementar login",
  description: "Desc",
  status: "TODO",
  priority: "HIGH",
  deadline: null,
  assignee_id: "user-1",
  assignee: { id: "user-1", name: "Alice" },
  task_labels: [{ label: { id: "lbl-1", name: "Bug", color: "#f00" } }],
});

const makeStep = () => ({
  id: "step-1",
  task_id: "task-1",
  title: "Passo 1",
  status: "PENDING",
  order: 1,
  assignments: [],
  description: null,
  deadline: null,
  due_reminder_sent_at: null,
  created_by: "user-1",
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
});

const makeMember = () => ({
  user_id: "user-1",
  role: "MEMBER",
  user: { id: "user-1", name: "Alice", email: "alice@test.com", avatar_url: null },
});

const makeComment = () => ({
  id: "cmt-1",
  task_id: "task-1",
  parent_id: null,
  user_id: "user-1",
  content: "Bom trabalho",
  edited_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  author: { id: "user-1", name: "Alice", avatar_url: null },
});

const makeLabel = () => ({ id: "lbl-1", name: "Bug", color: "#f00" });

const makeLog = () => ({
  id: "log-1",
  action: "TASK_STATUS_CHANGED",
  created_at: new Date(),
  user: { id: "user-1", name: "Alice" },
  metadata: { from: "TODO", to: "DONE" },
});

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTaskGet.mockResolvedValue({ data: { task: makeTask(), is_watching: true } });
  mockStepList.mockResolvedValue({ data: { steps: [makeStep()] } });
  mockCommentList.mockResolvedValue({ data: { comments: [makeComment()] } });
  mockLabelList.mockResolvedValue({ data: { labels: [makeLabel()] } });
  mockListMembers.mockResolvedValue({ data: { members: [makeMember()] } });
  mockActivityListByTask.mockResolvedValue({ data: { logs: [makeLog()] } });
});

describe("useTaskPageData", () => {
  it("retorna task e isWatching depois que a query resolve", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.task).toBeDefined());

    expect(result.current.task?.title).toBe("Implementar login");
    expect(result.current.isWatching).toBe(true);
  });

  it("retorna steps a partir da query de passos", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.steps.length).toBe(1));

    expect(result.current.steps[0].title).toBe("Passo 1");
  });

  it("retorna members a partir da query de membros", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.members.length).toBe(1));

    expect(result.current.members[0].user.name).toBe("Alice");
  });

  it("mapeia author → user nos comentários", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.comments.length).toBe(1));

    expect(result.current.comments[0].user.name).toBe("Alice");
  });

  it("retorna workspaceLabels da query de labels", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.workspaceLabels.length).toBe(1));

    expect(result.current.workspaceLabels[0].name).toBe("Bug");
  });

  it("deriva taskLabels de task.task_labels", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.taskLabels.length).toBe(1));

    expect(result.current.taskLabels[0].id).toBe("lbl-1");
  });

  it("retorna activityLogs da query de atividades", async () => {
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });
    await waitFor(() => expect(result.current.activityLogs.length).toBe(1));

    expect(result.current.activityLogs[0].action).toBe("TASK_STATUS_CHANGED");
  });

  it("isLoading é true enquanto as queries não resolveram", () => {
    mockTaskGet.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTaskPageData(PARAMS), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });
});
