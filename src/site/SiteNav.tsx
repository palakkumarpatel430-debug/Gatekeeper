import { Lock, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";
import type { SitePage } from "./shared";

const PAGES: { id: SitePage; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how", label: "How We Sort" },
  { id: "pricing", label: "Pricing" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function SiteNav({
  page,
  onNav,
  onOpenApp,
}: {
  page: SitePage;
  onNav: (p: SitePage) => void;
  onOpenApp: () => void;
}) {
  const { user, logout } = useAuth();
  const overlay = page === "home";
  return (
    <header
      className={
        (overlay ? "absolute inset-x-0 top-0 bg-bg/40 backdrop-blur-sm" : "sticky top-0 bg-bg") +
        " z-30 border-b border-line"
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
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => onNav(p.id)}
              className={
                "rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors " +
                (page === p.id
                  ? "border-line bg-surface2 text-white"
                  : "border-transparent text-ink-soft hover:bg-white/5 hover:text-white")
              }
            >
              {p.label}
            </button>
          ))}

          {user ? (
            <>
              <button
                onClick={onOpenApp}
                className="ml-2 flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-[13px] font-bold uppercase tracking-[0.04em] text-accent-ink transition hover:brightness-110"
              >
                <Lock size={12} strokeWidth={2.5} />
                {user.premium ? "Open Dashboard" : "Get Premium"}
              </button>
              <button
                onClick={logout}
                title={`Log out ${user.email}`}
                className="rounded-md border border-transparent px-2.5 py-2 text-ink-soft hover:bg-white/5 hover:text-white"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNav("auth")}
                className={
                  "ml-2 rounded-md border px-3.5 py-2 text-[13px] font-semibold transition-colors " +
                  (page === "auth"
                    ? "border-line bg-surface2 text-white"
                    : "border-line text-ink hover:bg-surface2")
                }
              >
                Login
              </button>
              <button
                onClick={() => onNav("pricing")}
                className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-[13px] font-bold uppercase tracking-[0.04em] text-accent-ink transition hover:brightness-110"
              >
                <Lock size={12} strokeWidth={2.5} />
                Get Premium
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
