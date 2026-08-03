import { useState } from "react";
import { Check, CreditCard, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { Btn, Modal, ModalTitle } from "../components/ui";
import { Section } from "./shared";

export interface Plan {
  name: string;
  price: number;
  priceId: string;
  tag?: string;
  feats: string[];
}

export const PLANS: Plan[] = [
  {
    name: "Per-Project",
    price: 99,
    priceId: "price_1U05802LdYFa7o6rnaYh29zL",
    feats: ["Pay as you go", "1 active project", "Full sort entry & records", "CSV / JSON export", "Email support"],
  },
  {
    name: "Basic",
    price: 349,
    priceId: "price_1U058M2LdYFa7o6rMydW2hpx",
    feats: ["Up to 5 projects", "Analytics dashboard", "Containment reports", "Zone classification", "Email support"],
  },
  {
    name: "Industrial Pro",
    price: 499,
    priceId: "price_1U058i2LdYFa7o6rxvtWyEJS",
    tag: "MOST SECURE",
    feats: ["Up to 20 projects", "Advanced Pareto & root-cause", "Billing, payroll & admin suite", "Automated mailing list", "24/7 priority support"],
  },
];

export default function Pricing({
  onNeedAccount,
}: {
  onNeedAccount: () => void;
  onUnlocked: () => void;
}) {
  const { user } = useAuth();
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = (p: Plan) => {
    if (!user) return onNeedAccount();
    setError(null);
    setCheckout(p);
  };

  const pay = async () => {
    if (!checkout) return;
    setPaying(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();

    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ priceId: checkout.priceId, planName: checkout.name }),
      }
    );

    const data = await resp.json();

    if (!resp.ok || !data.url) {
      setError(data.error ?? "Failed to start checkout. Please try again.");
      setPaying(false);
      return;
    }

    // Store plan name so the return page can activate premium without waiting for the webhook
    sessionStorage.setItem("pendingPlan", checkout.name);
    window.location.href = data.url;
  };

  return (
    <Section
      kicker="Premium Access"
      title="One subscription. The whole control room."
      sub="Public visitors see this website. Members log into the live dashboard with their own data — nothing is shared between accounts."
    >
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative flex flex-col rounded-xl border bg-surface p-7 ${p.tag ? "border-accent shadow-[0_0_30px_rgba(245,158,11,0.08)]" : "border-line"}`}
          >
            {p.tag && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-accent px-2 py-0.5 text-[9px] font-black text-accent-ink">
                {p.tag}
              </span>
            )}
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">{p.name}</div>
            <div className="my-3 font-disp text-4xl font-black text-white">
              ${p.price}
              <span className="text-sm font-bold text-ink-soft">/mo</span>
            </div>
            <ul className="mb-6 flex-1 space-y-2.5">
              {p.feats.map((ft) => (
                <li key={ft} className="flex items-start gap-2 text-[13px] text-ink-soft">
                  <Check size={14} className="mt-0.5 shrink-0 text-pass" />
                  {ft}
                </li>
              ))}
            </ul>
            <Btn variant={p.tag ? "solid" : "ghost"} onClick={() => choose(p)}>
              Get Premium
            </Btn>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-600">
        Payments secured by Stripe.
      </p>

      <Modal open={!!checkout} onClose={() => !paying && setCheckout(null)}>
        {checkout && (
          <>
            <ModalTitle>Checkout · {checkout.name}</ModalTitle>
            <p className="mb-4 text-[13px] text-ink-soft">
              ${checkout.price}/mo — billed to {user?.email}.<br />
              You'll be redirected to Stripe's secure payment page.
            </p>
            {error && (
              <p className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</p>
            )}
            <Btn className="w-full" onClick={pay} disabled={paying}>
              <span className="inline-flex items-center justify-center gap-2">
                {paying ? <Lock size={14} /> : <CreditCard size={14} />}
                {paying ? "Redirecting to Stripe…" : `Pay $${checkout.price} & unlock`}
              </span>
            </Btn>
            <p className="mt-3 text-center text-[11px] text-zinc-600">
              🔒 Secured by Stripe — we never see your card details
            </p>
          </>
        )}
      </Modal>
    </Section>
  );
}
