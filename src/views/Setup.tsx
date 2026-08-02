import { useRef, useState } from "react";
import { Camera, FileSpreadsheet } from "lucide-react";
import { useStore } from "../lib/store";
import { downscale, uid } from "../lib/util";
import { Btn, Empty, Field, Input, Modal, ModalTitle, Panel, Pill, Select, Tag } from "../components/ui";

export default function Setup() {
  const { db, update, toast } = useStore();
  const [newCustomer, setNewCustomer] = useState("");
  const [newDefect, setNewDefect] = useState("");
  const [newPart, setNewPart] = useState("");
  const [threshold, setThreshold] = useState(String(db.settings.threshold));
  const [mail, setMail] = useState({ email: "", name: "", freq: "Daily Summary" });
  const [zoneEditor, setZoneEditor] = useState<string | null>(null);
  const photoFor = useRef<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const s = db.settings;
  const editPart = s.parts.find((p) => p.part === zoneEditor);

  const simulate = (type: string) => {
    toast(`Simulating ${type} upload...`);
    setTimeout(() => toast(`${type} processed successfully`), 1200);
  };

  return (
    <>
      <Panel title="Customers" sub="Who you sort for.">
        <div className="mb-3">
          {s.customers.length
            ? s.customers.map((c) => (
                <Pill key={c} onRemove={() => update((d) => (d.settings.customers = d.settings.customers.filter((x) => x !== c)))}>
                  {c}
                </Pill>
              ))
            : <span className="text-ink-soft">none</span>}
        </div>
        <div className="flex gap-3">
          <Input placeholder="Add customer" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)} className="max-w-[280px]" />
          <Btn sm onClick={() => {
            const v = newCustomer.trim();
            if (!v) return;
            update((d) => { if (!d.settings.customers.includes(v)) d.settings.customers.push(v); });
            setNewCustomer("");
          }}>
            Add
          </Btn>
        </div>
      </Panel>

      <Panel title="Defect catalog" sub="Standardize defect names so the Pareto & heatmap stay clean.">
        <div className="mb-3">
          {s.defects.map((dd) => (
            <Pill key={dd} onRemove={() => update((d) => (d.settings.defects = d.settings.defects.filter((x) => x !== dd)))}>
              {dd}
            </Pill>
          ))}
        </div>
        <div className="flex gap-3">
          <Input placeholder="Add defect type" value={newDefect} onChange={(e) => setNewDefect(e.target.value)} className="max-w-[280px]" />
          <Btn sm onClick={() => {
            const v = newDefect.trim();
            if (!v) return;
            update((d) => { if (!d.settings.defects.includes(v)) d.settings.defects.push(v); });
            setNewDefect("");
          }}>
            Add
          </Btn>
        </div>
      </Panel>

      <Panel
        title="Parts & Zones"
        sub="Define each part once: add a reference photo, then tap to drop named zones. Inspectors reuse the same map so location data is consistent and trend-able."
      >
        <div className="mb-3 flex gap-3">
          <Input placeholder="Part number e.g. 44781-A" value={newPart} onChange={(e) => setNewPart(e.target.value)} className="max-w-[240px]" />
          <Btn sm onClick={() => {
            const v = newPart.trim();
            if (!v) return;
            if (s.parts.some((p) => p.part === v)) return toast("Part already exists");
            update((d) => d.settings.parts.push({ part: v, photo: "", zones: [] }));
            setNewPart("");
          }}>
            Add part
          </Btn>
        </div>
        {s.parts.length ? (
          s.parts.map((p) => (
            <div key={p.part} className="mb-2.5 flex items-center gap-3.5 rounded-[10px] border border-line bg-surface2 p-3">
              {p.photo ? (
                <img src={p.photo} className="h-[60px] w-[84px] rounded-md border border-line bg-[#111113] object-cover" alt="" />
              ) : (
                <div className="flex h-[60px] w-[84px] items-center justify-center rounded-md border border-line bg-[#111113] text-ink-soft">
                  <Camera size={18} />
                </div>
              )}
              <div className="flex-1">
                <b className="font-mono text-white">{p.part}</b>
                <div className="text-xs text-ink-soft">
                  {p.zones.length} zone(s){p.photo ? "" : " · no photo yet"}
                </div>
              </div>
              <Btn variant="ghost" sm onClick={() => (p.photo ? setZoneEditor(p.part) : toast("Attach a photo for this part first"))}>
                Edit zones
              </Btn>
              <Btn variant="ghost" sm onClick={() => { photoFor.current = p.part; fileRef.current?.click(); }}>
                Photo
              </Btn>
              <Btn variant="danger" sm onClick={() => update((d) => (d.settings.parts = d.settings.parts.filter((x) => x.part !== p.part)))}>
                Del
              </Btn>
            </div>
          ))
        ) : (
          <Empty>No parts yet. Add one above, attach a photo, then drop zones.</Empty>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !photoFor.current) return;
            const data = await downscale(file, 800, 0.6);
            const key = photoFor.current;
            update((d) => {
              const p = d.settings.parts.find((x) => x.part === key);
              if (p) p.photo = data;
            });
            toast("Photo saved");
            e.target.value = "";
          }}
        />
      </Panel>

      <Panel title="Bulk Import & Media" sub="Upload multiple parts or setup data via Excel, or sync bulk reference photos.">
        <div className="flex gap-3">
          <Btn variant="upload" sm onClick={() => simulate("Bulk Media")}>
            <span className="inline-flex items-center gap-1.5"><Camera size={13} /> Upload Picture(s)</span>
          </Btn>
          <Btn variant="upload" sm onClick={() => simulate("Bulk Excel")}>
            <span className="inline-flex items-center gap-1.5"><FileSpreadsheet size={13} /> Upload Excel File</span>
          </Btn>
        </div>
      </Panel>

      <Panel title="Automated Mailing List" sub="Configure recipients for automated reports and containment alerts.">
        <div className="mb-3">
          {s.mailingList.length ? (
            s.mailingList.map((m, i) => (
              <div key={m.email + i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3 border-b border-line p-2">
                <div>
                  <b className="text-white">{m.name}</b>
                  <br />
                  <small className="text-ink-soft">{m.email}</small>
                </div>
                <div><Tag kind="Sent">{m.freq}</Tag></div>
                <Btn variant="danger" sm onClick={() => update((d) => d.settings.mailingList.splice(i, 1))}>
                  Remove
                </Btn>
              </div>
            ))
          ) : (
            <Empty>No recipients configured.</Empty>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Email Address"><Input placeholder="e.g. sqe@customer.com" value={mail.email} onChange={(e) => setMail({ ...mail, email: e.target.value })} /></Field>
          <Field label="Name / Dept"><Input placeholder="e.g. Quality Team" value={mail.name} onChange={(e) => setMail({ ...mail, name: e.target.value })} /></Field>
          <Field label="Frequency">
            <Select value={mail.freq} onChange={(e) => setMail({ ...mail, freq: e.target.value })}>
              {["Daily Summary", "Per Box Alert", "Weekly Report"].map((fq) => <option key={fq}>{fq}</option>)}
            </Select>
          </Field>
        </div>
        <Btn sm onClick={() => {
          if (!mail.email.trim() || !mail.name.trim()) return toast("Email and Name required");
          update((d) => d.settings.mailingList.push({ email: mail.email.trim(), name: mail.name.trim(), freq: mail.freq }));
          setMail({ ...mail, email: "", name: "" });
          toast("Recipient added");
        }}>
          Add Recipient
        </Btn>
      </Panel>

      <Panel title="Customer PPM threshold" sub="Charts flag red above this. Many OEMs set 15–50.">
        <div className="flex gap-3">
          <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="max-w-[160px]" />
          <Btn sm onClick={() => {
            update((d) => (d.settings.threshold = +threshold || 0));
            toast("Threshold saved");
          }}>
            Save
          </Btn>
        </div>
      </Panel>

      {/* Zone editor modal */}
      <Modal open={!!editPart} onClose={() => setZoneEditor(null)}>
        {editPart && (
          <>
            <ModalTitle>Zones · {editPart.part}</ModalTitle>
            <p className="mb-3 text-[13px] text-ink-soft">Tap the photo to drop a zone. Name it when prompted.</p>
            <div
              className="relative w-full cursor-crosshair overflow-hidden rounded-lg border border-line leading-[0]"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(1);
                const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(1);
                const label = prompt("Zone name", "Zone " + (editPart.zones.length + 1));
                if (label === null) return;
                update((d) => {
                  const p = d.settings.parts.find((pp) => pp.part === editPart.part);
                  p?.zones.push({ id: uid(), label: label.trim() || "Zone " + (p.zones.length + 1), x, y });
                });
              }}
            >
              <img src={editPart.photo} className="w-full" draggable={false} alt="" />
              {editPart.zones.map((z, j) => (
                <div
                  key={z.id}
                  className="pointer-events-none absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-accent text-[10px] font-bold text-white shadow"
                  style={{ left: `${z.x}%`, top: `${z.y}%` }}
                >
                  {j + 1}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {editPart.zones.length ? (
                editPart.zones.map((z, j) => (
                  <Pill
                    key={z.id}
                    onRemove={() =>
                      update((d) => {
                        const p = d.settings.parts.find((pp) => pp.part === editPart.part);
                        if (p) p.zones = p.zones.filter((zz) => zz.id !== z.id);
                      })
                    }
                  >
                    {j + 1}. {z.label}
                  </Pill>
                ))
              ) : (
                <span className="text-ink-soft">No zones yet.</span>
              )}
            </div>
            <div className="mt-4">
              <Btn onClick={() => setZoneEditor(null)}>Done</Btn>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
