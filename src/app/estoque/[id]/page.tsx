"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import PageLoader from "@/components/ui/PageLoader";
import PageError from "@/components/ui/PageError";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import FormField, { inputClass } from "@/components/ui/FormField";
import StatusChip from "@/components/estoque/StatusChip";
import MovementForm from "@/components/estoque/MovementForm";
import { supabase } from "@/lib/supabase";
import { dbErrorPt } from "@/lib/dbMessages";
import { getWorkspace } from "@/hooks/useWorkspace";
import { useRole, can } from "@/hooks/useRole";
import { mutateProducts } from "@/hooks/useProducts";
import { mutateStats } from "@/hooks/useStats";
import { mutateMovements, mutateProductMovements, useProductMovements } from "@/hooks/useMovements";
import { sanitizeText, sanitizeCode } from "@/lib/sanitize";
import { api } from "@/lib/api";
import { deriveStatus, formatBRL, formatQty, stockLevel, timeAgo, parseQtyInput, parsePriceInput } from "@/lib/stock";
import {
  ArrowLeftIcon, BoxIcon, CameraIcon, PencilIcon, TrashIcon, ScanIcon, InIcon, OutIcon, CheckIcon, Spinner,
} from "@/components/ui/icons";

interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  price: number;
  qty: number;
  min_qty: number;
  max_qty: number | null;
  location: string | null;
  category: string | null;
  supplier: string | null;
  image_url:   string | null;
  nota_fiscal: string | null;
  created_at:  string;
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = typeof params.id === "string" ? params.id : "";

  const wsRole  = useRole();
  const canEdit = can(wsRole, "canEditEstoque");

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const cancelDelRef  = useRef<HTMLButtonElement>(null);

  const [product, setProduct]   = useState<Product | null>(null);
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError]     = useState("");
  const [actionError, setActionError] = useState("");
  const [now, setNow]           = useState(0);

  /* ── edit mode ── */
  const [editMode, setEditMode]         = useState(false);
  const [editName, setEditName]         = useState("");
  const [editPrice, setEditPrice]       = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState("");
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

  /* ── movimentação ── */
  const [movMsg, setMovMsg] = useState("");
  const { movements: history, loading: historyLoading } = useProductMovements(product?.id);

  useEffect(() => {
    setNow(Date.now());
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
        .select("id, name, code, unit, price, qty, min_qty, max_qty, location, category, supplier, image_url, nota_fiscal, created_at")
        .eq("id", id)
        .eq("workspace_id", ws.id)
        .single();

      if (err || !data) {
        setLoadError(err && err.code !== "PGRST116" ? dbErrorPt(err, "Não foi possível carregar o produto.") : "Produto não encontrado");
        setLoading(false);
        return;
      }

      const p = { ...data, price: Number(data.price), qty: Number(data.qty), min_qty: Number(data.min_qty ?? 0) } as Product;
      setProduct(p);
      resetEditFields(p);
      setLoading(false);
    }
    load();
  }, [router, id]);

  /* Modal de exclusão: foco no Cancelar e Esc fecha */
  useEffect(() => {
    if (!showDeleteConfirm) return;
    cancelDelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowDeleteConfirm(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showDeleteConfirm]);

  function resetEditFields(p: Product) {
    setEditName(p.name);
    setEditPrice(Number(p.price).toFixed(2).replace(".", ","));
    setEditLocation(p.location ?? "");
    setEditCategory(p.category ?? "");
    setEditMinQty(String(Number(p.min_qty)).replace(".", ","));
  }

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
    setActionError("");
    /* Aceita decimais com vírgula (antes parseInt truncava 1,5 para 1) */
    const newMinQty = editMinQty.trim() ? parseQtyInput(editMinQty) : product.min_qty;
    const newPrice  = editPrice.trim()  ? parsePriceInput(editPrice) : product.price;
    if (Number.isNaN(newMinQty) || Number.isNaN(newPrice)) {
      setSaving(false);
      setActionError("Valor inválido. Use números, com vírgula para decimais (ex.: 2,5).");
      return;
    }
    const { error: err } = await supabase
      .from("products")
      .update({
        name:     sanitizeText(editName, 200),
        price:    newPrice,
        location: sanitizeText(editLocation, 200) || null,
        category: sanitizeText(editCategory, 60),
        min_qty:  newMinQty,
      })
      .eq("id", product.id);

    setSaving(false);
    if (err) { setActionError(dbErrorPt(err)); return; }
    setProduct((p) => p ? {
      ...p,
      name:     editName,
      price:    newPrice,
      location: editLocation || null,
      category: editCategory.trim() || null,
      min_qty:  newMinQty,
    } : p);
    const ws = getWorkspace();
    if (ws) mutateProducts(ws.id);
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
    setActionError("");
    try {
      const compressed = await compressImage(file);
      const path = `${product.id}.jpg`;

      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, { upsert: true, contentType: "image/jpeg" });

      if (upErr) {
        setActionError(dbErrorPt(upErr, "Não foi possível enviar a imagem."));
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
        setActionError(dbErrorPt(updateErr, "Não foi possível salvar a imagem."));
        return;
      }

      setProduct((p) => p ? { ...p, image_url: publicUrl } : p);
      const ws = getWorkspace();
      if (ws) mutateProducts(ws.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setImgUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  function handleMoved(newQty: number, delta: number) {
    if (!product) return;
    setProduct((p) => (p ? { ...p, qty: newQty } : p));
    const ws = getWorkspace();
    if (ws) {
      mutateProducts(ws.id);
      mutateStats(ws.id);
      mutateMovements(ws.id);
    }
    mutateProductMovements(product.id);
    setNow(Date.now());
    setMovMsg(`${delta > 0 ? "Entrada" : "Saída"} registrada: ${delta > 0 ? "+" : "−"}${formatQty(Math.abs(delta))} ${product.unit}`);
    setTimeout(() => setMovMsg(""), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <PageError message={loadError || "Produto não encontrado"} onRetry={() => router.push("/estoque")} />
      </div>
    );
  }

  const status = deriveStatus(product.qty, product.min_qty);
  const level  = stockLevel(product.qty, product.min_qty, product.max_qty);

  const info: Array<[string, string]> = [
    ["Preço unitário", formatBRL(product.price)],
    ["Categoria",      product.category || "—"],
    ["Localização",    product.location ?? "—"],
    ["Fornecedor",     product.supplier ?? "—"],
    ["Cadastrado em",  new Date(product.created_at).toLocaleDateString("pt-BR")],
  ];

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      {/* Hidden file input for image upload */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:gap-6">

          <nav aria-label="Trilha" className="flex items-center gap-2.5 min-w-0 text-sm font-bold text-fg-muted">
            <Link href="/estoque" className="flex items-center gap-2 min-h-[40px] pl-3 pr-4 rounded-full bg-surface text-fg font-extrabold flex-shrink-0 hover:bg-surface-2 transition-colors">
              <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.4} /> Estoque
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="truncate">{product.name}</span>
          </nav>

          {/* Celular: uma coluna na ordem 1–6. Computador: conteúdo à esquerda, movimentação fixa à direita. */}
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6">
            <div className="contents lg:flex lg:flex-col lg:gap-6 lg:min-w-0">

              {/* 1 — Foto + identificação */}
              <section className="order-1 lg:order-none bg-surface rounded-5xl p-4 lg:p-5 flex flex-col gap-5">
                <div className="relative h-[220px] lg:h-[280px] rounded-4xl overflow-hidden bg-surface-2 flex items-center justify-center">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-20 h-20 rounded-full bg-ink text-fg-muted flex items-center justify-center">
                      <BoxIcon className="w-9 h-9" strokeWidth={1.6} />
                    </span>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imgUploading}
                      className="absolute bottom-3.5 right-3.5 flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-ink/85 text-fg text-sm font-extrabold cursor-pointer hover:bg-ink transition-colors disabled:cursor-not-allowed"
                    >
                      {imgUploading ? <Spinner className="w-[18px] h-[18px]" /> : <CameraIcon className="w-[18px] h-[18px]" />}
                      {imgUploading ? "Enviando…" : product.image_url ? "Trocar foto" : "Adicionar foto"}
                    </button>
                  )}
                </div>

                {actionError && (
                  <p role="alert" className="text-sm font-bold text-zero bg-zero/10 rounded-2xl px-4 py-3">{actionError}</p>
                )}

                {editMode ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}
                    className="flex flex-col gap-4 px-1 lg:px-2 pb-1"
                  >
                    <h1 className="text-xl font-black">Editar produto</h1>
                    <FormField label="Nome do produto" htmlFor="edit-nome" required>
                      <input id="edit-nome" type="text" required autoComplete="off" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Preço unitário (R$)" htmlFor="edit-preco">
                        <input id="edit-preco" type="text" inputMode="decimal" autoComplete="off" placeholder="0,00" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={inputClass} />
                      </FormField>
                      <FormField label="Estoque mínimo" htmlFor="edit-minimo">
                        <input id="edit-minimo" type="text" inputMode="decimal" autoComplete="off" placeholder="0" value={editMinQty} onChange={(e) => setEditMinQty(e.target.value)} className={inputClass} />
                      </FormField>
                    </div>
                    <FormField label="Localização" htmlFor="edit-local">
                      <input id="edit-local" type="text" autoComplete="off" placeholder="Ex.: Prateleira A3" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className={inputClass} />
                    </FormField>
                    <FormField label="Categoria" htmlFor="edit-categoria">
                      <input id="edit-categoria" type="text" autoComplete="off" maxLength={60} placeholder="Ex.: Bebidas" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputClass} />
                    </FormField>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => { resetEditFields(product); setEditMode(false); }}
                        className="flex-1 min-h-[48px] rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 min-h-[48px] rounded-full bg-accent text-ink text-[15px] font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50"
                      >
                        {saving ? <><Spinner className="w-[18px] h-[18px]" /> Salvando…</> : "Salvar alterações"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4 px-1 lg:px-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h1 className="text-[26px] lg:text-[32px] font-black tracking-tight leading-tight">{product.name}</h1>
                        <span className="text-sm font-bold text-fg-muted tracking-wide break-all">{product.code || "Sem código de barras"}</span>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditMode(true)}
                          aria-label="Editar produto"
                          className="w-11 h-11 rounded-full bg-surface-2 text-fg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
                        >
                          <PencilIcon className="w-[18px] h-[18px]" />
                        </button>
                      )}
                    </div>
                    {saved && (
                      <p role="status" className="flex items-center gap-2 text-sm font-extrabold text-ok">
                        <CheckIcon className="w-4 h-4" strokeWidth={2.8} /> Alterações salvas
                      </p>
                    )}
                    <dl className="flex flex-col">
                      {info.map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-3 py-3 border-t-2 border-dashed border-white/[0.08] text-sm">
                          <dt className="font-bold text-fg-muted">{label}</dt>
                          <dd className="font-extrabold text-right">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </section>

              {/* 2 — Quantidade (card de destaque) */}
              <section aria-label="Quantidade em estoque" className="order-2 lg:order-none bg-accent text-ink rounded-5xl p-[22px] lg:p-7 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm lg:text-base font-extrabold text-ink/80">Em estoque</p>
                    <p className="text-[44px] lg:text-[56px] font-black tracking-[-0.035em] leading-none">
                      {formatQty(product.qty)} <span className="text-xl lg:text-2xl tracking-tight">{product.unit}</span>
                    </p>
                  </div>
                  <StatusChip status={status} onLight />
                </div>
                <div aria-hidden="true" className="relative h-2.5 rounded-full bg-ink/15">
                  {level.fill > 0 && <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(level.fill * 100, 4)}%` }} />}
                  {level.minMark > 0 && (
                    <span className="absolute -top-1 w-[3px] h-[18px] rounded bg-ink/60" style={{ left: `calc(${level.minMark * 100}% - 1.5px)` }} />
                  )}
                </div>
                <div className="border-t-2 border-dashed border-ink/20" />
                <dl className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <dt className="order-2 text-[13px] lg:text-sm font-extrabold text-ink/75">Mínimo</dt>
                    <dd className="order-1 text-xl lg:text-2xl font-black">{formatQty(product.min_qty)} <span className="text-sm">{product.unit}</span></dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="order-2 text-[13px] lg:text-sm font-extrabold text-ink/75">Máximo</dt>
                    <dd className="order-1 text-xl lg:text-2xl font-black">{product.max_qty ? <>{formatQty(product.max_qty)} <span className="text-sm">{product.unit}</span></> : "—"}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <dt className="order-2 text-[13px] lg:text-sm font-extrabold text-ink/75">Valor em estoque</dt>
                    <dd className="order-1 text-xl lg:text-2xl font-black">{formatBRL(product.qty * product.price)}</dd>
                  </div>
                </dl>
              </section>

              {/* 4 — Histórico */}
              <section className="order-4 lg:order-none bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-1.5">
                <div className="flex flex-col gap-0.5 pb-2">
                  <h2 className="text-lg lg:text-xl font-black">Histórico</h2>
                  <p className="text-sm font-bold text-fg-muted">Últimas movimentações deste produto</p>
                </div>
                {historyLoading ? (
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-2xl bg-surface-2 animate-pulse" />)}
                  </div>
                ) : history.length === 0 ? (
                  <p className="py-3 text-sm font-bold text-fg-muted">Nenhuma movimentação registrada ainda.</p>
                ) : (
                  <ul className="flex flex-col">
                    {history.map((m) => {
                      const isIn = m.delta > 0;
                      return (
                        <li key={m.id} className="flex items-center gap-3.5 py-3 px-1 border-t-2 border-dashed border-white/[0.08]">
                          <span className={`w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? "bg-accent/20 text-accent" : "bg-inverse/10 text-inverse"}`}>
                            {isIn ? <InIcon className="w-5 h-5" strokeWidth={2.2} /> : <OutIcon className="w-5 h-5" strokeWidth={2.2} />}
                          </span>
                          <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-[15px] font-extrabold truncate">{m.reason || (isIn ? "Entrada" : "Saída")}</span>
                            <span className="text-[13px] font-bold text-fg-muted">
                              {new Date(m.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              {now ? ` · ${timeAgo(m.created_at, now)}` : ""}
                            </span>
                          </span>
                          <span className={`text-[15px] lg:text-base font-black flex-shrink-0 ${isIn ? "text-accent" : ""}`}>
                            {isIn ? "+" : "−"}{formatQty(Math.abs(m.delta))} {product.unit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* 5 — Nota fiscal */}
              <section className="order-5 lg:order-none bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg lg:text-xl font-black">Nota fiscal</h2>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setNfScanning(true)}
                      className="flex items-center gap-2 min-h-[40px] px-4 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <ScanIcon className="w-[18px] h-[18px]" /> Escanear NF
                    </button>
                  )}
                </div>
                {product.nota_fiscal ? (
                  <p className="text-sm font-bold text-fg tracking-wide break-all">{product.nota_fiscal}</p>
                ) : (
                  <p className="text-sm font-bold text-fg-muted">Nenhuma nota fiscal vinculada.</p>
                )}
              </section>
            </div>

            <div className="contents lg:flex lg:flex-col lg:gap-6 lg:sticky lg:top-20">
              {/* 3 — Registrar movimentação */}
              <section aria-labelledby="mov-title" className="order-3 lg:order-none bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="mov-title" className="text-lg lg:text-xl font-black">Registrar movimentação</h2>
                </div>
                {canEdit ? (
                  <MovementForm key={product.id} product={product} onDone={handleMoved} />
                ) : (
                  <p className="text-sm font-bold text-fg-muted bg-surface-2 rounded-2xl p-4">
                    Seu papel neste workspace é de leitura: entradas e saídas ficam com donos e administradores.
                  </p>
                )}
                <p aria-live="polite" className="text-sm font-extrabold text-ok empty:hidden">{movMsg}</p>
              </section>

              {/* 6 — Remover */}
              {canEdit && (
                <section className="order-6 lg:order-none bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-base font-black">Remover produto</h2>
                    <p className="text-sm font-bold text-fg-muted">Apaga o produto e o histórico de movimentações.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDeleteError(""); setShowDeleteConfirm(true); }}
                    className="flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-zero/10 text-zero text-[15px] font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
                  >
                    <TrashIcon className="w-[18px] h-[18px]" /> Remover produto
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <button type="button" aria-label="Fechar" tabIndex={-1} onClick={() => setShowDeleteConfirm(false)} className="absolute inset-0 bg-black/60 cursor-default" />
          <div className="relative w-full max-w-sm bg-surface rounded-5xl p-6 flex flex-col gap-5 animate-fade-up">
            <div className="flex flex-col gap-2">
              <h3 id="delete-title" className="text-lg font-black">Remover produto?</h3>
              <p className="text-sm font-bold text-fg-muted">
                <span className="text-fg">{product.name}</span> será removido permanentemente. Esta ação não pode ser desfeita.
              </p>
              {deleteError && (
                <p role="alert" className="text-sm font-bold text-zero bg-zero/10 rounded-2xl px-3.5 py-2.5 mt-1">{deleteError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                ref={cancelDelRef}
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 min-h-[48px] rounded-full bg-surface-2 text-[15px] font-extrabold cursor-pointer hover:bg-white/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 min-h-[48px] rounded-full bg-zero text-ink text-[15px] font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50"
              >
                {deleting ? <Spinner className="w-[18px] h-[18px]" /> : <TrashIcon className="w-[18px] h-[18px]" />}
                {deleting ? "Removendo…" : "Sim, remover"}
              </button>
            </div>
          </div>
        </div>
      )}

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
