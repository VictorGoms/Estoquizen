import { textoLlms } from "@/lib/llms";

/* /llms.txt (EQZ-47): gerado no build a partir dos dados da landing (lib/llms.ts) */
export const dynamic = "force-static";

export function GET() {
  return new Response(textoLlms(), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
