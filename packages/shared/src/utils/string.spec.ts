import { describe, it, expect } from "vitest";
import { normalizeEmail, truncate, generateRandomColor, getInitials, getDiceBearUrl } from "./string.js";

describe("normalizeEmail", () => {
  it("deve converter para lowercase", () => {
    expect(normalizeEmail("JOAO@TEST.COM")).toBe("joao@test.com");
  });

  it("deve remover espaços no início e no fim", () => {
    expect(normalizeEmail("  joao@test.com  ")).toBe("joao@test.com");
  });

  it("deve fazer as duas transformações juntas", () => {
    expect(normalizeEmail("  JOAO@TEST.COM  ")).toBe("joao@test.com");
  });

  it("deve retornar o email sem alteração se já estiver normalizado", () => {
    expect(normalizeEmail("joao@test.com")).toBe("joao@test.com");
  });
});

describe("truncate", () => {
  it("deve retornar a string sem alteração quando está dentro do limite", () => {
    expect(truncate("olá mundo", 20)).toBe("olá mundo");
  });

  it("deve retornar a string sem alteração quando tem exatamente o tamanho máximo", () => {
    expect(truncate("12345", 5)).toBe("12345");
  });

  it("deve truncar e adicionar ... quando ultrapassa o limite", () => {
    expect(truncate("olá mundo cruel", 10)).toBe("olá mun...");
  });

  it("deve preservar o tamanho máximo incluindo os ...", () => {
    const resultado = truncate("texto longo demais", 8);
    expect(resultado.length).toBe(8);
    expect(resultado.endsWith("...")).toBe(true);
  });
});

describe("generateRandomColor", () => {
  it("deve retornar uma string que começa com #", () => {
    const cor = generateRandomColor();
    expect(cor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("deve retornar sempre um valor válido (nunca undefined)", () => {
    // Roda 20 vezes para cobrir o fallback do último item do array
    for (let i = 0; i < 20; i++) {
      expect(generateRandomColor()).toBeTruthy();
    }
  });
});

describe("getInitials", () => {
  it("deve retornar as iniciais das duas primeiras palavras", () => {
    expect(getInitials("João Silva")).toBe("JS");
  });

  it("deve retornar apenas uma inicial para nome único", () => {
    expect(getInitials("João")).toBe("J");
  });

  it("deve ignorar palavras além das duas primeiras", () => {
    expect(getInitials("João da Silva")).toBe("JD");
  });

  it("deve retornar letras maiúsculas", () => {
    expect(getInitials("ana paula")).toBe("AP");
  });
});

describe("getDiceBearUrl", () => {
  it("deve gerar uma URL com o nome codificado", () => {
    const url = getDiceBearUrl("João Silva");
    expect(url).toContain("api.dicebear.com");
    expect(url).toContain(encodeURIComponent("João Silva"));
  });

  it("deve usar o endpoint de initials na versão 7.x", () => {
    const url = getDiceBearUrl("Teste");
    expect(url).toContain("7.x/initials/svg");
  });
});
