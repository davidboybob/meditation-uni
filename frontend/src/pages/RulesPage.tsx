import SubPage from "../components/SubPage";

/* 노션 '묵상대학 규칙' 페이지 내용 기반 */

const FEE_RULES = [
  {
    emoji: "💜",
    title: "환급 시스템",
    lines: ["묵상 100% 달성 시 회비 100% 환급!", "+ 다음 달로 자동 이월 (다음 달 회비 SAVE!)"],
    tone: "good" as const,
  },
  {
    emoji: "🚫",
    title: "결석 시",
    lines: ["1회당 회비의 10% 차감", "4회 초과 시 회비 100% 차감"],
    tone: "bad" as const,
  },
  {
    emoji: "⏰",
    title: "지각 시",
    lines: ["1회당 회비의 5% 차감", "지각 2회는 결석 1회로 간주"],
    tone: "warn" as const,
  },
  {
    emoji: "🎓",
    title: "장학 시스템",
    lines: ["100% 달성한 멤버에게", "소정의 장학금 지급!"],
    tone: "good" as const,
  },
];

const TONE_STYLE = {
  good: "border-emerald-200 bg-emerald-50",
  warn: "border-amber-200 bg-amber-50",
  bad: "border-rose-200 bg-rose-50",
};

const DAILY_RULES = [
  {
    emoji: "🕛",
    title: "시간",
    lines: ["하루는 1일, 00:00 ~ 23:59 입니다.", "해당 시간 안에 1일 묵상을 달성해야 합니다."],
  },
  {
    emoji: "✍️",
    title: "내용",
    lines: ["묵상 내용", "기도 제목", "오늘의 질문"],
  },
  {
    emoji: "📝",
    title: "양식",
    lines: ["자유 양식입니다.", "예시 템플릿이 제공됩니다.", "블로그(Oopy·네이버·Tistory) 활용도 좋아요."],
  },
];

export default function RulesPage() {
  return (
    <SubPage
      eyebrow="Rule"
      title="묵상대학 규칙"
      subtitle="🔖 함께 완주하기 위한 약속"
      description="작은 책임이 꾸준함을 만듭니다. 규칙은 벌이 아니라 4년 여정을 함께 완주하기 위한 장치예요."
      ctaTitle="규칙을 확인했다면"
      ctaDesc="이제 하루 한 장, 1일 묵상을 시작할 준비가 됐어요."
    >
      {/* 규칙 1. 비용 */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Rule 1</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">비용</h2>

          <div className="mt-8 rounded-3xl bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] p-8 text-center text-white shadow-cardHover">
            <p className="text-sm font-medium text-white/80">월 회비</p>
            <p className="mt-2 font-display text-5xl font-bold">3만원</p>
            <p className="mt-3 text-sm text-white/80">100% 달성하면 전액 돌려받는 보증금에 가깝습니다.</p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {FEE_RULES.map((r) => (
              <div key={r.title} className={`rounded-3xl border p-7 ${TONE_STYLE[r.tone]}`}>
                <div className="text-2xl">{r.emoji}</div>
                <h3 className="mt-3 text-lg font-bold">{r.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-[#3D3654]/70">
                  {r.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 규칙 2. 1일 묵상 달성하기 */}
      <section className="bg-accent-soft/60 px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Rule 2</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">1일 묵상 달성하기</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {DAILY_RULES.map((r) => (
              <div key={r.title} className="rounded-3xl bg-white p-7 shadow-card">
                <div className="text-2xl">{r.emoji}</div>
                <h3 className="mt-3 text-lg font-bold">{r.title}</h3>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-[#3D3654]/70">
                  {r.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 규칙 3. 정기 온라인 만남 */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Rule 3</span>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">정기 온라인 만남</h2>
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-card-border bg-card-subtle p-10">
            <div className="text-4xl">📹</div>
            <p className="mt-4 text-lg font-bold">Zoom 정기 모임</p>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3654]/60">
              온라인 화상 모임으로 얼굴을 보며 묵상과 삶을 나눕니다.
            </p>
          </div>
        </div>
      </section>
    </SubPage>
  );
}
