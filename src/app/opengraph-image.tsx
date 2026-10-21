import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * Imagem de compartilhamento (EQZ-47): o card que aparece quando alguém manda o link no WhatsApp ou
 * nas redes. Gerada no build, no tema "Noite Azul", e vale para todas as páginas.
 */
export const alt = "Estoquizen: controle seu estoque de forma simples e inteligente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COR = { ink: "#0b1220", surface: "#151f33", fg: "#f4f7fc", muted: "#a9b5c9", accent: "#60a5fa", ok: "#34d399" };

const TITULO_1  = "Controle seu estoque";
const TITULO_2  = "de forma simples";
const LINHA     = "Código de barras pela câmera · nota de compra · alerta de mínimo";
const SELO      = "14 dias grátis, sem cartão";
const ENDERECO  = "estoquizen.com.br";

/* Nunito do Google Fonts, só com as letras usadas. Sem internet no build, cai na fonte padrão */
async function nunito(peso: number, texto: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Nunito:wght@${peso}&text=${encodeURIComponent(texto)}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const icone = await readFile(join(process.cwd(), "src/app/icon.svg"));
  const logo  = `data:image/svg+xml;base64,${icone.toString("base64")}`;

  const [black, bold] = await Promise.all([
    nunito(900, `Estoquizen${TITULO_1}${TITULO_2}`),
    nunito(700, `${LINHA}${SELO}${ENDERECO}`),
  ]);
  const fonts = [
    ...(black ? [{ name: "Nunito", data: black, weight: 900 as const, style: "normal" as const }] : []),
    ...(bold  ? [{ name: "Nunito", data: bold,  weight: 700 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: COR.ink, color: COR.fg, fontFamily: "Nunito" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem dentro do ImageResponse */}
          <img src={logo} width={84} height={84} alt="" />
          <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1 }}>Estoquizen</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 900, lineHeight: 1.02, letterSpacing: -3 }}>
            <span>{TITULO_1}</span>
            <span style={{ color: COR.accent }}>{TITULO_2}</span>
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, color: COR.muted }}>{LINHA}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: COR.accent, color: COR.ink, borderRadius: 999, padding: "16px 30px", fontSize: 30, fontWeight: 700 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: COR.ink }} />
            {SELO}
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, color: COR.muted }}>{ENDERECO}</span>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
