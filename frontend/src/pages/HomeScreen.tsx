import { useState } from "react";
import { submitPost, type PostResponse } from "../api/client";

export default function HomeScreen() {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const [content, setContent] = useState("");
  const [deadline, setDeadline] = useState("06:00");
  const [result, setResult] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const now = new Date();
      const submissionTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const res = await submitPost({
        user_email: "user@meditation.uni",
        content,
        submission_time: submissionTime,
        deadline_time: deadline,
      });
      setResult(res);
    } catch {
      setError("제출에 실패했습니다. 서버 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = result
    ? result.status === "present"
      ? { label: "출석 ✅", cls: "bg-green-700 text-white" }
      : { label: "지각 ⚠️", cls: "bg-yellow-600 text-white" }
    : { label: "미제출 ❌", cls: "bg-gray-600 text-white" };

  return (
    <div className="min-h-screen p-6" style={{ background: "#1a3a2a", color: "#f5f0e8" }}>
      <div className="max-w-xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: "serif", textShadow: "1px 1px 4px rgba(0,0,0,0.5)" }}>
            📖 묵상대학
          </h1>
          <p className="text-sm opacity-70">{today}</p>
        </div>

        {/* 출석 상태 */}
        <div className="flex justify-between items-center mb-6 p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
          <span className="text-sm">오늘의 출석 상태</span>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>

        {result && (
          <div className="mb-4 p-3 rounded-lg text-center text-sm" style={{ background: "rgba(255,255,255,0.1)" }}>
            {result.message}
          </div>
        )}

        {/* 묵상 제출 폼 */}
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
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white transition"
            style={{ background: loading ? "#555" : "#2d6a4f" }}
          >
            {loading ? "제출 중..." : "묵상 제출하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
