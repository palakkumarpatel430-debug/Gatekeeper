import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DB } from "./types";
import { seed } from "./seed";

const KEY = "gatekeeper.v3"; // bumped so the imported glass dataset loads fresh

const DEFAULTS = {
  customers: ["Acme Powertrain", "Northstar Assembly", "Vector Stamping"],
  defects: [
    "Burr",
    "Scratch",
    "Short shot",
    "Flash",
    "Missing feature",
    "Dimensional",
    "Contamination",
    "Wrong part",
  ],
  threshold: 50,
};

function load(): DB {
  let raw: Partial<DB> = {};
  try {
    const s = localStorage.getItem(KEY);
    if (s) raw = JSON.parse(s);
  } catch {
    raw = {};
  }
  const db: DB = {
    records: raw.records || [],
    settings: {
      customers: raw.settings?.customers || [...DEFAULTS.customers],
      defects: raw.settings?.defects || [...DEFAULTS.defects],
      threshold: raw.settings?.threshold ?? DEFAULTS.threshold,
      mailingList: raw.settings?.mailingList || [],
      parts: raw.settings?.parts || [],
    },
    admin: {
      invoices: raw.admin?.invoices || [],
      timelogs: raw.admin?.timelogs || [],
      payments: raw.admin?.payments || [],
      auth: raw.admin?.auth || null,
    },
  };
  return seed(db);
}

interface StoreCtx {
  db: DB;
  update: (fn: (db: DB) => void) => void;
  toast: (msg: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      /* storage unavailable */
    }
  }, [db]);

  const update = useCallback((fn: (d: DB) => void) => {
    setDb((prev) => {
      const next: DB = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToastMsg(null), 1800);
  }, []);

  return (
    <Ctx.Provider value={{ db, update, toast }}>
      {children}
      <div
        className={
          "pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white shadow-card transition-all duration-300 " +
          (toastMsg ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0")
        }
      >
        {toastMsg}
      </div>
    </Ctx.Provider>
  );
}

export function useStore(): StoreCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
