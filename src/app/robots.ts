import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { ROTAS_INTERNAS } from "@/lib/rotas";

/*
 * /robots.txt (EQZ-47): buscadores e assistentes de IA podem ler a parte pública. As telas internas
 * (pedem login) e as etapas de cadastro, convite e senha ficam de fora: não têm o que indexar.
 */
const ETAPAS = ["/auth/", "/register-company", "/plan-selection", "/forgot-password", "/reset-password", "/set-password", "/aceitar-convite", "/convite-invalido"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...ROTAS_INTERNAS, ...ETAPAS] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
