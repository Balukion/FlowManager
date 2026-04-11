import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCompletionList } from "./project-completion-list";

const projects = [
  { project_id: "1", project_name: "Projeto Alpha", total: 10, done: 7, rate: 70 },
  { project_id: "2", project_name: "Projeto Beta", total: 4, done: 4, rate: 100 },
];

describe("ProjectCompletionList", () => {
  it("exibe o nome de cada projeto", () => {
    render(<ProjectCompletionList projects={projects} />);
    expect(screen.getByText("Projeto Alpha")).toBeInTheDocument();
    expect(screen.getByText("Projeto Beta")).toBeInTheDocument();
  });

  it("exibe a taxa de conclusão em percentual", () => {
    render(<ProjectCompletionList projects={projects} />);
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("exibe a contagem done/total", () => {
    render(<ProjectCompletionList projects={projects} />);
    expect(screen.getByText("7/10")).toBeInTheDocument();
    expect(screen.getByText("4/4")).toBeInTheDocument();
  });

  it("exibe mensagem quando não há projetos", () => {
    render(<ProjectCompletionList projects={[]} />);
    expect(screen.getByText(/nenhum projeto/i)).toBeInTheDocument();
  });

  it("exibe 0% para projeto sem tarefas", () => {
    render(
      <ProjectCompletionList
        projects={[{ project_id: "3", project_name: "Vazio", total: 0, done: 0, rate: 0 }]}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0/0")).toBeInTheDocument();
  });
});
