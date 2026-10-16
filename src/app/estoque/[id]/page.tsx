"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import { sanitizeText, sanitizeCode } from "@/lib/sanitize";
import { api } from "@/lib/api";

/* ─── Icons ─── */
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);
const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  price: number;
  qty: number;
  min_qty: number;
  location: string | null;
  supplier: string | null;
  image_url:   string | null;
  nota_fiscal: string | null;
  created_at:  string;
}

type MovType = "entrada" | "saida";

const CARD_COLOR = { from: "rgba(37,99,235,0.5)", to: "rgba(29,78,216,0.15)" };

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = typeof params.id === "string" ? params.id : "";

  const wsRole = useRole();
  const canEdit = can(wsRole, "canEditEstoque");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct]   = useState<Product | null>(null);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  /* ── edit mode ── */
  const [editMode, setEditMode]         = useState(false);
  const [editName, setEditName]         = useState("");
  const [editPrice, setEditPrice]       = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editMinQty, setEditMinQty]     = useState("");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);

  /* ── image upload ── */
  const [imgUploading, setImgUploading] = useState(false);

  /* ── delete ── */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]                   = useState(false);
  const [deleteError, setDeleteError]             = useState("");

  /* ── nota fiscal scanner ── */
  const [nfScanning, setNfScanning] = useState(false);

  /* ── movement panel ── */
  const [movType, setMovType]     = useState<MovType>("entrada");
  const [movQty, setMovQty]       = useState("");
  const [movReason, setMovReason] = useState("");
  const [movSaving, setMovSaving] = useState(false);
  const [movSaved, setMovSaved]   = useState(false);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }

      const { data, error: err } = await supabase
        .from("products")
        .select("id, name, code, unit, price, qty, min_qty, location, supplier, image_url, nota_fiscal, created_at")
        .eq("id", id)
        .eq("workspace_id", ws.id)
        .single();

      if (err || !data) {
        setError(err?.message ?? "Produto não encontrado");
        setLoading(false);
        return;
      }

      const p = { ...data, price: Number(data.price) } as Product;
      setProduct(p);
      setEditName(p.name);
      setEditPrice(String(p.price));
      setEditLocation(p.location ?? "");
      setEditMinQty(String(p.min_qty));
      setLoading(false);
    }
    load();
  }, [router, id]);

  async function handleDelete() {
    if (!product) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/products/${product.id}`);
      router.push("/estoque");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao remover produto.");
      setDeleting(false);
    }
  }

  async function handleSaveEdit() {
    if (!product) return;
    setSaving(true);
    const newMinQty = parseInt(editMinQty, 10);
    const { error: err } = await supabase
      .from("products")
      .update({
        name:     sanitizeText(editName, 200),
        price:    parseFloat(editPrice) || product.price,
        location: sanitizeText(editLocation, 200) || null,
        min_qty:  isNaN(newMinQty) ? product.min_qty : newMinQty,
      })
      .eq("id", product.id);

    setSaving(false);
    if (err) { setError(err.message); return; }
    setProduct((p) => p ? {
      ...p,
      name:     editName,
      price:    parseFloat(editPrice) || p.price,
      location: editLocation || null,
      min_qty:  isNaN(newMinQty) ? p.min_qty : newMinQty,
    } : p);
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2500);
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
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Falha ao comprimir imagem")), "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Falha ao ler imagem"));
      img.src = url;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    setImgUploading(true);
    try {
      const compressed = await compressImage(file);
      const path = `${product.id}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });

      if (upErr) {
        setError(
          upErr.message.toLowerCase().includes("not found") || upErr.message.toLowerCase().includes("bucket")
            ? "Bucket 'product-images' não encontrado. Crie-o em Supabase → Storage → New Bucket."
            : upErr.message
        );
        return;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      /* Adiciona timestamp para quebrar cache do browser a cada novo upload */
      const publicUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : "";

      // Persiste no banco — silencia se a coluna ainda não existir
      const { error: updateErr } = await supabase
        .from("products")
        .update({ image_url: publicUrl })
        .eq("id", product.id);

      if (updateErr && !updateErr.message.includes("image_url")) {
        setError(updateErr.message);
        return;
      }

      setProduct((p) => p ? { ...p, image_url: publicUrl } : p);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setImgUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleMovement() {
    if (!product || !movQty) return;
    const qty = parseInt(movQty, 10);
    if (!qty || qty <= 0) return;

    setMovSaving(true);
    const delta = movType === "entrada" ? qty : -qty;

    try {
      const result = await api.post(`/products/${product.id}/adjust`, {
        delta,
        reason: sanitizeText(movReason, 300) || undefined,
      }) as { qty: number };

      setProduct((p) => p ? { ...p, qty: result.qty ?? product.qty + delta } : p);
      setMovQty("");
      setMovReason("");
      setMovSaved(true);
      setTimeout(() => setMovSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar movimentação");
    } finally {
      setMovSaving(false);
    }
  }

  async function handleNfDetect(scannedCode: string) {
    if (!product) return;
    setNfScanning(false);
    const clean = sanitizeCode(scannedCode);
    const { error: err } = await supabase
      .from("products")
      .update({ code: clean })
      .eq("id", product.id);
    if (!err) setProduct((p) => p ? { ...p, code: clean } : p);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <PageError message={error || "Produto não encontrado"} onRetry={() => router.push("/estoque")} />
      </div>
    );
  }

  const status = product.qty === 0 ? "zerado" : product.qty <= product.min_qty ? "baixo" : "normal";
  const STATUS_CFG = {
    normal: { label: "Normal", bg: "rgba(5,150,105,0.15)",  text: "#6EE7B7", dot: "#10B981" },
    baixo:  { label: "Baixo",  bg: "rgba(217,119,6,0.15)",  text: "#FCD34D", dot: "#D97706" },
    zerado: { label: "Zerado", bg: "rgba(220,38,38,0.15)",  text: "#FCA5A5", dot: "#EF4444" },
  };
  const st = STATUS_CFG[status];

  const priceNum   = parseFloat(editPrice) || product.price;
  const totalValue = (product.qty * priceNum).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const unitFmt    = priceNum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const METRICS = [
    { label: "Quantidade atual",       value: `${product.qty} ${product.unit}`, sub: status === "baixo" ? `Mínimo: ${product.min_qty}` : undefined },
    { label: "Preço unitário",         value: unitFmt },
    { label: "Estoque mínimo",         value: `${product.min_qty} ${product.unit}` },
    { label: "Cadastrado em",          value: new Date(product.created_at).toLocaleDateString("pt-BR") },
    { label: "Valor total em estoque", value: totalValue, highlight: true, wide: true },
  ];

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "800px", height: "400px",
          background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 70%)",
        }}
      />

      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/estoque")}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200"
              >
                <ArrowLeftIcon />
                Estoque
              </button>
              <span className="text-slate-700 text-xs">/</span>
              <span className="text-slate-400 text-xs truncate">{product.name}</span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">

              {/* ── LEFT: Image + actions ── */}
              <div className="flex flex-col gap-5">

                {/* Product image */}
                <div
                  className="w-full rounded-2xl overflow-hidden relative flex items-center justify-center group"
                  style={{
                    height: "300px",
                    background: product.image_url
                      ? "rgba(15,23,42,0.6)"
                      : `radial-gradient(ellipse at 50% 60%, ${CARD_COLOR.from} 0%, ${CARD_COLOR.to} 60%, rgba(15,23,42,0.3) 100%)`,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {product.image_url ? (
                    /* Real image */
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Placeholder */
                    <>
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                        }}
                      />
                      <div
                        className="relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center text-white"
                        style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}
                      >
                        <BoxIcon />
                      </div>
                    </>
                  )}

                  {/* Status badge */}
                  <span
                    className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: st.bg, color: st.text, backdropFilter: "blur(8px)" }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                    {st.label}
                  </span>

                  {/* Upload overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imgUploading}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {imgUploading ? <SpinnerIcon /> : <CameraIcon />}
                    {imgUploading ? "Enviando…" : product.image_url ? "Trocar imagem" : "Adicionar imagem"}
                  </button>
                </div>

                {/* Upload button visible on mobile (no hover) */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imgUploading}
                  className="sm:hidden flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50"
                  style={{
                    background: "rgba(30,41,59,0.8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748B",
                  }}
                >
                  {imgUploading ? <SpinnerIcon /> : <CameraIcon />}
                  {imgUploading ? "Enviando…" : product.image_url ? "Trocar imagem" : "Adicionar imagem"}
                </button>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMovType("entrada")}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: movType === "entrada" ? "rgba(5,150,105,0.2)" : "rgba(5,150,105,0.12)",
                      border: movType === "entrada" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <span style={{ color: "#6EE7B7" }}><PlusIcon /></span>
                    <span className="text-[11px] font-medium" style={{ color: "#6EE7B7" }}>Entrada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovType("saida")}
                    className="flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: movType === "saida" ? "rgba(220,38,38,0.18)" : "rgba(220,38,38,0.10)",
                      border: movType === "saida" ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <span style={{ color: "#FCA5A5" }}><MinusIcon /></span>
                    <span className="text-[11px] font-medium" style={{ color: "#FCA5A5" }}>Saída</span>
                  </button>
                </div>

                {/* Movement form */}
                <div
                  className="rounded-2xl p-4 flex flex-col gap-3"
                  style={{
                    background: "rgba(22,32,52,0.8)",
                    border: movType === "entrada"
                      ? "1px solid rgba(16,185,129,0.2)"
                      : "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: movType === "entrada" ? "#6EE7B7" : "#FCA5A5" }}>
                    Registrar {movType === "entrada" ? "entrada" : "saída"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={movQty}
                        onChange={(e) => setMovQty(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-700 outline-none"
                        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">Motivo (opcional)</label>
                      <input
                        type="text"
                        value={movReason}
                        onChange={(e) => setMovReason(e.target.value)}
                        placeholder="Ex: NF-e 001"
                        className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-700 outline-none"
                        style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                        onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!movQty || movSaving || (movType === "saida" && product.qty === 0)}
                    onClick={handleMovement}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: movSaved
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : movType === "entrada"
                        ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                        : "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                    }}
                  >
                    {movSaving ? <SpinnerIcon /> : movSaved ? <CheckIcon /> : null}
                    {movSaving ? "Salvando…" : movSaved ? "Registrado!" : "Confirmar"}
                  </button>
                </div>

                {/* Edit button — só visível para owner/admin */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => editMode ? handleSaveEdit() : setEditMode(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-200"
                    style={{
                      background: editMode ? "rgba(37,99,235,0.18)" : "rgba(30,41,59,0.8)",
                      border: editMode ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                      color: editMode ? "#93C5FD" : "#64748B",
                    }}
                  >
                    {saving ? <SpinnerIcon /> : (saved || editMode) ? <CheckIcon /> : <PencilIcon />}
                    {saving ? "Salvando…" : saved ? "Salvo!" : editMode ? "Salvar edições" : "Editar produto"}
                  </button>
                )}

                {/* Delete button */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-rose-500/10"
                    style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}
                  >
                    <TrashIcon /> Remover produto
                  </button>
                )}

                {/* Confirm delete modal */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    <div
                      className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
                      style={{ background: "rgba(15,23,42,0.98)", border: "1px solid rgba(239,68,68,0.2)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <h3 className="font-display font-bold text-white text-base">Remover produto?</h3>
                        <p className="text-slate-400 text-sm mt-1">
                          <span className="text-white font-medium">{product?.name}</span> será removido permanentemente. Esta ação não pode ser desfeita.
                        </p>
                        {deleteError && (
                          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-3">
                            {deleteError}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
                          style={{ background: "rgba(30,41,59,0.8)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)" }}
                        >
                          {deleting ? <SpinnerIcon /> : <TrashIcon />}
                          {deleting ? "Removendo…" : "Sim, remover"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: Info + metrics ── */}
              <div className="flex flex-col gap-5">

                {/* Product identity */}
                <div
                  className="rounded-2xl p-5 flex flex-col gap-4"
                  style={{
                    background: "rgba(22,32,52,0.8)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {editMode ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">Nome do produto</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">Preço unitário (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">Estoque mínimo</label>
                          <input
                            type="number"
                            min="0"
                            value={editMinQty}
                            onChange={(e) => setEditMinQty(e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide block mb-1">Localização</label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          placeholder="Ex: Prateleira A3"
                          className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer transition-colors duration-200 text-center"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="font-display font-bold text-xl text-white leading-tight">{product.name}</h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="font-mono text-xs text-slate-600">{product.code}</span>
                        </div>
                      </div>
                      <div
                        className="flex items-center justify-between pt-4"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div>
                          <p className="text-[11px] text-slate-600 uppercase tracking-wide font-medium">Fornecedor</p>
                          <p className="text-sm text-slate-300 mt-0.5">{product.supplier ?? "—"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-600 uppercase tracking-wide font-medium">Localização</p>
                          <p className="text-sm text-slate-300 mt-0.5">{product.location ?? "—"}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-3">
                  {METRICS.map((m) => (
                    <div
                      key={m.label}
                      className={`rounded-2xl p-4 flex flex-col gap-1 ${m.wide ? "col-span-2" : ""}`}
                      style={{
                        background: m.highlight ? "rgba(37,99,235,0.12)" : "rgba(22,32,52,0.8)",
                        border: m.highlight ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{m.label}</p>
                      <p
                        className="font-display font-bold text-lg leading-tight"
                        style={{ color: m.highlight ? "#93C5FD" : "#F1F5F9" }}
                      >
                        {m.value}
                      </p>
                      {m.sub && <p className="text-[10px]" style={{ color: "#FCD34D" }}>{m.sub}</p>}
                    </div>
                  ))}
                </div>

                {/* Nota fiscal */}
                <div
                  className="rounded-2xl p-4 flex flex-col gap-2"
                  style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Nota Fiscal</p>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setNfScanning(true)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-all duration-200"
                        style={{ background: "rgba(37,99,235,0.15)", color: "#93C5FD", border: "1px solid rgba(59,130,246,0.2)" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 8H3m18-8h-2M7 20H4m17-8h2M7 4H4m17 0h-2M7 20v-4m10-8v3m0 0h.01m-9.01 0h-.01M12 8V4m0 16v-4" />
                        </svg>
                        Escanear NF
                      </button>
                    )}
                  </div>
                  {product.nota_fiscal ? (
                    <p className="font-mono text-sm text-slate-300 break-all">{product.nota_fiscal}</p>
                  ) : (
                    <p className="text-sm text-slate-600 italic">Nenhuma nota fiscal vinculada</p>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Scanner overlay para nota fiscal */}
      {nfScanning && (
        <BarcodeScanner
          title="Escanear Nota Fiscal"
          subtitle="Aponte para o código de barras da NF-e"
          onDetect={handleNfDetect}
          onClose={() => setNfScanning(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
