import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemberWorkloadList } from "./member-workload-list";

const members = [
  { user_id: "1", user_name: "João Silva", avatar_url: null, open_tasks: 3 },
  { user_id: "2", user_name: "Maria Souza", avatar_url: null, open_tasks: 0 },
];

describe("MemberWorkloadList", () => {
  it("exibe o nome de cada membro", () => {
    render(<MemberWorkloadList members={members} />);
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
  });

  it("exibe a contagem de tarefas abertas", () => {
    render(<MemberWorkloadList members={members} />);
    expect(screen.getByText("3 tarefas")).toBeInTheDocument();
  });

  it("exibe 0 tarefas para membro sem trabalho", () => {
    render(<MemberWorkloadList members={members} />);
    expect(screen.getByText("0 tarefas")).toBeInTheDocument();
  });

  it("exibe mensagem quando não há membros", () => {
    render(<MemberWorkloadList members={[]} />);
    expect(screen.getByText(/nenhum membro/i)).toBeInTheDocument();
  });

  it("exibe 1 tarefa no singular", () => {
    render(
      <MemberWorkloadList
        members={[{ user_id: "3", user_name: "Ana", avatar_url: null, open_tasks: 1 }]}
      />,
    );
    expect(screen.getByText("1 tarefa")).toBeInTheDocument();
  });
});
