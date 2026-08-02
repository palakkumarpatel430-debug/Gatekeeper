import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { today } from "../lib/util";
import type { Loc } from "../lib/types";
import { Btn, ChartCard, Empty, Field, Input, Panel, Select } from "../components/ui";

export default function RootCause() {
  const { db } = useStore();
  const parts = db.settings.parts.map((p) => p.part);
  const [draft, setDraft] = useState({ part: parts[0] || "", from: "", to: today() });
  const [filter, setFilter] = useState(draft);

  const part = db.settings.parts.find((p) => p.part === filter.part);

  const { recs, pts, zarr, tot, topType } = useMemo(() => {
    const recs = db.records.filter(
      (r) => r.part === filter.part && (!filter.from || r.date >= filter.from) && (!filter.to || r.date <= filter.to)
    );
    const pts: Loc[] = [];
    const zoneMap: Record<string, number> = {};
    const topType: Record<string, Record<string, number>> = {};
    recs.forEach((r) =>
      (r.defects || []).forEach((d) => {
        if (d.loc) pts.push({ ...d.loc });
        if (d.zone) {
          zoneMap[d.zone] = (zoneMap[d.zone] || 0) + (+d.count || 0);
          topType[d.zone] = topType[d.zone] || {};
          topType[d.zone][d.type] = (topType[d.zone][d.type] || 0) + (+d.count || 0);
        }
      })
    );
    const zarr = Object.entries(zoneMap)
      .map(([zone, count]) => ({ zone, count }))
      .sort((a, b) => b.count - a.count);
    const tot = zarr.reduce((a, b) => a + b.count, 0);
    return { recs, pts, zarr, tot, topType };
  }, [db.records, filter]);

  const max = zarr[0]?.count || 0;
  const top = zarr[0];
  const td = top
    ? Object.entries(topType[top.zone] || {}).sort((a, b) => b[1] - a[1])[0]
    : undefined;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-2.5">
        <Field label="Part" className="mb-0 min-w-[150px]">
          <Select value={draft.part} onChange={(e) => setDraft({ ...draft, part: e.target.value })}>
            {(parts.length ? parts : ["(no parts defined)"]).map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="From" className="mb-0 min-w-[150px]">
          <Input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </Field>
        <Field label="To" className="mb-0 min-w-[150px]">
          <Input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </Field>
        <Btn variant="ghost" sm onClick={() => setFilter(draft)}>Apply</Btn>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Defect Location Map" sub="Every reported defect, plotted on the reference photo. Clusters point to the cause.">
          <div className="relative min-h-[160px] overflow-hidden rounded-lg bg-[#111113]">
            {part?.photo ? (
              <div className="relative w-full leading-[0]">
                <img src={part.photo} className="w-full" alt="" />
                {part.zones.map((z, j) => (
                  <div
                    key={z.id}
                    className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent text-[10px] font-bold text-white shadow"
                    style={{ left: `${z.x}%`, top: `${z.y}%` }}
                  >
                    {j + 1}
                  </div>
                ))}
                {pts.map((p, i) => (
                  <div
                    key={i}
                    className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-fail opacity-85 shadow"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  />
                ))}
              </div>
            ) : (
              <Empty>Select a part that has a reference photo (set in Setup).</Empty>
            )}
          </div>
          <div className="mt-2.5 flex gap-4 text-[11px] uppercase tracking-[0.05em] text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-fail" />defect location</span>
            <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" />defined zone</span>
          </div>
        </ChartCard>

        <ChartCard title="Defects by Zone" sub="Which zone is hurting you most.">
          {zarr.length ? (
            <div className="space-y-2.5">
              {zarr.map((z) => (
                <div key={z.zone} className="grid grid-cols-[110px_1fr_90px] items-center gap-2.5">
                  <div className="truncate text-[13px] text-ink" title={z.zone}>{z.zone}</div>
                  <div className="h-3.5 overflow-hidden rounded border border-surface2 bg-[#1c1c1f]">
                    <div className="h-full bg-accent" style={{ width: `${max ? (z.count / max) * 100 : 0}%` }} />
                  </div>
                  <div className="text-right font-mono text-xs text-ink-soft">
                    {z.count} · {tot ? Math.round((z.count / tot) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No zone-tagged defects yet for this part.</Empty>
          )}
        </ChartCard>
      </div>

      <Panel
        title={<span className="inline-flex items-center gap-2"><Sparkles size={14} className="text-accent" /> AI Root-Cause Read</span>}
        sub="Auto-drafted from the location data. Edit before sharing."
        className="border-l-4 border-l-accent"
      >
        <div className="text-sm leading-relaxed text-ink-soft">
          {top ? (
            <>
              Across {recs.length} sort record(s) for {filter.part}, defects concentrate in "{top.zone}" —{" "}
              {tot ? Math.round((top.count / tot) * 100) : 0}% of zone-tagged defects ({top.count} parts).{" "}
              {td ? `The dominant mode there is "${td[0]}". ` : ""}A concentration this tight usually points to a
              single source feeding that location (tooling / fixture / operation at "{top.zone}"). Recommend
              inspecting the process step that forms that feature and confirming with a focused 5-Why before broad
              corrective action.
            </>
          ) : (
            "No zone-tagged defects in range yet. Tag zones on the Sort Entry defect rows to populate this."
          )}
        </div>
      </Panel>
    </>
  );
}
