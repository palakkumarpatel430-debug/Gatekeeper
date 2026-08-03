import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  premium: boolean;
  plan: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  register: (name: string, email: string, pass: string) => Promise<string | null>;
  login: (email: string, pass: string) => Promise<string | null>;
  logout: () => void;
  purchase: (plan: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function fetchProfile(userId: string, email: string): Promise<AuthUser> {
  const { data } = await supabase
    .from("profiles")
    .select("name, premium, plan, plan_expires_at")
    .eq("id", userId)
    .single();

  let premium = data?.premium ?? false;

  // Downgrade if subscription has expired
  if (premium && data?.plan_expires_at) {
    if (new Date(data.plan_expires_at) < new Date()) {
      premium = false;
      supabase.from("profiles").update({ premium: false }).eq("id", userId);
    }
  }

  // Record last seen (fire-and-forget — ignore errors)
  supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("id", userId);

  return { id: userId, email, name: data?.name ?? "", premium, plan: data?.plan ?? null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await fetchProfile(session.user.id, session.user.email!));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(await fetchProfile(session.user.id, session.user.email!));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = useCallback(async (name: string, email: string, pass: string) => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(e)) return "Enter a valid email";
    if (pass.length < 6) return "Password must be at least 6 characters";

    const { data, error } = await supabase.auth.signUp({
      email: e,
      password: pass,
      options: { data: { name: name.trim() } },
    });

    if (error) return error.message;

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name: name.trim(),
        premium: false,
        plan: null,
      });
      // Set user immediately — don't wait for onAuthStateChange to avoid race condition
      setUser({ id: data.user.id, email: e, name: name.trim(), premium: false, plan: null });
    }

    return null;
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });
    if (error) return error.message;
    // Kick all other active sessions — enforce single concurrent session
    await supabase.auth.signOut({ scope: "others" });
    return null;
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    setUser(null);
  }, []);

  const purchase = useCallback(async (plan: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from("profiles").upsert({ id: session.user.id, premium: true, plan });
    setUser((prev) => (prev ? { ...prev, premium: true, plan } : prev));
  }, []);

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(await fetchProfile(session.user.id, session.user.email!));
    }
  }, []);

  return <Ctx.Provider value={{ user, register, login, logout, purchase, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
