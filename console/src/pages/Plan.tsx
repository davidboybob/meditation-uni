import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { addMonths, thisMonth } from "../lib/date";
import type { ReadingPlan } from "../lib/types";

/** 한 줄 형식: 'YYYY-MM-DD 본문' 또는 'M/D 본문' */
function parseLine(line: string, month: string): { date: string; passage: string } | null {
  const t = line.trim();
  if (!t) return null;
  let m = t.match(/^(\d{4}-\d{2}-\d{2})\s+(.+)$/);
  if (m) return { date: m[1], passage: m[2].trim() };
  m = t.match(/^(\d{1,2})\/(\d{1,2})\s+(.+)$/);
  if (m) {
    const [y] = month.split("-");
    return {
      date: `${y}-${String(Number(m[1])).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`,
      passage: m[3].trim(),
    };
  }
  return null;
}

export default function Plan() {
  const { ctx } = useAuth();
  const group = ctx!.group;

  const [month, setMonth] = useState(thisMonth());
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [bulk, setBulk] = useState("");

  // 자동 생성기 입력
  const [genBook, setGenBook] = useState("");
  const [genStart, setGenStart] = useState(1);
  const [genEnd, setGenEnd] = useState(1);
  const [genFrom, setGenFrom] = useState(""); // YYYY-MM-DD
  const [skipSunday, setSkipSunday] = useState(false);

  const load = useCallback(async () => {
    const nextMonthFirst = addMonths(month, 1) + "-01";
    const { data } = await supabase
      .from("reading_plans")
      .select("*")
      .eq("group_id", group.id)
      .gte("date", `${month}-01`)
      .lt("date", nextMonthFirst)
      .order("date");
    setPlans((data as ReadingPlan[] | null) ?? []);
  }, [group.id, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async () => {
    const book = genBook.trim();
    if (!book || !genFrom || genEnd < genStart) {
      toast.error("책 이름, 시작 날짜, 장 범위를 확인해 주세요.");
      return;
    }
    const rows: { group_id: string; date: string; passage: string }[] = [];
    const cursor = new Date(`${genFrom}T00:00:00`);
    if (Number.isNaN(cursor.getTime())) {
      toast.error("시작 날짜 형식이 올바르지 않아요. (YYYY-MM-DD)");
      return;
    }
    for (let ch = genStart; ch <= genEnd; ) {
      if (skipSunday && cursor.getDay() === 0) {
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
      const y = cursor.getFullYear();
      const mo = String(cursor.getMonth() + 1).padStart(2, "0");
      const da = String(cursor.getDate()).padStart(2, "0");
      rows.push({ group_id: group.id, date: `${y}-${mo}-${da}`, passage: `${book} ${ch}장` });
      ch++;
      cursor.setDate(cursor.getDate() + 1);
    }
    const { error } = await supabase.from("reading_plans").upsert(rows, { onConflict: "group_id,date" });
    if (error) return toast.error(error.message);
    toast.success(`${book} ${genStart}~${genEnd}장 → ${rows.length}일치 일정 생성 완료 (${rows[0].date} ~ ${rows[rows.length - 1].date})`);
    setMonth(rows[0].date.slice(0, 7));
    void load();
  };

  const saveBulk = async () => {
    const rows = bulk
      .split("\n")
      .map((l) => parseLine(l, month))
      .filter((r): r is { date: string; passage: string } => r !== null)
      .map((r) => ({ ...r, group_id: group.id }));
    if (!rows.length) {
      toast.error("등록할 줄이 없어요. 형식: '7/2 누가복음 3장' 또는 '2026-07-02 누가복음 3장'");
      return;
    }
    const { error } = await supabase.from("reading_plans").upsert(rows, { onConflict: "group_id,date" });
    if (error) return toast.error(error.message);
    toast.success(`${rows.length}건 등록/갱신했어요.`);
    setBulk("");
    void load();
  };

  const remove = async (p: ReadingPlan) => {
    const { error } = await supabase.from("reading_plans").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">통독 일정</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost px-3" onClick={() => setMonth(addMonths(month, -1))}>
            ←
          </button>
          <span className="min-w-24 text-center font-semibold">{month}</span>
          <button type="button" className="btn-ghost px-3" onClick={() => setMonth(addMonths(month, 1))}>
            →
          </button>
        </div>
      </header>

      {/* 자동 생성기 */}
      <div className="card mt-5">
        <div className="text-sm font-semibold">📖 통독 일정 자동 생성</div>
        <p className="mt-1 text-xs text-base-text/40">
          책과 장 범위를 넣으면 시작 날짜부터 하루 1장씩 자동으로 배정합니다. 기존 날짜는 덮어써요.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="col-span-2 flex flex-col gap-1 text-xs font-medium sm:col-span-1">
            책 이름
            <input type="text" placeholder="누가복음" value={genBook} onChange={(e) => setGenBook(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            시작 장
            <input type="number" min={1} value={genStart} onChange={(e) => setGenStart(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            끝 장
            <input type="number" min={1} value={genEnd} onChange={(e) => setGenEnd(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            시작 날짜
            <input type="text" placeholder="2026-07-03" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-xs font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent-deep"
              checked={skipSunday}
              onChange={(e) => setSkipSunday(e.target.checked)}
            />
            주일(일요일) 건너뛰기
          </label>
        </div>
        <button type="button" className="btn-primary mt-3" onClick={() => void generate()}>
          일정 생성
        </button>
      </div>

      <div className="card mt-4">
        <div className="text-sm font-semibold">일괄 등록</div>
        <p className="mt-1 text-xs text-base-text/40">
          한 줄에 하나씩 — <code>7/2 누가복음 3장</code> 형식. 기존 날짜는 덮어씁니다.
        </p>
        <textarea
          rows={6}
          className="mt-3 w-full font-mono text-xs"
          placeholder={"7/1 누가복음 1장\n7/2 누가복음 2장\n7/3 누가복음 3장"}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
        />
        <button type="button" className="btn-primary mt-3" onClick={() => void saveBulk()}>
          등록
        </button>
      </div>

      <div className="card mt-4 p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-card-subtle text-left text-xs text-base-text/50">
              <th className="px-4 py-2.5 font-semibold">날짜</th>
              <th className="px-4 py-2.5 font-semibold">본문</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-card-border/60">
                <td className="px-4 py-2 text-base-text/60">{p.date}</td>
                <td className="px-4 py-2 font-medium">{p.passage}</td>
                <td className="px-4 py-2 text-right">
                  <button type="button" className="text-xs text-rose-500 underline" onClick={() => void remove(p)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-base-text/40">
                  {month}에 등록된 일정이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
