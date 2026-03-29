import { describe, it, expect } from "vitest";
import { generateSlug, generateUniqueSlug } from "./slug.js";

describe("generateSlug", () => {
  it("deve converter texto para lowercase", () => {
    expect(generateSlug("Minha Startup")).toBe("minha-startup");
  });

  it("deve remover acentos e caracteres especiais", () => {
    expect(generateSlug("Café com Leite")).toBe("cafe-com-leite");
    // ç → c, ã → a após normalização NFD; & é removido
    expect(generateSlug("Ação & Reação")).toBe("acao-reacao");
  });

  it("deve substituir espaços por hífens", () => {
    expect(generateSlug("meu projeto")).toBe("meu-projeto");
  });

  it("deve colapsar múltiplos espaços em um único hífen", () => {
    expect(generateSlug("meu   projeto")).toBe("meu-projeto");
  });

  it("deve remover hífens no início e no fim", () => {
    expect(generateSlug("  meu projeto  ")).toBe("meu-projeto");
  });

  it("deve remover caracteres que não são letras, números ou hífens", () => {
    expect(generateSlug("App v2.0!")).toBe("app-v20");
  });

  it("deve colapsar múltiplos hífens consecutivos", () => {
    expect(generateSlug("meu--projeto")).toBe("meu-projeto");
  });

  it("deve retornar string vazia para entrada vazia", () => {
    expect(generateSlug("")).toBe("");
  });

  it("deve lidar com caracteres especiais mantendo apenas alfanuméricos", () => {
    expect(generateSlug("Hello World!")).toBe("hello-world");
  });
});

describe("generateUniqueSlug", () => {
  it("deve retornar o slug base quando não há colisão", () => {
    expect(generateUniqueSlug("Meu Projeto", [])).toBe("meu-projeto");
  });

  it("deve adicionar sufixo -2 quando o slug já existe", () => {
    expect(generateUniqueSlug("Meu Projeto", ["meu-projeto"])).toBe("meu-projeto-2");
  });

  it("deve incrementar o sufixo até encontrar um slug disponível", () => {
    expect(
      generateUniqueSlug("Meu Projeto", ["meu-projeto", "meu-projeto-2", "meu-projeto-3"]),
    ).toBe("meu-projeto-4");
  });

  it("deve retornar o slug base quando a lista de existentes não contém ele", () => {
    expect(generateUniqueSlug("Novo Projeto", ["outro-projeto"])).toBe("novo-projeto");
  });
});
