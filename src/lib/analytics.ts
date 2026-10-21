import type { CaptureResult, PostHog } from "posthog-js";

/*
 * Analytics de produto (EQZ-01, PostHog na região US). Opção A do João (2026-10-21): nada é carregado
 * nem gravado no navegador antes de a pessoa clicar em "Aceitar" no aviso de cookies; "Só o necessário"
 * desliga e apaga o que o PostHog tinha guardado. Sem NEXT_PUBLIC_POSTHOG_KEY (dev local), nada acontece
 * e o aviso nem aparece.
 *
 * Privacidade: sem gravação de sessão, sem o texto da tela nos cliques (mask_all_text), endereços sem
 * #hash e sem parâmetros fora da lista (os links de login trazem tokens), e só o id da pessoa, sem
 * nome nem e-mail. Os eventos do funil saem de lib/eventos.ts.
 */
export const CHAVE_POSTHOG = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
export const analyticsDisponivel = CHAVE_POSTHOG.startsWith("phc_");

const CHAVE_CONSENTIMENTO = "estoquizen_cookies";
/** Avisa a tela quando a escolha muda ou alguém pede para rever (rodapé, Perfil, Privacidade) */
export const EVENTO_COOKIES = "estoquizen:cookies";
export const EVENTO_PREFERENCIAS = "estoquizen:preferencias-cookies";

export type Consentimento = "aceito" | "recusado";

export function lerConsentimento(): Consentimento | null {
  try {
    const v = localStorage.getItem(CHAVE_CONSENTIMENTO);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

/* Parâmetros que podem ir para o PostHog; o resto (code, token, e-mail…) sai */
const PARAMS_LIVRES = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "checkout", "link"]);

/** Tira o #hash e os parâmetros fora da lista de um endereço. O que não é URL passa como está */
export function limparUrl(valor: string): string {
  if (!/^https?:\/\//i.test(valor)) return valor;
  try {
    const u = new URL(valor);
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) if (!PARAMS_LIVRES.has(k)) u.searchParams.delete(k);
    return u.toString();
  } catch {
    return valor;
  }
}

/** before_send: limpa toda propriedade de endereço (URL, referrer, href) do evento e da pessoa */
export function limparEvento(evento: CaptureResult | null): CaptureResult | null {
  if (!evento) return evento;
  for (const grupo of [evento.properties, evento.$set, evento.$set_once]) {
    if (!grupo) continue;
    for (const [k, v] of Object.entries(grupo)) {
      if (typeof v === "string" && /url|referrer|href/i.test(k)) grupo[k] = limparUrl(v);
    }
  }
  return evento;
}

let posthog: PostHog | null = null;
let carregando: Promise<PostHog | null> | null = null;

/* Carrega o pacote só depois do aceite (fica fora do bundle de quem não aceita) */
function carregar(): Promise<PostHog | null> {
  if (!analyticsDisponivel || typeof window === "undefined") return Promise.resolve(null);
  carregando ??= import("posthog-js")
    .then(({ default: ph }) => {
      ph.init(CHAVE_POSTHOG, {
        api_host: "/ingest",                       // proxy no next.config (bloqueadores de anúncio)
        ui_host: "https://us.posthog.com",
        defaults: "2026-08-30",                    // pageview nas trocas de tela do Next
        person_profiles: "identified_only",
        disable_session_recording: true,
        mask_all_text: true,
        disable_capture_url_hashes: true,
        before_send: limparEvento,
      });
      /* Quem recusou e depois aceitou: o PostHog guardou a recusa */
      if (ph.has_opted_out_capturing()) ph.opt_in_capturing();
      posthog = ph;
      return ph;
    })
    .catch(() => null);
  return carregando;
}

function comAnalytics(fn: (ph: PostHog) => void) {
  if (!analyticsDisponivel || lerConsentimento() !== "aceito") return;
  if (posthog) fn(posthog);
  else void carregar().then((ph) => ph && fn(ph));
}

/** Na abertura do app: carrega só se a pessoa já tinha aceitado */
export function iniciarAnalytics() {
  if (lerConsentimento() === "aceito") void carregar();
}

/** Escolha no aviso de cookies */
export function decidirCookies(escolha: Consentimento) {
  try { localStorage.setItem(CHAVE_CONSENTIMENTO, escolha); } catch { /* navegador sem armazenamento */ }
  if (escolha === "aceito") {
    if (posthog) {
      posthog.set_config({ disable_persistence: false });
      posthog.opt_in_capturing();
    } else void carregar();
  } else if (posthog) {
    /* Revogou o aceite: para de contar e apaga os cookies e dados que o PostHog gravou */
    posthog.opt_out_capturing();
    posthog.set_config({ disable_persistence: true });
  }
  window.dispatchEvent(new Event(EVENTO_COOKIES));
}

/** Reabre o aviso para mudar a escolha */
export function abrirPreferenciasCookies() {
  window.dispatchEvent(new Event(EVENTO_PREFERENCIAS));
}

/** Liga os eventos à pessoa pelo id do Supabase (sem nome nem e-mail) */
export function identificar(userId: string) {
  comAnalytics((ph) => { if (ph.get_distinct_id() !== userId) ph.identify(userId); });
}

export function registrar(evento: string, props?: Record<string, unknown>) {
  comAnalytics((ph) => ph.capture(evento, props));
}

/** Ao sair da conta: o próximo login no mesmo navegador não herda a pessoa anterior */
export function esquecerPessoa() {
  posthog?.reset();
}
