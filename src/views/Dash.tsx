import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { KPI } from "../lib/kpi";
import { fmt } from "../lib/util";
import { Chart, CHART_COLORS, svgBars, svgDonut, svgHeat, svgLine, svgPareto } from "../components/charts";
import { Btn, ChartCard, Field, Input, KpiCard, Select } from "../components/ui";

export default function Dash() {
  const { db } = useStore();
  const [draft, setDraft] = useState({ customer: "", from: "", to: "" });
  const [filter, setFilter] = useState(draft);

  const recs = useMemo(
    () =>
      db.records.filter((r) => {
        if (filter.customer && r.customer !== filter.customer) return false;
        if (filter.from && r.date < filter.from) return false;
        if (filter.to && r.date > filter.to) return false;
        return true;
      }),
    [db.records, filter]
  );

  const a = useMemo(() => KPI.aggregate(recs), [recs]);
  const th = db.settings.threshold;
  const ppmTone = a.ppm > th ? "fail" : a.ppm > th * 0.6 ? "warn" : "pass";

  const { days, ppms, thru, topDef, matrix } = useMemo(() => {
    const byDate: Record<string, typeof recs> = {};
    recs.forEach((r) => (byDate[r.date] = byDate[r.date] || []).push(r));
    const days = Object.keys(byDate).sort().slice(-12);
    const ppms = days.map((d) => KPI.aggregate(byDate[d]).ppm);
    const thru = days.map((d) => KPI.aggregate(byDate[d]).total);
    const topDef = a.pareto.slice(0, 6).map((p) => p.type);
    const matrix = topDef.map((dt) =>
      days.map((d) => {
        let s = 0;
        byDate[d].forEach((r) =>
          (r.defects || []).forEach((x) => {
            if (x.type === dt) s += +x.count || 0;
          })
        );
        return s;
      })
    );
    return { days, ppms, thru, topDef, matrix };
  }, [recs, a]);

  const dayLbl = days.map((d) => d.slice(5));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2.5">
        <Field label="Customer" className="mb-0 min-w-[150px]">
          <Select value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })}>
            <option value="">All customers</option>
            {db.settings.customers.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="From" className="mb-0 min-w-[150px]">
          <Input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </Field>
        <Field label="To" className="mb-0 min-w-[150px]">
          <Input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </Field>
        <Btn variant="ghost" sm onClick={() => setFilter(draft)}>Apply</Btn>
        <Btn variant="ghost" sm onClick={() => { const z = { customer: "", from: "", to: "" }; setDraft(z); setFilter(z); }}>
          Reset
        </Btn>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
        <KpiCard label="PPM" value={fmt(a.ppm)} note={`threshold ${th}`} tone={ppmTone} />
        <KpiCard label="Yield" value={a.yield} unit="%" note="first-pass good" tone={a.yield >= 99 ? "pass" : "warn"} />
        <KpiCard label="Parts saved" value={fmt(a.rework)} note={`${a.savedRate}% of bad`} tone="pass" />
        <KpiCard label="Scrap rate" value={a.scrapRate} unit="%" tone={a.scrapRate > 2 ? "warn" : undefined} />
        <KpiCard label="Throughput" value={a.throughput != null ? fmt(a.throughput) : "—"} unit="/hr" note="parts/hr" />
        <KpiCard label="Avg TAT" value={a.avgTat || "—"} unit="min" note="per box" />
        <KpiCard label="Boxes" value={fmt(a.boxes)} note="sorted" />
        <KpiCard label="Inspected" value={fmt(a.total)} note="total" />
      </div>

      <ChartCard title="PPM Trend" sub="Aggregate PPM by day. Dashed line = customer threshold." className="mt-[18px]">
        <Chart html={svgLine(dayLbl, ppms, th)} />
      </ChartCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Defect Pareto" sub="Bars = count · line = cumulative %. Fix the tallest bar first.">
          <Chart html={svgPareto(a.pareto)} />
        </ChartCard>
        <ChartCard title="Disposition" sub="What happened to inspected parts.">
          <Chart
            html={svgDonut([
              { label: "Good", val: a.good, color: CHART_COLORS.good },
              { label: "Reworked", val: a.rework, color: CHART_COLORS.warn },
              { label: "Scrapped", val: a.scrap, color: CHART_COLORS.fail },
            ])}
          />
        </ChartCard>
      </div>

      <ChartCard title="Defect Matrix (type × day)" sub="Heatmap of where defects concentrate. Darker = more.">
        <Chart html={svgHeat(topDef, dayLbl, matrix)} />
      </ChartCard>

      <ChartCard title="Throughput by day" sub="Parts inspected per day — volume & pace of the containment.">
        <Chart html={svgBars(dayLbl, thru)} />
      </ChartCard>
    </>
  );
}
