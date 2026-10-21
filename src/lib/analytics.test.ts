import { describe, it, expect } from "vitest";
import type { CaptureResult } from "posthog-js";
import { limparUrl, limparEvento } from "./analytics";
import { eventoDaChamada } from "./eventos";

describe("limpeza de endereços antes de enviar ao PostHog", () => {
  it("tira o #hash (os links de login trazem o token ali)", () => {
    expect(limparUrl("https://www.estoquizen.com.br/set-password#access_token=abc&type=invite"))
      .toBe("https://www.estoquizen.com.br/set-password");
  });
  it("tira parâmetros fora da lista e mantém utm e checkout", () => {
    expect(limparUrl("https://www.estoquizen.com.br/auth/callback?code=xyz")).toBe("https://www.estoquizen.com.br/auth/callback");
    expect(limparUrl("https://www.estoquizen.com.br/?utm_source=zap&email=a@b.com&checkout=success"))
      .toBe("https://www.estoquizen.com.br/?utm_source=zap&checkout=success");
  });
  it("o que não é URL passa como está", () => {
    expect(limparUrl("$direct")).toBe("$direct");
    expect(limparUrl("/estoque")).toBe("/estoque");
  });
  it("limpa as propriedades de endereço do evento e da pessoa", () => {
    const ev = {
      uuid: "1", event: "$pageview",
      properties: { $current_url: "https://x.com/a?token=1#t", $referrer: "https://google.com/search?q=estoque", outra: "https://x.com/?token=1" },
      $set_once: { $initial_current_url: "https://x.com/b?code=9" },
    } as unknown as CaptureResult;
    const r = limparEvento(ev)!;
    expect(r.properties.$current_url).toBe("https://x.com/a");
    expect(r.properties.$referrer).toBe("https://google.com/search");
    expect(r.properties.outra).toBe("https://x.com/?token=1");   // só chaves de endereço
    expect(r.$set_once!.$initial_current_url).toBe("https://x.com/b");
  });
});

describe("eventos do funil (EQZ-01)", () => {
  it("empresa criada leva plano, ramo e teste, sem nome nem CPF", () => {
    const e = eventoDaChamada("POST", "/workspaces", { name: "Bar do Zé", plan: "growth", cpf: "123", segment: "bar" }, { id: "w", trial: true });
    expect(e).toEqual({ nome: "empresa_criada", props: { plano: "growth", ramo: "bar", teste_gratis: true } });
    expect(JSON.stringify(e)).not.toMatch(/Bar do Zé|123/);
  });
  it("movimentação diz se foi entrada ou saída", () => {
    expect(eventoDaChamada("POST", "/products/abc/adjust", { delta: 5 }, null)?.props.tipo).toBe("entrada");
    expect(eventoDaChamada("POST", "/products/abc/adjust", { delta: -2, motivo: "perda", reason: "quebrou" }, null))
      .toEqual({ nome: "movimentacao_registrada", props: { tipo: "saida", motivo: "perda" } });
  });
  it("importação conta só as quantidades", () => {
    expect(eventoDaChamada("POST", "/products/import", { itens: [{ name: "Arroz" }] }, { criados: 12, ignorados: 1 }))
      .toEqual({ nome: "produtos_importados", props: { quantidade: 12, ignorados: 1 } });
  });
  it("motivo de cancelamento sem o texto livre", () => {
    const e = eventoDaChamada("POST", "/billing/cancel-feedback", { motivo: "caro", acao: "pausar", detalhe: "achei caro" }, null);
    expect(e?.props).toEqual({ motivo: "caro", acao: "pausar" });
  });
  it("convite leva só o papel", () => {
    expect(eventoDaChamada("POST", "/members/invite", { email: "a@b.com", name: "Ana", role: "member" }, null)?.props).toEqual({ papel: "member" });
  });
  it("ignora leituras, edições e rotas sem evento", () => {
    expect(eventoDaChamada("GET", "/workspaces", null, null)).toBeNull();
    expect(eventoDaChamada("PATCH", "/products/abc", { name: "x" }, null)).toBeNull();
    expect(eventoDaChamada("POST", "/billing/portal", {}, null)).toBeNull();
  });
  it("query string não atrapalha", () => {
    expect(eventoDaChamada("POST", "/shopping-list?workspace_id=1", {}, null)?.nome).toBe("item_na_lista_de_compras");
  });
});
