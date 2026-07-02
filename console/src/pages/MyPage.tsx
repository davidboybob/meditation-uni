import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { calcStreak } from "@kit/challenge";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { monthDates, thisMonth, todayYmd, fmtWon } from "../lib/date";
import {
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_STYLE,
  type AttendanceRecord,
  type Settlement,
  type SettlementItem,
} from "../lib/types";

export default function MyPage() {
  const { ctx } = useAuth();
  const group = ctx!.group;
  const userId = ctx!.userId;
  const today = todayYmd();
  const month = thisMonth();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [passage, setPassage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [mySettle, setMySettle] = useState<{ month: string; status: string; item: SettlementItem } | null>(null);
  const [commentsToday, setCommentsToday] = useState(0);

  const dates = useMemo(() => monthDates(month), [month]);

  const load = useCallback(async () => {
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00+09:00`);
    setCommentsToday(count ?? 0);

    const [r, p, s] = await Promise.all([
      supabase
        .from("attendance_records")
        .select("*")
        .eq("group_id", group.id)
        .eq("user_id", userId)
        .gte("date", dates[0])
        .lte("date", dates[dates.length - 1]),
      supabase.from("reading_plans").select("passage").eq("group_id", group.id).eq("date", today).maybeSingle(),
      supabase
        .from("settlements")
        .select("*")
        .eq("group_id", group.id)
        .order("month", { ascending: false })
        .limit(3),
    ]);
    setRecords((r.data as AttendanceRecord[] | null) ?? []);
    setPassage(p.data ? (p.data as { passage: string }).passage : null);

    // 가장 최근 정산 중 내 라인 찾기
    const stls = (s.data as Settlement[] | null) ?? [];
    for (const stl of stls) {
      const { data: it } = await supabase
        .from("settlement_items")
        .select("*")
        .eq("settlement_id", stl.id)
        .eq("user_id", userId)
        .maybeSingle();
      if (it) {
        setMySettle({ month: stl.month, status: stl.status, item: it as SettlementItem });
        return;
      }
    }
    setMySettle(null);
  }, [group.id, userId, dates, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const todayRecord = records.find((r) => r.date === today);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("submit_meditation", {
      p_group_id: group.id,
      p_note: note,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("이미") ? "이미 오늘 묵상을 제출했어요." : error.message);
      return;
    }
    toast.success("오늘 묵상 제출 완료! 🙏");
    setNote("");
    void load();
  };

  // 이번 달 통계 + 현재 연속(스트릭) — @kit/challenge
  const stats = useMemo(
    () => ({
      done: records.filter((r) => r.status === "present" || r.status === "late").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
      streak: calcStreak(records, { today, minDate: dates[0] }),
    }),
    [records, today, dates],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-xl font-bold">내 묵상</h1>
        <p className="mt-1 text-sm text-base-text/50">
          {today} {passage ? `· 오늘 본문: ${passage}` : ""}
        </p>
      </header>

      {/* 오늘 제출 */}
      <div className="card mt-5">
        {todayRecord ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">오늘 묵상</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[todayRecord.status]}`}>
                {STATUS_LABEL[todayRecord.status]}
              </span>
            </div>
            {todayRecord.note && (
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-card-subtle p-4 text-sm leading-relaxed">
                {todayRecord.note}
              </p>
            )}
            <p className="mt-3 text-xs text-base-text/40">오늘 몫을 완료했어요. 내일도 함께해요 🌱</p>
          </div>
        ) : (
          <div>
            <div className="text-sm font-semibold">오늘 묵상 제출</div>
            <p className="mt-1 text-xs text-base-text/40">
              묵상 내용 또는 블로그 글 링크를 남겨주세요. 마감은 오늘 23:59입니다.
            </p>
            <textarea
              rows={5}
              className="mt-3 w-full"
              placeholder={"오늘 말씀에서 받은 은혜, 기도 제목, 오늘의 질문…\n(또는 블로그 글 링크)"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="button" className="btn-primary mt-3" disabled={busy} onClick={() => void submit()}>
              {busy ? "제출 중…" : "오늘 묵상 제출하기 ✨"}
            </button>
          </div>
        )}
      </div>

      {/* 오늘 목표 체크리스트 (규칙 2. 1일 목표) */}
      <div className="card mt-4">
        <div className="text-sm font-semibold">오늘 목표</div>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className={todayRecord ? "" : "opacity-30"}>{todayRecord ? "✅" : "⬜"}</span>
            묵상 글 제출하기
            {todayRecord && <span className="text-xs text-base-text/40">완료</span>}
          </li>
          <li className="flex items-center gap-2">
            <span className={commentsToday > 0 ? "" : "opacity-30"}>{commentsToday > 0 ? "✅" : "⬜"}</span>
            다른 사람 글에 답글 1회 이상
            {commentsToday > 0 ? (
              <span className="text-xs text-base-text/40">오늘 {commentsToday}개</span>
            ) : (
              <Link to="/feed" className="text-xs font-semibold text-accent-deep underline underline-offset-2">
                나눔 피드 가기 →
              </Link>
            )}
          </li>
        </ul>
        {todayRecord && commentsToday > 0 && (
          <p className="mt-3 text-xs font-semibold text-emerald-600">오늘 목표 모두 달성! 🎉</p>
        )}
      </div>

      {/* 이번 달 통계 */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="text-xs text-base-text/50">🔥 연속</div>
          <div className="mt-1 text-2xl font-bold text-accent-deep">{stats.streak}일</div>
        </div>
        <div className="card">
          <div className="text-xs text-base-text/50">이번 달 제출</div>
          <div className="mt-1 text-2xl font-bold">{stats.done}일</div>
        </div>
        <div className="card">
          <div className="text-xs text-base-text/50">지각</div>
          <div className="mt-1 text-2xl font-bold text-amber-500">{stats.late}</div>
        </div>
        <div className="card">
          <div className="text-xs text-base-text/50">결석</div>
          <div className="mt-1 text-2xl font-bold text-rose-500">{stats.absent}</div>
        </div>
      </div>

      {/* 이번 달 캘린더 */}
      <div className="card mt-4">
        <div className="mb-3 text-sm font-semibold">{month} 나의 기록</div>
        <div className="grid grid-cols-7 gap-1.5">
          {dates.map((d) => {
            const rec = records.find((r) => r.date === d);
            return (
              <div
                key={d}
                title={`${d}${rec ? ` · ${STATUS_LABEL[rec.status]}` : ""}`}
                className={`flex h-9 flex-col items-center justify-center rounded-lg text-[11px] ${
                  d === today ? "ring-2 ring-accent" : ""
                } ${rec ? "bg-card-subtle" : "bg-base-bg text-base-text/30"}`}
              >
                <span>{Number(d.slice(8))}</span>
                {rec && <span className="text-[9px] leading-none">{STATUS_DOT[rec.status]}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 내 정산 */}
      <div className="card mt-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          내 정산 {mySettle ? `(${mySettle.month})` : ""}
          {mySettle?.status === "draft" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              가안 — 확정 전 수치는 바뀔 수 있어요
            </span>
          )}
          {mySettle?.status === "confirmed" && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">확정</span>
          )}
        </div>
        {mySettle ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              결석 <b className="text-rose-500">{mySettle.item.absences}</b> · 지각{" "}
              <b className="text-amber-500">{mySettle.item.lates}</b>
            </span>
            <span>
              차감 <b className="text-rose-500">-{fmtWon(mySettle.item.deduction)}</b>
            </span>
            <span>
              환급 <b className="text-accent-deep">{fmtWon(mySettle.item.refund)}</b>
            </span>
            {mySettle.item.scholarship && <span>🎓 100% 달성 — 이월+장학!</span>}
            {mySettle.item.carryover_in && <span>🔖 전월 이월 적용(이번 달 회비 면제)</span>}
          </div>
        ) : (
          <p className="text-sm text-base-text/40">아직 정산 내역이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
