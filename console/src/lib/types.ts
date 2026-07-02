export type AttendanceStatus = "present" | "late" | "absent" | "excused";
export type Role = "owner" | "admin" | "member";

export interface Profile {
  id: string;
  display_name: string;
}

export interface Group {
  id: string;
  name: string;
  join_code: string;
  monthly_fee: number;
  absence_rate: number;
  late_rate: number;
  late_per_absence: number;
  absence_limit: number;
  late_cutoff: string | null;
}

export interface Membership {
  id: string;
  user_id: string;
  group_id: string;
  role: Role;
  active: boolean;
  joined_at: string;
  profiles: Profile;
}

export interface AttendanceRecord {
  id: string;
  group_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  source: "manual" | "self";
  note: string | null;
}

export interface ReadingPlan {
  id: string;
  group_id: string;
  date: string;
  passage: string;
}

export interface Settlement {
  id: string;
  group_id: string;
  month: string; // YYYY-MM
  status: "draft" | "confirmed";
  confirmed_at: string | null;
}

export interface SettlementItem {
  id: string;
  settlement_id: string;
  user_id: string;
  absences: number;
  lates: number;
  effective_absences: number;
  deduction: number;
  refund: number;
  carryover: boolean;
  scholarship: boolean;
  carryover_in: boolean;
  memo: string | null;
  profiles?: Profile;
}

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "출석",
  late: "지각",
  absent: "결석",
  excused: "공결",
};

export const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-700",
  late: "bg-amber-100 text-amber-700",
  absent: "bg-rose-100 text-rose-700",
  excused: "bg-slate-200 text-slate-600",
};

export const STATUS_DOT: Record<AttendanceStatus, string> = {
  present: "✅",
  late: "🟡",
  absent: "❌",
  excused: "⚪",
};
