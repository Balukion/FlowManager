import { describe, it, expect } from "vitest";
import { stripPassword } from "./user.js";

describe("stripPassword", () => {
  it("deve remover o campo password_hash do objeto", () => {
    const user = { id: "1", email: "test@test.com", password_hash: "bcrypt_hash" };
    const result = stripPassword(user);
    expect(result).not.toHaveProperty("password_hash");
  });

  it("deve manter todos os outros campos intactos", () => {
    const user = { id: "1", email: "test@test.com", name: "Test", password_hash: "bcrypt_hash" };
    const result = stripPassword(user);
    expect(result).toEqual({ id: "1", email: "test@test.com", name: "Test" });
  });

  it("deve funcionar mesmo quando password_hash não está presente", () => {
    const user = { id: "1", email: "test@test.com" };
    const result = stripPassword(user);
    expect(result).toEqual({ id: "1", email: "test@test.com" });
  });
});
