import { useMemo, useRef, useState } from "react";
import { Camera, FileSpreadsheet, MapPin, Plus } from "lucide-react";
import { useStore } from "../lib/store";
import { KPI } from "../lib/kpi";
import { uid, today, fmt, downscale } from "../lib/util";
import type { Defect, Loc, SortRecord } from "../lib/types";
import { Btn, Field, Input, Modal, ModalTitle, Panel, Select, Textarea } from "../components/ui";

interface DefRow extends Defect {
  key: string;
}

const CSL_OPTIONS = ["None", "GP 12", "pop up", "CS1", "CS2", "Custom Sort"];

const emptyForm = () => ({
  date: today(),
  customer: "",
  project: "",
  part: "",
  box: "",
  csl: "None",
  cslCustom: "",
  ref: "",
  po: "",
  operator: "",
  total: "",
  rework: "",
  scrap: "",
  start: "",
  end: "",
  notes: "",
});

export default function Entry() {
  const { db, update, toast } = useStore();
  const [f, setF] = useState(() => ({ ...emptyForm(), customer: db.settings.customers[0] || "" }));
  const [defs, setDefs] = useState<DefRow[]>([{ key: uid(), type: "", count: 0 }]);
  const [markRow, setMarkRow] = useState<string | null>(null);
  const [markLoc, setMarkLoc] = useState<Loc | null>(null);
  const photoFor = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof ReturnType<typeof emptyForm>) => (v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const part = db.settings.parts.find((p) => p.part === f.part.trim());
  const zones = part ? part.zones : [];

  const record = useMemo<SortRecord>(() => {
    let csl = f.csl;
    if (csl === "Custom Sort") csl = f.cslCustom.trim() || "Custom";
    return {
      id: uid(),
      date: f.date || today(),
      customer: f.customer,
      project: f.project.trim(),
      part: f.part.trim(),
      box: f.box.trim(),
      csl,
      ref: f.ref.trim(),
      po: f.po.trim(),
      operator: f.operator.trim(),
      total: +f.total || 0,
      defects: defs
        .map((d) => ({ type: d.type.trim(), count: +d.count || 0, zone: d.zone, loc: d.loc, photo: d.photo }))
        .filter((d) => d.type && d.count > 0),
      rework: +f.rework || 0,
      scrap: +f.scrap || 0,
      start: f.start,
      end: f.end,
      notes: f.notes.trim(),
    };
  }, [f, defs]);

  const c = KPI.forRecord(record);
  const hint =
    c.bad > c.total
      ? "⚠ bad > total inspected"
      : record.rework + record.scrap > c.bad && c.bad > 0
        ? "⚠ rework + scrap exceeds bad"
        : "";

  const save = () => {
    if (!record.total) return toast("Enter total inspected");
    if (!record.customer) return toast("Pick a customer");
    update((d) => d.records.unshift(record));
    toast("Saved ✓");
    setF({ ...emptyForm(), customer: f.customer });
    setDefs([{ key: uid(), type: "", count: 0 }]);
  };

  const setDef = (key: string, patch: Partial<DefRow>) =>
    setDefs((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const openMark = (key: string) => {
    if (!part || !part.photo) return toast("Add a reference photo for this part in Setup first");
    setMarkLoc(defs.find((d) => d.key === key)?.loc || null);
    setMarkRow(key);
  };

  const attachPhoto = (key: string) => {
    photoFor.current = key;
    fileRef.current?.click();
  };

  const simulate = (type: string) => {
    toast(`Simulating ${type} upload...`);
    setTimeout(() => toast(`${type} processed successfully`), 1200);
  };

  const pos = [...new Set(db.admin.invoices.map((i) => i.po).filter(Boolean))];

  return (
    <>
      {/* live preview bar */}
      <div className="mb-4 flex flex-wrap gap-x-8 gap-y-3 rounded-lg bg-black px-5 py-4">
        {[
          { v: c.total ? fmt(c.ppm) : "—", l: "PPM", cls: "text-white" },
          { v: c.total ? c.yield + "%" : "—", l: "Yield %", cls: "text-pass-soft" },
          { v: c.total ? fmt(c.bad) : "—", l: "Bad parts", cls: "text-fail-soft" },
          { v: fmt(c.saved), l: "Parts saved", cls: "text-white" },
          { v: c.tat != null ? String(c.tat) : "—", l: "TAT (min)", cls: "text-white" },
        ].map((x) => (
          <div key={x.l} className="flex flex-col">
            <b className={`font-mono text-[22px] font-semibold tabular-nums ${x.cls}`}>{x.v}</b>
            <span className="text-[10px] uppercase tracking-[0.08em] text-[#b7b0a0]">{x.l}</span>
          </div>
        ))}
      </div>

      <Panel title="Log a sort box" sub="Enter only the raw counts. Every KPI is calculated for you.">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Field label="Date"><Input type="date" value={f.date} onChange={(e) => set("date")(e.target.value)} /></Field>
          <Field label="Customer">
            <Select value={f.customer} onChange={(e) => set("customer")(e.target.value)}>
              {db.settings.customers.map((cu) => <option key={cu}>{cu}</option>)}
            </Select>
          </Field>
          <Field label="Project"><Input placeholder="e.g. Acme CSL1" value={f.project} onChange={(e) => set("project")(e.target.value)} /></Field>
          <Field label="Part number"><Input placeholder="e.g. 44781-A" value={f.part} onChange={(e) => set("part")(e.target.value)} list="partOptions" /></Field>
          <Field label="Box / lot #"><Input placeholder="e.g. BX-0042" value={f.box} onChange={(e) => set("box")(e.target.value)} /></Field>
        </div>
        <datalist id="partOptions">
          {db.settings.parts.map((p) => <option key={p.part} value={p.part} />)}
        </datalist>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Field label="Containment level">
            <Select value={f.csl} onChange={(e) => set("csl")(e.target.value)}>
              {CSL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </Select>
          </Field>
          {f.csl === "Custom Sort" && (
            <Field label="Custom Sort Label">
              <Input placeholder="e.g. Special Check" value={f.cslCustom} onChange={(e) => set("cslCustom")(e.target.value)} />
            </Field>
          )}
          <Field label="Complaint ref"><Input placeholder="optional" value={f.ref} onChange={(e) => set("ref")(e.target.value)} /></Field>
          <Field label="PO number">
            <Input placeholder="PO-..." value={f.po} onChange={(e) => set("po")(e.target.value)} list="poOptions" />
            <datalist id="poOptions">
              {(pos.length ? pos : ["pending", "optional", "NA"]).map((p) => <option key={p} value={p} />)}
            </datalist>
          </Field>
          <Field label="Operator"><Input placeholder="name / badge" value={f.operator} onChange={(e) => set("operator")(e.target.value)} /></Field>
          <Field label="Total inspected"><Input type="number" min={0} placeholder="0" value={f.total} onChange={(e) => set("total")(e.target.value)} /></Field>
        </div>

        <Field label="Defects found (by type)">
          <div className="mb-2 space-y-2">
            {defs.map((d) => (
              <div key={d.key} className="grid grid-cols-[1fr_90px_1fr_34px_34px_34px] items-center gap-2">
                <Select value={d.type} onChange={(e) => setDef(d.key, { type: e.target.value })}>
                  <option value="">— defect —</option>
                  {db.settings.defects.map((t) => <option key={t}>{t}</option>)}
                </Select>
                <Input type="number" min={0} placeholder="count" value={d.count || ""} onChange={(e) => setDef(d.key, { count: +e.target.value || 0 })} />
                <Select value={d.zone || ""} onChange={(e) => setDef(d.key, { zone: e.target.value })}>
                  <option value="">— zone —</option>
                  {zones.map((z) => <option key={z.id}>{z.label}</option>)}
                </Select>
                <button
                  title="mark location on photo"
                  onClick={() => openMark(d.key)}
                  className={`flex h-[34px] items-center justify-center rounded-lg border ${d.loc ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface2 text-ink-soft hover:text-white"}`}
                >
                  <MapPin size={15} />
                </button>
                <button
                  title="attach defect photo"
                  onClick={() => attachPhoto(d.key)}
                  className={`flex h-[34px] items-center justify-center rounded-lg border ${d.photo ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface2 text-ink-soft hover:text-white"}`}
                >
                  <Camera size={15} />
                </button>
                <button
                  title="remove"
                  onClick={() => setDefs((rows) => rows.filter((r) => r.key !== d.key))}
                  className="flex h-[34px] items-center justify-center rounded-lg border border-line bg-surface2 font-bold text-fail"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Btn variant="ghost" sm onClick={() => setDefs((r) => [...r, { key: uid(), type: "", count: 0 }])}>
            <span className="inline-flex items-center gap-1"><Plus size={13} /> Add defect type</span>
          </Btn>
        </Field>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !photoFor.current) return;
            const data = await downscale(file, 600, 0.5);
            setDef(photoFor.current, { photo: data });
            toast("Photo attached");
            e.target.value = "";
          }}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Reworked / saved"><Input type="number" min={0} placeholder="0" value={f.rework} onChange={(e) => set("rework")(e.target.value)} /></Field>
          <Field label="Scrapped"><Input type="number" min={0} placeholder="0" value={f.scrap} onChange={(e) => set("scrap")(e.target.value)} /></Field>
          <Field label="Start time"><Input type="time" value={f.start} onChange={(e) => set("start")(e.target.value)} /></Field>
          <Field label="End time"><Input type="time" value={f.end} onChange={(e) => set("end")(e.target.value)} /></Field>
        </div>
        <Field label="Notes"><Textarea rows={2} placeholder="optional" value={f.notes} onChange={(e) => set("notes")(e.target.value)} /></Field>

        <div className="flex flex-wrap items-center gap-3">
          <Btn onClick={save}>Save sort record</Btn>
          <Btn variant="ghost" onClick={() => { setF({ ...emptyForm(), customer: f.customer }); setDefs([{ key: uid(), type: "", count: 0 }]); }}>
            Clear
          </Btn>
          <div className="flex-1" />
          <Btn variant="upload" sm onClick={() => simulate("Picture")}>
            <span className="inline-flex items-center gap-1.5"><Camera size={13} /> Upload Picture</span>
          </Btn>
          <Btn variant="upload" sm onClick={() => simulate("Excel")}>
            <span className="inline-flex items-center gap-1.5"><FileSpreadsheet size={13} /> Upload Excel</span>
          </Btn>
          {hint && <span className="font-mono text-xs text-fail">{hint}</span>}
        </div>
      </Panel>

      {/* Mark-location modal */}
      <Modal open={!!markRow} onClose={() => setMarkRow(null)}>
        <ModalTitle>Mark defect location</ModalTitle>
        <p className="mb-3 text-[13px] text-ink-soft">
          Tap the exact spot on {part?.part} where the defect is.
        </p>
        {part?.photo && (
          <div
            className="relative w-full cursor-crosshair overflow-hidden rounded-lg border border-line leading-[0]"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setMarkLoc({
                x: +(((e.clientX - r.left) / r.width) * 100).toFixed(1),
                y: +(((e.clientY - r.top) / r.height) * 100).toFixed(1),
              });
            }}
          >
            <img src={part.photo} className="w-full" draggable={false} alt="" />
            {markLoc && (
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-fail opacity-90 shadow"
                style={{ left: `${markLoc.x}%`, top: `${markLoc.y}%` }}
              />
            )}
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <Btn
            onClick={() => {
              if (markRow) setDef(markRow, { loc: markLoc });
              setMarkRow(null);
              if (markLoc) toast("Location set");
            }}
          >
            Done
          </Btn>
          <Btn variant="ghost" onClick={() => setMarkLoc(null)}>Clear</Btn>
        </div>
      </Modal>
    </>
  );
}
