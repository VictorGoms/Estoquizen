import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { rotaAberta, ROTAS_PUBLICAS, ROTAS_INTERNAS, ROTAS_SEM_TELA } from "./rotas";

describe("rotas (EQZ-47)", () => {
  it("toda pasta de src/app está classificada como pública, interna ou sem tela", () => {
    const app = path.resolve(__dirname, "../app");
    const pastas = fs.readdirSync(app, { withFileTypes: true })
      /* "_pasta" e "(grupo)" não viram endereço; ".pasta" é de ferramenta (ex.: .omc), fora do git */
      .filter((d) => d.isDirectory() && !/^[_(.]/.test(d.name))
      .map((d) => "/" + d.name);
    const conhecidas = new Set([...ROTAS_PUBLICAS, ...ROTAS_INTERNAS, ...ROTAS_SEM_TELA]);
    expect(pastas.filter((p) => !conhecidas.has(p))).toEqual([]);
  });

  it("nenhuma rota está nas duas listas", () => {
    expect(ROTAS_PUBLICAS.filter((r) => ROTAS_INTERNAS.includes(r))).toEqual([]);
  });

  it("telas internas pedem login, inclusive as subpáginas", () => {
    for (const p of ["/dashboard", "/dashboard-metricas", "/estoque/123", "/membros/novo", "/select-workspace", "/perfil"]) {
      expect(rotaAberta(p), p).toBe(false);
    }
  });

  it("públicas e links quebrados ficam abertos (a 404 aparece sem mandar para o login)", () => {
    for (const p of ["/", "/termos", "/auth/callback", "/register", "/pagina-que-nao-existe", "/precos"]) {
      expect(rotaAberta(p), p).toBe(true);
    }
  });

  it("prefixo parecido não engana: /dashboardx não é o /dashboard", () => {
    expect(rotaAberta("/dashboardx")).toBe(true);
    expect(rotaAberta("/estoques")).toBe(true);
  });
});
