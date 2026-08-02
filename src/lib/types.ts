export interface Loc {
  x: number;
  y: number;
}

export interface Defect {
  type: string;
  count: number;
  zone?: string;
  loc?: Loc | null;
  photo?: string | null;
}

export interface SortRecord {
  id: string;
  date: string;
  customer: string;
  project: string;
  part: string;
  box: string;
  csl: string;
  ref: string;
  po: string;
  operator: string;
  total: number;
  defects: Defect[];
  rework: number;
  scrap: number;
  start: string;
  end: string;
  notes: string;
}

export interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Part {
  part: string;
  photo: string;
  zones: Zone[];
}

export interface MailRecipient {
  email: string;
  name: string;
  freq: string;
}

export interface Settings {
  customers: string[];
  defects: string[];
  threshold: number;
  mailingList: MailRecipient[];
  parts: Part[];
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface Invoice {
  id: string;
  project: string;
  customer: string;
  po: string;
  num: string;
  date: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
}

export interface TimeLog {
  id: string;
  employee: string;
  project: string;
  date: string;
  hours: number;
  rate: number;
}

export interface Payment {
  id: string;
  date: string;
  project: string;
  ref: string;
  amount: number;
  method: string;
}

export interface AdminAuth {
  user: string;
  hash: string;
}

export interface AdminData {
  invoices: Invoice[];
  timelogs: TimeLog[];
  payments: Payment[];
  auth: AdminAuth | null;
}

export interface DB {
  records: SortRecord[];
  settings: Settings;
  admin: AdminData;
}

export type View =
  | "home"
  | "entry"
  | "dash"
  | "records"
  | "costing"
  | "report"
  | "rootcause"
  | "legal"
  | "admin"
  | "setup";
