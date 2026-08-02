import { esc } from "../lib/util";
import type { ParetoItem } from "../lib/kpi";

/* Hand-drawn SVG charts, ported from gatekeeper-v3.html and retouched
   for the zinc/amber dark theme. No chart libraries. */

const C = {
  axis: "#71717a",
  grid: "#27272a",
  txt: "#d4d4d8",
  line: "#f59e0b",
  area: "rgba(245,158,11,.18)",
  bar: "#d97706",
  good: "#10b981",
  warn: "#fbbf24",
  fail: "#ef4444",
  pt: "#fcd34d",
};
const MONO = "IBM Plex Mono, monospace";

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * p;
}

function lerpColor(t: number): string {
  // 0..1 -> zinc -> amber -> red
  const a = [39, 39, 42],
    b = [245, 158, 11],
    c = [239, 68, 68];
  let x: number[], y: number[], f: number;
  if (t < 0.5) {
    x = a;
    y = b;
    f = t / 0.5;
  } else {
    x = b;
    y = c;
    f = (t - 0.5) / 0.5;
  }
  const m = (i: number) => Math.round(x[i] + (y[i] - x[i]) * f);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}

function emptySvg(W: number, H: number): string {
  return `<svg viewBox="0 0 ${W} ${H}"><text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="13" fill="${C.axis}">No data in range</text></svg>`;
}

