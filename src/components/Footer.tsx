export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg px-4 py-8 text-center print:hidden">
      <div className="inline-flex items-center gap-2.5 rounded-full border border-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.05em] text-accent">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
        </svg>
        Michigan Made · Michigan Based
      </div>
      <p className="mt-3 text-xs text-ink-soft">© 2026 Motor City Workforce · Wayne County Compliance</p>
    </footer>
  );
}
