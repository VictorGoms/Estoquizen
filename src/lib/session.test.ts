import { describe, it, expect } from "vitest";
import { atividadeValida, INACTIVITY_MS, INACTIVITY_CURTA_MS } from "./session";

const HORA = 60 * 60 * 1000;
const DIA  = 24 * HORA;
const agora = Date.UTC(2026, 9, 28, 12);

describe("sessão (2026-10-28: deslogava toda hora)", () => {
  it("com 'Manter conectado' (padrão), vale por 30 dias sem uso", () => {
    expect(INACTIVITY_MS).toBe(30 * DIA);
    expect(atividadeValida(agora - 3 * HORA, true, agora)).toBe(true);
    expect(atividadeValida(agora - 29 * DIA, true, agora)).toBe(true);
    expect(atividadeValida(agora - 31 * DIA, true, agora)).toBe(false);
  });

  it("em aparelho compartilhado (desmarcado), continua acabando em 2 h", () => {
    expect(INACTIVITY_CURTA_MS).toBe(2 * HORA);
    expect(atividadeValida(agora - 1 * HORA, false, agora)).toBe(true);
    expect(atividadeValida(agora - 3 * HORA, false, agora)).toBe(false);
  });

  it("sem registro de atividade, não vale", () => {
    expect(atividadeValida(0, true, agora)).toBe(false);
  });
});
