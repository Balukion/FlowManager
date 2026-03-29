import { describe, it, expect } from "vitest";
import { getSafeLimit } from "./pagination.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/pagination.js";

describe("getSafeLimit", () => {
  it("deve retornar o DEFAULT_PAGE_SIZE quando limit não é fornecido", () => {
    expect(getSafeLimit()).toBe(DEFAULT_PAGE_SIZE);
  });

  it("deve retornar o limit quando está dentro do máximo permitido", () => {
    expect(getSafeLimit(10)).toBe(10);
    expect(getSafeLimit(50)).toBe(50);
  });

  it("deve retornar o MAX_PAGE_SIZE quando o limit solicitado ultrapassa o máximo", () => {
    expect(getSafeLimit(MAX_PAGE_SIZE + 1)).toBe(MAX_PAGE_SIZE);
    expect(getSafeLimit(9999)).toBe(MAX_PAGE_SIZE);
  });

  it("deve retornar o MAX_PAGE_SIZE exatamente quando limit é igual ao máximo", () => {
    expect(getSafeLimit(MAX_PAGE_SIZE)).toBe(MAX_PAGE_SIZE);
  });

  it("deve retornar o DEFAULT_PAGE_SIZE quando limit é undefined explicitamente", () => {
    expect(getSafeLimit(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });
});
