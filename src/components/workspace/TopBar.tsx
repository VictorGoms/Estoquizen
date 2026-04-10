"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

export default function TopBar() {
  const router = useRouter();
  const [userName, setUserName]   = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("name, email, avatar_url").eq("id", user.id).single()
        .then(({ data }) => {
          setUserName(data?.name  ?? user.email?.split("@")[0] ?? "");
          setUserEmail(data?.email ?? user.email ?? "");
          if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        });
    });
  }, []);

  const initials = getInitials(userName);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 glass"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer group"
            aria-label="Estoquizen"
          >
            <Logo size={28} />
            <span className="font-display font-bold text-base text-white group-hover:text-brand-300 transition-colors duration-200 hidden sm:block">
              Estoquizen
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["Dashboard", "Produtos", "Relatórios"].map((item) => (
              <span
                key={item}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-500 cursor-not-allowed select-none"
                title="Selecione um workspace primeiro"
              >
                {item}
              </span>
            ))}
          </nav>

          {/* User avatar */}
          <div className="flex items-center gap-3">
            {userName && (
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-slate-300 leading-none">{userName}</span>
                <span className="text-[11px] text-slate-600 mt-0.5 leading-none">{userEmail}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                background: avatarUrl ? "transparent" : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
              }}
              aria-label={`Usuário: ${userName}`}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                : initials || "?"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
