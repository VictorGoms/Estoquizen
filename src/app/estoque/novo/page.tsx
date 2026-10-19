"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import BarcodeScanner from "@/components/ui/BarcodeScanner";
import FormField, { inputClass } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabase";
import { sanitizeCode } from "@/lib/sanitize";
import { getWorkspace } from "@/hooks/useWorkspace";
import { mutateProducts } from "@/hooks/useProducts";
import { useProductLimit } from "@/hooks/useProductLimit";
import ProductLimitBanner from "@/components/dashboard/ProductLimitBanner";
import { api } from "@/lib/api";
import { parseQtyInput, parsePriceInput } from "@/lib/stock";
import { ArrowLeftIcon, ScanIcon, ImageIcon, CheckIcon, Spinner } from "@/components/ui/icons";

const UNITS = ["un", "kg", "g", "L", "ml", "cx", "pct"];

async function lookupBarcode(ean: string): Promise<string | null> {
  if (ean.length < 8) return null;
  try {
    const res  = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`);
    const json = await res.json();
    if (json.status !== 1) return null;
    const p = json.product;

    /* product_name é o campo exibido no site — tem prioridade */
    const nome = (
      p.product_name       ||
      p.product_name_pt_BR ||
      p.product_name_pt    ||
      p.product_name_en    ||
      ""
    ).trim();

    return nome || null;
  } catch {
    return null;
  }
}

function Section({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface rounded-5xl p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-black">{title}</h2>
        {aside && <span className="text-xs font-extrabold text-fg-subtle">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function NovoItemContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [wsName, setWsName]     = useState("");
  const [wsId, setWsId]         = useState<string | null>(null);
  /* No limite do plano a API recusa; avisa antes de a pessoa preencher (EQZ-06) */
  const productLimit            = useProductLimit(wsId);
  const [userName, setUserName] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [autoFilled,  setAutoFilled]  = useState(false);
  const [scanning, setScanning] = useState(false);

  const [name, setName]         = useState("");
  const [code, setCode]         = useState(searchParams.get("code") ?? "");
  const [unit, setUnit]         = useState("un");
  const [price, setPrice]       = useState("");
  const [cost, setCost]         = useState(""); /* custo de compra (EQZ-23), opcional */
  const [qty, setQty]           = useState("");
  const [minQty, setMinQty]     = useState("0");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Lookup automático quando página carrega com ?code= (vindo do scanner) */
  useEffect(() => {
    const initialCode = searchParams.get("code");
    if (!initialCode || name) return;
    setLookingUp(true);
    lookupBarcode(initialCode).then((found) => {
      if (found) { setName(found); setAutoFilled(true); }
      setLookingUp(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Lookup quando usuário digita o código manualmente (debounce 700ms) */
  useEffect(() => {
    if (searchParams.get("code")) return; // já foi feito no mount
    const digits = code.replace(/\D/g, "");
    if (digits.length < 8) return;
    const timer = setTimeout(() => {
      setLookingUp(true);
      setAutoFilled(false);
      lookupBarcode(digits).then((found) => {
        if (found && !name) { setName(found); setAutoFilled(true); }
        setLookingUp(false);
      });
    }, 700);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    async function load() {
      const ws = getWorkspace();
      if (!ws) { router.push("/select-workspace"); return; }
      setWsName(ws.name);
      setWsId(ws.id);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).single();
        setUserName(profile?.name ?? user.email?.split("@")[0] ?? "");
      }
    }
    load();
  }, [router]);

  async function compressImage(file: File, maxPx = 800, quality = 0.82): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        /* Tenta WebP, cai para JPEG se não suportado (iOS antigo) */
        canvas.toBlob(
          (blob) => {
            if (blob) { resolve(blob); return; }
            canvas.toBlob((jpgBlob) => resolve(jpgBlob ?? file), "image/jpeg", quality);
          },
          "image/webp",
          quality,
        );
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  }

  /* Máscara de dinheiro (digita 1250 → 12,50) para preço e custo */
  function moneyMask(set: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      if (!digits) { set(""); return; }
      set((parseInt(digits, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    };
  }
  const handlePriceInput = moneyMask(setPrice);
  const handleCostInput  = moneyMask(setCost);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleImageRemove() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleScanDetect = useCallback((scanned: string) => {
    setCode(sanitizeCode(scanned));
    setScanning(false);
  }, []);
  const handleScanClose = useCallback(() => setScanning(false), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Preencha o nome do produto.");
      return;
    }
    /* Aceita decimais com vírgula (2,5 kg); antes parseInt truncava para 2 sem avisar */
    const qtyNum   = qty.trim()    ? parseQtyInput(qty)      : 0;
    const minNum   = minQty.trim() ? parseQtyInput(minQty)   : 0;
    const priceNum = price.trim()  ? parsePriceInput(price)  : 0;
    if (Number.isNaN(qtyNum) || Number.isNaN(minNum)) {
      setError("Quantidade inválida. Use números, com vírgula para decimais (ex.: 2,5).");
      return;
    }
    if (Number.isNaN(priceNum)) {
      setError("Preço inválido. Use o formato 12,50.");
      return;
    }
    setSaving(true);

    const ws = getWorkspace();
    if (!ws) { setError("Nenhum workspace selecionado."); setSaving(false); return; }

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const isWebp = compressed.type === "image/webp";
        const ext    = isWebp ? "webp" : "jpg";
        const path   = `${ws.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("product-images")
          .upload(path, compressed, { upsert: true, contentType: compressed.type });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      await api.post("/products", {
        workspace_id: ws.id,
        name,
        code:      code.trim() || null,
        unit:      unit || "un",
        price:     priceNum,
        ...(cost.trim() ? { cost: parsePriceInput(cost) } : {}),
        qty:       qtyNum,
        min_qty:   minNum,
        location:  location.trim() || undefined,
        category:  category.trim() || undefined,
        supplier:  supplier.trim() || undefined,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      mutateProducts(ws.id);
      router.push("/estoque");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink">
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:gap-6">

          <div className="flex flex-col gap-4">
            <Link href="/estoque" className="w-fit flex items-center gap-2 min-h-[40px] pl-3 pr-4 rounded-full bg-surface text-sm text-fg font-extrabold hover:bg-surface-2 transition-colors">
              <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.4} /> Estoque
            </Link>
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] lg:text-[32px] font-black tracking-tight leading-tight">Adicionar produto</h1>
              <p className="text-sm lg:text-[15px] font-bold text-fg-muted">Comece pelo código de barras: o nome costuma vir sozinho.</p>
            </div>
          </div>

          <ProductLimitBanner workspaceId={wsId} />

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

            <Section title="Identificação">
              <FormField label="Código de barras" htmlFor="novo-codigo">
                <div className="flex gap-2.5">
                  <input
                    id="novo-codigo"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex.: 7891234560001"
                    className={`${inputClass} tracking-wide`}
                  />
                  <button
                    type="button"
                    onClick={() => setScanning(true)}
                    aria-label="Ler código de barras com a câmera"
                    className="w-12 h-12 rounded-2xl bg-surface-2 text-fg flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <ScanIcon />
                  </button>
                </div>
              </FormField>

              <FormField
                label="Nome do produto"
                htmlFor="novo-nome"
                required
                hint={autoFilled ? (
                  <p className="flex items-center gap-1.5 text-[13px] font-bold text-accent">
                    <CheckIcon className="w-4 h-4" strokeWidth={2.6} /> Nome sugerido pelo Open Food Facts. Confira antes de salvar.
                  </p>
                ) : null}
              >
                <div className="relative">
                  <input
                    id="novo-nome"
                    type="text"
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setAutoFilled(false); }}
                    placeholder={lookingUp ? "Identificando produto…" : "Ex.: Feijão carioca 1kg"}
                    className={`${inputClass} pr-11`}
                  />
                  {lookingUp && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fg-subtle">
                      <Spinner className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </FormField>
            </Section>

            <Section title="Estoque">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Quantidade inicial" htmlFor="novo-qtd">
                  <input id="novo-qtd" type="text" inputMode="decimal" autoComplete="off" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" className={inputClass} />
                </FormField>
                <FormField label="Estoque mínimo" htmlFor="novo-minimo">
                  <input id="novo-minimo" type="text" inputMode="decimal" autoComplete="off" value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="0" className={inputClass} />
                </FormField>
              </div>
              <FormField label="Unidade" htmlFor="novo-unidade">
                <div className="flex flex-col gap-2.5">
                  <div role="group" aria-label="Unidades comuns" className="flex flex-wrap gap-2">
                    {UNITS.map((u) => {
                      const active = unit === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setUnit(u)}
                          className={`min-h-[40px] min-w-[52px] px-3.5 rounded-full text-sm cursor-pointer transition-colors ${
                            active ? "bg-inverse text-ink font-black" : "bg-surface-2 text-fg-soft font-extrabold hover:text-fg"
                          }`}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    id="novo-unidade"
                    type="text"
                    autoComplete="off"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Outra unidade (ex.: fardo)"
                    className={inputClass}
                  />
                </div>
              </FormField>
            </Section>

            <Section title="Valores e localização">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Preço unitário (R$)" htmlFor="novo-preco">
                  <input id="novo-preco" type="text" inputMode="numeric" autoComplete="off" value={price} onChange={handlePriceInput} placeholder="0,00" className={inputClass} />
                </FormField>
                <FormField label="Custo de compra (R$, opcional)" htmlFor="novo-custo">
                  <input id="novo-custo" type="text" inputMode="numeric" autoComplete="off" value={cost} onChange={handleCostInput} placeholder="0,00" className={inputClass} />
                </FormField>
                <FormField label="Localização" htmlFor="novo-local">
                  <input id="novo-local" type="text" autoComplete="off" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Prateleira A3" className={inputClass} />
                </FormField>
              </div>
              <FormField label="Categoria" htmlFor="novo-categoria">
                <input id="novo-categoria" type="text" autoComplete="off" maxLength={60} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Bebidas" className={inputClass} />
              </FormField>
              <FormField label="Fornecedor" htmlFor="novo-fornecedor">
                <input id="novo-fornecedor" type="text" autoComplete="organization" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex.: Distribuidora Central" className={inputClass} />
              </FormField>
            </Section>

            <Section title="Foto do produto" aside="Opcional">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {imagePreview ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Prévia da foto" width={80} height={80} className="w-20 h-20 rounded-3xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <p className="text-sm font-bold text-fg-muted truncate">{imageFile?.name}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-[40px] px-4 rounded-full bg-surface-2 text-sm font-extrabold cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="min-h-[40px] px-4 rounded-full bg-zero/10 text-zero text-sm font-extrabold cursor-pointer hover:bg-zero/20 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2.5 py-7 rounded-4xl border-2 border-dashed border-white/[0.12] text-fg-muted cursor-pointer hover:border-white/25 hover:text-fg transition-colors"
                >
                  <span className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6" />
                  </span>
                  <span className="text-sm font-extrabold">Toque para adicionar uma foto</span>
                </button>
              )}
            </Section>

            {error && <p role="alert" className="text-sm font-bold text-zero bg-zero/10 rounded-2xl px-4 py-3 text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 sm:flex-none sm:w-40 min-h-[54px] rounded-full bg-surface text-[15px] font-extrabold cursor-pointer hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !!productLimit?.at}
                className="flex-[2] min-h-[54px] rounded-full bg-accent text-ink text-base font-black flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-[filter] disabled:opacity-50"
              >
                {saving ? <><Spinner /> Salvando…</> : "Adicionar produto"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {scanning && (
        <BarcodeScanner
          title="Código do produto"
          subtitle="Aponte a câmera para o código de barras"
          onDetect={handleScanDetect}
          onClose={handleScanClose}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function NovoItemPage() {
  return (
    <Suspense>
      <NovoItemContent />
    </Suspense>
  );
}
