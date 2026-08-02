import { BarChart3, ClipboardList, DollarSign, FileText, Crosshair, ShieldCheck } from "lucide-react";
import { Chart, svgHeat, svgLine, svgPareto } from "../components/charts";
import { BrowserFrame, Section } from "./shared";

/* Mock "screenshots" rendered with the real chart engine — no customer data. */

const days = ["05-12", "05-19", "05-26", "06-02", "06-09", "06-16", "06-23", "06-30", "07-07", "07-14"];
const ppms = [41200, 38400, 35100, 33800, 30900, 29500, 27200, 26800, 24100, 22600];
const pareto = [
  { type: "Scratch/Surface", count: 843, pct: 34.4, cum: 34.4 },
  { type: "Breakage", count: 419, pct: 17.1, cum: 51.5 },
  { type: "Edge Chip", count: 379, pct: 15.5, cum: 67.0 },
  { type: "Paint", count: 176, pct: 7.2, cum: 74.2 },
  { type: "Contamination", count: 167, pct: 6.8, cum: 81.0 },
  { type: "Bubbles/Air", count: 119, pct: 4.9, cum: 85.9 },
];
const heatRows = ["Scratch/Surface", "Breakage", "Edge Chip", "Paint"];
const heatCols = ["Z1", "Z2", "Z3", "Z5", "Z10", "Z11"];
const heatM = [
  [420, 260, 130, 180, 510, 250],
  [310, 120, 90, 60, 280, 160],
  [180, 210, 70, 110, 300, 190],
  [90, 40, 30, 45, 120, 80],
];

const FEATURES = [
  {
    icon: ClipboardList,
    name: "Sort Entry",
    line: "Log raw counts — every KPI calculated for you",
    bullets: ["Defect type + zone + photo per find", "Live PPM / yield / TAT preview", "CS1 · CS2 · GP-12 · custom levels"],
  },
  {
    icon: BarChart3,
    name: "Analytics Dashboard",
    line: "The control room your customer wishes you had",
    bullets: ["PPM trend vs threshold", "Defect Pareto & disposition", "Zone heatmap & throughput"],
  },
  {
    icon: Crosshair,
    name: "Root Cause",
    line: "Clusters point to the cause",
    bullets: ["Defects plotted on the part photo", "Defects-by-zone ranking", "Auto-drafted root-cause narrative"],
  },
  {
    icon: FileText,
    name: "Containment Reports",
    line: "The report CSL forces you to produce — in one click",
    bullets: ["Customer-facing, print-ready", "AI narrative with cost avoided", "Signature blocks built in"],
  },
  {
    icon: DollarSign,
    name: "Billing & Admin",
    line: "From sort box to invoice without spreadsheets",
    bullets: ["PO, invoices, payroll, payments", "Per-project ledger & outstanding", "Password-gated admin area"],
  },
  {
    icon: ShieldCheck,
    name: "Compliance Ready",
    line: "Speak your OEM's language",
    bullets: ["IATF 16949-aligned records", "MIOSHA-aware workflows", "CSV / JSON export of everything"],
  },
];

export default function Features() {
  return (
    <>
      <Section
        kicker="The Premium Control Room"
        title={<>Everything between the sort table and the invoice</>}
        sub="What paying members see when they log in — powered by the same engine that runs your sorts, without exposing a single customer part number to the public."
      >
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.name} className="rounded-lg border border-line bg-surface p-6 transition hover:border-accent/40">
              <f.icon size={22} className="text-accent" />
              <h3 className="mt-3 font-disp text-base font-black uppercase tracking-wide text-white">{f.name}</h3>
              <p className="mt-1 text-[13px] font-semibold text-ink">{f.line}</p>
              <ul className="mt-3 space-y-1.5">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13px] text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section
        kicker="Screenshots"
        title="Inside the member dashboard"
        sub="Rendered live by the same hand-drawn SVG chart engine members use — shown here with sample data."
      >
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <BrowserFrame label="PPM trend">
            <Chart html={svgLine(days, ppms, 25000)} />
          </BrowserFrame>
          <BrowserFrame label="Defect pareto">
            <Chart html={svgPareto(pareto)} />
          </BrowserFrame>
          <BrowserFrame label="Zone heatmap">
            <Chart html={svgHeat(heatRows, heatCols, heatM)} />
          </BrowserFrame>
          <BrowserFrame label="Live overview">
            {/* KPI tiles — how the member dashboard actually greets you */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "PPM", v: "22,600", u: "", n: "▼ 45% in 90 days", tone: "bg-pass" },
                { l: "Yield", v: "97.0", u: "%", n: "first-pass good", tone: "bg-pass" },
                { l: "Parts saved", v: "5,741", u: "", n: "49.9% of bad", tone: "bg-pass" },
                { l: "Boxes", v: "248", u: "", n: "sorted", tone: "bg-line" },
                { l: "Throughput", v: "512", u: "/hr", n: "parts/hr", tone: "bg-line" },
                { l: "Scrap rate", v: "0.98", u: "%", n: "▲ watch", tone: "bg-accent" },
              ].map((k) => (
                <div key={k.l} className="relative overflow-hidden rounded-md border border-line bg-bg p-2.5">
                  <span className={`absolute bottom-0 left-0 top-0 w-[3px] ${k.tone}`} />
                  <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-ink-soft">{k.l}</div>
                  <div className="mt-1 font-mono text-lg font-semibold leading-none text-white tabular-nums">
                    {k.v}
                    <span className="ml-0.5 text-[10px] text-ink-soft">{k.u}</span>
                  </div>
                  <div className="mt-1 font-mono text-[8px] uppercase text-ink-soft">{k.n}</div>
                </div>
              ))}
            </div>
            {/* ranked defects — top offenders at a glance */}
            <div className="mt-2 rounded-md border border-line bg-bg p-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-ink-soft">Top defects · latest 30 days</span>
                <span className="font-mono text-[8px] uppercase text-sys">view all →</span>
              </div>
              {[
                { t: "Scratch/Surface", c: 843, w: 100 },
                { t: "Breakage", c: 419, w: 50 },
                { t: "Edge Chip", c: 379, w: 45 },
                { t: "Paint", c: 176, w: 21 },
              ].map((d, i) => (
                <div key={d.t} className="mt-1 grid grid-cols-[14px_92px_1fr_38px] items-center gap-1.5">
                  <span className="font-mono text-[9px] text-ink-soft">{i + 1}</span>
                  <span className="truncate text-[10px] text-ink">{d.t}</span>
                  <span className="h-2 overflow-hidden rounded-sm bg-surface2">
                    <span className="block h-full rounded-sm bg-accent" style={{ width: `${d.w}%` }} />
                  </span>
                  <span className="text-right font-mono text-[9px] text-ink-soft tabular-nums">{d.c}</span>
                </div>
              ))}
            </div>
          </BrowserFrame>
        </div>
      </Section>
    </>
  );
}
