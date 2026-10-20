import { describe, it, expect } from "vitest";
import { chaveValida, cnpjRaizDaChave, gtinValido, codigoDoItem } from "./nfe";

describe("chave de acesso da NF-e/NFC-e", () => {
  /* 43 dígitos quaisquer: só um dos 10 dígitos finais é o verificador certo */
  const base = "3526101234567800019965001000012345100001234";

  it("exatamente um dígito verificador vale", () => {
    const validas = Array.from({ length: 10 }, (_, d) => base + d).filter(chaveValida);
    expect(validas).toHaveLength(1);
  });

  it("recusa tamanho errado e letras", () => {
    expect(chaveValida(base)).toBe(false);
    expect(chaveValida(base + "12")).toBe(false);
    expect(chaveValida(base.slice(0, 42) + "AB")).toBe(false);
  });

  it("raiz do CNPJ fica nas posições 7 a 14", () => {
    expect(cnpjRaizDaChave(base + "0")).toBe("12345678");
  });
});

describe("GTIN/EAN", () => {
  it("dígito verificador", () => {
    expect(gtinValido("4006381333931")).toBe(true);   // exemplo clássico de EAN-13
    expect(gtinValido("4006381333932")).toBe(false);
    expect(gtinValido("12345")).toBe(false);
  });

  it("código do item: GTIN fica como está, interno ganha a raiz do CNPJ, SEM GTIN some", () => {
    expect(codigoDoItem("4006381333931", "12345678")).toBe("4006381333931");
    expect(codigoDoItem("002", "12345678")).toBe("12345678-002");
    expect(codigoDoItem("SEM GTIN", "12345678")).toBe("");
    expect(codigoDoItem("  ", "12345678")).toBe("");
  });
});
