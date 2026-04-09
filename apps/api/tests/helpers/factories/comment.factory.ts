import { randomUUID } from "node:crypto";

interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  edited_at: Date | null;
  deleted_at: Date | null;
  deleted_by: string | null;
  created_at: Date;
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: randomUUID(),
    task_id: randomUUID(),
    user_id: randomUUID(),
    content: "Comentário de teste",
    parent_id: null,
    edited_at: null,
    deleted_at: null,
    deleted_by: null,
    created_at: new Date(),
    ...overrides,
  };
}
