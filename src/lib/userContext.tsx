"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
}

interface UserContextValue extends UserProfile {
  setProfile: (p: Partial<UserProfile>) => void;
}

const CACHE_KEY = "estoquizen_user_profile";

function readCache(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCache(p: UserProfile) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

const UserContext = createContext<UserContextValue>({
  userName: "",
  userEmail: "",
  avatarUrl: null,
  setProfile: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const cached = readCache();
  const [profile, setProfileState] = useState<UserProfile>(
    cached ?? { userName: "", userEmail: "", avatarUrl: null }
  );

  function setProfile(partial: Partial<UserProfile>) {
    setProfileState((prev) => {
      const next = { ...prev, ...partial };
      writeCache(next);
      return next;
    });
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const email = user.email ?? "";
      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      const next: UserProfile = {
        userName:  data?.name ?? email.split("@")[0],
        userEmail: email,
        avatarUrl: data?.avatar_url ?? null,
      };

      setProfileState(next);
      writeCache(next);
    });
  }, []);

  return (
    <UserContext.Provider value={{ ...profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export function clearUserCache() {
  try { sessionStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}
