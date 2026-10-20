import { describe, it, expect } from "vitest";
import {
  deriveStatus, parseQtyInput, parsePriceInput, stockLevel, consumoDiario, previsaoDias, formatPrevisao,
  estaParado, tituloMovimentacao, productInitials, personInitials, timeAgo,
} from "./stock";

const DIA = 24 * 60 * 60 * 1000;
const AGORA = Date.parse("2026-10-20T12:00:00Z");
const haDias = (d: number) => new Date(AGORA - d * DIA).toISOString();

describe("deriveStatus", () => {
  it("zerado, baixo (no mínimo ou abaixo) e normal", () => {
    expect(deriveStatus(0, 5)).toBe("zerado");
    expect(deriveStatus(-1, 0)).toBe("zerado");
    expect(deriveStatus(5, 5)).toBe("baixo");
    expect(deriveStatus(3, 5)).toBe("baixo");
    expect(deriveStatus(6, 5)).toBe("normal");
  });
});

describe("números digitados no formato brasileiro", () => {
  it("quantidade: vírgula decimal, ponto de milhar e até 3 casas", () => {
    expect(parseQtyInput("1,5")).toBe(1.5);
    expect(parseQtyInput("1.234,5")).toBe(1234.5);
    expect(parseQtyInput("2.5")).toBe(2.5);
    expect(parseQtyInput("0,1234")).toBe(0.123);
  });
  it("texto com letras é inválido (o parseFloat aceitava \"2abc\")", () => {
    expect(parseQtyInput("2abc")).toBeNaN();
    expect(parseQtyInput("")).toBeNaN();
    expect(parseQtyInput("-3")).toBeNaN();
  });
  it("preço com 2 casas", () => {
    expect(parsePriceInput("1.234,56")).toBe(1234.56);
    expect(parsePriceInput("12,999")).toBe(13);
  });
});

describe("stockLevel", () => {
  it("usa o máximo quando existe", () => {
    expect(stockLevel(5, 2, 10)).toEqual({ fill: 0.5, minMark: 0.2 });
  });
  it("sem máximo, a referência é o dobro do mínimo (ou a própria quantidade, se maior)", () => {
    expect(stockLevel(5, 5, null)).toEqual({ fill: 0.5, minMark: 0.5 });
    expect(stockLevel(30, 5, null).fill).toBe(1);
  });
});

describe("previsão de quando acaba (EQZ-16)", () => {
  it("não prevê com menos de 7 dias de cadastro ou sem saídas", () => {
    expect(consumoDiario(haDias(3), 10, AGORA)).toBeNull();
    expect(consumoDiario(haDias(60), 0, AGORA)).toBeNull();
    expect(consumoDiario(haDias(60), undefined, AGORA)).toBeNull();
  });
  it("divide pelos dias que o produto existe quando tem menos de 30", () => {
    expect(consumoDiario(haDias(10), 20, AGORA)).toBeCloseTo(2);
    expect(consumoDiario(haDias(90), 30, AGORA)).toBeCloseTo(1);
  });
  it("estoque ÷ consumo por dia", () => {
    expect(previsaoDias(15, haDias(90), 30, AGORA)).toBeCloseTo(15);
    expect(previsaoDias(0, haDias(90), 30, AGORA)).toBeNull();
  });
  it("texto da previsão", () => {
    expect(formatPrevisao(0.4)).toBe("acaba hoje");
    expect(formatPrevisao(1.2)).toBe("dura ~1 dia");
    expect(formatPrevisao(12.4)).toBe("dura ~12 dias");
    expect(formatPrevisao(400)).toBe("dura mais de 1 ano");
  });
});

describe("dinheiro parado (EQZ-18)", () => {
  it("só conta produto com estoque, cadastrado há 60+ dias e sem saída nesse tempo", () => {
    expect(estaParado(5, haDias(90), undefined, AGORA)).toBe(true);
    expect(estaParado(5, haDias(90), haDias(70), AGORA)).toBe(true);
    expect(estaParado(5, haDias(90), haDias(10), AGORA)).toBe(false);
    expect(estaParado(5, haDias(20), undefined, AGORA)).toBe(false);
    expect(estaParado(0, haDias(90), undefined, AGORA)).toBe(false);
  });
});

describe("textos", () => {
  it("título da movimentação: motivo, motivo com observação ou tipo", () => {
    expect(tituloMovimentacao({ delta: -1, reason: null, motivo: "perda" })).toBe("Perda/avaria");
    expect(tituloMovimentacao({ delta: -1, reason: "caiu da prateleira", motivo: "perda" })).toBe("Perda/avaria · caiu da prateleira");
    expect(tituloMovimentacao({ delta: 3, reason: null })).toBe("Entrada");
    expect(tituloMovimentacao({ delta: -3, reason: null })).toBe("Saída");
  });
  it("iniciais", () => {
    expect(productInitials("feijão carioca")).toBe("Fe");
    expect(productInitials("   ")).toBe("?");
    expect(personInitials("João Victor Silva")).toBe("JV");
  });
  it("tempo relativo", () => {
    expect(timeAgo(new Date(AGORA - 30_000).toISOString(), AGORA)).toBe("agora");
    expect(timeAgo(new Date(AGORA - 12 * 60_000).toISOString(), AGORA)).toBe("há 12 min");
    expect(timeAgo(haDias(1), AGORA)).toBe("ontem");
    expect(timeAgo(haDias(3), AGORA)).toBe("há 3 dias");
  });
});
