"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardTopBar from "@/components/dashboard/DashboardTopBar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import BottomNav from "@/components/dashboard/BottomNav";
import { supabase } from "@/lib/supabase";
import { getWorkspace } from "@/hooks/useWorkspace";
import { api } from "@/lib/api";

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: "rgba(15,23,42,0.6)",
  border: "1px solid rgba(255,255,255,0.08)",
};
const inputClass = "w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-slate-700 outline-none transition-all duration-200";

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

function NovoItemContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [wsName, setWsName]     = useState("");
  const [userName, setUserName] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [autoFilled,  setAutoFilled]  = useState(false);

  const [name, setName]         = useState("");
  const [code, setCode]         = useState(searchParams.get("code") ?? "");
  const [unit, setUnit]         = useState("un");
  const [price, setPrice]       = useState("");
  const [qty, setQty]           = useState("");
  const [minQty, setMinQty]     = useState("0");
  const [location, setLocation] = useState("");
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

  function handlePriceInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) { setPrice(""); return; }
    const num = parseInt(digits, 10) / 100;
    setPrice(num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Preencha o nome do produto.");
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
        price:     parseFloat(price.replace(/\./g, "").replace(",", ".")) || 0,
        qty:       parseInt(qty, 10)    || 0,
        min_qty:   parseInt(minQty, 10) || 0,
        location:  location.trim() || undefined,
        supplier:  supplier.trim() || undefined,
        ...(imageUrl ? { image_url: imageUrl } : {}),
      });
      router.push("/estoque");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 relative overflow-hidden">
      <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ width: "700px", height: "350px", background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.09) 0%, transparent 70%)" }}
      />
      <DashboardSidebar workspaceName={wsName} userName={userName} />
      <DashboardTopBar  workspaceName={wsName} userName={userName} />

      <main className="lg:pl-64 pt-14 pb-28 lg:pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 lg:py-8 flex flex-col gap-6">

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => router.back()}
                className="flex items-center gap-1.5 text-slate-500 hover:text-white text-xs font-medium cursor-pointer transition-colors duration-200">
                <ArrowLeftIcon /> Estoque
              </button>
            </div>

            <div>
              <h1 className="font-display font-bold text-xl text-white">Adicionar produto</h1>
              <p className="text-slate-500 text-sm mt-1">Preencha os dados do novo item</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Identificação */}
              <div className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white">Identificação</h3>

                <Field label="Nome do produto" required>
                  <div className="relative">
                    <input type="text" value={name} onChange={(e) => { setName(e.target.value); setAutoFilled(false); }}
                      placeholder={lookingUp ? "Identificando produto…" : "Ex: Parafuso M8"}
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                    {lookingUp && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {autoFilled && (
                    <p className="text-[11px] text-blue-400 mt-1">Identificado automaticamente</p>
                  )}
                </Field>

                <Field label="Código de barras (SKU)">
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: 7891234560001"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                </Field>
              </div>

              {/* Estoque */}
              <div className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white">Estoque</h3>

                <div className="grid grid-cols-3 gap-3 items-end">
                  <Field label="Qtd. inicial">
                    <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0"
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </Field>
                  <Field label="Mínimo">
                    <input type="number" min="0" value={minQty} onChange={(e) => setMinQty(e.target.value)} placeholder="0"
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </Field>
                  <Field label="Unidade">
                    <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="un"
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </Field>
                </div>
              </div>

              {/* Valores */}
              <div className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="text-sm font-semibold text-white">Valores e localização</h3>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Preço unitário (R$)">
                    <input type="text" inputMode="numeric" value={price} onChange={handlePriceInput} placeholder="0,00"
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </Field>
                  <Field label="Localização">
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Prateleira A3"
                      className={inputClass} style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                      onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </Field>
                </div>

                <Field label="Fornecedor">
                  <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex: Distribuidora XYZ"
                    className={inputClass} style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                </Field>
              </div>

              {/* Foto */}
              <div className="rounded-2xl p-5 flex flex-col gap-4"
                style={{ background: "rgba(22,32,52,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Foto do produto</h3>
                  <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wide">Opcional</span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                {imagePreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <div className="flex flex-col gap-2">
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{imageFile?.name}</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-brand-400 hover:text-brand-300 cursor-pointer transition-colors duration-200"
                        >
                          Trocar
                        </button>
                        <span className="text-slate-700">·</span>
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="text-xs text-rose-500 hover:text-rose-400 cursor-pointer transition-colors duration-200"
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
                    className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all duration-200 hover:border-slate-600"
                    style={{ border: "1.5px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-slate-600">Toque para adicionar uma foto</p>
                  </button>
                )}
              </div>

              {error && <p className="text-xs text-red-400 text-center">{error}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => router.back()}
                  className="flex-1 sm:flex-none sm:w-32 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200"
                  style={{ background: "rgba(30,41,59,0.7)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748B" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#F1F5F9"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#2563EB,#1D4ED8)", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
                  {saving && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  {saving ? "Salvando…" : "Adicionar produto"}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
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
