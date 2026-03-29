import { randomUUID } from "crypto";
import { addHours } from "@flowmanager/shared";
import type { Invitation } from "@flowmanager/types";

export function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: randomUUID(),
    workspace_id: randomUUID(),
    invited_by: randomUUID(),
    email: "convidado@test.com",
    role: "MEMBER",
    token_hash: "hash_do_token",
    status: "PENDING",
    expires_at: addHours(new Date(), 48),
    viewed_at: null,
    accepted_at: null,
    declined_at: null,
    created_at: new Date(),
    ...overrides,
  };
}
