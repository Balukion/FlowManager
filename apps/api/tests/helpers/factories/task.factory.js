import { randomUUID } from "crypto";
export function makeTask(overrides = {}) {
    return {
        id: randomUUID(),
        project_id: randomUUID(),
        assignee_id: null,
        title: "Test Task",
        number: 1,
        description: null,
        status: "TODO",
        priority: "LOW",
        order: 1,
        deadline: null,
        due_reminder_sent_at: null,
        status_is_manual: false,
        status_overridden_by: null,
        status_overridden_at: null,
        created_by: randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        ...overrides,
    };
}
//# sourceMappingURL=task.factory.js.map