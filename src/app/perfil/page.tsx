"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import { supabase } from "@/lib/supabase";
import { dbErrorPt } from "@/lib/dbMessages";
import { useUser } from "@/lib/userContext";
import Link from "next/link";
import { getWorkspace, clearWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { clearSession } from "@/lib/session";
import { SlidersIcon, ArrowRightIcon, CheckIcon, Spinner } from "@/components/ui/icons";
import FormField, { inputClass } from "@/components/ui/FormField";
import { sanitizeEmail } from "@/lib/sanitize";

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

interface Profile { id: string; name: string; email: string; phone: string; avatar_url: string | null }

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function compressImage(file: File, maxPx = 800, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("Falha ao comprimir imagem")),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Falha ao ler imagem"));
    img.src = url;
  });
}

export default function PerfilPage() {
  const router = useRouter();
  const role = useRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wsName, setWsName]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState<Profile | null>(null);
  /* Menu lateral e barra do topo leem o perfil do contexto (com cache na sessão) */
  const { setProfile: setUserProfile } = useUser();
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]     = useState("");

  /* Troca do e-mail de acesso: o Supabase manda o link de confirmação e só troca depois dele */
  const [provedores, setProvedores]       = useState<string[]>([]);
  const [novoEmail, setNovoEmail]         = useState("");
  const [emailEnviando, setEmailEnviando] = useState(false);
  const [emailMsg, setEmailMsg]           = useState("");
  const [emailErro, setEmailErro]         = useState("");

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (ws) setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setProvedores((user.app_metadata?.providers as string[] | undefined) ?? []);

      /* Volta do link de confirmação da troca de e-mail. Com a troca segura do Supabase, o
         primeiro link (de um dos dois e-mails) volta com uma mensagem e falta o outro */
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (hash.get("message")) {
        setEmailMsg("Link confirmado. Falta abrir o link que foi para o outro e-mail; depois disso o e-mail de acesso muda.");
      } else if (new URLSearchParams(window.location.search).get("email") === "confirmado") {
        setEmailMsg(`E-mail de acesso trocado para ${user.email}.`);
        setUserProfile({ userEmail: user.email ?? "" });
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, phone, avatar_url")
        .eq("id", user.id)
        .single();

      const p: Profile = {
        id:         user.id,
        name:       data?.name       ?? user.email?.split("@")[0] ?? "",
        email:      user.email       ?? data?.email ?? "",
        phone:      data?.phone      ?? "",
        avatar_url: data?.avatar_url ?? null,
      };
      setProfile(p);
      setName(p.name);
      setPhone(p.phone);
      setLoading(false);
    }
    load();
  }, [router]);

  async function trocarEmail(e: React.FormEvent) {
    e.preventDefault();
    const email = sanitizeEmail(novoEmail);
    setEmailErro("");
    setEmailMsg("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailErro("Digite um e-mail válido."); return; }
    if (email === profile?.email?.toLowerCase()) { setEmailErro("Esse já é o seu e-mail de acesso."); return; }

    setEmailEnviando(true);
    const { error: err } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/perfil?email=confirmado` },
    );
    setEmailEnviando(false);
    if (err) {
      const code = (err as { code?: string }).code;
      setEmailErro(
        code === "email_exists" ? "Este e-mail já é usado por outra conta."
        : code === "over_email_send_rate_limit" ? "Aguarde um minuto e tente de novo."
        : code === "email_address_invalid" ? "Digite um e-mail válido."
        : "Não foi possível trocar o e-mail agora. Tente de novo.",
      );
      return;
    }
    setNovoEmail("");
    setEmailMsg(`Enviamos o link de confirmação para ${email}. Abra o link (e o que chegar no e-mail atual, se chegar) para concluir.`);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setImgError("");
    setImgUploading(true);
    try {
      const blob = await compressImage(file);
      const ext  = "jpg";
      const path = `${profile.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-images")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) { setImgError(dbErrorPt(upErr, "Não foi possível enviar a imagem.")); return; }

      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (dbErr) { setImgError(dbErrorPt(dbErr, "Não foi possível salvar a imagem.")); return; }

      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
      setUserProfile({ avatarUrl: publicUrl });
    } catch (err: unknown) {
      setImgError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setImgUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("profiles")
      .update({ name, phone: phone || null })
      .eq("id", profile.id);
    setSaving(false);
    if (err) { setError(dbErrorPt(err)); return; }
    setProfile((p) => p ? { ...p, name, phone } : p);
    setUserProfile({ userName: name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogout() {
    clearSession();
    await supabase.auth.signOut({ scope: "local" });
    clearWorkspace();
    router.push("/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-ink flex items-center justify-center"><PageLoader /></div>
  );

  const initials = getInitials(profile?.name ?? "");

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={profile?.name ?? ""} />
      <DashboardTopBar  workspaceName={wsName} userName={profile?.name ?? ""} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5">

          <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Perfil</h1>

          {/* Cartão do usuário */}
          <section className="bg-accent text-ink rounded-5xl p-5 lg:p-6 flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imgUploading}
              aria-label="Alterar foto de perfil"
              className="relative w-20 h-20 rounded-full shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="w-full h-full rounded-full overflow-hidden bg-ink text-fg flex items-center justify-center text-2xl font-black">
                {profile?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  : initials}
              </span>
              <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-ink text-fg border-[3px] border-accent flex items-center justify-center">
                {imgUploading ? <Spinner className="w-3.5 h-3.5" /> : <PencilIcon />}
              </span>
            </button>
            <div className="min-w-0 flex flex-col gap-0.5">
              <p className="text-xl font-black truncate">{profile?.name}</p>
              <p className="text-sm font-bold text-ink/75 truncate">{profile?.email}</p>
              {wsName && <p className="text-[13px] font-extrabold text-ink/70 truncate">{wsName}</p>}
            </div>
          </section>
          {imgError && <p role="alert" className="text-sm font-bold text-zero">{imgError}</p>}

          {/* Formulário */}
          <form onSubmit={handleSave} className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
            <h2 className="text-lg font-black">Informações pessoais</h2>

            <FormField label="Nome" htmlFor="perfil-nome">
              <input id="perfil-nome" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="E-mail" htmlFor="perfil-email" hint={<p className="text-[13px] font-bold text-fg-subtle">É o seu login. Para trocar, use &quot;E-mail de acesso&quot;, logo abaixo.</p>}>
              <input id="perfil-email" type="email" value={profile?.email ?? ""} disabled className={inputClass} />
            </FormField>
            <FormField label="Telefone" htmlFor="perfil-telefone">
              <input id="perfil-telefone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(opcional)" className={inputClass} />
            </FormField>

            {error && <p role="alert" className="text-sm font-bold text-zero">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="min-h-[52px] flex items-center justify-center gap-2 rounded-full bg-accent text-ink text-[15px] font-black cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50"
            >
              {saving ? <Spinner className="w-[18px] h-[18px]" /> : saved ? <CheckIcon /> : null}
              {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
            </button>
          </form>

          {/* ── E-mail de acesso ── */}
          <section aria-labelledby="perfil-acesso" className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="perfil-acesso" className="text-lg font-black">E-mail de acesso</h2>
              <p className="text-sm font-bold text-fg-muted">Hoje: <span className="text-fg">{profile?.email}</span></p>
            </div>
            {provedores.length > 0 && !provedores.includes("email") ? (
              <p className="px-5 py-3.5 rounded-4xl bg-surface-2 text-sm font-bold text-fg-muted">
                Sua conta entra pelo Google: o e-mail de acesso é o da sua conta Google.
              </p>
            ) : (
              <form onSubmit={trocarEmail} className="flex flex-col gap-3" noValidate>
                <FormField label="Novo e-mail" htmlFor="perfil-novo-email">
                  <input
                    id="perfil-novo-email"
                    type="email"
                    autoComplete="email"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    placeholder="nome@empresa.com.br"
                    className={inputClass}
                  />
                </FormField>
                <p className="text-[13px] font-bold text-fg-subtle">
                  Enviamos um link de confirmação. Por segurança, também pode chegar um link no e-mail atual: confirme nos dois.
                  Até lá, você continua entrando com o e-mail de hoje.
                </p>
                {emailErro && <p role="alert" className="text-sm font-bold text-zero">{emailErro}</p>}
                <button
                  type="submit"
                  disabled={emailEnviando}
                  className="min-h-[52px] flex items-center justify-center gap-2 rounded-full bg-surface-2 text-[15px] font-black cursor-pointer hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {emailEnviando && <Spinner className="w-[18px] h-[18px]" />}
                  {emailEnviando ? "Enviando…" : "Trocar e-mail"}
                </button>
              </form>
            )}
            {emailMsg && <p role="status" className="px-5 py-3.5 rounded-4xl bg-ok/10 text-sm font-bold text-ok">{emailMsg}</p>}
          </section>

          {/* Configurações do workspace — no celular o atalho fica aqui (saiu do menu inferior) */}
          {can(role, "canAccessConfiguracoes") && (
            <Link
              href="/configuracoes"
              className="lg:hidden flex items-center gap-3 min-h-[64px] px-4 rounded-4xl bg-surface text-fg hover:bg-surface-2 transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                <SlidersIcon />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-extrabold">Configurações do workspace</span>
                <span className="block text-[13px] font-bold text-fg-muted truncate">Plano, assinatura e dados de {wsName || "sua empresa"}</span>
              </span>
              <ArrowRightIcon className="w-[18px] h-[18px] text-fg-subtle" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[52px] flex items-center justify-center gap-2 rounded-full bg-zero/10 text-zero text-[15px] font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
          >
            <LogOutIcon /> Sair da conta
          </button>

        </div>
      </main>
      <BottomNav />
    </div>
  );
}
