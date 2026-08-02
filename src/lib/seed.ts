import type { DB } from "./types";
import { uid } from "./util";
import { IMPORT_CUSTOMER, IMPORT_DEFECTS, IMPORT_PARTS, IMPORT_RECORDS } from "./data";

const day = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const partImg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#111113"/><rect x="110" y="80" width="380" height="240" rx="26" fill="#27272a" stroke="#71717a" stroke-width="3"/><circle cx="180" cy="148" r="30" fill="#18181b" stroke="#71717a" stroke-width="2"/><rect x="300" y="178" width="120" height="64" rx="10" fill="#18181b" stroke="#71717a" stroke-width="2"/><path d="M430 270 l40 40" stroke="#71717a" stroke-width="3"/><text x="300" y="360" fill="#71717a" font-family="monospace" font-size="16" text-anchor="middle">Reference photo · 44781-A</text></svg>'
  );

export function seed(db: DB): DB {
  if (db.records.length) return db;

  /* ---- Imported dataset: 'data for sorting .xlsx' (glass sorting) ---- */
  db.records = [...IMPORT_RECORDS];
  if (!db.settings.customers.includes(IMPORT_CUSTOMER)) db.settings.customers.unshift(IMPORT_CUSTOMER);
  db.settings.defects = [...new Set([...IMPORT_DEFECTS, ...db.settings.defects])];
  db.settings.parts = [...IMPORT_PARTS];
  db.settings.threshold = 25000; // adjust in Setup — totals were derived from a 3% defect-rate assumption
  db.admin.invoices = [
    { id: uid(), project: "Windshield Containment", customer: IMPORT_CUSTOMER, po: "PO-GL-2026", num: "INV-2001", date: day(20), due: day(-10), amount: 18400, status: "Sent" },
    { id: uid(), project: "Door Glass LH Containment", customer: IMPORT_CUSTOMER, po: "PO-GL-2026", num: "INV-2002", date: day(10), due: day(-20), amount: 7600, status: "Sent" },
    { id: uid(), project: "Windshield Containment", customer: IMPORT_CUSTOMER, po: "PO-GL-2026", num: "INV-2003", date: day(2), due: day(-28), amount: 9200, status: "Draft" },
  ];
  db.admin.timelogs = [
    { id: uid(), employee: "M. Reyes", project: "Windshield Containment", date: day(3), hours: 8, rate: 28 },
    { id: uid(), employee: "J. Park", project: "Windshield Containment", date: day(2), hours: 8, rate: 26 },
    { id: uid(), employee: "T. Okafor", project: "Door Glass LH Containment", date: day(1), hours: 6, rate: 25 },
  ];
  db.admin.payments = [
    { id: uid(), date: day(1), project: "Windshield Containment", ref: "INV-2001", amount: 18400, method: "ACH" },
  ];
  return db;
}

/* Original demo seed, kept for reference */
export function demoSeed(db: DB): DB {
  if (db.records.length) return db;
  db.settings.parts = [
    {
      part: "44781-A",
      photo: partImg,
      zones: [
        { id: uid(), label: "Gate", x: 30, y: 37 },
        { id: uid(), label: "Face", x: 60, y: 52 },
        { id: uid(), label: "Edge", x: 78, y: 76 },
      ],
    },
  ];
  db.records = [
    { id: uid(), date: day(4), customer: "Acme Powertrain", project: "Acme CSL1", po: "PO-88231", part: "44781-A", box: "BX-0039", csl: "CS1", ref: "CC-2231", operator: "M. Reyes", total: 1100, defects: [{ type: "Burr", count: 18, zone: "Gate", loc: { x: 30, y: 37 } }, { type: "Scratch", count: 6, zone: "Edge", loc: { x: 78, y: 74 } }], rework: 14, scrap: 10, start: "07:00", end: "10:45", notes: "" },
    { id: uid(), date: day(3), customer: "Acme Powertrain", project: "Acme CSL1", po: "PO-88231", part: "44781-A", box: "BX-0040", csl: "CS1", ref: "CC-2231", operator: "M. Reyes", total: 1300, defects: [{ type: "Burr", count: 12, zone: "Gate", loc: { x: 33, y: 34 } }, { type: "Dimensional", count: 4, zone: "Face", loc: { x: 58, y: 52 } }], rework: 13, scrap: 3, start: "07:00", end: "11:00", notes: "" },
    { id: uid(), date: day(2), customer: "Acme Powertrain", project: "Acme CSL1", po: "PO-88231", part: "44781-A", box: "BX-0041", csl: "CS1", ref: "CC-2231", operator: "J. Park", total: 1500, defects: [{ type: "Burr", count: 9, zone: "Gate", loc: { x: 28, y: 40 } }, { type: "Flash", count: 5, zone: "Gate", loc: { x: 34, y: 33 } }, { type: "Scratch", count: 3, zone: "Edge", loc: { x: 80, y: 72 } }], rework: 14, scrap: 3, start: "06:30", end: "10:30", notes: "" },
    { id: uid(), date: day(1), customer: "Acme Powertrain", project: "Acme CSL1", po: "PO-88231", part: "44781-A", box: "BX-0042", csl: "CS1", ref: "CC-2231", operator: "J. Park", total: 1450, defects: [{ type: "Burr", count: 6, zone: "Gate", loc: { x: 31, y: 36 } }, { type: "Dimensional", count: 2, zone: "Face", loc: { x: 62, y: 50 } }], rework: 7, scrap: 1, start: "07:00", end: "10:50", notes: "" },
    { id: uid(), date: day(0), customer: "Northstar Assembly", project: "Northstar Sweep", po: "PO-44120", part: "PL-92", box: "BX-0101", csl: "None", ref: "", operator: "T. Okafor", total: 800, defects: [{ type: "Short shot", count: 3 }], rework: 2, scrap: 1, start: "08:00", end: "09:45", notes: "" },
  ];
  db.admin.invoices = [
    { id: uid(), project: "Acme CSL1", customer: "Acme Powertrain", po: "PO-88231", num: "INV-1001", date: day(3), due: day(-11), amount: 6400, status: "Sent" },
    { id: uid(), project: "Acme CSL1", customer: "Acme Powertrain", po: "PO-88231", num: "INV-1002", date: day(1), due: day(-13), amount: 5200, status: "Sent" },
    { id: uid(), project: "Northstar Sweep", customer: "Northstar Assembly", po: "PO-44120", num: "INV-1003", date: day(0), due: day(-14), amount: 1800, status: "Draft" },
  ];
  db.admin.timelogs = [
    { id: uid(), employee: "M. Reyes", project: "Acme CSL1", date: day(4), hours: 3.75, rate: 28 },
    { id: uid(), employee: "M. Reyes", project: "Acme CSL1", date: day(3), hours: 4, rate: 28 },
    { id: uid(), employee: "J. Park", project: "Acme CSL1", date: day(2), hours: 4, rate: 26 },
    { id: uid(), employee: "J. Park", project: "Acme CSL1", date: day(1), hours: 3.83, rate: 26 },
    { id: uid(), employee: "T. Okafor", project: "Northstar Sweep", date: day(0), hours: 1.75, rate: 25 },
  ];
  db.admin.payments = [
    { id: uid(), date: day(0), project: "Acme CSL1", ref: "INV-1001", amount: 6400, method: "ACH" },
  ];
  return db;
}
