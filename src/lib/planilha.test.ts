import { describe, it, expect } from "vitest";
import { lerNumero, adivinharColunas, validar, parseCsv, type Planilha } from "./planilha";

describe("lerNumero (células da planilha)", () => {
  it("formatos brasileiro e americano, com R$", () => {
    expect(lerNumero("1.234,56")).toBe(1234.56);
    expect(lerNumero("1,234.56")).toBe(1234.56);
    expect(lerNumero("R$ 12,90")).toBe(12.9);
    expect(lerNumero("1.500")).toBe(1500);
    expect(lerNumero("2.5")).toBe(2.5);
    expect(lerNumero(7)).toBe(7);
  });
  it("vazia é null e texto é NaN", () => {
    expect(lerNumero("")).toBeNull();
    expect(lerNumero(null)).toBeNull();
    expect(lerNumero("abc")).toBeNaN();
  });
});

describe("adivinharColunas", () => {
  it("acha as colunas pelo cabeçalho, com custo antes de preço e mínimo antes de quantidade", () => {
    const m = adivinharColunas(["Código de barras", "Descrição do produto", "Qtd", "Estoque mínimo", "Preço de custo", "Preço de venda", "Valor total"]);
    expect(m.code).toBe(0);
    expect(m.name).toBe(1);
    expect(m.qty).toBe(2);
    expect(m.min_qty).toBe(3);
    expect(m.cost).toBe(4);
    expect(m.price).toBe(5);
  });
});

describe("parseCsv", () => {
  it("separador ponto e vírgula, aspas e BOM do Excel", () => {
    const linhas = parseCsv('﻿nome;qtd\n"Arroz; tipo 1";5\nFeijão;3\n');
    expect(linhas[0]).toEqual(["nome", "qtd"]);
    expect(linhas[1]).toEqual(["Arroz; tipo 1", "5"]);
    expect(linhas[2]).toEqual(["Feijão", "3"]);
  });
});

describe("validar", () => {
  const p: Planilha = {
    cabecalho: ["nome", "codigo", "quantidade", "unidade"],
    linhas: [
      ["Arroz 5 kg", "7890000000001", "10", "un"],
      ["Feijão", "", "abc", "kg"],
      ["Óleo de soja", "7890000000003", "5", "litro"],
      ["Óleo de soja", "7890000000003", "5", "litro"],
      ["Açúcar", "", "2", ""],
      ["X", "", "1", "un"],
      ["Café", "7,89E+12", "1", "un"],
    ],
    numeros: [2, 3, 4, 5, 6, 7, 8],
  };
  const mapa = adivinharColunas(p.cabecalho);
  const r = validar(p, mapa, { codigos: new Set(["7890000000001"]), nomes: new Set(["acucar"]) });

  it("pula o que já existe pelo código ou, sem código, pelo nome", () => {
    expect(r[0].situacao).toBe("ja_existe");
    expect(r[4].situacao).toBe("ja_existe");
  });
  it("número inválido, nome curto e código em notação científica são erro da linha", () => {
    expect(r[1].situacao).toBe("erro");
    expect(r[1].erros[0]).toContain("não é um número");
    expect(r[5].erros).toContain("nome com menos de 2 letras");
    expect(r[6].erros[0]).toContain("notação científica");
  });
  it("normaliza a unidade e marca a linha repetida na própria planilha", () => {
    expect(r[2].situacao).toBe("ok");
    expect(r[2].item?.unit).toBe("L");
    expect(r[3].situacao).toBe("repetido");
  });
  it("guarda o número da linha no arquivo", () => {
    expect(r.map((l) => l.numero)).toEqual(p.numeros);
  });
});
