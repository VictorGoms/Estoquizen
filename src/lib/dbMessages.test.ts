import { describe, it, expect } from "vitest";
import { dbErrorPt } from "./dbMessages";

describe("mensagens do Storage (EQZ-64: fotos só JPG, PNG ou WebP de até 5 MB)", () => {
  it("foto grande demais explica o limite", () => {
    expect(dbErrorPt({ message: "The object exceeded the maximum allowed size" })).toBe("A foto passa de 5 MB. Escolha uma imagem menor.");
  });

  it("formato recusado diz quais servem", () => {
    expect(dbErrorPt({ message: "mime type image/svg+xml is not supported" })).toBe("Formato de foto não aceito: use JPG, PNG ou WebP.");
  });

  it("erro desconhecido usa a mensagem da tela", () => {
    expect(dbErrorPt({ message: "algo estranho" }, "Não foi possível enviar a foto.")).toBe("Não foi possível enviar a foto.");
  });
});
