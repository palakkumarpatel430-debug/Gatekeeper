import { useState } from "react";
import { Check, CreditCard, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Btn, Field, Input, Modal, ModalTitle } from "../components/ui";
import { Section } from "./shared";

export interface Plan {
  name: string;
  price: number;
  tag?: string;
  feats: string[];
}

export const PLANS: Plan[] = [
  {
    name: "Per-Project",
    price: 99,
    feats: ["Pay as you go", "1 active project", "Full sort entry & records", "CSV / JSON export", "Email support"],
  },
  {
    name: "Basic",
    price: 349,
    feats: ["Up to 5 projects", "Analytics dashboard", "Containment reports", "Zone classification", "Email support"],
  },
  {
    name: "Industrial Pro",
    price: 499,
    tag: "MOST SECURE",
    feats: ["Up to 20 projects", "Advanced Pareto & root-cause", "Billing, payroll & admin suite", "Automated mailing list", "24/7 priority support"],
  },
];

export default function Pricing({
  onNeedAccount,
  onUnlocked,
}: {
  onNeedAccount: () => void;
  onUnlocked: () => void;
}) {
  const { user, purchase } = useAuth();
  const [checkout, setCheckout] = useState<Plan | null>(null);
  const [card, setCard] = useState({ num: "", exp: "", cvc: "" });
  const [paying, setPaying] = useState(false);

  const choose = (p: Plan) => {
    if (!user) return onNeedAccount();
    setCheckout(p);
  };

  const pay = () => {
    if (!checkout) return;
    setPaying(true);
    setTimeout(() => {
      purchase(checkout.name);
      setPaying(false);
      setCheckout(null);
      onUnlocked();
    }, 1400);
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
        Demo checkout — no real payment is processed. Production uses Stripe.
      </p>

      <Modal open={!!checkout} onClose={() => !paying && setCheckout(null)}>
        {checkout && (
          <>
            <ModalTitle>Checkout · {checkout.name}</ModalTitle>
            <p className="mb-4 text-[13px] text-ink-soft">
              ${checkout.price}/mo — billed to {user?.email}. This is a simulated payment for the demo.
            </p>
            <Field label="Card number">
              <Input placeholder="4242 4242 4242 4242" value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Expiry"><Input placeholder="12/28" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} /></Field>
              <Field label="CVC"><Input placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} /></Field>
            </div>
            <Btn className="w-full" onClick={pay} disabled={paying}>
              <span className="inline-flex items-center justify-center gap-2">
                {paying ? <Lock size={14} /> : <CreditCard size={14} />}
                {paying ? "Processing…" : `Pay $${checkout.price} & unlock`}
              </span>
            </Btn>
          </>
        )}
      </Modal>
    </Section>
  );
}
