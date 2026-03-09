import { useState } from "react";
import { calculateFine, type FineResponse } from "../api/client";

export default function FineCalculator() {
  const [lateCount, setLateCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [result, setResult] = useState<FineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await calculateFine({ late_count: lateCount, absent_count: absentCount });
      setResult(res);
    } catch {
      setError("계산 실패. 서버 상태를 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "#1a3a2a", color: "#f5f0e8" }}>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "serif" }}>💰 벌금 계산기</h1>
          <p className="text-sm opacity-60 mt-1">지각 0.5회 = 결석 0.5회 환산</p>
        </div>

        <form onSubmit={handleCalculate} className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
            <label className="block text-sm mb-2 opacity-80">지각 횟수</label>
            <input
              type="number"
              min={0}
              value={lateCount}
              onChange={(e) => setLateCount(Number(e.target.value))}
              className="w-full p-2 rounded text-black"
            />
          </div>

          <div className="p-4 rounded-lg" style={{ background: "rgba(255,255,255,0.08)" }}>
            <label className="block text-sm mb-2 opacity-80">결석 횟수</label>
            <input
              type="number"
              min={0}
              value={absentCount}
              onChange={(e) => setAbsentCount(Number(e.target.value))}
              className="w-full p-2 rounded text-black"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-white"
            style={{ background: loading ? "#555" : "#2d6a4f" }}
          >
            {loading ? "계산 중..." : "벌금 계산하기"}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-6 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.12)" }}>
            <p className="text-4xl font-bold mb-2">{result.total_fine.toLocaleString()}원</p>
            <p className="text-sm opacity-70">{result.detail}</p>
          </div>
        )}

        {/* 벌금 기준표 */}
        <div className="mt-6 p-4 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.06)" }}>
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
