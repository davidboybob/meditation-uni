import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { calculateFine, getAttendanceSummary, type FineResponse } from "../api/client";

const USER_EMAIL_KEY = "meditation_user_email";

export default function FineCalculator() {
  const [lateCount, setLateCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [result, setResult] = useState<FineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  const runCalculation = useCallback(async (late: number, absent: number) => {
    setLoading(true);
    try {
      const res = await calculateFine({ late_count: late, absent_count: absent });
      setResult(res);
    } catch {
      toast.error("계산 실패. 서버 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 출석 이력에서 지각/결석 횟수 자동 로드
  useEffect(() => {
    const userEmail = localStorage.getItem(USER_EMAIL_KEY) || "";
    if (!userEmail) return;
    getAttendanceSummary(userEmail)
      .then((summary) => {
        setLateCount(summary.late_count);
        setAbsentCount(summary.absent_count);
        setAutoLoaded(true);
        if (summary.late_count > 0 || summary.absent_count > 0) {
          runCalculation(summary.late_count, summary.absent_count);
        }
      })
      .catch(() => {}); // 서버 오프라인 시 수동 입력 유지
  }, [runCalculation]);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    runCalculation(lateCount, absentCount);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif">💰 벌금 계산기</h1>
          <p className="text-sm opacity-60 mt-1">지각 0.5회 = 결석 0.5회 환산</p>
        </div>

        {autoLoaded && (
          <div className="mb-4 p-3 rounded-lg text-center text-sm bg-accent-light/15 text-accent-light">
            출석 이력에서 자동으로 불러왔습니다. 수동 수정도 가능합니다.
          </div>
        )}

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="p-4 rounded-lg bg-card">
            <label className="block text-sm mb-2 opacity-80">지각 횟수</label>
            <input
              type="number"
              min={0}
              value={lateCount}
              onChange={(e) => setLateCount(Number(e.target.value))}
              className="w-full p-2 rounded text-black"
            />
          </div>

          <div className="p-4 rounded-lg bg-card">
            <label className="block text-sm mb-2 opacity-80">결석 횟수</label>
            <input
              type="number"
              min={0}
              value={absentCount}
              onChange={(e) => setAbsentCount(Number(e.target.value))}
              className="w-full p-2 rounded text-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition ${
              loading ? "bg-gray-600" : "bg-accent hover:bg-accent/80"
            }`}
          >
            {loading ? "계산 중..." : "벌금 계산하기"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-6 rounded-lg text-center bg-card-hover">
            <p className="text-4xl font-bold mb-2">{result.total_fine.toLocaleString()}원</p>
            <p className="text-sm opacity-70">{result.detail}</p>
          </div>
        )}

        {/* 벌금 기준표 */}
        <div className="mt-6 p-4 rounded-lg text-sm bg-card-subtle">
          <p className="font-semibold mb-2 opacity-80">📋 벌금 기준</p>
          <ul className="space-y-1 opacity-60">
            <li>• 지각 1회 = 결석 0.5회 환산</li>
            <li>• 환산 결석 4회 미만: 회당 3,000원</li>
            <li>• 환산 결석 4회 이상: 30,000원 (상한)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
