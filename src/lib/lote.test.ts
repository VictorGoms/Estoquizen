import { describe, it, expect } from "vitest";
import { somarNaLista, mudarQuantidade, faltandoNaSaida, valorDaLista, mapaDeCodigos, buscarNoEstoque, type ProdutoLote } from "./lote";

const arroz:  ProdutoLote = { id: "a", name: "Arroz Branco 5kg",      code: "7891234567890", qty: 10,  unit: "un", price: 24.9 };
const feijao: ProdutoLote = { id: "f", name: "Feijão Carioca 1kg",    code: null,            qty: 2,   unit: "un", price: 8.5 };
const carne:  ProdutoLote = { id: "c", name: "Carne moída",           code: "abc-01",        qty: 1.5, unit: "kg", price: 39.9 };
const mapa = new Map([arroz, feijao, carne].map((p) => [p.id, p]));

describe("lista do modo Vários (EQZ-69)", () => {
  it("o produto novo entra no topo; ler de novo soma na mesma linha", () => {
    let l = somarNaLista([], "a");
    l = somarNaLista(l, "f");
    l = somarNaLista(l, "a");
    expect(l).toEqual([{ id: "f", qtd: 1 }, { id: "a", qtd: 2 }]);
  });

  it("aceita fração (kg) e zero tira da lista", () => {
    let l = somarNaLista([], "c", 0.25);
    l = mudarQuantidade(l, "c", 1.2345);
    expect(l).toEqual([{ id: "c", qtd: 1.235 }]);
    expect(mudarQuantidade(l, "c", 0)).toEqual([]);
  });

  it("na saída, marca o que passa do estoque (bloqueia com aviso)", () => {
    const l = [{ id: "a", qtd: 10 }, { id: "f", qtd: 3 }, { id: "c", qtd: 1.5 }];
    expect([...faltandoNaSaida(l, mapa)]).toEqual(["f"]);
  });

  it("soma o valor pelo preço de venda", () => {
    expect(valorDaLista([{ id: "a", qtd: 2 }, { id: "c", qtd: 0.5 }], mapa)).toBe(69.75);
  });

  it("acha pelo código lido sem diferença de maiúscula", () => {
    const codigos = mapaDeCodigos([arroz, feijao, carne]);
    expect(codigos.get("ABC-01")?.id).toBe("c");
    expect(codigos.get("7891234567890")?.id).toBe("a");
    expect(codigos.size).toBe(2);
  });

  it("busca pelo nome sem acento, em qualquer ordem, ou pelo começo do código", () => {
    expect(buscarNoEstoque([arroz, feijao, carne], "feijao").map((p) => p.id)).toEqual(["f"]);
    expect(buscarNoEstoque([arroz, feijao, carne], "moida carne").map((p) => p.id)).toEqual(["c"]);
    expect(buscarNoEstoque([arroz, feijao, carne], "789123").map((p) => p.id)).toEqual(["a"]);
    expect(buscarNoEstoque([arroz, feijao, carne], "  ")).toEqual([]);
  });
});
