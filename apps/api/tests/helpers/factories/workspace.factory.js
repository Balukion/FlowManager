import { randomUUID } from "crypto";
export function makeWorkspace(overrides = {}) {
    const id = randomUUID();
    return {
        id,
        name: "Test Workspace",
        slug: `test-workspace-${id.slice(0, 8)}`,
        description: null,
        color: null,
        logo_url: null,
        owner_id: randomUUID(),
        settings: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        ...overrides,
    };
}
//# sourceMappingURL=workspace.factory.js.map