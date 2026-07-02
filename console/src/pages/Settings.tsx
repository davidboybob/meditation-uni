import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";

export default function Settings() {
  const { ctx, refreshCtx } = useAuth();
  const group = ctx!.group;

  const [name, setName] = useState(group.name);
  const [fee, setFee] = useState(group.monthly_fee);
  const [absenceRate, setAbsenceRate] = useState(group.absence_rate * 100);
  const [lateRate, setLateRate] = useState(group.late_rate * 100);
  const [latePerAbsence, setLatePerAbsence] = useState(group.late_per_absence);
  const [absenceLimit, setAbsenceLimit] = useState(group.absence_limit);
  const [lateCutoff, setLateCutoff] = useState(group.late_cutoff ?? "");
  const [busy, setBusy] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("groups")
      .update({
        name: name.trim(),
        monthly_fee: fee,
        absence_rate: absenceRate / 100,
        late_rate: lateRate / 100,
        late_per_absence: latePerAbsence,
        absence_limit: absenceLimit,
        late_cutoff: lateCutoff.trim() || null,
      })
      .eq("id", group.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("설정을 저장했습니다.");
    await refreshCtx();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold">그룹 설정</h1>
      <p className="mt-1 text-sm text-base-text/50">정산 규칙 파라미터 — 노션 「묵상대학 규칙」이 기본값입니다.</p>

      <form onSubmit={save} className="card mt-5 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          그룹 이름
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            월 회비 (원)
            <input type="number" min={0} step={1000} value={fee} onChange={(e) => setFee(Number(e.target.value))} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            결석 차감률 (%)
            <input
              type="number"
              min={0}
              max={100}
              value={absenceRate}
              onChange={(e) => setAbsenceRate(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            지각 차감률 (%)
            <input
              type="number"
              min={0}
              max={100}
              value={lateRate}
              onChange={(e) => setLateRate(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            지각 → 결석 환산 (회)
            <input
              type="number"
              min={1}
              value={latePerAbsence}
              onChange={(e) => setLatePerAbsence(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            결석 한도 (초과 시 전액 차감)
            <input
              type="number"
              min={0}
              value={absenceLimit}
              onChange={(e) => setAbsenceLimit(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            지각 판정 시각 (선택, HH:MM)
            <input
              type="text"
              placeholder="비우면 지각 수동 기록만"
              value={lateCutoff}
              onChange={(e) => setLateCutoff(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" className="btn-primary self-start" disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </button>
      </form>

      <div className="card mt-4 text-xs leading-relaxed text-base-text/50">
        <div className="font-semibold text-base-text">현재 규칙 요약</div>
        회비 {fee.toLocaleString()}원 · 결석 1회 -{Math.round((absenceRate / 100) * fee).toLocaleString()}원 · 지각 1회 -
        {Math.round((lateRate / 100) * fee).toLocaleString()}원 · 지각 {latePerAbsence}회 = 결석 1회 · 환산결석{" "}
        {absenceLimit}회 초과 시 전액 차감 · 100% 달성 시 전액 환급+이월+장학
      </div>
    </div>
  );
}
