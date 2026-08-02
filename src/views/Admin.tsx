import { useState } from "react";
import { Lock } from "lucide-react";
import { useStore } from "../lib/store";
import { money, sha, today, uid } from "../lib/util";
import type { InvoiceStatus } from "../lib/types";
import { Chart, svgGrouped } from "../components/charts";
import { Btn, Empty, Field, Input, KpiCard, Modal, Panel, Select, TableWrap, Tag, Td, Th, ChartCard } from "../components/ui";

type Sub = "summary" | "invoices" | "payroll" | "payments" | "subscriptions";

const SUBS: { id: Sub; label: string }[] = [
  { id: "summary", label: "Billing Summary" },
  { id: "invoices", label: "PO & Invoices" },
  { id: "payroll", label: "Hours / Payroll" },
  { id: "payments", label: "Payments" },
  { id: "subscriptions", label: "Billing & Subscriptions" },
];

export default function Admin() {
  const { db, update, toast } = useStore();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("gk.admin") === "1");
  const [sub, setSub] = useState<Sub>("summary");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [upgrade, setUpgrade] = useState(false);

  const auth = db.admin.auth;

  const go = async () => {
    const u = user.trim() || "admin";
    if (!pass) return toast("Enter a password");
    const h = await sha(pass);
    if (!auth) {
      update((d) => (d.admin.auth = { user: u, hash: h }));
      toast("Admin created ✓");
    } else if (u === auth.user && h === auth.hash) {
      toast("Unlocked ✓");
    } else {
      toast("Wrong username or password");
      return;
    }
    setPass("");
    sessionStorage.setItem("gk.admin", "1");
    setUnlocked(true);
  };

  if (!unlocked) {
    return (
      <div className="mx-auto mt-10 max-w-[420px] text-center">
        <div className="mx-auto mb-3.5 flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-black text-accent">
          <Lock size={24} />
        </div>
        <h2 className="font-disp text-xl font-black uppercase text-white">Admin access</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {auth ? "Enter admin credentials." : "First time: set an admin username & password."}
        </p>
        <div className="my-3.5 rounded-lg border border-accent/25 bg-accent/5 px-3.5 py-2.5 text-left text-[12.5px] text-ink-soft">
          <b className="text-accent">Prototype gate only.</b> This login is client-side and is{" "}
          <b className="text-ink">not real security</b>. Move auth to a server (Supabase/Firebase) before storing
          real billing data. Never enter bank, card, or SSN numbers.
        </div>
        <div className="text-left">
          <Field label="Username"><Input placeholder="admin" value={user} onChange={(e) => setUser(e.target.value)} /></Field>
          <Field label="Password">
            <Input
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go()}
            />
          </Field>
          <Btn className="w-full" onClick={go}>{auth ? "Unlock" : "Create admin"}</Btn>
        </div>
      </div>
    );
  }

  /* ---- ledger math ---- */
  const labor: Record<string, number> = {};
  db.admin.timelogs.forEach((t) => (labor[t.project] = (labor[t.project] || 0) + (+t.hours || 0) * (+t.rate || 0)));
  const inv: Record<string, number> = {};
  db.admin.invoices.forEach((i) => {
    if (i.status !== "Draft") inv[i.project] = (inv[i.project] || 0) + (+i.amount || 0);
  });
  const paid: Record<string, number> = {};
  db.admin.payments.forEach((p) => (paid[p.project] = (paid[p.project] || 0) + (+p.amount || 0)));
  const projects = [...new Set([...Object.keys(labor), ...Object.keys(inv), ...Object.keys(paid)])];
  const totInv = Object.values(inv).reduce((a, b) => a + b, 0);
  const totPaid = Object.values(paid).reduce((a, b) => a + b, 0);
  const totLabor = Object.values(labor).reduce((a, b) => a + b, 0);
  const overdue = db.admin.invoices.filter(
    (i) => i.status === "Overdue" || (i.status !== "Paid" && i.status !== "Draft" && i.due && i.due < today())
  ).length;
  const projectCustomer = (p: string) =>
    db.admin.invoices.find((i) => i.project === p)?.customer ||
    db.records.find((r) => r.project === p)?.customer ||
    "—";

  const projCount = [...new Set(db.records.map((r) => r.project).filter(Boolean))].length;
  const limit = 10;
  const pct = Math.min(100, (projCount / limit) * 100);
  const history = [
    { date: "2026-06-01", desc: "Industrial Pro (Monthly)", amt: 499 },
    { date: "2026-05-01", desc: "Industrial Pro (Monthly)", amt: 499 },
    { date: "2026-04-01", desc: "Industrial Pro (Monthly)", amt: 499 },
    { date: "2026-03-01", desc: "Industrial Pro (Monthly)", amt: 499 },
  ];

  return (
    <>
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {SUBS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSub(s.id)}
              className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition ${
                sub === s.id
                  ? "border-ink bg-ink text-bg"
                  : "border-line bg-surface2 text-ink-soft hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Btn
          variant="ghost"
          sm
          onClick={() => {
            sessionStorage.removeItem("gk.admin");
            setUnlocked(false);
            toast("Locked");
          }}
        >
          <span className="inline-flex items-center gap-1.5">Lock <Lock size={12} /></span>
        </Btn>
      </div>

      {sub === "summary" && (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
            <KpiCard label="Invoiced" value={money(totInv)} note="non-draft" />
            <KpiCard label="Received" value={money(totPaid)} note="payments logged" tone="pass" />
            <KpiCard label="Outstanding" value={money(totInv - totPaid)} note="invoiced − received" tone={totInv - totPaid > 0 ? "warn" : "pass"} />
            <KpiCard label="Labor cost" value={money(totLabor)} note="hours × rate" />
            <KpiCard label="Overdue" value={overdue} note="invoices" tone={overdue ? "fail" : "pass"} />
          </div>
          <ChartCard title="Invoiced vs Received by project" sub="Outstanding = invoiced − received." className="mt-[18px]">
            <Chart
              html={svgGrouped(
                projects.map((p) => (p.length > 10 ? p.slice(0, 9) + "…" : p)),
                projects.map((p) => inv[p] || 0),
                projects.map((p) => paid[p] || 0)
              )}
            />
          </ChartCard>
          <Panel title="Per-project ledger">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Project</Th><Th>Customer</Th><Th num>Labor cost</Th><Th num>Invoiced</Th><Th num>Received</Th><Th num>Outstanding</Th>
                </tr>
              </thead>
              <tbody>
                {projects.length ? (
                  projects.map((p) => {
                    const out = (inv[p] || 0) - (paid[p] || 0);
                    return (
                      <tr key={p}>
                        <Td>{p}</Td>
                        <Td>{projectCustomer(p)}</Td>
                        <Td num>{money(labor[p] || 0)}</Td>
                        <Td num>{money(inv[p] || 0)}</Td>
                        <Td num>{money(paid[p] || 0)}</Td>
                        <Td num className={out > 0 ? "!text-fail" : "!text-pass"}>{money(out)}</Td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan={6}><Empty>Add invoices, hours or payments to see the ledger.</Empty></td></tr>
                )}
              </tbody>
            </TableWrap>
          </Panel>
        </>
      )}

      {sub === "invoices" && <Invoices />}
      {sub === "payroll" && <Payroll />}
      {sub === "payments" && <Payments />}

      {sub === "subscriptions" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Subscription Status" sub="Active project limits and plan details.">
            <div className="flex flex-col gap-3 rounded-lg border border-accent bg-surface2 p-5 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
              <div className="flex items-center justify-between">
                <div>
                  <b className="text-lg text-white">Industrial Pro Plan</b>
                  <br />
                  <small className="text-ink-soft">Michigan Fleet License</small>
                </div>
                <Tag kind="Sent">Active</Tag>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs">
                  <span>Project Capacity</span>
                  <span className="font-mono">{projCount} / {limit}</span>
                </div>
                <div className="my-2.5 h-3 overflow-hidden rounded-md bg-line">
                  <div
                    className={`h-full transition-all duration-500 ${pct > 90 ? "bg-fail" : "bg-accent"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="mt-1 flex gap-3">
                <Btn sm onClick={() => setUpgrade(true)}>Upgrade Capacity</Btn>
                <Btn variant="ghost" sm>Manage Billing</Btn>
              </div>
            </div>
          </Panel>
          <Panel title="Billing History" sub="Past 6 months of service invoices.">
            <TableWrap minW={0}>
              <thead>
                <tr><Th>Date</Th><Th>Description</Th><Th num>Amount</Th><Th /></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.date}>
                    <Td>{h.date}</Td>
                    <Td>{h.desc}</Td>
                    <Td num>{money(h.amt)}</Td>
                    <Td num><Btn variant="ghost" sm onClick={() => toast("Downloading invoice...")}>PDF</Btn></Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Panel>
        </div>
      )}

      {/* Upgrade modal */}
      <Modal open={upgrade} onClose={() => setUpgrade(false)}>
        <div className="py-2 text-center">
          <h2 className="font-disp text-xl font-black uppercase text-white">Scale Your Containment</h2>
          <p className="text-ink-soft">Add project capacity as your sorting volume grows.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { name: "BASIC", price: 349, feats: ["Up to 5 Projects", "Basic Analytics", "Email Support"], cta: "Current Plan", pop: false },
              { name: "INDUSTRIAL PRO", price: 499, feats: ["Up to 20 Projects", "Advanced Pareto & Root-Cause", "24/7 Priority Support"], cta: "Upgrade Now", pop: true },
              { name: "PER-PROJECT", price: 99, feats: ["Pay as you go", "Full Admin access", "Perfect for one-off sorts"], cta: "Select", pop: false },
            ].map((pl) => (
              <div
                key={pl.name}
                className={`relative rounded-lg border p-6 text-center ${pl.pop ? "border-accent" : "border-line"} bg-surface2`}
              >
                {pl.pop && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-accent px-2 py-0.5 text-[9px] font-black text-accent-ink">
                    MOST SECURE
                  </span>
                )}
                <div className="text-[11px] tracking-[0.1em] text-ink-soft">{pl.name}</div>
                <div className="my-2 text-[28px] font-black text-white">
                  ${pl.price}<small className="text-xs">/mo</small>
                </div>
                <div className="mb-5 text-[13px] text-ink-soft">
                  {pl.feats.map((ft) => <div key={ft}>{ft}</div>)}
                </div>
                <Btn
                  variant={pl.pop ? "solid" : "ghost"}
                  sm
                  className="w-full"
                  onClick={() => toast(pl.pop ? "Contacting account manager..." : "Switching plan...")}
                >
                  {pl.cta}
                </Btn>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-ink-soft">All plans subject to Michigan Commercial Compliance standards.</p>
        </div>
      </Modal>
    </>
  );
}

/* ---------- Invoices ---------- */
function Invoices() {
  const { db, update, toast } = useStore();
  const [f, setF] = useState({
    project: "", customer: db.settings.customers[0] || "", po: "", num: "",
    date: "", due: "", amount: "", status: "Draft" as InvoiceStatus,
  });
  const add = () => {
    const amt = +f.amount || 0;
    if (!f.project.trim() || !amt) return toast("Project and amount required");
    update((d) =>
      d.admin.invoices.unshift({
        id: uid(), project: f.project.trim(), customer: f.customer, po: f.po.trim(),
        num: f.num.trim(), date: f.date || today(), due: f.due, amount: amt, status: f.status,
      })
    );
    setF({ ...f, po: "", num: "", amount: "" });
    toast("Invoice added");
  };
  return (
    <>
      <Panel title="Add PO / Invoice">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Project"><Input placeholder="Acme CSL1" value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} /></Field>
          <Field label="Customer">
            <Select value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })}>
              {db.settings.customers.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="PO number"><Input placeholder="PO-..." value={f.po} onChange={(e) => setF({ ...f, po: e.target.value })} /></Field>
          <Field label="Invoice #"><Input placeholder="INV-..." value={f.num} onChange={(e) => setF({ ...f, num: e.target.value })} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Issue date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Due date"><Input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
          <Field label="Amount ($)"><Input type="number" min={0} step="0.01" placeholder="0.00" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as InvoiceStatus })}>
              {["Draft", "Sent", "Paid", "Overdue"].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <Btn onClick={add}>Add invoice</Btn>
      </Panel>
      <Panel title="Invoices">
        <TableWrap>
          <thead>
            <tr>
              <Th>Date</Th><Th>Project</Th><Th>Customer</Th><Th>PO</Th><Th>Invoice</Th><Th num>Amount</Th><Th>Due</Th><Th>Status</Th><Th />
            </tr>
          </thead>
          <tbody>
            {db.admin.invoices.length ? (
              db.admin.invoices.map((i) => (
                <tr key={i.id}>
                  <Td>{i.date}</Td><Td>{i.project}</Td><Td>{i.customer}</Td><Td>{i.po}</Td><Td>{i.num}</Td>
                  <Td num>{money(i.amount)}</Td><Td>{i.due || "—"}</Td>
                  <Td><Tag kind={i.status}>{i.status}</Tag></Td>
                  <Td num>
                    <Btn variant="danger" sm onClick={() => update((d) => (d.admin.invoices = d.admin.invoices.filter((x) => x.id !== i.id)))}>
                      Del
                    </Btn>
                  </Td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={9}><Empty>No invoices yet.</Empty></td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

/* ---------- Payroll ---------- */
function Payroll() {
  const { db, update, toast } = useStore();
  const [f, setF] = useState({ employee: "", project: "", date: "", hours: "", rate: "" });
  const add = () => {
    if (!f.employee.trim() || !+f.hours) return toast("Employee and hours required");
    update((d) =>
      d.admin.timelogs.unshift({
        id: uid(), employee: f.employee.trim(), project: f.project.trim(),
        date: f.date || today(), hours: +f.hours || 0, rate: +f.rate || 0,
      })
    );
    setF({ ...f, hours: "" });
    toast("Hours added");
  };
  return (
    <>
      <Panel title="Log employee hours">
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="Employee"><Input placeholder="name" value={f.employee} onChange={(e) => setF({ ...f, employee: e.target.value })} /></Field>
          <Field label="Project"><Input placeholder="Acme CSL1" value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Hours"><Input type="number" min={0} step="0.25" placeholder="0" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} /></Field>
          <Field label="Rate ($/hr)"><Input type="number" min={0} step="0.01" placeholder="0.00" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
        </div>
        <Btn onClick={add}>Add hours</Btn>
      </Panel>
      <Panel title="Time log">
        <TableWrap>
          <thead>
            <tr><Th>Date</Th><Th>Employee</Th><Th>Project</Th><Th num>Hours</Th><Th num>Rate</Th><Th num>Cost</Th><Th /></tr>
          </thead>
          <tbody>
            {db.admin.timelogs.length ? (
              db.admin.timelogs.map((t) => (
                <tr key={t.id}>
                  <Td>{t.date}</Td><Td>{t.employee}</Td><Td>{t.project}</Td>
                  <Td num>{t.hours}</Td><Td num>{money(t.rate)}</Td>
                  <Td num>{money((+t.hours || 0) * (+t.rate || 0))}</Td>
                  <Td num>
                    <Btn variant="danger" sm onClick={() => update((d) => (d.admin.timelogs = d.admin.timelogs.filter((x) => x.id !== t.id)))}>
                      Del
                    </Btn>
                  </Td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7}><Empty>No hours logged.</Empty></td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}

/* ---------- Payments ---------- */
function Payments() {
  const { db, update, toast } = useStore();
  const [f, setF] = useState({ date: "", project: "", ref: "", amount: "", method: "ACH" });
  const add = () => {
    const amt = +f.amount || 0;
    if (!f.project.trim() || !amt) return toast("Project and amount required");
    update((d) =>
      d.admin.payments.unshift({
        id: uid(), date: f.date || today(), project: f.project.trim(),
        ref: f.ref.trim(), amount: amt, method: f.method,
      })
    );
    setF({ ...f, ref: "", amount: "" });
    toast("Payment recorded");
  };
  return (
    <>
      <Panel title="Record payment received">
        <div className="grid gap-4 md:grid-cols-5">
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Project"><Input placeholder="Acme CSL1" value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })} /></Field>
          <Field label="Invoice ref"><Input placeholder="INV-..." value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} /></Field>
          <Field label="Amount ($)"><Input type="number" min={0} step="0.01" placeholder="0.00" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Method">
            <Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
              {["ACH", "Wire", "Check", "Card", "Other"].map((m) => <option key={m}>{m}</option>)}
            </Select>
          </Field>
        </div>
        <Btn onClick={add}>Record payment</Btn>
      </Panel>
      <Panel title="Payments received">
        <TableWrap>
          <thead>
            <tr><Th>Date</Th><Th>Project</Th><Th>Invoice</Th><Th>Method</Th><Th num>Amount</Th><Th /></tr>
          </thead>
          <tbody>
            {db.admin.payments.length ? (
              db.admin.payments.map((p) => (
                <tr key={p.id}>
                  <Td>{p.date}</Td><Td>{p.project}</Td><Td>{p.ref || "—"}</Td><Td>{p.method}</Td>
                  <Td num>{money(p.amount)}</Td>
                  <Td num>
                    <Btn variant="danger" sm onClick={() => update((d) => (d.admin.payments = d.admin.payments.filter((x) => x.id !== p.id)))}>
                      Del
                    </Btn>
                  </Td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6}><Empty>No payments recorded.</Empty></td></tr>
            )}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
