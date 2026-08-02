import { useEffect, useRef } from "react";
import {
  ArrowRight,
  MapPin,
  MousePointer2,
  ScanLine,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { useStore } from "../lib/store";
import { KPI } from "../lib/kpi";
import { fmt } from "../lib/util";

/**
 * GATEKEEPER hero — signature cursor-following spotlight.
 *
 * Two full-bleed layers:
 *   base   — dark, desaturated strata (the "sealed" state)
 *   reveal — warm amber-lit strata, clipped by a soft circular mask
 *            (radial-gradient mask) that trails the cursor with a lerp.
 */

const BASE_IMG =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2400&q=80";
const REVEAL_IMG =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2400&q=80";

export default function Hero({
  onStart,
  onDash,
  startLabel = "Start sorting",
  dashLabel = "View dashboard",
  isPublic = false,
}: {
  onStart: () => void;
  onDash: () => void;
  startLabel?: string;
  dashLabel?: string;
  isPublic?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { db } = useStore();
  const a = KPI.aggregate(db.records);
  const kpis: { label: string; value: string; tone?: "ok" | "bad" }[] = isPublic
    ? [
        { label: "Parts inspected", value: "383k+" },
        { label: "Yield %", value: "97.0", tone: "ok" },
        { label: "Defects caught", value: "11.5k", tone: "bad" },
        { label: "Zones mapped", value: "12" },
        { label: "Defect modes", value: "23" },
      ]
    : [
        { label: "PPM", value: fmt(a.ppm) },
        { label: "Yield %", value: String(a.yield), tone: "ok" },
        { label: "Bad parts", value: fmt(a.bad), tone: "bad" },
        { label: "Parts saved", value: fmt(a.rework) },
        { label: "TAT (min)", value: a.avgTat ? String(a.avgTat) : "—" },
      ];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Target and current positions (lerped for a weighty, cinematic trail)
    const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };
    const pos = { ...target };
    let targetR = 240;
    let r = 240;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      targetR = 260;
    };
    const onLeave = () => {
      targetR = 0; // spotlight collapses when the cursor leaves the gate
    };
    const onDown = () => {
      targetR = 340; // press to widen the beam
    };
    const onUp = () => {
      targetR = 260;
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.09;
      pos.y += (target.y - pos.y) * 0.09;
      r += (targetR - r) * 0.08;
      el.style.setProperty("--mx", `${pos.x}px`);
      el.style.setProperty("--my", `${pos.y}px`);
      el.style.setProperty("--spot-r", `${Math.max(r, 0.001)}px`);
      raf = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseup", onUp);
    raf = requestAnimationFrame(tick);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="spotlight-auto relative flex min-h-screen w-full flex-col overflow-hidden bg-bg"
    >
      {/* ---- LAYER 0 · gradient bedrock (fallback if images are offline) ---- */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_70%_20%,#1c1917_0%,#09090b_60%)]" />

      {/* ---- LAYER 1 · base image, sealed & desaturated ---- */}
      <img
        src={BASE_IMG}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover opacity-60 grayscale contrast-125 brightness-[0.45]"
      />

      {/* Dot-grid etched over the base — the gatekeeper-v3 signature texture */}
      <div className="dot-grid absolute inset-0 opacity-40" />

      {/* ---- LAYER 2 · reveal image, warm strata under the spotlight ---- */}
      <div className="spotlight-mask absolute inset-0">
        <img
          src={REVEAL_IMG}
          alt=""
          aria-hidden
          draggable={false}
          className="h-full w-full select-none object-cover saturate-[1.15] contrast-110"
        />
        {/* amber duotone wash so the reveal reads on-brand */}
        <div className="absolute inset-0 bg-accent/15 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/60 via-transparent to-bg/40" />
      </div>

      {/* ---- LAYER 3 · halo + ring riding the cursor ---- */}
      <div className="spotlight-halo pointer-events-none absolute inset-0" />
      <div className="spotlight-ring" aria-hidden />

      {/* ---- LAYER 4 · legibility scrim ---- */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent md:via-bg/40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent" />

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center px-5 pb-40 pt-32">
        {/* Michigan badge — mi-badge treatment */}
        <div className="animate-rise mb-7 inline-flex w-fit items-center gap-2.5 rounded-full border border-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.05em] text-accent">
          <MapPin size={14} />
          Michigan Made · IATF 16949 Aligned
        </div>

        {/* Display headline — Archivo 900, uppercase, tight tracking */}
        <h1
          className="animate-rise font-disp font-black uppercase leading-[0.95] tracking-[-0.01em] text-white [animation-delay:80ms]"
          style={{ fontSize: "clamp(3rem, 8.5vw, 7rem)" }}
        >
          Nothing gets
          <br />
          past{" "}
          <span className="text-accent drop-shadow-[0_0_24px_rgba(245,158,11,0.45)]">
            the gate.
          </span>
        </h1>

        {/* Sub copy */}
        <p className="animate-rise mt-6 max-w-xl text-base leading-relaxed text-ink-soft [animation-delay:160ms] md:text-lg">
          Gatekeeper is the control room for sorting, containment&nbsp;&amp;
          billing. Log the raw counts — every KPI is calculated for you.{" "}
          <span className="font-mono text-sm uppercase tracking-[0.05em] text-ink">
            Move the light. Find the flaw.
          </span>
        </p>

        {/* CTAs — .btn / .btn.ghost, uppercase, amber */}
        <div className="animate-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
          <button
            onClick={onStart}
            className="group inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3.5 text-sm font-bold uppercase tracking-[0.04em] text-accent-ink transition hover:-translate-y-px hover:brightness-110 active:translate-y-0"
          >
            {startLabel}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={onDash}
            className="inline-flex items-center gap-2 rounded-md border border-line px-6 py-3.5 text-sm font-bold uppercase tracking-[0.04em] text-ink transition hover:border-ink-soft hover:bg-surface2"
          >
            <ScanLine size={16} className="text-sys" />
            {dashLabel}
          </button>
          <span className="ml-1 hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft md:inline-flex">
            <ShieldCheck size={14} className="text-pass" />
            CS1 · CS2 · GP-12 ready
          </span>
        </div>
      </div>

      {/* ---- KPI strip — the .preview live bar, pinned to the floor ---- */}
      <div className="absolute inset-x-0 bottom-0 z-20 border-t border-line bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-10 gap-y-3 px-5 py-4">
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">
            <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-pass" />
            Live containment
          </span>
          {kpis.map((k) => (
            <div key={k.label} className="flex flex-col">
              <b
                className={
                  "font-mono text-[22px] font-semibold leading-tight tabular-nums " +
                  (k.tone === "ok"
                    ? "text-pass-soft"
                    : k.tone === "bad"
                      ? "text-fail-soft"
                      : "text-white")
                }
              >
                {k.value}
              </b>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
                {k.label}
              </span>
            </div>
          ))}
          <span className="ml-auto hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft lg:flex">
            <MousePointer2 size={12} className="text-accent" />
            Move cursor — the spotlight reveals the seam
            <ChevronDown size={12} className="animate-bounce" />
          </span>
        </div>
      </div>
    </section>
  );
}
