import { describe, it, expect } from "vitest";
import { SEGMENTOS, UNIDADES, ordenarUnidades, segmentoInfo } from "./segmentos";

/* Mesmos valores do CHECK de workspaces.segment e do schema da API (EQZ-13) */
const NO_BANCO = ["mercearia", "bar", "buffet", "roupas", "pet", "oficina", "outro"];

describe("ramos do negócio (EQZ-13)", () => {
  it("os ids batem com o banco", () => {
    expect(SEGMENTOS.map((s) => s.id).sort()).toEqual([...NO_BANCO].sort());
  });

  it("as listas prontas usam só unidades da lista única, sem nome repetido e com mínimo válido", () => {
    for (const s of SEGMENTOS) {
      const nomes = new Set<string>();
      for (const item of s.modelo) {
        expect(UNIDADES, `${s.id}: ${item.nome}`).toContain(item.unidade);
        expect(nomes.has(item.nome), `${s.id}: ${item.nome} repetido`).toBe(false);
        expect(item.minimo).toBeGreaterThanOrEqual(0);
        nomes.add(item.nome);
      }
    }
  });

  it("os atalhos de unidade do ramo existem na lista única", () => {
    for (const s of SEGMENTOS) for (const u of s.unidades) expect(UNIDADES).toContain(u);
  });

  it("ordenarUnidades põe as do ramo primeiro e não perde nenhuma", () => {
    const r = ordenarUnidades(UNIDADES, "roupas");
    expect(r.slice(0, 3)).toEqual(["peça", "par", "un"]);
    expect([...r].sort()).toEqual([...UNIDADES].sort());
    expect(ordenarUnidades(UNIDADES, null)).toEqual(UNIDADES);
  });

  it("segmentoInfo devolve null para ramo desconhecido", () => {
    expect(segmentoInfo("xyz")).toBeNull();
    expect(segmentoInfo(undefined)).toBeNull();
  });
});
