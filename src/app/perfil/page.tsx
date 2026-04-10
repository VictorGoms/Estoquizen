"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import { supabase } from "@/lib/supabase";
import { getWorkspace, clearWorkspace } from "@/hooks/useWorkspace";
import { clearSession } from "@/lib/session";

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wsName, setWsName]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState<Profile | null>(null);
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]     = useState("");

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (ws) setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, phone, avatar_url")
        .eq("id", user.id)
        .single();

      const p: Profile = {
        id:         user.id,
        name:       data?.name       ?? user.email?.split("@")[0] ?? "",
        email:      data?.email      ?? user.email ?? "",
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
      if (upErr) { setImgError(upErr.message); return; }

      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (dbErr) { setImgError(dbErr.message); return; }

      setProfile((p) => p ? { ...p, avatar_url: publicUrl } : p);
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
    if (err) { setError(err.message); return; }
    setProfile((p) => p ? { ...p, name, phone } : p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleLogout() {
    clearSession();
    await supabase.auth.signOut();
    clearWorkspace();
    router.push("/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center"><PageLoader /></div>
  );

  const initials = getInitials(profile?.name ?? "");

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "700px", height: "350px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.09) 0%, transparent 70%)" }}
      />
      <DashboardSidebar workspaceName={wsName} userName={profile?.name ?? ""} />
      <DashboardTopBar  workspaceName={wsName} userName={profile?.name ?? ""} />

      <main className="lg:pl-60 pt-14 pb-28 md:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.back()}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200">
                <ArrowLeftIcon /> Voltar
              </button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imgUploading}
                className="relative group cursor-pointer disabled:cursor-not-allowed"
                title="Alterar foto de perfil"
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    className="w-20 h-20 rounded-2xl object-cover"
                    style={{ boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
                    {imgUploading ? (
                      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : initials}
                  </div>
                )}
                {/* Pencil overlay */}
                {!imgUploading && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-90 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#2563EB", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                    <PencilIcon />
                  </span>
                )}
                {/* Uploading spinner overlay on photo */}
                {imgUploading && profile?.avatar_url && (
                  <span className="absolute inset-0 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(13,19,35,0.6)" }}>
                    <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </span>
                )}
              </button>
              {imgError && <p className="text-xs text-red-400 text-center">{imgError}</p>}
              <div className="text-center">
                <p className="font-display font-bold text-lg text-white">{profile?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{profile?.email}</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSave}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <h3 className="text-sm font-semibold text-white">Informações pessoais</h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200"
                  style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">E-mail</label>
                <input type="email" value={profile?.email ?? ""} disabled
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-500 outline-none"
                  style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.04)" }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Telefone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(opcional)"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                  style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <button type="submit" disabled={saving}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: saved ? "linear-gradient(135deg,#059669,#047857)" : "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
              >
                {saving ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : saved ? <CheckIcon /> : null}
                {saving ? "Salvando…" : saved ? "Salvo!" : "Salvar alterações"}
              </button>
            </form>

            {/* Logout */}
            <button type="button" onClick={handleLogout}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200"
              style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#FCA5A5" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.16)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(220,38,38,0.08)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)"; }}
            >
              <LogOutIcon /> Sair da conta
            </button>

          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
