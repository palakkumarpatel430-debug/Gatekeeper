import { useEffect, useMemo, useRef, useState } from "react";
import { Boxes, CheckCircle2, FileCheck2, RotateCcw, ScanSearch, ShieldCheck, Timer } from "lucide-react";
import sortingImg from "../assets/smart-sorting.png";

/* ============================================================
   SMART SORTING EXAMPLE — built around the uploaded infographic.
   The photo renders dimmed/grayscale; as the laser sweeps, each
   zone region is revealed in full colour via CSS clip-path.
   Effects: scan · sequential zone reveal · hover · side panel
   details · ambience (particles + holo grid) · counters ·
   idle pulsing · success. No animation libraries.
   ============================================================ */

interface ZoneDef {
  n: number;
  name: string;
  container: string;
  color: string;
  includes: string[];
  detail: string;
  parts: number;
  /** region on the image, in % of width/height */
  box: { x: number; y: number; w: number; h: number };
}

const ZONES: ZoneDef[] = [
  {
    n: 1, name: "Front End Zone", container: "C-01", color: "#3b82f6", parts: 214,
    includes: ["Radiator Support", "Front Bumper Reinforcement", "Headlight Mounts", "Frame Rails"],
    detail: "The crash structure. Frame rails carry the body's VIN-linked identity, so this zone is scanned first — everything downstream traces back to it.",
    box: { x: 12.5, y: 42, w: 23, h: 26 },
  },
  {
    n: 2, name: "Side Structure Zone", container: "C-02", color: "#22c55e", parts: 168,
    includes: ["A-Pillar", "B-Pillar", "Rocker Panel", "Door Frames", "Side Beams"],
    detail: "Pillars, rockers and beams form the safety cage. Sorting them as one zone keeps high-strength steel apart from mild-steel skin panels.",
    box: { x: 35.5, y: 33, w: 21, h: 12 },
  },
  {
    n: 3, name: "Roof Zone", container: "C-03", color: "#eab308", parts: 96,
    includes: ["Roof Panel", "Roof Reinforcements", "Header Bow"],
    detail: "Large, clean, single-alloy panels — the highest-value fraction when kept uncontaminated. Header bow condition is logged for resale grading.",
    box: { x: 55, y: 32.5, w: 17.5, h: 9.5 },
  },
  {
    n: 4, name: "Rear End Zone", container: "C-04", color: "#a855f7", parts: 187,
    includes: ["Rear Panel", "Trunk Floor", "Tail Light Mounts", "Rear Frame"],
    detail: "Rear impact structure and trunk floor. Tail-light mounts identify the trim level, which routes parts to the right resale channel.",
    box: { x: 70.5, y: 39, w: 20, h: 26 },
  },
  {
    n: 5, name: "Front Door Zone", container: "C-05", color: "#ef4444", parts: 262,
    includes: ["Front Door Shell", "Window Regulator", "Hinges", "Lock Assembly"],
    detail: "Doors are the top resale assembly. Regulators, hinges and locks are tracked piece-by-piece for warranty-grade traceability.",
    box: { x: 34, y: 43.5, w: 21.5, h: 25 },
  },
  {
    n: 6, name: "Rear Door Zone", container: "C-06", color: "#06b6d4", parts: 241,
    includes: ["Rear Door Shell", "Window Regulator", "Hinges", "Lock Assembly"],
    detail: "Same discipline as the front doors — left/right and front/rear shells never share a container, so nothing gets re-sorted later.",
    box: { x: 55, y: 43.5, w: 15, h: 22 },
  },
  {
    n: 7, name: "Floor Zone", container: "C-07", color: "#f97316", parts: 152,
    includes: ["Floor Panel", "Cross Members", "Seat Mounts"],
    detail: "Underbody structure between the axles. Seat mounts are torque-critical safety points — each one is photographed and logged.",
    box: { x: 57.5, y: 63.5, w: 12.5, h: 7.5 },
  },
  {
    n: 8, name: "Miscellaneous Zone", container: "C-08", color: "#84cc16", parts: 108,
    includes: ["Small Brackets", "Clips", "Fasteners", "Misc. Components"],
    detail: "The small parts that ruin sorts. A dedicated container means clips and fasteners never contaminate the metal fractions.",
    box: { x: 80.5, y: 56.5, w: 10.5, h: 10 },
  },
];

