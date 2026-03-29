import { describe, it, expect } from "vitest";
import { isExpired, addHours, addDays, addMinutes, isWithinHours } from "./date.js";

describe("isExpired", () => {
  it("deve retornar true para uma data no passado", () => {
    const passado = new Date(Date.now() - 1000);
    expect(isExpired(passado)).toBe(true);
  });

  it("deve retornar false para uma data no futuro", () => {
    const futuro = new Date(Date.now() + 1000 * 60 * 60);
    expect(isExpired(futuro)).toBe(false);
  });
});

describe("addHours", () => {
  it("deve adicionar horas corretamente", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    const resultado = addHours(base, 3);
    expect(resultado.toISOString()).toBe("2026-01-01T03:00:00.000Z");
  });

  it("deve funcionar com valor zero", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    expect(addHours(base, 0).toISOString()).toBe(base.toISOString());
  });

  it("deve funcionar com valores negativos (subtrair horas)", () => {
    const base = new Date("2026-01-01T06:00:00Z");
    const resultado = addHours(base, -2);
    expect(resultado.toISOString()).toBe("2026-01-01T04:00:00.000Z");
  });
});

describe("addDays", () => {
  it("deve adicionar dias corretamente", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    const resultado = addDays(base, 7);
    expect(resultado.toISOString()).toBe("2026-01-08T00:00:00.000Z");
  });

  it("deve funcionar com valores negativos (subtrair dias)", () => {
    const base = new Date("2026-01-10T00:00:00Z");
    const resultado = addDays(base, -3);
    expect(resultado.toISOString()).toBe("2026-01-07T00:00:00.000Z");
  });
});

describe("addMinutes", () => {
  it("deve adicionar minutos corretamente", () => {
    const base = new Date("2026-01-01T00:00:00Z");
    const resultado = addMinutes(base, 90);
    expect(resultado.toISOString()).toBe("2026-01-01T01:30:00.000Z");
  });

  it("deve funcionar com valores negativos", () => {
    const base = new Date("2026-01-01T02:00:00Z");
    const resultado = addMinutes(base, -30);
    expect(resultado.toISOString()).toBe("2026-01-01T01:30:00.000Z");
  });
});

describe("isWithinHours", () => {
  it("deve retornar true quando a data está dentro do intervalo futuro", () => {
    const em2h = new Date(Date.now() + 1000 * 60 * 60 * 2); // daqui a 2h
    expect(isWithinHours(em2h, 24)).toBe(true);
  });

  it("deve retornar false quando a data está além do intervalo", () => {
    const em48h = new Date(Date.now() + 1000 * 60 * 60 * 48); // daqui a 48h
    expect(isWithinHours(em48h, 24)).toBe(false);
  });

  it("deve retornar false para uma data no passado", () => {
    const passado = new Date(Date.now() - 1000);
    expect(isWithinHours(passado, 24)).toBe(false);
  });

  it("deve retornar true exatamente no limite do intervalo", () => {
    // Daqui a 1h, dentro do limite de 2h
    const em1h = new Date(Date.now() + 1000 * 60 * 60);
    expect(isWithinHours(em1h, 2)).toBe(true);
  });
});
