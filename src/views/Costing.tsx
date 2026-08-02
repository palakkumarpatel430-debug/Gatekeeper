import { useState } from "react";
import { FileText } from "lucide-react";
import { useStore } from "../lib/store";
import { KPI } from "../lib/kpi";
import { fmt, money } from "../lib/util";
import { Chart, svgGrouped } from "../components/charts";
import { Btn, ChartCard, Field, Input, Panel, Select } from "../components/ui";

export default function Costing() {
  const { db, toast } = useStore();
  const [failCost, setFailCost] = useState("1500");
  const [budget, setBudget] = useState("15000");
  const [poStatus, setPoStatus] = useState("");

  const a = KPI.aggregate(db.records);
  const totalLabor = db.admin.timelogs.reduce((s, t) => s + (+t.hours || 0) * (+t.rate || 0), 0);
  const savings = a.rework * (+failCost || 1500);
  const b = +budget || 1;
  const pct = Math.min(100, (totalLabor / b) * 100);
  const pos = [...new Set(db.admin.invoices.map((i) => i.po).filter(Boolean))];

  return (
    <>
      <Panel title="Project Costing & ROI" sub="Analyze containment financial impact and manage PO budgets.">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface2 p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">ROI Calculator</div>
            <Field label="Cost of 1 Customer Return ($)">
              <Input type="number" value={failCost} onChange={(e) => setFailCost(e.target.value)} />
            </Field>
            <Field label="Est. Parts Saved (from current data)">
              <b className="font-mono text-white">{fmt(a.rework)}</b>
            </Field>
            <Field label="Total Savings (Avoided Cost)">
              <b className="font-mono text-2xl text-pass">{money(savings)}</b>
            </Field>
            <Field label="Current Sorting Cost (Labor)">
              <b className="font-mono text-fail">{money(totalLabor)}</b>
            </Field>
          </div>
          <div className="rounded-lg border border-line bg-surface2 p-5">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">PO Management</div>
            <Field label="Active PO">
              <Select>{(pos.length ? pos : ["(no POs logged)"]).map((p) => <option key={p}>{p}</option>)}</Select>
            </Field>
            <Field label="PO Total Budget ($)">
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </Field>
            <div className="mt-5 rounded-md border border-line bg-bg p-4">
              <div className="flex justify-between text-xs">
                <span>Budget Burn</span>
                <span className="font-mono">{Math.round(pct)}%</span>
              </div>
              <div className="my-2 h-2 overflow-hidden rounded bg-line">
                <div className="h-full bg-sys transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
                <span>{money(totalLabor)}</span>
                <span>{money(Math.max(0, b - totalLabor))}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Btn
                variant="upload"
                sm
                onClick={() => {
                  toast("Simulating PO OCR extraction...");
                  setTimeout(() => {
                    setPoStatus("PO-2026-MI-001 extracted");
                    toast("PO data linked ✓");
                  }, 1500);
                }}
              >
                <span className="inline-flex items-center gap-1.5"><FileText size={13} /> Upload PO Document</span>
              </Btn>
              <span className="font-mono text-[10px] text-ink-soft">{poStatus}</span>
            </div>
          </div>
        </div>
      </Panel>
      <ChartCard title="Cost Benefit Analysis" sub="Avoided Cost (Savings) vs. Implementation Cost (Labor)">
        <Chart html={svgGrouped(["Project Totals"], [savings], [totalLabor])} />
      </ChartCard>
    </>
  );
}
