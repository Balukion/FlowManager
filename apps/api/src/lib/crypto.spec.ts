import crypto from "crypto";
import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "./crypto.js";

describe("generateToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns a different value on each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe("hashToken", () => {
  it("returns a 64-character hex string", () => {
    const hash = hashToken("any-token");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input always produces same output", () => {
    const token = "my-secret-token";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("matches the sha256 output from Node crypto directly", () => {
    const token = generateToken();
    const expected = crypto.createHash("sha256").update(token).digest("hex");
    expect(hashToken(token)).toBe(expected);
  });
});
