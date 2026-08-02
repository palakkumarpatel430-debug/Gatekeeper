import { Award, Factory, MapPin, ShieldCheck } from "lucide-react";
import { Section } from "./shared";

const STATS = [
  { v: "383k+", l: "parts inspected" },
  { v: "248", l: "boxes sorted" },
  { v: "23", l: "defect modes tracked" },
  { v: "12", l: "zones per part map" },
];

const STANDARDS = [
  { icon: ShieldCheck, name: "IATF 16949", body: "Records and reports aligned with automotive QMS expectations." },
  { icon: Award, name: "GP-12 · CS1 · CS2", body: "Built around GM early containment and controlled shipping levels." },
  { icon: Factory, name: "MIOSHA aware", body: "Workflows respect Michigan occupational safety requirements on the line." },
];

export default function About() {
  return (
    <>
      <Section
        kicker="Michigan Made · Michigan Based"
        title="Born on a Wayne County sort line"
        sub={
          <>
            Gatekeeper wasn't designed in a startup loft. It started as the tracking sheet of a Michigan
            containment crew that got tired of retyping defect tallies into spreadsheets at 11pm — and grew into
            the control room that runs the whole operation: sort entry, zone-wise classification, analytics,
            customer reports and billing. We build for the Tier 1 &amp; Tier 2 suppliers that keep Motor City
            shipping, and for every sort house that can't afford enterprise QMS software but refuses to let a
            bad part reach the customer.
          </>
        }
      >
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.l} className="rounded-lg border border-line bg-surface p-5 text-center">
              <div className="font-mono text-3xl font-semibold text-accent">{s.v}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-soft">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STANDARDS.map((s) => (
            <div key={s.name} className="rounded-lg border border-line bg-surface p-6">
              <s.icon size={22} className="text-accent" />
              <h3 className="mt-3 font-disp text-sm font-black uppercase tracking-wide text-white">{s.name}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-2.5 rounded-lg border border-accent/30 bg-accent/5 p-5 font-mono text-xs uppercase tracking-[0.05em] text-accent">
          <MapPin size={16} />
          Gatekeeper v3.0.0-MI · Registered in Wayne County, MI · © 2026 Motor City Workforce
        </div>
      </Section>
    </>
  );
}
