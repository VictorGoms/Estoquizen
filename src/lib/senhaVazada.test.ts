import { describe, it, expect } from "vitest";
import { sha1Hex, apareceNaLista } from "./senhaVazada";

describe("senha vazada por k-anonimato (EQZ-65)", () => {
  it("SHA-1 igual ao que a API do HaveIBeenPwned usa", async () => {
    expect(await sha1Hex("password")).toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });

  it("acha o sufixo na resposta e ignora o padding (quantidade 0)", () => {
    const resposta = "1E4C9B93F3F0682250B6CF8331B7EE68FD8:9659365\r\n0018A45C4D1DEF81644B54AB7F969B88D65:0\r\n";
    expect(apareceNaLista(resposta, "1e4c9b93f3f0682250b6cf8331b7ee68fd8")).toBe(true);
    expect(apareceNaLista(resposta, "0018A45C4D1DEF81644B54AB7F969B88D65")).toBe(false);
    expect(apareceNaLista(resposta, "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toBe(false);
  });
});
