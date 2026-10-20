import { supabase } from "@/lib/supabase";

/**
 * Caminho novo a cada envio de foto. O CDN do Supabase ignora "?t=" na URL, então regravar no
 * mesmo caminho fazia o menu e as listas mostrarem a foto antiga até o cache expirar.
 */
export function caminhoNovo(pasta: string, nome: string, ext: string) {
  return `${pasta}/${nome}-${Date.now()}.${ext}`;
}

/**
 * Apaga a foto anterior, se ela for deste bucket. Falha em silêncio: a foto nova já está salva
 * (e o bucket profile-images ainda não tem regra de DELETE, aí o arquivo antigo só fica lá).
 */
export async function apagarFotoAntiga(bucket: string, urlAntiga: string | null | undefined, caminhoAtual: string) {
  if (!urlAntiga) return;
  const marca = `/storage/v1/object/public/${bucket}/`;
  const i = urlAntiga.indexOf(marca);
  if (i < 0) return; /* foto de fora (ex.: embalagem do Open Food Facts) */
  const caminho = decodeURIComponent(urlAntiga.slice(i + marca.length).split("?")[0]);
  if (!caminho || caminho === caminhoAtual) return;
  try {
    await supabase.storage.from(bucket).remove([caminho]);
  } catch { /* ignora */ }
}
