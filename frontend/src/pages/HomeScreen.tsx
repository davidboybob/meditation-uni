import { useState, useEffect } from "react";
import { submitPost, getTodayStatus, type TodayStatus } from "../api/client";

const USER_EMAIL_KEY = "meditation_user_email";

function getStoredEmail(): string {
  return localStorage.getItem(USER_EMAIL_KEY) || "";
}

export default function HomeScreen() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const [userEmail, setUserEmail] = useState<string>(getStoredEmail);
  const [emailInput, setEmailInput] = useState<string>(getStoredEmail);
  const [showEmailEdit, setShowEmailEdit] = useState(!getStoredEmail());

  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("06:00");
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 오늘 제출 상태 조회
  useEffect(() => {
    if (!userEmail) return;
    getTodayStatus(userEmail)
      .then(setTodayStatus)
      .catch(() => {}); // 서버 오프라인 시 무시
  }, [userEmail]);

  const saveEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    localStorage.setItem(USER_EMAIL_KEY, trimmed);
    setUserEmail(trimmed);
    setShowEmailEdit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) { setError("이름/이메일을 먼저 설정하세요."); return; }
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const submissionTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      await submitPost({
        user_email: userEmail,
        content,
        submission_time: submissionTime,
        deadline_time: deadline,
      });
      // 제출 후 오늘 상태 재조회
      const status = await getTodayStatus(userEmail);
      setTodayStatus(status);
      setContent("");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "duplicate") {
        setError("오늘은 이미 묵상을 제출했습니다.");
        // 서버에서 기존 상태 가져오기
        getTodayStatus(userEmail).then(setTodayStatus).catch(() => {});
      } else {
        setError("제출에 실패했습니다. 서버 상태를 확인하세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const alreadySubmitted = todayStatus?.submitted === true;

  const statusBadge = todayStatus?.submitted
    ? todayStatus.status === "present"
      ? { label: "출석 ✅", cls: "bg-green-700 text-white" }
      : { label: "지각 ⚠️", cls: "bg-yellow-600 text-white" }
    : { label: "미제출 ❌", cls: "bg-gray-600 text-white" };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-1 font-serif drop-shadow-md">
            📖 묵상대학
          </h1>
          <p className="text-sm opacity-70">{today}</p>
        </div>

        {/* 사용자 이메일 설정 */}
        {showEmailEdit ? (
          <div className="mb-5 p-4 rounded-lg bg-card">
            <p className="text-sm mb-2 opacity-80">이름 또는 이메일을 입력하세요</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                placeholder="예: hong@example.com"
                className="flex-1 p-2 rounded text-black text-sm"
              />
              <button
                onClick={saveEmail}
                className="px-3 py-2 rounded text-sm font-medium text-white bg-accent"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex justify-between items-center text-sm opacity-70">
            <span>👤 {userEmail}</span>
            <button onClick={() => setShowEmailEdit(true)} className="underline text-xs">변경</button>
          </div>
        )}

        {/* 출석 상태 */}
        <div className="flex justify-between items-center mb-6 p-4 rounded-lg bg-card">
          <span className="text-sm">오늘의 출석 상태</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>

        {todayStatus?.submitted && todayStatus.message && (
          <div className="mb-4 p-3 rounded-lg text-center text-sm bg-card-hover">
            {todayStatus.message}
          </div>
        )}

        {/* 제출 폼 — 이미 제출한 경우 숨김 */}
        {!alreadySubmitted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 opacity-80">마감 시간</label>
              <input
                type="time"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 rounded text-black"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 opacity-80">오늘의 묵상</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="오늘 묵상한 내용을 기록하세요..."
                required
                className="w-full p-3 rounded text-black resize-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !userEmail}
              className={`w-full py-3 rounded-lg font-bold text-white transition ${
                loading || !userEmail ? "bg-gray-600" : "bg-accent hover:bg-accent/80"
              }`}
            >
              {loading ? "제출 중..." : "묵상 제출하기"}
            </button>
          </form>
        )}

        {alreadySubmitted && (
          <div className="text-center text-sm opacity-60 mt-4">
            오늘 묵상을 완료했습니다. 내일 또 만나요! 🌿
          </div>
        )}
      </div>
    </div>
  );
}