export function svgLine(labels: string[], vals: number[], threshold?: number): string {
  const W = 720, H = 300, pl = 46, pr = 20, pt = 18, pb = 42, iw = W - pl - pr, ih = H - pt - pb;
  if (!vals.length) return emptySvg(W, H);
  const ymax = niceMax(Math.max(...vals, threshold || 0) * 1.1) || 1;
  const X = (i: number) => pl + (vals.length === 1 ? iw / 2 : (iw * i) / (vals.length - 1));
  const Y = (v: number) => pt + ih - (v / ymax) * ih;
  let grid = "", ax = "";
  for (let g = 0; g <= 4; g++) {
    const v = (ymax * g) / 4, y = Y(v);
    grid += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="${C.grid}"/>`;
    ax += `<text x="${pl - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="${C.axis}" font-family="${MONO}">${Math.round(v)}</text>`;
  }
  const pts = vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  const area = `M ${X(0)},${pt + ih} L ${pts.split(" ").join(" L ")} L ${X(vals.length - 1)},${pt + ih} Z`;
  let dots = "", xl = "";
  vals.forEach((v, i) => {
    dots += `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="${C.pt}" stroke="${C.line}"/>`;
    if (vals.length <= 14 || i % 2 === 0)
      xl += `<text x="${X(i)}" y="${H - 16}" text-anchor="middle" font-size="10" fill="${C.axis}" font-family="${MONO}">${esc(labels[i])}</text>`;
  });
  let thr = "";
  if (threshold) {
    const y = Y(threshold);
    thr = `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="${C.fail}" stroke-dasharray="6 4"/>
      <text x="${W - pr}" y="${y - 6}" text-anchor="end" font-size="10" fill="${C.fail}" font-family="${MONO}">threshold ${threshold}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}">${grid}${ax}<path d="${area}" fill="${C.area}"/>
    <polyline points="${pts}" fill="none" stroke="${C.line}" stroke-width="2.5"/>${thr}${dots}${xl}</svg>`;
}

export function svgPareto(pareto: ParetoItem[]): string {
  const W = 560, H = 300, pl = 40, pr = 44, pt = 18, pb = 70, iw = W - pl - pr, ih = H - pt - pb;
  const data = pareto.slice(0, 8);
  if (!data.length) return emptySvg(W, H);
  const maxc = Math.max(...data.map((d) => d.count));
  const ymax = niceMax(maxc);
  const bw = (iw / data.length) * 0.6, gap = iw / data.length;
  let grid = "", axL = "";
  for (let g = 0; g <= 4; g++) {
    const y = pt + ih - (ih * g) / 4;
    grid += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="${C.grid}"/>`;
    axL += `<text x="${pl - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="${C.axis}" font-family="${MONO}">${Math.round((ymax * g) / 4)}</text>`;
  }
  for (let g = 0; g <= 4; g++) {
    const y = pt + ih - (ih * g) / 4;
    axL += `<text x="${W - pr + 6}" y="${y + 4}" font-size="10" fill="${C.warn}" font-family="${MONO}">${g * 25}%</text>`;
  }
  let bars = "", line = "", lbl = "";
  const cx = (i: number) => pl + gap * i + gap / 2;
  data.forEach((d, i) => {
    const h = (d.count / ymax) * ih, x = cx(i) - bw / 2, y = pt + ih - h;
    bars += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${C.bar}"/>`;
    bars += `<text x="${cx(i)}" y="${y - 5}" text-anchor="middle" font-size="10" fill="${C.txt}" font-family="${MONO}">${d.count}</text>`;
    const ly = pt + ih - (d.cum / 100) * ih;
    line += `${cx(i)},${ly} `;
    const nm = d.type.length > 9 ? d.type.slice(0, 8) + "…" : d.type;
    lbl += `<text x="${cx(i)}" y="${H - 46}" text-anchor="middle" font-size="10" fill="${C.axis}" transform="rotate(35 ${cx(i)} ${H - 46})">${esc(nm)}</text>`;
  });
  const lpts = line.trim().split(" ");
  let dots = "";
  lpts.forEach((p) => {
    const [a, b] = p.split(",");
    dots += `<circle cx="${a}" cy="${b}" r="3.5" fill="${C.warn}"/>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${grid}${axL}${bars}<polyline points="${line.trim()}" fill="none" stroke="${C.warn}" stroke-width="2"/>${dots}${lbl}</svg>`;
}

export function svgDonut(segs: { label: string; val: number; color: string }[]): string {
  const total = segs.reduce((s, x) => s + x.val, 0);
  const W = 260, H = 220, cx = 110, cy = 110, r = 78, sw = 26;
  if (total <= 0) return emptySvg(W, H);
  let off = 0, arcs = "";
  const circ = 2 * Math.PI * r;
  segs.forEach((s) => {
    const frac = s.val / total, len = frac * circ;
    arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${sw}"
      stroke-dasharray="${len} ${circ - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;
    off += len;
  });
  let leg = "";
  segs.forEach((s, i) => {
    const pct = Math.round((s.val / total) * 100);
    leg += `<rect x="${W - 120}" y="${30 + i * 26}" width="12" height="12" rx="3" fill="${s.color}"/>
      <text x="${W - 103}" y="${40 + i * 26}" font-size="12" fill="${C.txt}">${esc(s.label)}</text>
      <text x="${W - 8}" y="${40 + i * 26}" text-anchor="end" font-size="12" fill="#fff" font-family="${MONO}">${pct}%</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${arcs}
    <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="22" fill="#fff" font-family="${MONO}">${total.toLocaleString()}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="10" fill="${C.axis}">parts</text>${leg}</svg>`;
}

export function svgHeat(rows: string[], cols: string[], matrix: number[][]): string {
  if (!rows.length || !cols.length) return emptySvg(560, 200);
  const pl = 110, pt = 30;
  const cw = Math.max(34, Math.min(70, (560 - pl) / cols.length)), ch = 26;
  const W = pl + cw * cols.length + 10, H = pt + ch * rows.length + 10;
  let max = 0;
  matrix.forEach((r) => r.forEach((v) => { if (v > max) max = v; }));
  let cells = "", rl = "", cl = "";
  cols.forEach((c, j) => (cl += `<text x="${pl + cw * j + cw / 2}" y="${pt - 8}" text-anchor="middle" font-size="10" fill="${C.axis}" font-family="${MONO}">${esc(c)}</text>`));
  rows.forEach((rname, i) => {
    rl += `<text x="${pl - 8}" y="${pt + ch * i + ch / 2 + 4}" text-anchor="end" font-size="11" fill="${C.txt}">${esc(rname.length > 14 ? rname.slice(0, 13) + "…" : rname)}</text>`;
    cols.forEach((_c, j) => {
      const v = matrix[i][j] || 0, t = max ? v / max : 0;
      cells += `<rect x="${pl + cw * j}" y="${pt + ch * i}" width="${cw - 2}" height="${ch - 2}" rx="3" fill="${v ? lerpColor(t) : "#1c1c1f"}"/>`;
      if (v)
        cells += `<text x="${pl + cw * j + cw / 2 - 1}" y="${pt + ch * i + ch / 2 + 3}" text-anchor="middle" font-size="10" fill="${t > 0.45 ? "#09090b" : "#a1a1aa"}" font-family="${MONO}">${v}</text>`;
    });
  });
  return `<svg viewBox="0 0 ${W} ${H}">${cl}${rl}${cells}</svg>`;
}

export function svgBars(labels: string[], vals: number[], color?: string): string {
  const W = 720, H = 240, pl = 46, pr = 18, pt = 16, pb = 40, iw = W - pl - pr, ih = H - pt - pb;
  if (!vals.length) return emptySvg(W, H);
  const ymax = niceMax(Math.max(...vals));
  const gap = iw / vals.length, bw = gap * 0.6;
  let grid = "", ax = "", bars = "", xl = "";
  for (let g = 0; g <= 4; g++) {
    const y = pt + ih - (ih * g) / 4;
    grid += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="${C.grid}"/>`;
    ax += `<text x="${pl - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="${C.axis}" font-family="${MONO}">${Math.round((ymax * g) / 4)}</text>`;
  }
  vals.forEach((v, i) => {
    const h = (v / ymax) * ih, x = pl + gap * i + gap / 2 - bw / 2, y = pt + ih - h;
    bars += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${color || C.bar}"/>`;
    if (vals.length <= 16)
      xl += `<text x="${pl + gap * i + gap / 2}" y="${H - 14}" text-anchor="middle" font-size="10" fill="${C.axis}" font-family="${MONO}">${esc(labels[i])}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${grid}${ax}${bars}${xl}</svg>`;
}

export function svgGrouped(labels: string[], seriesA: number[], seriesB: number[]): string {
  const W = 720, H = 240, pl = 54, pr = 18, pt = 16, pb = 40, iw = W - pl - pr, ih = H - pt - pb;
  if (!labels.length) return emptySvg(W, H);
  const ymax = niceMax(Math.max(...seriesA, ...seriesB, 1));
  const gap = iw / labels.length, bw = gap * 0.3;
  let grid = "", ax = "", bars = "", xl = "";
  for (let g = 0; g <= 4; g++) {
    const y = pt + ih - (ih * g) / 4;
    grid += `<line x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}" stroke="${C.grid}"/>`;
    ax += `<text x="${pl - 6}" y="${y + 4}" text-anchor="end" font-size="9" fill="${C.axis}" font-family="${MONO}">${Math.round((ymax * g) / 4 / 1000)}k</text>`;
  }
  labels.forEach((l, i) => {
    const cx = pl + gap * i + gap / 2;
    const hA = (seriesA[i] / ymax) * ih, hB = (seriesB[i] / ymax) * ih;
    bars += `<rect x="${cx - bw - 2}" y="${pt + ih - hA}" width="${bw}" height="${hA}" rx="3" fill="${C.bar}"/>`;
    bars += `<rect x="${cx + 2}" y="${pt + ih - hB}" width="${bw}" height="${hB}" rx="3" fill="${C.good}"/>`;
    xl += `<text x="${cx}" y="${H - 14}" text-anchor="middle" font-size="10" fill="${C.axis}">${esc(l)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${grid}${ax}${bars}${xl}
    <rect x="${pl}" y="2" width="11" height="11" rx="2" fill="${C.bar}"/><text x="${pl + 16}" y="11" font-size="11" fill="${C.txt}">Invoiced</text>
    <rect x="${pl + 90}" y="2" width="11" height="11" rx="2" fill="${C.good}"/><text x="${pl + 106}" y="11" font-size="11" fill="${C.txt}">Received</text></svg>`;
}

export const CHART_COLORS = C;

export function Chart({ html }: { html: string }) {
  return <div className="chart-svg" dangerouslySetInnerHTML={{ __html: html }} />;
}
