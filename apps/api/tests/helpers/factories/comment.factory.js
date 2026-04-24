import { randomUUID } from "node:crypto";
export function makeComment(overrides = {}) {
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
//# sourceMappingURL=comment.factory.js.map