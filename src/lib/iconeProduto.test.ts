import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ICONES, SEM_ICONE, iconeDoNome, iconeDoProduto, buscarIcones } from "./iconeProduto";
import { SEGMENTOS } from "./segmentos";

describe("ícones (EQZ-30)", () => {
  it("toda chave cabe no CHECK de products.icon e tem o arquivo em public/", () => {
    const pasta = path.resolve(__dirname, "../../public/icones/produtos");
    for (const chave of Object.keys(ICONES)) {
      expect(chave).toMatch(/^[a-z]{2,20}$/);
      expect(fs.existsSync(path.join(pasta, `${chave}.webp`)), `${chave}.webp`).toBe(true);
    }
  });

  it("acha o ícone pelo nome do produto", () => {
    expect(iconeDoNome("Mussarela fatiada 1kg")).toBe("queijo");
    expect(iconeDoNome("Coca-Cola 2L")).toBe("refri");
    expect(iconeDoNome("Óleo de soja 900 ml")).toBe("frasco");
    expect(iconeDoNome("Óleo de motor 5W30")).toBe("oleo");
    expect(iconeDoNome("Feijão carioca 1 kg")).toBe("feijao");
    expect(iconeDoNome("Batata doce")).toBe("batatadoce");
    expect(iconeDoNome("Vela de ignição NGK")).toBe("engrenagem");
  });

  it("palavra forte vence a genérica, e a primeira forte do nome vence", () => {
    expect(iconeDoNome("Ração Golden gatos 10kg")).toBe("gato");
    expect(iconeDoNome("Ração cães adultos")).toBe("cachorro");
    expect(iconeDoNome("Camiseta manga longa")).toBe("camiseta");
    expect(iconeDoNome("Manga palmer")).toBe("manga");
  });

  it("palavras do CLDR valem depois das do comércio", () => {
    expect(iconeDoNome("Macarronada")).toBe("macarrao");
    expect(iconeDoNome("Cápsula de café")).toBe("cafe");
    expect(iconeDoNome("Vitamina de banana")).toBe("banana");
  });

  it("sem ícone: ficam as iniciais", () => {
    expect(iconeDoNome("Farinha de trigo")).toBeNull();
  });

  it("a escolha manual vence o nome, e \"nenhum\" força as iniciais", () => {
    expect(iconeDoProduto("Mussarela", "pizza")).toBe("pizza");
    expect(iconeDoProduto("Mussarela", SEM_ICONE)).toBeNull();
    expect(iconeDoProduto("Mussarela", "chave-que-nao-existe")).toBe("queijo");
  });

  it("busca do seletor: pelo dicionário e pelo rótulo", () => {
    expect(buscarIcones("mussarela")).toContain("queijo");
    expect(buscarIcones("cane")).toContain("caneta");
    expect(buscarIcones("   ")).toEqual([]);
  });

  it("as listas prontas por ramo só usam ícones que existem", () => {
    for (const s of SEGMENTOS) {
      for (const item of s.modelo) {
        const k = iconeDoNome(item.nome);
        if (k) expect(ICONES[k], `${item.nome} → ${k}`).toBeDefined();
      }
    }
  });
});
