import { randomUUID } from "crypto";
import type { Project } from "@flowmanager/types";

export function makeProject(overrides: Partial<Project> = {}): Project {
  const id = randomUUID();
  return {
    id,
    workspace_id: randomUUID(),
    owner_id: null,
    name: "Test Project",
    slug: `test-project-${id.slice(0, 8)}`,
    description: null,
    color: null,
    status: "ACTIVE",
    deadline: null,
    created_by: randomUUID(),
    archived_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  };
}
