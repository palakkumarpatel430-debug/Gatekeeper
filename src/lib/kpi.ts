import type { SortRecord } from "./types";

export interface ParetoItem {
  type: string;
  count: number;
  pct: number;
  cum: number;
}

export interface RecordKpi {
  bad: number;
  good: number;
  total: number;
  ppm: number;
  yield: number;
  scrapRate: number;
  saved: number;
  savedRate: number;
  tat: number | null;
  throughput: number | null;
}

export interface Aggregate {
  boxes: number;
  total: number;
  bad: number;
  good: number;
  rework: number;
  scrap: number;
  ppm: number;
  yield: number;
  scrapRate: number;
  savedRate: number;
  avgTat: number;
  throughput: number | null;
  pareto: ParetoItem[];
}

export const KPI = {
  bad(r: SortRecord): number {
    return (r.defects || []).reduce((s, d) => s + (+d.count || 0), 0);
  },
  good(r: SortRecord): number {
    return Math.max(0, (+r.total || 0) - this.bad(r));
  },
  ppm(bad: number, total: number): number {
    return total > 0 ? Math.round((bad / total) * 1e6) : 0;
  },
  yield(good: number, total: number): number {
    return total > 0 ? +((good / total) * 100).toFixed(2) : 0;
  },
  scrapRate(s: number, t: number): number {
    return t > 0 ? +((s / t) * 100).toFixed(2) : 0;
  },
  savedRate(rw: number, bad: number): number {
    return bad > 0 ? +((rw / bad) * 100).toFixed(1) : 0;
  },
  durationMin(r: SortRecord): number | null {
    if (!r.start || !r.end) return null;
    const [a, b] = r.start.split(":").map(Number);
    const [c, d] = r.end.split(":").map(Number);
    let m = c * 60 + d - (a * 60 + b);
    if (m < 0) m += 1440;
    return m;
  },
  throughputPerHr(t: number, m: number | null): number | null {
    return m && m > 0 ? Math.round(t / (m / 60)) : null;
  },
  forRecord(r: SortRecord): RecordKpi {
    const bad = this.bad(r);
    const good = this.good(r);
    const total = +r.total || 0;
    const m = this.durationMin(r);
    return {
      bad,
      good,
      total,
      ppm: this.ppm(bad, total),
      yield: this.yield(good, total),
      scrapRate: this.scrapRate(+r.scrap || 0, total),
      saved: +r.rework || 0,
      savedRate: this.savedRate(+r.rework || 0, bad),
      tat: m,
      throughput: this.throughputPerHr(total, m),
    };
  },
  aggregate(recs: SortRecord[]): Aggregate {
    let total = 0,
      bad = 0,
      good = 0,
      rw = 0,
      scrap = 0,
      mins = 0;
    const boxes = recs.length;
    const dm: Record<string, number> = {};
    recs.forEach((r) => {
      const c = this.forRecord(r);
      total += c.total;
      bad += c.bad;
      good += c.good;
      rw += c.saved;
      scrap += +r.scrap || 0;
      if (c.tat) mins += c.tat;
      (r.defects || []).forEach(
        (d) => (dm[d.type] = (dm[d.type] || 0) + (+d.count || 0))
      );
    });
    const pareto: ParetoItem[] = Object.entries(dm)
      .map(([type, count]) => ({ type, count, pct: 0, cum: 0 }))
      .sort((a, b) => b.count - a.count);
    let cum = 0;
    pareto.forEach((p) => {
      p.pct = bad > 0 ? +((p.count / bad) * 100).toFixed(1) : 0;
      cum += p.pct;
      p.cum = +cum.toFixed(1);
    });
    return {
      boxes,
      total,
      bad,
      good,
      rework: rw,
      scrap,
      ppm: this.ppm(bad, total),
      yield: this.yield(good, total),
      scrapRate: this.scrapRate(scrap, total),
      savedRate: this.savedRate(rw, bad),
      avgTat: boxes ? Math.round(mins / boxes) : 0,
      throughput: this.throughputPerHr(total, mins),
      pareto,
    };
  },
};
