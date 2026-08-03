import { Lock, LogOut } from "lucide-react";
import type { View } from "../lib/types";
import type { PlanLimits } from "../lib/plans";

const TABS: { id: View; label: string; minPlan?: "Basic" | "Industrial Pro" }[] = [
  { id: "entry", label: "Sort Entry" },
  { id: "dash", label: "Dashboard" },
  { id: "records", label: "Records" },
  { id: "costing", label: "Costing" },
  { id: "report", label: "Report" },
  { id: "rootcause", label: "Root Cause", minPlan: "Basic" },
  { id: "legal", label: "Legal", minPlan: "Basic" },
  { id: "admin", label: "Admin", minPlan: "Industrial Pro" },
  { id: "setup", label: "Setup" },
];

function isTabLocked(tab: typeof TABS[number], limits: PlanLimits): boolean {
  if (tab.id === "admin") return !limits.adminAccess;
  if (tab.id === "rootcause") return !limits.rootCauseAccess;
  if (tab.id === "legal") return !limits.legalAccess;
  return false;
}

export default function Navbar({
  view,
  onNav,
  onExit,
  userName,
  limits,
}: {
  view: View;
  onNav: (v: View) => void;
  onExit?: () => void;
  userName?: string;
  limits: PlanLimits;
}) {
  const overlay = view === "home";
  return (
    <header
      className={
        (overlay
          ? "absolute inset-x-0 top-0 bg-bg/40 backdrop-blur-sm"
          : "sticky top-0 bg-bg") +
        " z-30 border-b border-line print:hidden"
      }
    >
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3.5 px-4 py-3.5">
        <button onClick={() => onNav("home")} className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-sm bg-accent shadow-accent-glow" />
          <span className="font-disp text-xl font-black tracking-wide text-white">GATEKEEPER</span>
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.04em] text-ink-soft xl:inline">
            sorting&nbsp;·&nbsp;containment&nbsp;·&nbsp;billing
          </span>
        </button>

        <nav className="ml-auto flex flex-wrap items-center gap-1">
          {TABS.map((t) => {
            const locked = isTabLocked(t, limits);
            return (
              <button
                key={t.id}
                onClick={() => onNav(t.id)}
                title={locked ? `Upgrade to ${t.minPlan} to unlock` : undefined}
                className={
                  "flex items-center gap-1.5 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors " +
                  (view === t.id
                    ? "border-accent bg-accent text-accent-ink"
                    : locked
                      ? "cursor-not-allowed border-transparent text-zinc-700"
                      : "border-transparent text-ink-soft hover:bg-white/5 hover:text-white")
                }
              >
                <Lock size={12} strokeWidth={2.5} className={locked ? "text-zinc-600" : "hidden"} />
                {t.label}
              </button>
            );
          })}
          {onExit && (
            <button
              onClick={onExit}
              title={userName ? `Sign out ${userName}` : "Sign out"}
              className="ml-1.5 flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft transition-colors hover:bg-surface2 hover:text-white"
            >
              <LogOut size={13} />
              Exit
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
