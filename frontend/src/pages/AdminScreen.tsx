import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  verifyPin,
  listChallenges,
  updateChallenge,
  deleteChallenge,
  getChallengeAttendance,
  removeMember,
  joinChallenge,
  type ChallengeResponse,
  type ChallengeAttendance,
} from "../api/client";

const ADMIN_KEY = "meditation_admin_verified";

// --- PIN Gate ---

function PinGate({ onVerified }: { onVerified: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await verifyPin(pin);
    if (ok) {
      sessionStorage.setItem(ADMIN_KEY, "1");
      onVerified();
    } else {
      setError("비밀번호가 틀렸습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1 className="text-2xl font-bold text-center font-display tracking-tight text-accent-deep">🔒 관리자</h1>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="비밀번호 입력"
          autoFocus
          className="w-full p-3 rounded-2xl text-center text-lg tracking-widest"
        />
        {error && <p className="text-rose-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full py-3 rounded-2xl font-bold text-white bg-accent hover:bg-accent-deep shadow-button transition">
          확인
        </button>
      </form>
    </div>
  );
}

// --- Status Cell ---

function StatusCell({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    present: { label: "✅", cls: "bg-status-presentBg" },
    late: { label: "⚠️", cls: "bg-status-lateBg" },
    absent: { label: "❌", cls: "bg-status-absentBg" },
    pending: { label: "⏳", cls: "bg-status-pendingBg" },
  };
  const s = map[status] || { label: "—", cls: "bg-gray-100" };
  return (
    <span className={`inline-block w-8 h-8 leading-8 text-center rounded-lg text-xs ${s.cls}`}>
      {s.label}
    </span>
  );
}

// --- Main Admin Panel ---

export default function AdminScreen() {
  const [verified, setVerified] = useState(sessionStorage.getItem(ADMIN_KEY) === "1");

  if (!verified) {
    return <PinGate onVerified={() => setVerified(true)} />;
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [challenges, setChallenges] = useState<ChallengeResponse[]>([]);
  const [selected, setSelected] = useState<ChallengeAttendance | null>(null);
  const [loading, setLoading] = useState(false);

  // 편집 상태
  const [editing, setEditing] = useState<ChallengeResponse | null>(null);
  const [editForm, setEditForm] = useState({ name: "", start_date: "", end_date: "", deadline_time: "" });

  // 멤버 추가
  const [addEmail, setAddEmail] = useState("");

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      setChallenges(await listChallenges());
    } catch {
      toast.error("챌린지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  const handleSelect = async (id: number) => {
    setLoading(true);
    try {
      setSelected(await getChallengeAttendance(id));
    } catch {
      toast.error("출석 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 챌린지를 삭제하시겠습니까?`)) return;
    try {
      await deleteChallenge(id);
      if (selected?.challenge.id === id) setSelected(null);
      loadChallenges();
      toast.success("챌린지가 삭제되었습니다.");
    } catch {
      toast.error("챌린지 삭제에 실패했습니다.");
    }
  };

  const startEdit = (c: ChallengeResponse) => {
    setEditing(c);
    setEditForm({ name: c.name, start_date: c.start_date, end_date: c.end_date, deadline_time: c.deadline_time });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateChallenge(editing.id, editForm);
      setEditing(null);
      loadChallenges();
      if (selected?.challenge.id === editing.id) handleSelect(editing.id);
      toast.success("챌린지가 수정되었습니다.");
    } catch {
      toast.error("챌린지 수정에 실패했습니다.");
    }
  };

  const handleRemoveMember = async (challengeId: number, email: string) => {
    if (!confirm(`${email}을(를) 제거하시겠습니까?`)) return;
    try {
      await removeMember(challengeId, email);
      handleSelect(challengeId);
      loadChallenges();
      toast.success(`${email}을(를) 제거했습니다.`);
    } catch {
      toast.error("멤버 제거에 실패했습니다.");
    }
  };

  const handleAddMember = async (challengeId: number) => {
    const email = addEmail.trim();
    if (!email) return;
    try {
      await joinChallenge(challengeId, email);
      setAddEmail("");
      handleSelect(challengeId);
      loadChallenges();
      toast.success(`${email}을(를) 추가했습니다.`);
    } catch {
      toast.error("멤버 추가에 실패했습니다. 이미 참여 중일 수 있습니다.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem("meditation_admin_pin");
    window.location.reload();
  };

  return (
    <div className="min-h-screen p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-display tracking-tight text-accent-deep">🛠 관리자</h1>
          <button onClick={handleLogout} className="text-xs text-rose-500 underline">로그아웃</button>
        </div>

        {/* 챌린지 목록 */}
        {!selected && !editing && (
          <>
            <h2 className="text-lg font-bold mb-3 text-gray-700">챌린지 목록</h2>
            {loading && <p className="text-sm text-gray-500">불러오는 중...</p>}
            <div className="space-y-3">
              {challenges.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {c.start_date} ~ {c.end_date} · 마감 {c.deadline_time} · {c.member_count}명
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleSelect(c.id)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-deep transition">
                      출석 현황
                    </button>
                    <button onClick={() => startEdit(c)} className="px-3 py-2 rounded-xl text-sm font-medium bg-accent-soft text-accent-deep hover:bg-accent/20 transition">
                      수정
                    </button>
                    <button onClick={() => handleDelete(c.id, c.name)} className="px-3 py-2 rounded-xl text-sm font-medium text-rose-500 bg-rose-50 hover:bg-rose-100 transition">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              {!loading && challenges.length === 0 && (
                <p className="text-center text-sm text-gray-500 mt-8">챌린지가 없습니다.</p>
              )}
            </div>
          </>
        )}

        {/* 챌린지 수정 폼 */}
        {editing && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">챌린지 수정</h2>
              <button onClick={() => setEditing(null)} className="text-xs underline text-gray-500">취소</button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3 p-4 rounded-2xl bg-card">
              <div>
                <label className="block text-xs text-gray-500 mb-1">이름</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required className="w-full p-2 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">시작일</label>
                  <input type="date" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} required className="w-full p-2 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">종료일</label>
                  <input type="date" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} required className="w-full p-2 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">마감 시간</label>
                <input type="time" value={editForm.deadline_time} onChange={(e) => setEditForm({ ...editForm, deadline_time: e.target.value })} required className="w-full p-2 rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full py-2 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent-deep shadow-button transition">
                저장
              </button>
            </form>
          </div>
        )}

        {/* 출석 대시보드 */}
        {selected && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold">{selected.challenge.name}</h2>
                <p className="text-xs text-gray-500">{selected.challenge.start_date} ~ {selected.challenge.end_date}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs underline text-gray-500">목록으로</button>
            </div>

            {/* 멤버별 통계 카드 */}
            <div className="space-y-2 mb-6">
              {selected.members.map((m) => (
                <div key={m.user_email} className="flex items-center justify-between p-3 rounded-2xl bg-card">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.user_email}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      출석 {m.present_count} · 지각 {m.late_count} · 결석 {m.absent_count}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm font-bold text-accent-deep whitespace-nowrap">
                      {m.total_fine.toLocaleString()}원
                    </span>
                    <button
                      onClick={() => handleRemoveMember(selected.challenge.id, m.user_email)}
                      className="text-xs text-rose-500 underline whitespace-nowrap"
                    >
                      제거
                    </button>
                  </div>
                </div>
              ))}
              {selected.members.length === 0 && (
                <p className="text-center text-sm text-gray-500">멤버가 없습니다.</p>
              )}
            </div>

            {/* 멤버 추가 */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddMember(selected.challenge.id))}
                placeholder="멤버 이메일 추가"
                className="flex-1 p-2 rounded-xl text-sm"
              />
              <button
                onClick={() => handleAddMember(selected.challenge.id)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accent-deep shadow-button transition"
              >
                추가
              </button>
            </div>

            {/* 출석 그리드 */}
            {selected.dates.length > 0 && selected.members.length > 0 && (
              <div className="rounded-2xl bg-card p-4 overflow-x-auto">
                <h3 className="text-sm font-bold mb-3 text-gray-700">일별 출석 현황</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left p-1 sticky left-0 bg-base-bg text-gray-600">멤버</th>
                      {selected.dates.map((d) => (
                        <th key={d} className="p-1 text-center whitespace-nowrap text-gray-500">
                          {d.slice(5)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.members.map((m) => (
                      <tr key={m.user_email}>
                        <td className="p-1 truncate max-w-[120px] sticky left-0 bg-base-bg">{m.user_email}</td>
                        {selected.dates.map((d) => (
                          <td key={d} className="p-1 text-center">
                            <StatusCell status={selected.grid[m.user_email]?.[d] || "—"} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
