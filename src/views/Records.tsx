import { useState } from "react";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { KPI } from "../lib/kpi";
import { downloadFile, fmt } from "../lib/util";
import { Btn, cslTagKind, Empty, Field, Input, Panel, TableWrap, Tag, Td, Th } from "../components/ui";

export default function Records() {
  const { db, update, toast } = useStore();
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const recs = db.records.filter(
    (r) => !q || [r.part, r.box, r.customer, r.operator].join(" ").toLowerCase().includes(q.toLowerCase())
  );

  const stamp = `# Exported by: ${user?.email ?? "unknown"} | Plan: ${user?.plan ?? "Premium"} | ${new Date().toISOString()}`;

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Date", "Customer", "Project", "PO", "Part", "Box", "CSL", "Ref", "Operator", "Inspected", "Bad", "PPM", "Yield%", "Reworked", "Scrapped", "TATmin", "Defects", "Notes"],
    ];
    db.records.forEach((r) => {
      const c = KPI.forRecord(r);
      rows.push([
        r.date, r.customer, r.project || "", r.po || "", r.part, r.box, r.csl, r.ref, r.operator,
        c.total, c.bad, c.ppm, c.yield, c.saved, r.scrap || 0, c.tat ?? "",
        (r.defects || []).map((d) => `${d.type}:${d.count}${d.zone ? "@" + d.zone : ""}`).join("; "),
        r.notes || "",
      ]);
    });
    const csv = [stamp, rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")].join("\n");
    downloadFile("gatekeeper-records.csv", csv, "text/csv");
  };

  return (
    <Panel title="Sort records">
      <div className="mb-4 flex flex-wrap items-end gap-2.5">
        <Field label="Search" className="mb-0 min-w-[220px]">
          <Input placeholder="part, box, customer, operator" value={q} onChange={(e) => setQ(e.target.value)} />
        </Field>
        <Btn variant="ghost" sm onClick={exportCsv}>Export CSV</Btn>
        <Btn variant="ghost" sm onClick={() => downloadFile("gatekeeper-backup.json", JSON.stringify({ _export: { by: user?.email, plan: user?.plan, at: new Date().toISOString() }, ...db }, null, 2), "application/json")}>
          Backup (JSON)
        </Btn>
        <Btn
          variant="danger"
          sm
          onClick={() => {
            if (confirm("Delete ALL sort records?")) {
              update((d) => (d.records = []));
              toast("Cleared");
            }
          }}
        >
          Clear all
        </Btn>
      </div>
      <TableWrap>
        <thead>
          <tr>
            <Th>Date</Th><Th>Customer</Th><Th>Part</Th><Th>Box</Th><Th>PO</Th><Th>CSL</Th>
            <Th num>Insp.</Th><Th num>Bad</Th><Th num>PPM</Th><Th num>Yield%</Th><Th num>Saved</Th><Th num>TAT</Th><Th />
          </tr>
        </thead>
        <tbody>
          {recs.length ? (
            recs.map((r) => {
              const c = KPI.forRecord(r);
              return (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <Td>{r.date}</Td>
                  <Td>{r.customer}</Td>
                  <Td>{r.part}</Td>
                  <Td>{r.box}</Td>
                  <Td>{r.po || ""}</Td>
                  <Td><Tag kind={cslTagKind(r.csl)}>{r.csl}</Tag></Td>
                  <Td num>{fmt(c.total)}</Td>
                  <Td num>{fmt(c.bad)}</Td>
                  <Td num>{fmt(c.ppm)}</Td>
                  <Td num>{c.yield}</Td>
                  <Td num>{fmt(c.saved)}</Td>
                  <Td num>{c.tat != null ? c.tat : "—"}</Td>
                  <Td num>
                    <Btn
                      variant="danger"
                      sm
                      onClick={() => {
                        update((d) => (d.records = d.records.filter((x) => x.id !== r.id)));
                        toast("Deleted");
                      }}
                    >
                      Del
                    </Btn>
                  </Td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={13}><Empty>No records yet.</Empty></td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </Panel>
  );
}
