import { describe, it, expect } from "vitest";
import { TIMEZONES } from "./timezones.js";

describe("TIMEZONES", () => {
  it("is a non-empty array of strings", () => {
    expect(Array.isArray(TIMEZONES)).toBe(true);
    expect(TIMEZONES.length).toBeGreaterThan(0);
    TIMEZONES.forEach((tz: string) => expect(typeof tz).toBe("string"));
  });

  it("contains UTC", () => {
    expect(TIMEZONES).toContain("UTC");
  });

  it("contains America/Sao_Paulo", () => {
    expect(TIMEZONES).toContain("America/Sao_Paulo");
  });

  it("has no duplicate entries", () => {
    const unique = new Set(TIMEZONES);
    expect(unique.size).toBe(TIMEZONES.length);
  });
});
