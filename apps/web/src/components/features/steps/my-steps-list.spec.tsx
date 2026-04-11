import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyStepsList } from "./my-steps-list";

const makeStep = (overrides = {}) => ({
  id: "step-1",
  title: "Revisar PR",
  status: "PENDING",
  deadline: null,
  task: {
    id: "task-1",
    title: "Tarefa principal",
    number: 1,
    project_id: "proj-1",
    project: { id: "proj-1", name: "Projeto Alpha" },
  },
  ...overrides,
});

describe("MyStepsList", () => {
  it("renders empty state when no steps", () => {
    render(<MyStepsList steps={[]} workspaceId="ws-1" />);
    expect(screen.getByText(/nenhum passo/i)).toBeInTheDocument();
  });

  it("renders step title", () => {
    render(<MyStepsList steps={[makeStep()]} workspaceId="ws-1" />);
    expect(screen.getByText("Revisar PR")).toBeInTheDocument();
  });

  it("renders task title and number", () => {
    render(<MyStepsList steps={[makeStep()]} workspaceId="ws-1" />);
    expect(screen.getByText(/tarefa principal/i)).toBeInTheDocument();
    expect(screen.getByText(/#1/i)).toBeInTheDocument();
  });

  it("renders project name", () => {
    render(<MyStepsList steps={[makeStep()]} workspaceId="ws-1" />);
    expect(screen.getByText(/Projeto Alpha/i)).toBeInTheDocument();
  });

  it("renders PENDING status badge", () => {
    render(<MyStepsList steps={[makeStep({ status: "PENDING" })]} workspaceId="ws-1" />);
    expect(screen.getByText(/pendente/i)).toBeInTheDocument();
  });

  it("renders DONE status badge", () => {
    render(<MyStepsList steps={[makeStep({ status: "DONE" })]} workspaceId="ws-1" />);
    expect(screen.getByText(/concluído/i)).toBeInTheDocument();
  });

  it("renders IN_PROGRESS status badge", () => {
    render(<MyStepsList steps={[makeStep({ status: "IN_PROGRESS" })]} workspaceId="ws-1" />);
    expect(screen.getByText(/em andamento/i)).toBeInTheDocument();
  });

  it("renders deadline when present", () => {
    render(
      <MyStepsList
        steps={[makeStep({ deadline: "2026-05-15T12:00:00.000Z" })]}
        workspaceId="ws-1"
      />,
    );
    expect(screen.getByText(/15\/05\/2026/)).toBeInTheDocument();
  });

  it("renders multiple steps", () => {
    const steps = [
      makeStep({ id: "s-1", title: "Passo A" }),
      makeStep({ id: "s-2", title: "Passo B" }),
    ];
    render(<MyStepsList steps={steps} workspaceId="ws-1" />);
    expect(screen.getByText("Passo A")).toBeInTheDocument();
    expect(screen.getByText("Passo B")).toBeInTheDocument();
  });

  it("renders link to task", () => {
    render(<MyStepsList steps={[makeStep()]} workspaceId="ws-1" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "/workspaces/ws-1/projects/proj-1/tasks/task-1",
    );
  });
});
