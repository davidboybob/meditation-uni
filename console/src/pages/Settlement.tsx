import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { addMonths, fmtWon, thisMonth } from "../lib/date";
import { kakaoEnabled, shareToKakao } from "../lib/kakao";
import type { Settlement, SettlementItem } from "../lib/types";

export default function SettlementPage() {
  const { ctx } = useAuth();
  const group = ctx!.group;

  const [month, setMonth] = useState(thisMonth());
  const [stl, setStl] = useState<Settlement | null>(null);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("settlements")
      .select("*")
      .eq("group_id", group.id)
      .eq("month", month)
      .maybeSingle();
    setStl((data as Settlement | null) ?? null);
    if (data) {
      const { data: it } = await supabase
        .from("settlement_items")
        .select("*, profiles(*)")
        .eq("settlement_id", (data as Settlement).id)
        .order("refund", { ascending: false });
      setItems((it as SettlementItem[] | null) ?? []);
    } else {
      setItems([]);
    }
  }, [group.id, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const calculate = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("calculate_settlement", {
      p_group_id: group.id,
      p_month: month,
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("confirmed") ? "이미 확정된 정산입니다. 확정 해제 후 재계산하세요." : error.message,
      );
      return;
    }
    toast.success("정산이 계산되었습니다. 검토 후 확정하세요.");
    void load();
  };

  const confirm = async () => {
    if (!stl) return;
    const { error } = await supabase
      .from("settlements")
      .update({ status: "confirmed", confirmed_by: ctx!.userId, confirmed_at: new Date().toISOString() })
      .eq("id", stl.id);
    if (error) return toast.error(error.message);
    toast.success("정산을 확정했습니다.");
    void load();
  };

  const unconfirm = async () => {
    if (!stl) return;
    const { error } = await supabase
      .from("settlements")
      .update({ status: "draft", confirmed_by: null, confirmed_at: null })
      .eq("id", stl.id);
    if (error) return toast.error(error.message);
    toast.success("확정을 해제했습니다. 재계산할 수 있어요.");
    void load();
  };

  const shareText = () => {
    const perfect = items.filter((i) => i.scholarship);
    return [
      `📊 묵상대학 ${month} 정산 결과`,
      `(회비 ${fmtWon(group.monthly_fee)} 기준)`,
      "",
      perfect.length
        ? `🎓 100% 달성 — 전액 환급+이월+장학: ${perfect.map((i) => i.profiles?.display_name ?? "?").join(", ")}`
        : "🎓 이번 달 100% 달성자가 없습니다.",
      "",
      ...items
        .filter((i) => !i.scholarship)
        .map(
          (i) =>
            `· ${i.profiles?.display_name ?? "?"}: 결석 ${i.absences}·지각 ${i.lates} → 차감 ${fmtWon(i.deduction)} / 환급 ${fmtWon(i.refund)}${i.carryover_in ? " (전월 이월 적용)" : ""}`,
        ),
    ].join("\n");
  };

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareText());
    toast.success("공유용 정산 요약을 복사했어요.");
  };

  const kakaoShare = async () => {
    const ok = await shareToKakao(shareText());
    if (!ok) toast.error("카카오 SDK 로드 실패 — 키 설정을 확인하세요.");
  };

  const exportCsv = () => {
    const head = "이름,결석,지각,환산결석,차감액,환급액,이월,장학";
    const rows = items.map((i) =>
      [
        i.profiles?.display_name ?? "?",
        i.absences,
        i.lates,
        i.effective_absences,
        i.deduction,
        i.refund,
        i.carryover ? "O" : "",
        i.scholarship ? "O" : "",
      ].join(","),
    );
    const blob = new Blob(["﻿" + [head, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `정산_${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const confirmed = stl?.status === "confirmed";

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">월 정산</h1>
          <p className="mt-1 text-sm text-base-text/50">
            회비 {fmtWon(group.monthly_fee)} · 결석 {group.absence_rate * 100}% · 지각 {group.late_rate * 100}% 차감 ·
            환산결석 {group.absence_limit}회 초과 시 전액 차감
          </p>
        </div>
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

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary" disabled={busy || confirmed} onClick={() => void calculate()}>
          {busy ? "계산 중…" : stl ? "재계산" : "정산 계산"}
        </button>
        {stl && !confirmed && (
          <button type="button" className="btn-ghost" onClick={() => void confirm()}>
            ✅ 확정
          </button>
        )}
        {confirmed && (
          <>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
              확정됨 {stl?.confirmed_at?.slice(0, 10)}
            </span>
            <button type="button" className="btn-ghost" onClick={() => void unconfirm()}>
              확정 해제
            </button>
          </>
        )}
        {items.length > 0 && (
          <>
            <button type="button" className="btn-ghost" onClick={() => void copyShare()}>
              📋 공유 텍스트
            </button>
            {kakaoEnabled && (
              <button type="button" className="btn-ghost" onClick={() => void kakaoShare()}>
                💬 카카오
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={exportCsv}>
              CSV
            </button>
          </>
        )}
      </div>

      {items.length > 0 ? (
        <div className="card mt-4 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-card-subtle text-left text-xs text-base-text/50">
                <th className="px-4 py-2.5 font-semibold">이름</th>
                <th className="px-3 py-2.5 text-center font-semibold">결석</th>
                <th className="px-3 py-2.5 text-center font-semibold">지각</th>
                <th className="px-3 py-2.5 text-center font-semibold">환산</th>
                <th className="px-3 py-2.5 text-right font-semibold">차감</th>
                <th className="px-3 py-2.5 text-right font-semibold">환급</th>
                <th className="px-3 py-2.5 text-center font-semibold">이월/장학</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-card-border/60">
                  <td className="px-4 py-2.5 font-medium">{i.profiles?.display_name ?? "?"}</td>
                  <td className="px-3 py-2.5 text-center">{i.absences}</td>
                  <td className="px-3 py-2.5 text-center">{i.lates}</td>
                  <td className={`px-3 py-2.5 text-center ${i.effective_absences > group.absence_limit ? "font-bold text-rose-600" : ""}`}>
                    {i.effective_absences}
                  </td>
                  <td className="px-3 py-2.5 text-right text-rose-500">-{fmtWon(i.deduction)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmtWon(i.refund)}</td>
                  <td className="px-3 py-2.5 text-center">
                    {i.scholarship ? "🎓 SAVE" : ""}
                    {i.carryover_in ? " 🔖이월적용" : ""}
                    {!i.scholarship && !i.carryover_in ? "—" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card mt-4 py-12 text-center text-sm text-base-text/40">
          아직 {month} 정산이 없습니다. [정산 계산]을 눌러 생성하세요.
        </div>
      )}

      <p className="mt-3 text-xs text-base-text/40">
        계산식: 차감 = 결석×{group.absence_rate * 100}% + 지각×{group.late_rate * 100}% (환산결석 = 결석 + 지각÷
        {group.late_per_absence}, {group.absence_limit}회 초과 시 전액 차감) · 100% 달성 = 전액 환급 + 다음 달 이월 +
        장학 대상 · 공결은 미집계
      </p>
    </div>
  );
}
