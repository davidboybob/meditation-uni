import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { downloadCsv } from "@kit/utils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { addMonths, monthDates, thisMonth, todayYmd } from "../lib/date";
import {
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_STYLE,
  type AttendanceRecord,
  type AttendanceStatus,
  type Membership,
} from "../lib/types";

interface CellTarget {
  member: Membership;
  date: string;
  record: AttendanceRecord | undefined;
}

interface AdjustmentRow {
  id: string;
  old_status: string | null;
  new_status: string;
  reason: string;
  created_at: string;
  attendance_records: { date: string; profiles: { display_name: string } };
  profiles: { display_name: string };
}

const ALL_STATUS: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export default function Attendance() {
  const { ctx } = useAuth();
  const group = ctx!.group;
  const today = todayYmd();

  const [month, setMonth] = useState(thisMonth());
  const [members, setMembers] = useState<Membership[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [target, setTarget] = useState<CellTarget | null>(null);
  const [reason, setReason] = useState("");
  const [adjustments, setAdjustments] = useState<AdjustmentRow[] | null>(null); // null = 닫힘

  const dates = useMemo(() => monthDates(month), [month]);

  const load = useCallback(async () => {
    const [m, r] = await Promise.all([
      supabase
        .from("memberships")
        .select("*, profiles(*)")
        .eq("group_id", group.id)
        .eq("active", true)
        .order("joined_at"),
      supabase
        .from("attendance_records")
        .select("*")
        .eq("group_id", group.id)
        .gte("date", dates[0])
        .lte("date", dates[dates.length - 1]),
    ]);
    setMembers((m.data as Membership[] | null) ?? []);
    setRecords((r.data as AttendanceRecord[] | null) ?? []);
  }, [group.id, dates]);

  useEffect(() => {
    void load();
  }, [load]);

  const recMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) map.set(`${r.user_id}|${r.date}`, r);
    return map;
  }, [records]);

  const totals = (userId: string) => {
    const mine = records.filter((r) => r.user_id === userId);
    const a = mine.filter((r) => r.status === "absent").length;
    const l = mine.filter((r) => r.status === "late").length;
    return { a, l, eff: a + Math.floor(l / group.late_per_absence) };
  };

  const saveCell = async (status: AttendanceStatus | "clear") => {
    if (!target) return;
    const { member, date, record } = target;
    if (status === "clear") {
      // 주의: 기록 삭제 시 해당 기록의 정정 이력도 함께 삭제됨(FK cascade) — 감사가 필요하면 삭제 대신 상태 변경 권장
      if (record) {
        const { error } = await supabase.from("attendance_records").delete().eq("id", record.id);
        if (error) return toast.error(error.message);
      }
      setTarget(null);
      setReason("");
      void load();
      return;
    }
    const { data, error } = await supabase
      .from("attendance_records")
      .upsert(
        {
          group_id: group.id,
          user_id: member.user_id,
          date,
          status,
          source: "manual",
          note: reason.trim() || null,
          created_by: ctx!.userId,
        },
        { onConflict: "group_id,user_id,date" },
      )
      .select()
      .single();
    if (error) return toast.error(`저장 실패: ${error.message}`);
    if (record && record.status !== status) {
      await supabase.from("attendance_adjustments").insert({
        record_id: (data as AttendanceRecord).id,
        old_status: record.status,
        new_status: status,
        reason: reason.trim() || "출석부에서 정정",
        adjusted_by: ctx!.userId,
      });
    }
    toast.success(`${member.profiles.display_name} · ${date.slice(5)} → ${STATUS_LABEL[status]}`);
    setTarget(null);
    setReason("");
    void load();
  };

  const openAdjustments = async () => {
    const { data, error } = await supabase
      .from("attendance_adjustments")
      .select(
        "id, old_status, new_status, reason, created_at, attendance_records!inner(date, group_id, profiles!attendance_records_user_id_fkey(display_name)), profiles!attendance_adjustments_adjusted_by_fkey(display_name)",
      )
      .eq("attendance_records.group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return toast.error(error.message);
    setAdjustments((data as unknown as AdjustmentRow[]) ?? []);
  };

  const exportCsv = () => {
    const head = ["이름", ...dates.map((d) => d.slice(8)), "결석", "지각", "환산결석"];
    const rows = members.map((m) => {
      const t = totals(m.user_id);
      return [
        m.profiles.display_name,
        ...dates.map((d) => {
          const r = recMap.get(`${m.user_id}|${d}`);
          return r ? STATUS_LABEL[r.status] : "";
        }),
        t.a,
        t.l,
        t.eff,
      ];
    });
    downloadCsv(`출석부_${month}.csv`, [head, ...rows]);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">출석부</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost px-3" onClick={() => setMonth(addMonths(month, -1))}>
            ←
          </button>
          <span className="min-w-24 text-center font-semibold">{month}</span>
          <button type="button" className="btn-ghost px-3" onClick={() => setMonth(addMonths(month, 1))}>
            →
          </button>
          <button type="button" className="btn-ghost" onClick={exportCsv}>
            CSV
          </button>
          <button type="button" className="btn-ghost" onClick={() => void openAdjustments()}>
            🧾 정정 이력
          </button>
        </div>
      </header>
      <p className="mt-1 text-xs text-base-text/40">
        셀을 클릭해 기록/정정하세요. 지각 {group.late_per_absence}회 = 결석 1회로 환산됩니다.
      </p>

      <div className="card mt-4 overflow-x-auto p-0">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-card-border bg-card-subtle">
              <th className="sticky left-0 z-10 bg-card-subtle px-3 py-2 text-left font-semibold">이름</th>
              {dates.map((d) => (
                <th
                  key={d}
                  className={`min-w-8 px-1 py-2 text-center font-medium ${
                    d === today ? "bg-accent-soft text-accent-deep" : "text-base-text/50"
                  }`}
                >
                  {Number(d.slice(8))}
                </th>
              ))}
              <th className="px-2 py-2 text-center font-semibold text-rose-500">결</th>
              <th className="px-2 py-2 text-center font-semibold text-amber-500">지</th>
              <th className="px-2 py-2 text-center font-semibold">환산</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const t = totals(m.user_id);
              return (
                <tr key={m.id} className="border-b border-card-border/60 hover:bg-card-subtle/60">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-1.5 font-medium">
                    {m.profiles.display_name}
                  </td>
                  {dates.map((d) => {
                    const r = recMap.get(`${m.user_id}|${d}`);
                    return (
                      <td key={d} className="p-0 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setTarget({ member: m, date: d, record: r });
                            setReason("");
                          }}
                          className={`h-8 w-full min-w-8 text-[13px] leading-8 transition hover:bg-accent-soft ${
                            d === today ? "bg-accent-soft/40" : ""
                          }`}
                          title={`${m.profiles.display_name} · ${d}${r ? ` · ${STATUS_LABEL[r.status]}` : ""}`}
                        >
                          {r ? STATUS_DOT[r.status] : "·"}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-2 text-center font-semibold text-rose-500">{t.a}</td>
                  <td className="px-2 text-center font-semibold text-amber-500">{t.l}</td>
                  <td className={`px-2 text-center font-bold ${t.eff > group.absence_limit ? "text-rose-600" : ""}`}>
                    {t.eff}
                  </td>
                </tr>
              );
            })}
            {members.length === 0 && (
              <tr>
                <td colSpan={dates.length + 4} className="py-8 text-center text-base-text/40">
                  활성 멤버가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 정정 이력 모달 */}
      {adjustments !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
          onClick={() => setAdjustments(null)}
        >
          <div
            className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold">🧾 정정 이력 (최근 50건)</h2>
              <button type="button" className="text-sm text-base-text/40 hover:text-base-text" onClick={() => setAdjustments(null)}>
                ✕
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {adjustments.map((a) => (
                <li key={a.id} className="rounded-xl bg-card-subtle px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{a.attendance_records.profiles.display_name}</b>
                    <span className="text-base-text/50">{a.attendance_records.date}</span>
                    <span className="text-xs">
                      {a.old_status ? STATUS_LABEL[a.old_status as keyof typeof STATUS_LABEL] : "미기록"} →{" "}
                      <b className="text-accent-deep">{STATUS_LABEL[a.new_status as keyof typeof STATUS_LABEL]}</b>
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-base-text/60">사유: {a.reason}</div>
                  <div className="mt-0.5 text-[11px] text-base-text/40">
                    {a.profiles.display_name} · {a.created_at.slice(0, 16).replace("T", " ")}
                  </div>
                </li>
              ))}
              {adjustments.length === 0 && (
                <li className="py-8 text-center text-sm text-base-text/40">정정 이력이 없습니다.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 기록/정정 모달 */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
          onClick={() => setTarget(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold">
              {target.member.profiles.display_name} · {target.date}
            </h2>
            <p className="mt-1 text-xs text-base-text/50">
              현재: {target.record ? STATUS_LABEL[target.record.status] : "미기록"}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {ALL_STATUS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void saveCell(s)}
                  className={`rounded-xl py-2 text-sm font-semibold ${STATUS_STYLE[s]} transition hover:opacity-80`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="mt-3 w-full"
              placeholder="정정 사유/메모 (선택)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="mt-4 flex justify-between">
              <button type="button" className="text-xs text-rose-500 underline" onClick={() => void saveCell("clear")}>
                기록 삭제
              </button>
              <button type="button" className="btn-ghost" onClick={() => setTarget(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
