import { describe, it, expect } from "vitest";
import { getErrorMessage } from "./error.js";

describe("getErrorMessage", () => {
  it("deve retornar a mensagem de um Error", () => {
    const err = new Error("algo explodiu");
    expect(getErrorMessage(err)).toBe("algo explodiu");
  });

  it("deve retornar a mensagem de um objeto com campo message", () => {
    const err = { message: "erro da API" };
    expect(getErrorMessage(err)).toBe("erro da API");
  });

  it("deve retornar o fallback padrão quando não há mensagem", () => {
    expect(getErrorMessage(null)).toBe("Algo deu errado");
    expect(getErrorMessage(undefined)).toBe("Algo deu errado");
    expect(getErrorMessage(42)).toBe("Algo deu errado");
    expect(getErrorMessage("string direta")).toBe("Algo deu errado");
    expect(getErrorMessage({})).toBe("Algo deu errado");
  });

  it("deve usar o fallback personalizado quando fornecido", () => {
    expect(getErrorMessage(null, "Erro customizado")).toBe("Erro customizado");
    expect(getErrorMessage({}, "Outro erro")).toBe("Outro erro");
  });

  it("deve ignorar campo message que não é string", () => {
    const err = { message: 42 };
    expect(getErrorMessage(err)).toBe("Algo deu errado");
  });
});
