import { Link } from "react-router-dom";
import SubPage from "../components/SubPage";

/* 노션 '1일 묵상 가이드' 페이지 내용 기반 */

const STEPS = [
  { emoji: "📖", label: "묵상하기" },
  { emoji: "✍️", label: "묵상 글 작성" },
  { emoji: "📤", label: "글 공유하기" },
  { emoji: "💬", label: "답변 달기 (나눔)" },
];

const CHECKLIST = [
  "일정에 맞는 말씀 1장을 묵상하기",
  "글에 기도 제목 포함시키기",
  "글에 오늘의 질문 포함시키기",
  "다른 사람 질문에 1회 이상 답변 달기 (나눔하기)",
];

export default function GuidePage() {
  return (
    <SubPage
      eyebrow="Guide"
      title="1일 묵상 가이드"
      subtitle="📒 하루 묵상, 이렇게 진행돼요"
      description="분량보다 꾸준함. 나만의 양식으로 부담 없이, 그러나 매일 빠짐없이."
      ctaTitle="가이드를 읽었다면"
      ctaDesc="오늘 말씀 한 장으로 첫 묵상을 시작해 보세요."
    >
      {/* 1. 묵상하기 */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Step 1</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">묵상 하기</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-card-border bg-card-subtle p-7">
              <div className="text-2xl">📖</div>
              <h3 className="mt-3 text-lg font-bold">말씀 1장</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3654]/70">
                일정에 맞는 말씀 1장을 묵상합니다. 나만의 양식으로 묵상 글을 작성하고, 분량은 상관없습니다.
              </p>
            </div>
            <div className="rounded-3xl border border-card-border bg-card-subtle p-7">
              <div className="text-2xl">🙏</div>
              <h3 className="mt-3 text-lg font-bold">꼭 들어갈 것</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3654]/70">
                기도 제목과 오늘의 질문이 포함되어야 합니다. 그리고 다른 사람의 질문에 1회 이상 답변을 달아주세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 1일 목표 달성하기 */}
      <section className="bg-accent-soft/60 px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Step 2</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">1일 목표 달성하기</h2>

          {/* 단계 플로우 */}
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-0">
                <div className="flex w-full items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-card sm:flex-col sm:gap-2 sm:py-6 sm:text-center">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="text-sm font-bold">{`${i + 1}. ${s.label}`}</span>
                </div>
              </div>
            ))}
          </div>

          {/* 체크리스트 */}
          <ul className="mt-8 space-y-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl bg-white px-5 py-4 shadow-card">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  ✓
                </span>
                <span className="text-sm leading-relaxed text-[#3D3654]/80">{item}</span>
              </li>
            ))}
          </ul>

          {/* 인정 기준 경고 */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-sm font-bold text-amber-800">⚠️ 인정 기준</p>
            <p className="mt-1.5 text-sm leading-relaxed text-amber-800/80">
              1일 목표는 00:00 ~ 23:59, 하루 안에 모두 달성해야 1회로 인정됩니다.
              이 중 1개라도 달성하지 못하면 결석으로 처리됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 3. 나눔하기 */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Step 3</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">나눔하기</h2>
          <div className="mt-8 rounded-3xl border border-card-border bg-card-subtle p-8">
            <div className="text-3xl">💬</div>
            <p className="mt-4 text-sm leading-relaxed text-[#3D3654]/70">
              나눔 방에서 서로의 글을 읽고, 자유롭게 답을 달면 됩니다.
              <br />
              질문에 대해서 토론해도 좋습니다. 서로의 묵상이 서로의 은혜가 됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* 4. 묵상 양식 가이드 */}
      <section className="bg-accent-soft/60 px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Step 4</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">묵상 양식 가이드</h2>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <a
              href="https://home.dailyqtweblog.pw/luke"
              target="_blank"
              rel="noreferrer noopener"
              className="group flex flex-1 items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
            >
              <span className="text-2xl">🌏</span>
              <div className="flex-1">
                <div className="font-semibold group-hover:text-accent-deep">다윗소년 블로그 — 누가복음 목차</div>
                <div className="text-xs text-[#3D3654]/50">실제 묵상 양식 예시 (23.01.01 ~ 23.01.28)</div>
              </div>
              <span className="text-[#3D3654]/30 transition group-hover:text-accent">↗</span>
            </a>
            <Link
              to="/blog"
              className="group flex flex-1 items-center gap-4 rounded-2xl bg-white px-6 py-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
            >
              <span className="text-2xl">📒</span>
              <div className="flex-1">
                <div className="font-semibold group-hover:text-accent-deep">묵상 참고 블로그 모음</div>
                <div className="text-xs text-[#3D3654]/50">멤버들의 실제 묵상 기록 보러가기</div>
              </div>
              <span className="text-[#3D3654]/30 transition group-hover:text-accent">→</span>
            </Link>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
