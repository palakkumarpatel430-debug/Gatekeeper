import { useState } from "react";
import { Lock, UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useStore } from "../lib/store";
import { Btn, Field, Input } from "../components/ui";

export default function AuthPage({
  onDone,
  onPricing,
}: {
  onDone: () => void;
  onPricing: () => void;
}) {
  const { register, login, user } = useAuth();
  const { toast } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", pass: "" });
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    const err =
      mode === "register"
        ? await register(f.name, f.email, f.pass)
        : await login(f.email, f.pass);
    setBusy(false);
    if (err) return toast(err);
    toast(mode === "register" ? "Account created ✓" : "Welcome back ✓");
    onDone();
  };

  return (
    <div className="mx-auto max-w-[420px] px-5 py-20">
      <div className="mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-black text-accent">
        {mode === "login" ? <Lock size={24} /> : <UserPlus size={24} />}
      </div>
      <h2 className="text-center font-disp text-xl font-black uppercase text-white">
        {mode === "login" ? "Member login" : "Create your account"}
      </h2>
      <p className="mt-1.5 text-center text-sm text-ink-soft">
        {mode === "login"
          ? "The dashboard is for premium members only."
          : "An account is free — premium unlocks the control room."}
      </p>
      {user && (
        <p className="mt-2 text-center font-mono text-xs text-pass">
          Signed in as {user.email} {user.premium ? "· premium" : "· free"}
        </p>
      )}
      <div className="mt-6 rounded-lg border border-line bg-surface p-6">
        {mode === "register" && (
          <Field label="Name">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
        )}
        <Field label="Email">
          <Input type="email" placeholder="you@company.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            placeholder="••••••••"
            value={f.pass}
            onChange={(e) => setF({ ...f, pass: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && go()}
          />
        </Field>
        <Btn className="w-full" onClick={go} disabled={busy}>
          {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
        </Btn>
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-4 w-full text-center text-[13px] text-ink-soft hover:text-white"
        >
          {mode === "login" ? "No account? Create one →" : "Already a member? Log in →"}
        </button>
      </div>
      <button onClick={onPricing} className="mt-5 w-full text-center font-mono text-[11px] uppercase tracking-[0.08em] text-accent hover:brightness-110">
        See premium plans →
      </button>
      <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-zinc-600">
        Secured by Supabase Auth.
      </p>
    </div>
  );
}
