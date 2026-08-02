import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { X } from "lucide-react";

/* Shared primitives matching gatekeeper-v3.html: .panel .kpi .btn .field .tag ... */

export function Panel({
  title,
  sub,
  children,
  className = "",
}: {
  title?: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 rounded-lg border border-line bg-surface p-6 ${className}`}>
      {title && (
        <h2 className="mb-1.5 font-disp text-[15px] font-black uppercase tracking-[0.08em] text-white">
          {title}
        </h2>
      )}
      {sub && <p className="mb-5 text-xs text-ink-soft">{sub}</p>}
      {children}
    </div>
  );
}

export function ChartCard({
  title,
  sub,
  children,
  className = "",
}: {
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-5 rounded-lg border border-line bg-surface p-5 ${className}`}>
      <h2 className="font-disp text-sm font-black uppercase tracking-[0.08em] text-white">
        {title}
      </h2>
      {sub && <p className="mb-4 mt-1 text-[11px] text-ink-soft">{sub}</p>}
      {children}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  note,
  tone,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: string;
  tone?: "pass" | "warn" | "fail";
}) {
  const bar =
    tone === "pass" ? "bg-pass" : tone === "warn" ? "bg-accent" : tone === "fail" ? "bg-fail" : "bg-line";
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-[18px]">
      <span className={`absolute bottom-0 left-0 top-0 w-[3px] ${bar}`} />
      <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-soft">{label}</div>
      <div className="mt-2 font-mono text-[26px] font-semibold leading-[1.1] text-white tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-[13px] text-ink-soft">{unit}</span>}
      </div>
      {note && (
        <div className="mt-1.5 font-mono text-[10px] uppercase text-ink-soft">{note}</div>
      )}
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-[18px] ${className}`}>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-line bg-bg px-3 py-2.5 text-base text-ink transition-all " +
  "focus:border-sys focus:bg-surface2 focus:outline-none focus:ring-1 focus:ring-sys";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} ${props.className || ""}`} />;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "danger" | "upload";
  sm?: boolean;
};

export function Btn({ variant = "solid", sm, className = "", ...rest }: BtnProps) {
  const base =
    "rounded-md font-bold uppercase tracking-[0.04em] transition-all cursor-pointer " +
    (sm ? "px-3.5 py-2 text-xs " : "px-5 py-3 text-sm ");
  const look =
    variant === "solid"
      ? "bg-accent text-accent-ink hover:brightness-110 hover:-translate-y-px active:translate-y-0"
      : variant === "ghost"
        ? "border border-line bg-transparent text-ink hover:border-ink-soft hover:bg-surface2"
        : variant === "danger"
          ? "border border-red-950 bg-transparent text-fail hover:bg-red-950"
          : "bg-sys text-black hover:brightness-110";
  return <button {...rest} className={`${base}${look} ${className}`} />;
}

export function Tag({ kind, children }: { kind: string; children: ReactNode }) {
  const map: Record<string, string> = {
    csl1: "bg-accent/10 text-accent border border-accent/20",
    csl2: "bg-fail/10 text-fail border border-fail/20",
    none: "bg-surface2 text-ink-soft",
    Paid: "bg-pass/10 text-pass",
    Sent: "bg-sys/10 text-sys",
    Overdue: "bg-fail/10 text-fail",
    Draft: "bg-surface2 text-ink-soft",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] ${map[kind] || map.none}`}
    >
      {children}
    </span>
  );
}

export function cslTagKind(csl: string): string {
  return csl === "CS1" || csl === "CSL1" ? "csl1" : csl === "CS2" || csl === "CSL2" ? "csl2" : "none";
}

export function TableWrap({ children, minW = 720 }: { children: ReactNode; minW?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full border-collapse text-[13px]" style={{ minWidth: minW }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, num }: { children?: ReactNode; num?: boolean }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-line bg-surface2 px-3.5 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-soft ${num ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  num,
  className = "",
}: {
  children?: ReactNode;
  num?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b border-line px-3.5 py-3 text-ink ${num ? "text-right font-mono tabular-nums" : "text-left"} ${className}`}
    >
      {children}
    </td>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="p-8 text-center text-sm text-ink-soft">{children}</div>;
}

export function Pill({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="mb-1.5 mr-1.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface2 px-3 py-1.5 text-[13px]">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="font-bold text-fail" title="remove">
          ×
        </button>
      )}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[90vh] w-full max-w-[680px] overflow-auto rounded-[14px] border border-line bg-surface p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,.6)]">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3 text-ink-soft hover:text-white"
          title="close"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-1.5 font-disp text-base font-black uppercase tracking-[0.05em] text-white">
      {children}
    </h2>
  );
}
