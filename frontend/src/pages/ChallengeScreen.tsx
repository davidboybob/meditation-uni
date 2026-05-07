import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  listChallenges,
  createChallenge,
  joinChallenge,
  leaveChallenge,
  getChallengeToday,
  type ChallengeResponse,
  type ChallengeTodayResponse,
} from "../api/client";

const USER_EMAIL_KEY = "meditation_user_email";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  present: { label: "출석", cls: "bg-status-presentBg text-status-presentTx" },
  late: { label: "지각", cls: "bg-status-lateBg text-status-lateTx" },
};

export default function ChallengeScreen() {
  const userEmail = localStorage.getItem(USER_EMAIL_KEY) || "";

  const [challenges, setChallenges] = useState<ChallengeResponse[]>([]);
  const [selected, setSelected] = useState<ChallengeTodayResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 생성 폼
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("06:00");

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const list = await listChallenges();
      setChallenges(list);
    } catch {
      toast.error("챌린지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChallenges(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createChallenge({
        name, start_date: startDate, end_date: endDate, deadline_time: deadlineTime,
      });
      // 생성자 자동 참여
      if (userEmail) await joinChallenge(created.id, userEmail);
      setShowCreate(false);
      setName("");
      setEndDate("");
      loadChallenges();
      toast.success("챌린지가 생성되었습니다.");
    } catch {
      toast.error("챌린지 생성에 실패했습니다.");
    }
  };

  const handleJoin = async (id: number) => {
    if (!userEmail) { toast.error("홈에서 이름/이메일을 먼저 설정하세요."); return; }
    try {
      await joinChallenge(id, userEmail);
      loadChallenges();
      toast.success("챌린지에 참여했습니다.");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "already_joined") {
        toast.warning("이미 참여 중입니다.");
      } else {
        toast.error("참여에 실패했습니다.");
      }
    }
  };

  const handleLeave = async (id: number) => {
    if (!userEmail) return;
    try {
      await leaveChallenge(id, userEmail);
      if (selected?.challenge.id === id) setSelected(null);
      loadChallenges();
      toast.success("챌린지에서 나갔습니다.");
    } catch {
      toast.error("탈퇴에 실패했습니다.");
    }
  };

  const handleViewToday = async (id: number) => {
    setLoading(true);
    try {
      const data = await getChallengeToday(id);
      setSelected(data);
    } catch {
      toast.error("출석 현황을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-gray-500">홈 화면에서 이름/이메일을 먼저 설정하세요.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center font-display tracking-tight text-accent-deep">
          🏆 챌린지
        </h2>

        {/* 출석 현황 (선택된 챌린지) */}
        {selected && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">{selected.challenge.name}</h3>
              <button onClick={() => setSelected(null)} className="text-xs underline text-gray-500">닫기</button>
            </div>
            <p className="text-xs text-gray-500 mb-3">{selected.date} 출석 현황</p>

            <div className="space-y-2">
              {selected.members.map((m) => {
                const badge = m.submitted
                  ? STATUS_BADGE[m.status || ""] || { label: m.status, cls: "bg-gray-100 text-gray-500" }
                  : { label: "미제출", cls: "bg-gray-100 text-gray-500" };
                return (
                  <div
                    key={m.user_email}
                    className="flex justify-between items-center p-3 rounded-2xl bg-card"
                  >
                    <div>
                      <div className="text-sm font-medium">{m.user_email}</div>
                      {m.submission_time && (
                        <div className="text-xs text-gray-500 mt-0.5">{m.submission_time} 제출</div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
              {selected.members.length === 0 && (
                <p className="text-center text-sm text-gray-500">아직 참가자가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {/* 챌린지 목록 */}
        {!selected && (
          <>
            {loading && <p className="text-center text-sm text-gray-500">불러오는 중...</p>}

            <div className="space-y-3 mb-6">
              {challenges.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.start_date} ~ {c.end_date} · 마감 {c.deadline_time}
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-accent-soft text-accent-deep font-medium">
                      {c.member_count}명
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleViewToday(c.id)}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-deep transition"
                    >
                      출석 현황
                    </button>
                    <button
                      onClick={() => handleJoin(c.id)}
                      className="px-3 py-2 rounded-xl text-sm font-medium bg-accent-soft text-accent-deep hover:bg-accent/20 transition"
                    >
                      참여
                    </button>
                    <button
                      onClick={() => handleLeave(c.id)}
                      className="px-3 py-2 rounded-xl text-sm font-medium text-rose-500 bg-rose-50 hover:bg-rose-100 transition"
                    >
                      나가기
                    </button>
                  </div>
                </div>
              ))}
              {!loading && challenges.length === 0 && !showCreate && (
                <p className="text-center text-sm text-gray-500 mt-8">아직 챌린지가 없습니다.</p>
              )}
            </div>

            {/* 생성 폼 */}
            {showCreate ? (
              <form onSubmit={handleCreate} className="space-y-3 p-4 rounded-2xl bg-card">
                <h3 className="font-bold text-sm mb-2">새 챌린지 만들기</h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="챌린지 이름"
                  required
                  className="w-full p-2 rounded-xl text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">시작일</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full p-2 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">종료일</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full p-2 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">마감 시간</label>
                  <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} required className="w-full p-2 rounded-xl text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent-deep shadow-button transition">
                    만들기
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl text-sm text-gray-500">
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full py-3 rounded-2xl font-bold text-white bg-accent hover:bg-accent-deep shadow-button transition"
              >
                + 새 챌린지 만들기
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
