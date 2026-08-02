import type { ReactNode } from "react";

export type SitePage = "home" | "features" | "how" | "pricing" | "about" | "contact" | "auth";

export function Section({
  kicker,
  title,
  sub,
  children,
  className = "",
}: {
  kicker?: string;
  title: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-[1180px] px-5 py-16 ${className}`}>
      {kicker && (
        <div className="mb-3 font-mono text-xs uppercase tracking-[0.14em] text-accent">{kicker}</div>
      )}
      <h2 className="font-disp text-3xl font-black uppercase leading-tight text-white md:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">{sub}</p>}
      {children}
    </section>
  );
}

export function BrowserFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-line bg-surface2 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-fail/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-pass/70" />
        <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-soft">
          app.gatekeeper.com — {label}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
