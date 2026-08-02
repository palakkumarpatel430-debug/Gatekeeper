import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { sha } from "./util";

/* DEMO AUTH — client-side gate only, mirrors the admin gate in the app.
   For production: replace this module with Supabase Auth (register/login/logout)
   and a Stripe Checkout webhook that sets `premium` + `plan` server-side.
   The rest of the site only talks to this interface, so the swap is contained. */

export interface AuthUser {
  email: string;
  name: string;
  hash: string;
  premium: boolean;
  plan: string | null;
}

const USERS_KEY = "gatekeeper.users";
const SESSION_KEY = "gatekeeper.session";

function loadUsers(): AuthUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveUsers(u: AuthUser[]) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

interface AuthCtx {
  user: AuthUser | null;
  register: (name: string, email: string, pass: string) => Promise<string | null>;
  login: (email: string, pass: string) => Promise<string | null>;
  logout: () => void;
  purchase: (plan: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const email = localStorage.getItem(SESSION_KEY);
    return loadUsers().find((u) => u.email === email) || null;
  });

  const register = useCallback(async (name: string, email: string, pass: string) => {
    const e = email.trim().toLowerCase();
    if (!name.trim()) return "Enter your name";
    if (!/^\S+@\S+\.\S+$/.test(e)) return "Enter a valid email";
    if (pass.length < 6) return "Password must be at least 6 characters";
    const users = loadUsers();
    if (users.some((u) => u.email === e)) return "Account already exists — log in instead";
    const nu: AuthUser = { email: e, name: name.trim(), hash: await sha(pass), premium: false, plan: null };
    users.push(nu);
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, e);
    setUser(nu);
    return null;
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const e = email.trim().toLowerCase();
    const u = loadUsers().find((x) => x.email === e);
    if (!u) return "No account with that email";
    if (u.hash !== (await sha(pass))) return "Wrong password";
    localStorage.setItem(SESSION_KEY, e);
    setUser(u);
    return null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const purchase = useCallback((plan: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, premium: true, plan };
      saveUsers(loadUsers().map((u) => (u.email === next.email ? next : u)));
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ user, register, login, logout, purchase }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
