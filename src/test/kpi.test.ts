import { describe, it, expect } from "vitest";
import { KPI } from "../lib/kpi";
import type { SortRecord } from "../lib/types";

function makeRecord(overrides: Partial<SortRecord> = {}): SortRecord {
  return {
    id: "r1",
    project: "proj",
    date: "2024-01-01",
    operator: "Alice",
    part: "P100",
    box: "B1",
    csl: "",
    ref: "",
    po: "",
    total: 1000,
    scrap: 5,
    rework: 10,
    start: "08:00",
    end: "16:00",
    customer: "Cust",
    defects: [
      { type: "Scratch", count: 20 },
      { type: "Dent", count: 10 },
    ],
    notes: "",
    ...overrides,
  };
}

describe("KPI.bad", () => {
  it("sums all defect counts", () => {
    expect(KPI.bad(makeRecord())).toBe(30);
  });

  it("returns 0 when no defects", () => {
    expect(KPI.bad(makeRecord({ defects: [] }))).toBe(0);
  });

  it("handles missing defects array", () => {
    const r = makeRecord();
    (r as unknown as Record<string, unknown>).defects = undefined;
    expect(KPI.bad(r)).toBe(0);
  });
});

describe("KPI.good", () => {
  it("returns total minus bad", () => {
    expect(KPI.good(makeRecord())).toBe(970);
  });

  it("never goes below 0", () => {
    expect(KPI.good(makeRecord({ total: 10, defects: [{ type: "X", count: 100 }] }))).toBe(0);
  });
});

describe("KPI.ppm", () => {
  it("calculates parts per million", () => {
    expect(KPI.ppm(30, 1000)).toBe(30000);
  });

  it("returns 0 when total is 0", () => {
    expect(KPI.ppm(0, 0)).toBe(0);
  });

  it("returns 0 when bad is 0", () => {
    expect(KPI.ppm(0, 1000)).toBe(0);
  });

  it("handles 100% defect rate", () => {
    expect(KPI.ppm(1000, 1000)).toBe(1000000);
  });
});

describe("KPI.yield", () => {
  it("calculates yield percentage", () => {
    expect(KPI.yield(970, 1000)).toBe(97);
  });

  it("returns 0 when total is 0", () => {
    expect(KPI.yield(0, 0)).toBe(0);
  });

  it("returns 100 for perfect yield", () => {
    expect(KPI.yield(100, 100)).toBe(100);
  });
});

describe("KPI.scrapRate", () => {
  it("calculates scrap rate", () => {
    expect(KPI.scrapRate(5, 1000)).toBe(0.5);
  });

  it("returns 0 when total is 0", () => {
    expect(KPI.scrapRate(0, 0)).toBe(0);
  });
});

describe("KPI.savedRate", () => {
  it("calculates rework save rate", () => {
    expect(KPI.savedRate(10, 30)).toBeCloseTo(33.3, 0);
  });

  it("returns 0 when bad is 0", () => {
    expect(KPI.savedRate(0, 0)).toBe(0);
  });
});

describe("KPI.durationMin", () => {
  it("calculates minutes between start and end", () => {
    expect(KPI.durationMin(makeRecord({ start: "08:00", end: "16:00" }))).toBe(480);
  });

  it("handles overnight shift (wraps past midnight)", () => {
    expect(KPI.durationMin(makeRecord({ start: "22:00", end: "06:00" }))).toBe(480);
  });

  it("returns null when start is missing", () => {
    expect(KPI.durationMin(makeRecord({ start: "", end: "16:00" }))).toBeNull();
  });

  it("returns null when end is missing", () => {
    expect(KPI.durationMin(makeRecord({ start: "08:00", end: "" }))).toBeNull();
  });
});

describe("KPI.throughputPerHr", () => {
  it("calculates pieces per hour", () => {
    expect(KPI.throughputPerHr(1000, 60)).toBe(1000);
  });

  it("returns null when duration is null", () => {
    expect(KPI.throughputPerHr(1000, null)).toBeNull();
  });

  it("returns null when duration is 0", () => {
    expect(KPI.throughputPerHr(1000, 0)).toBeNull();
  });
});

describe("KPI.forRecord", () => {
  it("returns all KPIs for a record", () => {
    const kpi = KPI.forRecord(makeRecord());
    expect(kpi.bad).toBe(30);
    expect(kpi.good).toBe(970);
    expect(kpi.total).toBe(1000);
    expect(kpi.ppm).toBe(30000);
    expect(kpi.yield).toBe(97);
    expect(kpi.scrapRate).toBe(0.5);
    expect(kpi.saved).toBe(10);
    expect(kpi.tat).toBe(480);
    expect(kpi.throughput).toBe(125);
  });
});

describe("KPI.aggregate", () => {
  it("aggregates multiple records", () => {
    const recs = [makeRecord(), makeRecord()];
    const agg = KPI.aggregate(recs);
    expect(agg.boxes).toBe(2);
    expect(agg.total).toBe(2000);
    expect(agg.bad).toBe(60);
    expect(agg.good).toBe(1940);
    expect(agg.ppm).toBe(30000);
  });

  it("builds pareto sorted by count descending", () => {
    const agg = KPI.aggregate([makeRecord()]);
    expect(agg.pareto[0].type).toBe("Scratch");
    expect(agg.pareto[0].count).toBe(20);
    expect(agg.pareto[1].type).toBe("Dent");
  });

  it("calculates cumulative pareto percentages", () => {
    const agg = KPI.aggregate([makeRecord()]);
    expect(agg.pareto[0].cum).toBeCloseTo(66.7, 0);
    expect(agg.pareto[1].cum).toBeCloseTo(100, 0);
  });

  it("returns empty pareto for no defects", () => {
    const agg = KPI.aggregate([makeRecord({ defects: [] })]);
    expect(agg.pareto).toEqual([]);
  });

  it("handles empty record list", () => {
    const agg = KPI.aggregate([]);
    expect(agg.boxes).toBe(0);
    expect(agg.total).toBe(0);
    expect(agg.ppm).toBe(0);
  });
});
