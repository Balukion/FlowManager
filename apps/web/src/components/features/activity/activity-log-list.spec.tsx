import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityLogList } from "./activity-log-list";

const logs = [
  {
    id: "log-1",
    action: "TASK_CREATED",
    created_at: new Date("2026-01-01T10:00:00Z"),
    user: { id: "user-1", name: "João Silva" },
    metadata: {},
  },
  {
    id: "log-2",
    action: "TASK_STATUS_CHANGED",
    created_at: new Date("2026-01-02T12:00:00Z"),
    user: { id: "user-2", name: "Maria Souza" },
    metadata: { from: "TODO", to: "DONE" },
  },
  {
    id: "log-3",
    action: "STEP_ASSIGNED",
    created_at: new Date("2026-01-03T09:00:00Z"),
    user: { id: "user-1", name: "João Silva" },
    metadata: { assigned_to: ["user-2"] },
  },
];

describe("ActivityLogList", () => {
  it("renders user names for each log", () => {
    render(<ActivityLogList logs={logs} />);
    expect(screen.getAllByText("João Silva")).toHaveLength(2);
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("shows empty state when no logs", () => {
    render(<ActivityLogList logs={[]} />);
    expect(screen.getByText(/nenhuma atividade/i)).toBeInTheDocument();
  });

  it("renders a human-readable label for TASK_CREATED", () => {
    render(<ActivityLogList logs={[logs[0]]} />);
    expect(screen.getByText(/criou a tarefa/i)).toBeInTheDocument();
  });

  it("renders a human-readable label for TASK_STATUS_CHANGED with from/to", () => {
    render(<ActivityLogList logs={[logs[1]]} />);
    expect(screen.getByText(/status.*todo.*done/i)).toBeInTheDocument();
  });

  it("renders a human-readable label for STEP_ASSIGNED", () => {
    render(<ActivityLogList logs={[logs[2]]} />);
    expect(screen.getByText(/atribuiu um passo/i)).toBeInTheDocument();
  });

  it("renders the date of each log entry", () => {
    render(<ActivityLogList logs={[logs[0]]} />);
    // deve mostrar a data formatada — 01/01/2026
    expect(screen.getByText(/01\/01\/2026/)).toBeInTheDocument();
  });

  it("renders the time of each log entry in HH:MM format", () => {
    render(<ActivityLogList logs={[logs[0]]} />);
    // verifica que existe um elemento com padrão de horário HH:MM (independente do fuso)
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });
});