const cx = (z: ZoneDef) => z.box.x + z.box.w / 2;
const SCAN_ORDER = [...ZONES].sort((a, b) => cx(a) - cx(b));

const NARRATION = [
  "Every vehicle tells a story. Gatekeeper reads it instantly.",
  "Our intelligent scanning engine identifies every structural zone with precision.",
  "From front-end assembly to roof, side structures, floor and rear — every component is classified.",
  "Each identified part is assigned to the correct Gatekeeper container.",
  "Real-time tracking, automated containment, accurate billing.",
  "Gatekeeper. Built for intelligent parts management.",
];

const STEPS: { t: string; d: string }[] = [
  { t: "Item (car body) arrives at the Gatekeeper system", d: "The body is booked in against a container set (C-01 → C-08) and a scan ID. Everything that happens next is traceable to this moment." },
  { t: "System scans and identifies all parts and zones", d: "AI-assisted vision maps 1,428 parts onto 8 structural zones — no clipboards, no guesswork, no missed brackets." },
  { t: "Each zone is sorted, tracked and assigned", d: "Zone → container assignment is automatic. Operators confirm; the system records who, when and how many." },
  { t: "Sorted parts move to their respective containers", d: "Doors to C-05/C-06, roof to C-03, rear structure to C-04 — the chips on the infographic are live container IDs." },
  { t: "You get real-time visibility and accurate billing", d: "The dashboard updates as parts land in containers, and billing is computed from actual sorted counts — not estimates." },
];

const FOOT = [
  { icon: ShieldCheck, t: "100% Traceability", d: "Track every part, every move, every time." },
  { icon: ScanSearch, t: "High Accuracy", d: "AI-powered identification minimizes manual errors." },
  { icon: Timer, t: "Real-Time Visibility", d: "Live updates across all zones and containers." },
  { icon: FileCheck2, t: "Accurate Billing", d: "Automatic calculation based on sorted parts." },
  { icon: Boxes, t: "Smart Reports", d: "Detailed insights for better decisions." },
];

type Phase = "waiting" | "scanning" | "done";
const SCAN_MS = 6500;
const clip = (b: ZoneDef["box"]) =>
  `inset(${b.y}% ${100 - b.x - b.w}% ${100 - b.y - b.h}% ${b.x}% round 10px)`;

