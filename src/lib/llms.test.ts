import { describe, it, expect } from "vitest";
import { textoLlms } from "./llms";
import { PLANOS, precoEmNumero } from "./planos";
import { PERGUNTAS } from "./perguntas";
import { CONTATO, SITE_URL } from "./site";
import { TESTE_GRATIS } from "./teste";

describe("preço em número (JSON-LD)", () => {
  it("lê o formato brasileiro", () => {
    expect(precoEmNumero("R$ 24,90")).toBe(24.9);
    expect(precoEmNumero("R$ 1.234,50")).toBe(1234.5);
  });
  it("todos os planos têm preço válido", () => {
    for (const p of PLANOS) expect(precoEmNumero(p.price), p.name).toBeGreaterThan(0);
  });
});

describe("llms.txt (EQZ-47)", () => {
  const texto = textoLlms();

  it("segue o formato: título e resumo no começo", () => {
    expect(texto.startsWith("# Estoquizen\n\n> ")).toBe(true);
  });
  it("traz cada plano com o preço da landing", () => {
    for (const p of PLANOS) expect(texto).toContain(`**${p.name}** (${p.price}${p.priceNote}`);
  });
  it("todos os planos aparecem com o teste grátis da oferta", () => {
    for (const p of PLANOS) expect(texto).toContain(`**${p.name}** (${p.price}${p.priceNote}, ${TESTE_GRATIS}, sem cartão)`);
    expect(texto).not.toContain("sem teste grátis");
  });
  it("traz todas as perguntas, o contato e links absolutos", () => {
    for (const { q } of PERGUNTAS) expect(texto).toContain(`### ${q}`);
    expect(texto).toContain(CONTATO);
    expect(texto).toContain(`(${SITE_URL}/register)`);
  });
  it("não lista recurso que o plano não tem", () => {
    const basic = texto.split("\n").find((l) => l.startsWith("- **Basic**"))!;
    expect(basic).not.toContain("Histórico por funcionário");
  });
});
