import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { parseKakaoExport, distinctSenders } from "../lib/kakaoParse";
import { matchAttendance, type AttendanceMatch } from "../lib/kakaoMatch";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { STATUS_LABEL, STATUS_STYLE, type Membership } from "../lib/types";

export default function Import() {
  const { ctx } = useAuth();
  const group = ctx!.group;

  const [members, setMembers] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [raw, setRaw] = useState("");
  const [matches, setMatches] = useState<AttendanceMatch[] | null>(null);
  const [unmapped, setUnmapped] = useState<string[]>([]);
  // 미매핑 발신자 → 멤버 user_id 수동 지정
  const [manualMap, setManualMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [m, p] = await Promise.all([
      supabase.from("memberships").select("*, profiles(*)").eq("group_id", group.id).eq("active", true),
      supabase.from("reading_plans").select("date, passage").eq("group_id", group.id),
    ]);
    setMembers((m.data as Membership[] | null) ?? []);
    const planMap: Record<string, string> = {};
    for (const r of (p.data as { date: string; passage: string }[] | null) ?? []) planMap[r.date] = r.passage;
    setPlans(planMap);
  }, [group.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const memberList = useMemo(
    () => members.map((m) => ({ user_id: m.user_id, name: m.profiles.display_name, kakao_name: m.kakao_name })),
    [members],
  );

  const analyze = () => {
    const msgs = parseKakaoExport(raw);
    if (!msgs.length) {
      toast.error("대화 내용을 인식하지 못했어요. 카톡 '대화 내보내기' 텍스트를 그대로 붙여넣어 주세요.");
      return;
    }
    if (Object.keys(plans).length === 0) {
      toast.error("통독 일정이 없어요. '통독 일정'에서 날짜별 본문을 먼저 등록해 주세요.");
      return;
    }
    // 멤버 목록에 수동 매핑 반영(임시 kakao_name 주입)
    const senders = distinctSenders(msgs);
    const withManual = memberList.map((m) => {
      const alias = Object.entries(manualMap).find(([, uid]) => uid === m.user_id)?.[0];
      return alias ? { ...m, kakao_name: alias } : m;
    });
    const res = matchAttendance(msgs, withManual, plans, { lateCutoff: group.late_cutoff });
    setMatches(res.matches);
    setUnmapped(res.unmappedSenders);
    const dateSet = new Set(msgs.map((x) => x.date).filter(Boolean));
    toast.success(
      `메시지 ${msgs.length}건 · 발신자 ${senders.length}명 분석 → ${res.matches.length}건 매칭 (${[...dateSet].length}일치)`,
    );
  };

  const confirm = async () => {
    if (!matches?.length) return;
    setSaving(true);
    const rows = matches.map((mt) => ({
      group_id: group.id,
      user_id: mt.user_id,
      date: mt.date,
      status: mt.status,
      source: "kakao" as const,
      note: mt.note,
      created_by: ctx!.userId,
    }));
    const { error } = await supabase
      .from("attendance_records")
      .upsert(rows, { onConflict: "group_id,user_id,date" });
    setSaving(false);
    if (error) {
      toast.error(`저장 실패: ${error.message}`);
      return;
    }
    toast.success(`${rows.length}건 출석 반영 완료!`);
    setMatches(null);
    setRaw("");
    setManualMap({});
  };

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-xl font-bold">카톡 대화 → 자동 출석</h1>
        <p className="mt-1 text-sm text-base-text/50">
          카톡방 '대화 내보내기' 텍스트를 붙여넣으면, 각 메시지의 날짜와 그날 통독 본문(예: 에스겔 3장)을 대조해
          출석을 자동 매칭합니다. 블로그 링크·채팅 문구 모두 인식해요. (
          <a href="/docs" onClick={(e) => e.preventDefault()} className="underline">
            내보내기 방법은 가이드 참고
          </a>
          )
        </p>
      </header>

      <div className="card mt-5">
        <div className="mb-2 text-sm font-semibold">1. 대화 내용 붙여넣기</div>
        <textarea
          rows={8}
          className="w-full font-mono text-xs"
          placeholder={
            "카카오톡 → 채팅방 → 메뉴(≡) → 대화 내용 → 내보내기 → 텍스트를 여기에 붙여넣기\n\n예)\n2026. 7. 3. 오전 6:12, 김믿음 : 에스겔 3장 묵상 https://blog.naver.com/..."
          }
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-2">
          <button type="button" className="btn-primary" onClick={analyze} disabled={!raw.trim()}>
            분석하기
          </button>
          <span className="text-xs text-base-text/40">
            지각 기준 {group.late_cutoff ? `${group.late_cutoff} 이후` : "미설정(전부 출석)"}
          </span>
        </div>
      </div>

      {/* 미매핑 발신자 수동 지정 */}
      {unmapped.length > 0 && (
        <div className="card mt-4 border border-amber-200 bg-amber-50">
          <div className="text-sm font-semibold text-amber-800">
            매칭 안 된 카톡 이름 {unmapped.length}명 — 멤버와 연결해 주세요
          </div>
          <p className="mt-1 text-xs text-amber-800/70">
            연결 후 다시 '분석하기'를 누르면 반영됩니다. (이름은 멤버 관리에서 저장해두면 다음부터 자동 매칭)
          </p>
          <div className="mt-3 space-y-2">
            {unmapped.map((sender) => (
              <div key={sender} className="flex items-center gap-2 text-sm">
                <span className="min-w-32 font-medium">{sender}</span>
                <span>→</span>
                <select
                  className="!py-1 text-xs"
                  value={manualMap[sender] ?? ""}
                  onChange={(e) => setManualMap((prev) => ({ ...prev, [sender]: e.target.value }))}
                >
                  <option value="">(연결 안 함)</option>
                  {memberList.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-3" onClick={analyze}>
            다시 분석
          </button>
        </div>
      )}

      {/* 매칭 미리보기 */}
      {matches && (
        <div className="card mt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">2. 매칭 결과 ({matches.length}건)</span>
            <button type="button" className="btn-primary" disabled={saving || matches.length === 0} onClick={() => void confirm()}>
              {saving ? "반영 중…" : "출석으로 반영"}
            </button>
          </div>
          {matches.length === 0 ? (
            <p className="py-6 text-center text-sm text-base-text/40">
              매칭된 항목이 없어요. 통독 일정 날짜/본문과 대화 날짜가 맞는지, 이름 연결이 됐는지 확인해 주세요.
            </p>
          ) : (
            <ul className="divide-y divide-card-border">
              {matches.map((mt, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="min-w-20 font-medium">{mt.name}</span>
                  <span className="text-base-text/50">{mt.date}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[mt.status]}`}>
                    {STATUS_LABEL[mt.status]}
                  </span>
                  <span className="rounded bg-base-bg px-1.5 py-0.5 text-[10px] text-base-text/50">
                    {mt.via === "link" ? "🔗 링크" : "💬 문구"} {mt.time ?? ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-base-text/40" title={mt.matchedText}>
                    {mt.matchedText}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