export default function SmartSorting() {
  const [phase, setPhase] = useState<Phase>("waiting");
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [pulse, setPulse] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  /* start scan when scrolled into view */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      setProgress(1);
      return;
    }
    const io = new IntersectionObserver(
      (ents) => {
        if (ents[0].isIntersecting && !started.current) {
          started.current = true;
          setPhase("scanning");
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* scan driver */
  useEffect(() => {
    if (phase !== "scanning") return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / SCAN_MS);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setPhase("done");
        setFlash(true);
        window.setTimeout(() => setFlash(false), 1600);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /* idle pulse cycle */
  useEffect(() => {
    if (phase !== "done") return;
    let i = 0;
    setPulse(SCAN_ORDER[0].n);
    const iv = window.setInterval(() => {
      i = (i + 1) % SCAN_ORDER.length;
      setPulse(SCAN_ORDER[i].n);
    }, 3000);
    return () => window.clearInterval(iv);
  }, [phase]);

  const laserPct = 5 + progress * 92; // % across the image
  const identified = SCAN_ORDER.filter((z) => phase === "done" || cx(z) <= laserPct);
  const lastIdentified = identified[identified.length - 1] || null;
  const active = ZONES.find((z) => z.n === (hover ?? (phase === "done" ? pulse : lastIdentified?.n))) || null;
  const narration = phase === "done" ? NARRATION[5] : NARRATION[Math.min(4, Math.floor(progress * 5))];
  const cnt = (v: number) => Math.round(v * (phase === "done" ? 1 : progress));

  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 137) % 100,
        top: (i * 53) % 100,
        dx: ((i * 29) % 40) - 20,
        dy: -(((i * 17) % 40) + 10),
        dur: 4 + ((i * 7) % 6),
        delay: (i * 0.37) % 4,
        cyan: i % 3 !== 0,
      })),
    []
  );

  const replay = () => {
    setProgress(0);
    setPulse(null);
    setPhase("scanning");
  };

  return (
    <section className="mx-auto max-w-[1180px] px-5 py-16">
      {/* header */}
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-sys">Smart Sorting Example</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-disp text-3xl font-black uppercase leading-tight text-white md:text-4xl">
            Intelligent. Accurate. <span className="text-sys">Organized.</span>
          </h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
            One car body. Eight Gatekeeper zones. Twelve containers. Watch the scanner light up each zone of
            the vehicle — then hover any zone to inspect what lives inside it.
          </p>
        </div>
        {/* live counters */}
        <div className="glass-card flex gap-6 rounded-xl border border-line px-6 py-4">
          {[
            { v: cnt(12), l: "Containers" },
            { v: cnt(1428).toLocaleString(), l: "Parts identified" },
            { v: identified.length, l: "Zones" },
            { v: (99.8 * (phase === "done" ? 1 : progress)).toFixed(1) + "%", l: "Accuracy" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-mono text-2xl font-semibold text-sys tabular-nums">{s.v}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-soft">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* ================= STAGE — the uploaded infographic ================= */}
        <div ref={stageRef} className="relative overflow-hidden rounded-2xl border border-line bg-[#0a0f16]">
          {/* ambience: particles */}
          {particles.map((p, i) => (
            <span
              key={i}
              className="gk-particle pointer-events-none absolute z-10 h-1 w-1 rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                background: p.cyan ? "#06b6d4" : "#f59e0b",
                boxShadow: `0 0 6px ${p.cyan ? "#06b6d4" : "#f59e0b"}`,
                animation: `gk-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
                ["--dx" as string]: `${p.dx}px`,
                ["--dy" as string]: `${p.dy}px`,
              }}
            />
          ))}
          {/* ambience: holographic floor */}
          <div className="holo-grid pointer-events-none absolute inset-x-[-10%] bottom-0 z-10 h-44" />

          {/* base image — dimmed until zones reveal */}
          <img
            src={sortingImg}
            alt="Gatekeeper smart sorting — car body zones"
            className="block w-full select-none transition-all duration-700"
            draggable={false}
            style={{
              filter:
                phase === "done"
                  ? "none"
                  : `grayscale(${1 - progress * 0.4}) brightness(${0.45 + progress * 0.2})`,
            }}
          />

          {/* per-zone colour reveal — same image clipped to the zone region */}
          {ZONES.map((z) => {
            const on = identified.some((i) => i.n === z.n);
            const isActive = active?.n === z.n;
            const dimmed = hover !== null && !isActive;
            return (
              <img
                key={z.n}
                src={sortingImg}
                alt=""
                aria-hidden
                draggable={false}
                className="pointer-events-none absolute inset-0 block w-full select-none transition-all duration-500"
                style={{
                  clipPath: clip(z.box),
                  opacity: on ? (dimmed ? 0.35 : 1) : 0,
                  filter: isActive ? "brightness(1.25) saturate(1.25)" : "none",
                }}
              />
            );
          })}

          {/* zone hotspots: glow border, hover target, ripple, pulse */}
          {ZONES.map((z) => {
            const on = identified.some((i) => i.n === z.n);
            const isActive = active?.n === z.n;
            return (
              <div
                key={z.n}
                onMouseEnter={() => setHover(z.n)}
                onMouseLeave={() => setHover(null)}
                className="absolute cursor-pointer rounded-[10px] transition-all duration-300"
                style={{
                  left: `${z.box.x}%`,
                  top: `${z.box.y}%`,
                  width: `${z.box.w}%`,
                  height: `${z.box.h}%`,
                  border: `2px solid ${z.color}`,
                  opacity: on ? 1 : 0,
                  boxShadow: isActive
                    ? `0 0 22px ${z.color}, inset 0 0 22px ${z.color}44`
                    : `0 0 8px ${z.color}66`,
                  animation:
                    !hover && pulse === z.n ? "gk-pulse-glow 3s ease-in-out infinite" : undefined,
                }}
              >
                {/* number badge */}
                <span
                  className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-bg font-mono text-[10px]"
                  style={{ borderColor: z.color, color: z.color }}
                >
                  {z.n}
                </span>
                {/* AI ripple */}
                {(isActive || (on && phase === "scanning" && lastIdentified?.n === z.n)) && (
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{ borderColor: z.color, animation: "gk-ripple-el 1.4s ease-out infinite" }}
                  />
                )}
              </div>
            );
          })}

          {/* scanning laser */}
          {phase === "scanning" && (
            <div
              className="pointer-events-none absolute inset-y-0 z-10 w-28 -translate-x-full"
              style={{ left: `${laserPct}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent to-sys/30" />
              <div className="absolute inset-y-0 right-0 w-[3px] bg-[#67e8f9] shadow-[0_0_16px_#06b6d4]" />
            </div>
          )}

          {/* success flash */}
          {flash && (
            <div className="pointer-events-none absolute inset-0 z-20 bg-pass/40" style={{ animation: "gk-flash 1.6s ease-out both" }} />
          )}

          {/* status HUD */}
          <div className="glass-card absolute right-3 top-3 z-20 w-[230px] rounded-xl border border-line p-3.5">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-sys">
              <span className={`h-1.5 w-1.5 rounded-full ${phase === "done" ? "bg-pass" : "animate-pulse-dot bg-sys"}`} />
              {phase === "done" ? "Sorting complete" : phase === "scanning" ? "Sorting in progress" : "Standby"}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-line">
              <div className="h-full bg-sys transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="mt-1 font-mono text-[10px] text-ink-soft">{Math.round(progress * 100)}%</div>
            <div className="mt-1.5 space-y-1">
              {identified.slice(-3).map((z) => (
                <div key={z.n} className="flex items-center gap-1.5 font-mono text-[9.5px] text-ink-soft">
                  <CheckCircle2 size={10} style={{ color: z.color }} />
                  {z.name} identified
                </div>
              ))}
            </div>
          </div>

          {/* success banner + replay */}
          {phase === "done" && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
              <span className="glass-card flex items-center gap-2 rounded-full border border-pass/50 px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-pass shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                <CheckCircle2 size={14} /> Sorting complete
              </span>
              <button onClick={replay} title="Replay scan" className="glass-card rounded-full border border-line p-2.5 text-ink-soft transition hover:text-white">
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ================= SIDE PANEL — the details, explained ================= */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl border border-line p-4 font-mono text-[11px] leading-relaxed text-sys">
            » {narration}
          </div>

          <div className="glass-card rounded-xl border p-5 transition-colors" style={{ borderColor: active ? active.color : "#27272a" }}>
            {active ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-disp text-sm font-black uppercase tracking-wide text-white">
                    <span style={{ color: active.color }}>{active.n} · </span>
                    {active.name}
                  </h3>
                  <span className="rounded bg-surface2 px-2 py-0.5 font-mono text-[10px] text-ink">{active.container}</span>
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                  ~{active.parts} parts · Status: <span className="text-pass">READY</span>
                </div>
                <ul className="mt-3 space-y-1">
                  {active.includes.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[13px] text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm" style={{ background: active.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 border-t border-line pt-3 text-[12px] leading-relaxed text-ink-soft">{active.detail}</p>
              </>
            ) : (
              <p className="text-[13px] text-ink-soft">Hover a zone on the vehicle to inspect it.</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="font-disp text-sm font-black uppercase tracking-wide text-sys">How it works</h3>
            <ol className="mt-3 space-y-3">
              {STEPS.map((s, i) => {
                const reached = phase === "done" || progress > i / STEPS.length;
                return (
                  <li key={s.t} className="flex gap-3" style={{ opacity: reached ? 1 : 0.35, transition: "opacity .5s" }}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${reached ? "border-sys text-sys" : "border-line text-ink-soft"}`}>
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-[13px] font-semibold text-ink">{s.t}</div>
                      <div className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{s.d}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* footer strip from the infographic */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-line bg-surface p-5 md:grid-cols-5">
        {FOOT.map((f) => (
          <div key={f.t} className="flex gap-3">
            <f.icon size={18} className="mt-0.5 shrink-0 text-sys" />
            <div>
              <div className="text-[12px] font-bold uppercase tracking-wide text-white">{f.t}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-ink-soft">{f.d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
