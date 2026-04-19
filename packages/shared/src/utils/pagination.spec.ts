import { describe, it, expect } from "vitest";
import { getSafeLimit, paginateResult } from "./pagination.js";
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

describe("paginateResult", () => {
  const makeRows = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ id: `item-${i + 1}` }));

  it("retorna todos os itens e next_cursor undefined quando não há próxima página", () => {
    const rows = makeRows(5);
    const { items, next_cursor } = paginateResult(rows, 10);

    expect(items).toHaveLength(5);
    expect(next_cursor).toBeUndefined();
  });

  it("fatia os itens e retorna o id do último quando há mais resultados", () => {
    const rows = makeRows(11); // limit=10, repo retorna limit+1
    const { items, next_cursor } = paginateResult(rows, 10);

    expect(items).toHaveLength(10);
    expect(next_cursor).toBe("item-10");
  });

  it("retorna next_cursor do décimo item quando limit=10 e há exatamente 11 resultados", () => {
    const rows = makeRows(11);
    const { items, next_cursor } = paginateResult(rows, 10);

    expect(items.at(-1)!.id).toBe("item-10");
    expect(next_cursor).toBe("item-10");
  });

  it("retorna lista vazia e sem cursor quando não há resultados", () => {
    const { items, next_cursor } = paginateResult([], 10);

    expect(items).toHaveLength(0);
    expect(next_cursor).toBeUndefined();
  });

  it("retorna exatamente limit itens quando rows.length === limit + 1", () => {
    const rows = makeRows(21); // limit=20
    const { items, next_cursor } = paginateResult(rows, 20);

    expect(items).toHaveLength(20);
    expect(next_cursor).toBe("item-20");
  });

  it("não corta quando rows.length === limit (sem próxima página)", () => {
    const rows = makeRows(20);
    const { items, next_cursor } = paginateResult(rows, 20);

    expect(items).toHaveLength(20);
    expect(next_cursor).toBeUndefined();
  });

  it("não explode e retorna next_cursor undefined quando limit = 0 e há rows", () => {
    const rows = makeRows(3);
    const { items, next_cursor } = paginateResult(rows, 0);

    expect(items).toHaveLength(0);
    expect(next_cursor).toBeUndefined();
  });
});
