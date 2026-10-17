"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { personInitials } from "@/lib/stock";

export default function TopBar() {
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

  return (
    <header className="fixed top-0 inset-x-0 z-40 glass">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Estoquizen — página inicial">
          <Logo size={32} />
          <span className="hidden sm:block text-lg font-black tracking-tight text-fg group-hover:text-accent transition-colors">
            Estoquizen
          </span>
        </Link>

        <div className="flex items-center gap-3 min-w-0">
          {userName && (
            <span className="hidden sm:flex flex-col items-end min-w-0">
              <span className="text-sm font-extrabold truncate max-w-[220px]">{userName}</span>
              <span className="text-xs font-bold text-fg-muted truncate max-w-[220px]">{userEmail}</span>
            </span>
          )}
          <Link
            href="/perfil"
            aria-label={userName ? `Perfil de ${userName}` : "Perfil"}
            className="w-11 h-11 rounded-full overflow-hidden bg-surface-2 text-sm font-black flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
          >
            {avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : personInitials(userName || "?")}
          </Link>
        </div>
      </div>
    </header>
  );
}
