import { useState, useEffect } from "react";
import { getPosts, getAttendanceSummary, type PostRecord, type AttendanceSummary } from "../api/client";

const USER_EMAIL_KEY = "meditation_user_email";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  present: { label: "출석 ✅", cls: "bg-green-700 text-white" },
  late: { label: "지각 ⚠️", cls: "bg-yellow-600 text-white" },
};

export default function HistoryScreen() {
  const userEmail = localStorage.getItem(USER_EMAIL_KEY) || "";

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(!!userEmail);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    Promise.all([getPosts(userEmail), getAttendanceSummary(userEmail)])
      .then(([p, s]) => { setPosts(p); setSummary(s); })
      .catch(() => setError("이력을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [userEmail]);

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm opacity-70">홈 화면에서 이름/이메일을 먼저 설정하세요.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center font-serif">
          📅 출석 이력
        </h2>

        {/* 통계 요약 */}
        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "출석", value: summary.present_count },
              { label: "지각", value: summary.late_count },
              { label: "제출일수", value: summary.total_days },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3 text-center bg-card">
                <div className="text-2xl font-bold text-accent-light">{value}</div>
                <div className="text-xs opacity-70 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {loading && <p className="text-center text-sm opacity-60">불러오는 중...</p>}
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* 이력 목록 */}
        <div className="space-y-2">
          {posts.map((post) => {
            const badge = STATUS_LABEL[post.status] || { label: post.status, cls: "bg-gray-600 text-white" };
            const isOpen = expanded === post.id;
            return (
              <div
                key={post.id}
                className="rounded-lg overflow-hidden cursor-pointer bg-card"
                onClick={() => setExpanded(isOpen ? null : post.id)}
              >
                <div className="flex justify-between items-center p-4">
                  <div>
                    <div className="font-medium text-sm">{post.submitted_date}</div>
                    <div className="text-xs opacity-60 mt-0.5">{post.submission_time} 제출</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm opacity-80 border-t border-card-border">
                    <p className="mt-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                )}
              </div>
            );
          })}
          {!loading && posts.length === 0 && (
            <p className="text-center text-sm opacity-60 mt-8">아직 제출 이력이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
