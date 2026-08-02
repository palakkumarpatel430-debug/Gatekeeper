import { useState } from "react";
import { Sparkles, Printer } from "lucide-react";
import { useStore } from "../lib/store";
import { KPI, type Aggregate } from "../lib/kpi";
import { fmt, money, today } from "../lib/util";
import { Btn, Empty, Field, Input, Panel, Select } from "../components/ui";

interface ReportData {
  title: string;
  cust: string;
  parts: string;
  csl: string;
  period: string;
  by: string;
  a: Aggregate;
  th: number;
  cost: number;
  val: number;
  narr: string;
}

function generateNarrative(a: Aggregate, cust: string, th: number, cost: number, csl: string): string {
  const top = a.pareto[0];
  const status = a.ppm <= th ? "within" : "above";
  let s = `During this containment for ${cust}, ${fmt(a.total)} parts were 100% inspected across ${a.boxes} box(es). `;
  s += `${fmt(a.bad)} nonconforming parts were detected, yielding ${fmt(a.ppm)} PPM — ${status} the customer threshold of ${fmt(th)}. `;
  if (top) s += `The dominant failure mode was "${top.type}" (${top.pct}% of defects), the focus for corrective action. `;
  s += `Of the defective parts, ${fmt(a.rework)} were recovered through rework (${a.savedRate}% saved) and ${fmt(a.scrap)} scrapped. `;
  if (cost > 0) s += `This represents an estimated ${money(cost)} in scrap cost avoided. `;
  s += `First-pass yield for shipped product was ${a.yield}%` + (csl !== "None" ? ` under ${csl}.` : ".");
  return s;
}

export default function Report() {
  const { db } = useStore();
  const [f, setF] = useState({
    customer: "",
    from: "",
    to: today(),
    value: "",
    by: "",
    title: "Controlled Shipping Containment Report",
  });
  const [rep, setRep] = useState<ReportData | null>(null);
  const [none, setNone] = useState(false);

  const build = (withAi: boolean) => {
    const recs = db.records.filter(
      (r) => (!f.customer || r.customer === f.customer) && (!f.from || r.date >= f.from) && (!f.to || r.date <= f.to)
    );
    if (!recs.length) {
      setRep(null);
      setNone(true);
      return;
    }
    setNone(false);
    const a = KPI.aggregate(recs);
    const th = db.settings.threshold;
    const cust = f.customer || "All customers";
    const val = +f.value || 0;
    const cost = a.rework * val;
    const parts = [...new Set(recs.map((r) => r.part).filter(Boolean))].join(", ") || "—";
    const csl = [...new Set(recs.map((r) => r.csl))].filter((x) => x !== "None").join(", ") || "None";
    const period = (f.from || "start") + " → " + (f.to || "today");
    const narr = withAi
      ? generateNarrative(a, cust, th, cost, csl)
      : "Click “✦ AI narrative” to auto-write the summary, or type your own.";
    setRep({ title: f.title || "Containment Report", cust, parts, csl, period, by: f.by, a, th, cost, val, narr });
  };

  return (
    <>
      <Panel
        title="Generate containment report"
        sub="The customer-facing report CSL forces you to produce."
        className="print:hidden"
      >
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Customer">
            <Select value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })}>
              <option value="">All customers</option>
              {db.settings.customers.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="From"><Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="To"><Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
          <Field label="$ value per saved part"><Input type="number" min={0} step="0.01" placeholder="0.00" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Prepared by"><Input placeholder="your name" value={f.by} onChange={(e) => setF({ ...f, by: e.target.value })} /></Field>
          <Field label="Report title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={() => build(false)}>Generate report</Btn>
          <Btn variant="ghost" onClick={() => build(true)}>
            <span className="inline-flex items-center gap-1.5"><Sparkles size={14} className="text-accent" /> AI narrative</span>
          </Btn>
          <Btn variant="ghost" onClick={() => window.print()}>
            <span className="inline-flex items-center gap-1.5"><Printer size={14} /> Print / PDF</span>
          </Btn>
        </div>
      </Panel>

      <div id="reportOut" className="rounded-lg border border-line bg-white p-8 text-zinc-900 print:border-0 print:p-0">
        {!rep && (
          <Empty>{none ? "No records match those filters." : "Generate a report to preview it here."}</Empty>
        )}
        {rep && (
          <>
            <div className="mb-4 flex flex-wrap justify-between gap-3 border-b-[3px] border-black pb-3.5">
              <div>
                <h1 className="font-disp text-2xl font-black uppercase">{rep.title}</h1>
                <div className="text-sm text-zinc-500">{rep.cust} · Part(s): {rep.parts}</div>
              </div>
              <div className="text-right font-mono text-xs text-zinc-500">
                CSL: {rep.csl}<br />Period: {rep.period}<br />Prepared by: {rep.by || "—"}<br />Issued: {today()}
              </div>
            </div>
            <div className="my-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
              {[
                ["PPM", fmt(rep.a.ppm)],
                ["Threshold", fmt(rep.th)],
                ["Yield", rep.a.yield + "%"],
                ["Inspected", fmt(rep.a.total)],
                ["Bad found", fmt(rep.a.bad)],
                ["Parts saved", fmt(rep.a.rework)],
                ["Scrapped", fmt(rep.a.scrap)],
                ...(rep.val ? [["Cost avoided", money(rep.cost)]] : []),
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-lg border border-zinc-300 p-3">
                  <div className="text-[11px] uppercase tracking-[0.05em] text-zinc-500">{l}</div>
                  <div className="font-mono text-[22px] font-semibold">{v}</div>
                </div>
              ))}
            </div>
            <div className="my-4 rounded-r-lg border-l-[3px] border-accent bg-zinc-100 px-4 py-3.5 text-sm">
              {rep.narr}
            </div>
            <h3 className="mb-2 font-disp text-sm font-black uppercase tracking-[0.05em]">Defect breakdown</h3>
            <div className="overflow-x-auto rounded-lg border border-zinc-300">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {["Defect", "Count", "% of bad", "Cumulative %"].map((h, i) => (
                      <th key={h} className={`border-b border-zinc-300 bg-zinc-100 px-3.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-zinc-500 ${i ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rep.a.pareto.length ? (
                    rep.a.pareto.map((p) => (
                      <tr key={p.type}>
                        <td className="border-b border-zinc-200 px-3.5 py-2.5">{p.type}</td>
                        <td className="border-b border-zinc-200 px-3.5 py-2.5 text-right font-mono">{fmt(p.count)}</td>
                        <td className="border-b border-zinc-200 px-3.5 py-2.5 text-right font-mono">{p.pct}%</td>
                        <td className="border-b border-zinc-200 px-3.5 py-2.5 text-right font-mono">{p.cum}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-6 text-center text-zinc-400">No defects.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-7 flex flex-wrap justify-between gap-8">
              <div className="min-w-[180px] flex-1 border-t border-zinc-800 pt-1.5 text-xs text-zinc-500">
                Supplier signature / date
              </div>
              <div className="min-w-[180px] flex-1 border-t border-zinc-800 pt-1.5 text-xs text-zinc-500">
                Customer SQE signature / date
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
