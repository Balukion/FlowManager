import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockTaskUpdate = vi.fn();
const mockTaskDelete = vi.fn();
const mockTaskUpdateStatus = vi.fn();
const mockTaskAssign = vi.fn();
const mockTaskWatch = vi.fn();
const mockTaskUnwatch = vi.fn();
const mockStepCreate = vi.fn();
const mockStepUpdateStatus = vi.fn();
const mockStepAssign = vi.fn();
const mockStepUnassign = vi.fn();
const mockStepDelete = vi.fn();
const mockStepReorder = vi.fn();
const mockCommentCreate = vi.fn();
const mockCommentDelete = vi.fn();
const mockCommentUpdate = vi.fn();
const mockCommentReply = vi.fn();

vi.mock("@web/hooks/use-api-client", () => ({
  useApiClient: vi.fn(() => ({})),
}));

vi.mock("@web/services/task.service", () => ({
  taskService: vi.fn(() => ({
    update: mockTaskUpdate,
    delete: mockTaskDelete,
    updateStatus: mockTaskUpdateStatus,
    assign: mockTaskAssign,
    watch: mockTaskWatch,
    unwatch: mockTaskUnwatch,
  })),
}));

vi.mock("@web/services/step.service", () => ({
  stepService: vi.fn(() => ({
    create: mockStepCreate,
    updateStatus: mockStepUpdateStatus,
    assign: mockStepAssign,
    unassign: mockStepUnassign,
    delete: mockStepDelete,
    reorder: mockStepReorder,
  })),
}));

vi.mock("@web/services/comment.service", () => ({
  commentService: vi.fn(() => ({
    create: mockCommentCreate,
    delete: mockCommentDelete,
    update: mockCommentUpdate,
    reply: mockCommentReply,
  })),
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { useTaskMutations } from "./use-task-mutations";

const PARAMS = { workspaceId: "ws-1", projectId: "proj-1", taskId: "task-1" };

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTaskMutations", () => {
  it("createStepMutation chama stepService.create com os argumentos corretos", async () => {
    mockStepCreate.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      await result.current.createStepMutation.mutateAsync("Novo passo");
    });

    expect(mockStepCreate).toHaveBeenCalledWith("ws-1", "proj-1", "task-1", { title: "Novo passo" });
  });

  it("createCommentMutation chama commentService.create com os argumentos corretos", async () => {
    mockCommentCreate.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      await result.current.createCommentMutation.mutateAsync({ content: "Olá", mentions: ["user-1"] });
    });

    expect(mockCommentCreate).toHaveBeenCalledWith("ws-1", "proj-1", "task-1", "Olá", ["user-1"]);
  });

  it("assignMutation define assignError quando o serviço falha", async () => {
    mockStepAssign.mockRejectedValue({ message: "Usuário já atribuído" });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      result.current.assignMutation.mutate({ stepId: "step-1", userId: "user-1" });
    });

    await waitFor(() => expect(result.current.assignError).toBe("Usuário já atribuído"));
  });

  it("unassignMutation define assignError quando o serviço falha", async () => {
    mockStepUnassign.mockRejectedValue({ message: "Atribuição não encontrada" });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      result.current.unassignMutation.mutate({ stepId: "step-1", userId: "user-1" });
    });

    await waitFor(() => expect(result.current.assignError).toBe("Atribuição não encontrada"));
  });

  it("assignMutation limpa assignError quando sucesso", async () => {
    mockStepAssign.mockRejectedValue({ message: "Erro anterior" });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      result.current.assignMutation.mutate({ stepId: "step-1", userId: "user-1" });
    });
    await waitFor(() => expect(result.current.assignError).toBe("Erro anterior"));

    mockStepAssign.mockResolvedValue({ data: {} });
    await act(async () => {
      await result.current.assignMutation.mutateAsync({ stepId: "step-1", userId: "user-1" });
    });

    expect(result.current.assignError).toBeNull();
  });

  it("deleteTaskMutation navega para a página do projeto após sucesso", async () => {
    mockTaskDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      await result.current.deleteTaskMutation.mutateAsync();
    });

    expect(mockPush).toHaveBeenCalledWith("/workspaces/ws-1/projects/proj-1");
  });

  it("updateTaskMutation chama taskService.update com os dados corretos", async () => {
    mockTaskUpdate.mockResolvedValue({ data: {} });
    const onSuccess = vi.fn();
    const { result } = renderHook(
      () => useTaskMutations({ ...PARAMS, onUpdateTaskSuccess: onSuccess }),
      { wrapper },
    );

    const payload = { title: "Novo título", description: null, priority: "HIGH", deadline: null };
    await act(async () => {
      await result.current.updateTaskMutation.mutateAsync(payload);
    });

    expect(mockTaskUpdate).toHaveBeenCalledWith("ws-1", "proj-1", "task-1", payload);
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it("watchMutation chama taskService.watch", async () => {
    mockTaskWatch.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      await result.current.watchMutation.mutateAsync();
    });

    expect(mockTaskWatch).toHaveBeenCalledWith("ws-1", "proj-1", "task-1");
  });

  it("unwatchMutation chama taskService.unwatch", async () => {
    mockTaskUnwatch.mockResolvedValue({ data: {} });
    const { result } = renderHook(() => useTaskMutations(PARAMS), { wrapper });

    await act(async () => {
      await result.current.unwatchMutation.mutateAsync();
    });

    expect(mockTaskUnwatch).toHaveBeenCalledWith("ws-1", "proj-1", "task-1");
  });
});
