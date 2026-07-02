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

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("reading_plans")
      .select("*")
      .eq("group_id", group.id)
      .gte("date", `${month}-01`)
      .lte("date", `${month}-31`)
      .order("date");
    setPlans((data as ReadingPlan[] | null) ?? []);
  }, [group.id, month]);

  useEffect(() => {
    void load();
  }, [load]);

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

      <div className="card mt-5">
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
