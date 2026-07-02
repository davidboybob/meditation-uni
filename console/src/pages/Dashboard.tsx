import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { todayYmd, ymd } from "../lib/date";
import {
  STATUS_LABEL,
  STATUS_STYLE,
  type AttendanceRecord,
  type AttendanceStatus,
  type Membership,
} from "../lib/types";

const QUICK: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export default function Dashboard() {
  const { ctx } = useAuth();
  const group = ctx!.group;
  const today = todayYmd();

  const [members, setMembers] = useState<Membership[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [weekRecords, setWeekRecords] = useState<AttendanceRecord[]>([]);
  const [passage, setPassage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);

    const [m, r, w, p] = await Promise.all([
      supabase
        .from("memberships")
        .select("*, profiles(*)")
        .eq("group_id", group.id)
        .eq("active", true)
        .order("joined_at"),
      supabase.from("attendance_records").select("*").eq("group_id", group.id).eq("date", today),
      supabase
        .from("attendance_records")
        .select("*")
        .eq("group_id", group.id)
        .gte("date", ymd(weekStart))
        .lte("date", today),
      supabase.from("reading_plans").select("*").eq("group_id", group.id).eq("date", today).maybeSingle(),
    ]);
    setMembers((m.data as Membership[] | null) ?? []);
    setRecords((r.data as AttendanceRecord[] | null) ?? []);
    setWeekRecords((w.data as AttendanceRecord[] | null) ?? []);
    setPassage(p.data ? (p.data as { passage: string }).passage : null);
  }, [group.id, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const recordOf = (userId: string) => records.find((r) => r.user_id === userId);
  const submitted = records.filter((r) => r.status === "present" || r.status === "late");
  const pending = members.filter((m) => {
    const r = recordOf(m.user_id);
    return !r || r.status === "absent";
  });
  const perfectSoFar = useMemo(() => {
    const bad = new Set(
      weekRecords.filter((r) => r.status === "absent" || r.status === "late").map((r) => r.user_id),
    );
    return members.filter((m) => !bad.has(m.user_id)).length;
  }, [members, weekRecords]);

  const setStatus = async (m: Membership, status: AttendanceStatus) => {
    const prev = recordOf(m.user_id);
    const { data, error } = await supabase
      .from("attendance_records")
      .upsert(
        {
          group_id: group.id,
          user_id: m.user_id,
          date: today,
          status,
          source: "manual",
          created_by: ctx!.userId,
        },
        { onConflict: "group_id,user_id,date" },
      )
      .select()
      .single();
    if (error) {
      toast.error(`저장 실패: ${error.message}`);
      return;
    }
    if (prev && prev.status !== status) {
      await supabase.from("attendance_adjustments").insert({
        record_id: (data as AttendanceRecord).id,
        old_status: prev.status,
        new_status: status,
        reason: "대시보드 퀵체크 변경",
        adjusted_by: ctx!.userId,
      });
    }
    toast.success(`${m.profiles.display_name} — ${STATUS_LABEL[status]}`);
    void load();
  };

  const copyReminder = async () => {
    const names = pending.map((m) => m.profiles.display_name).join(", ");
    const lines = [
      `📢 묵상 리마인드 (${today.slice(5).replace("-", "/")})`,
      passage ? `오늘 본문: ${passage}` : null,
      pending.length ? `아직 제출 전: ${names}` : "오늘 전원 제출 완료! 🎉",
      "마감은 오늘 23:59입니다. 화이팅! 🙏",
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    toast.success("리마인드 문구를 복사했어요. 카톡방에 붙여넣기!");
  };

  // 최근 7일 제출률
  const spark = useMemo(() => {
    const days: { day: string; rate: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = ymd(d);
      const cnt = weekRecords.filter(
        (r) => r.date === key && (r.status === "present" || r.status === "late"),
      ).length;
      days.push({ day: key.slice(8), rate: members.length ? cnt / members.length : 0 });
    }
    return days;
  }, [weekRecords, members.length]);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">오늘 현황</h1>
          <p className="mt-1 text-sm text-base-text/50">
            {today} {passage ? `· 오늘 본문: ${passage}` : ""}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => void copyReminder()}>
          📋 리마인드 문구 복사
        </button>
      </header>

      {/* 상단 카드 */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card">
          <div className="text-xs text-base-text/50">오늘 제출률</div>
          <div className="mt-1 text-2xl font-bold text-accent-deep">
            {submitted.length}/{members.length}
          </div>
        </div>
        <div className="card">
          <div className="text-xs text-base-text/50">미제출</div>
          <div className="mt-1 text-2xl font-bold text-rose-500">{pending.length}명</div>
        </div>
        <div className="card">
          <div className="text-xs text-base-text/50">최근 7일 무결점</div>
          <div className="mt-1 text-2xl font-bold">{perfectSoFar}명</div>
        </div>
        <div className="card">
          <div className="text-xs text-base-text/50">마감</div>
          <div className="mt-1 text-2xl font-bold">23:59</div>
        </div>
      </div>

      {/* 7일 스파크라인 */}
      <div className="card mt-4">
        <div className="mb-3 text-sm font-semibold">최근 7일 제출률</div>
        <div className="flex h-24 gap-2">
          {spark.map((s) => (
            <div key={s.day} className="flex h-full flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-accent"
                  style={{ height: `${Math.max(5, s.rate * 100)}%`, opacity: 0.35 + s.rate * 0.65 }}
                />
              </div>
              <div className="text-[10px] text-base-text/40">
                {s.day}일 <span className="text-accent-deep">{Math.round(s.rate * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 퀵 체크 */}
      <div className="card mt-4">
        <div className="mb-1 text-sm font-semibold">오늘 출석 퀵 체크</div>
        <p className="mb-4 text-xs text-base-text/40">카톡방 제출 글을 보며 탭 한 번으로 기록하세요.</p>
        <ul className="divide-y divide-card-border">
          {members.map((m) => {
            const r = recordOf(m.user_id);
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.profiles.display_name}</span>
                  {r && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {QUICK.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void setStatus(m, s)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        r?.status === s
                          ? STATUS_STYLE[s]
                          : "bg-base-bg text-base-text/40 hover:text-base-text"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
          {members.length === 0 && (
            <li className="py-6 text-center text-sm text-base-text/40">활성 멤버가 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
