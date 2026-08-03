export interface PlanLimits {
  projects: number;          // max unique project names (Infinity = unlimited)
  recordsPerProject: number; // max sort records per project
  parts: number;             // max parts in Setup
  adminAccess: boolean;      // billing / payroll / admin view
  rootCauseAccess: boolean;  // root-cause analysis view
  legalAccess: boolean;      // legal / containment letter view
  exportCSV: boolean;        // CSV / JSON export buttons
  mailingList: number;       // max mailing list recipients (0 = none)
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  "Per-Project": {
    projects: 1,
    recordsPerProject: 10,
    parts: 3,
    adminAccess: false,
    rootCauseAccess: false,
    legalAccess: false,
    exportCSV: false,
    mailingList: 0,
  },
  "Basic": {
    projects: 5,
    recordsPerProject: 50,
    parts: 20,
    adminAccess: false,
    rootCauseAccess: true,
    legalAccess: true,
    exportCSV: true,
    mailingList: 5,
  },
  "Industrial Pro": {
    projects: Infinity,
    recordsPerProject: Infinity,
    parts: Infinity,
    adminAccess: true,
    rootCauseAccess: true,
    legalAccess: true,
    exportCSV: true,
    mailingList: Infinity,
  },
};

export function getLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan ?? ""] ?? PLAN_LIMITS["Per-Project"];
}

export function fmtLimit(n: number): string {
  return n === Infinity ? "Unlimited" : String(n);
}
