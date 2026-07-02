import SubPage from "../components/SubPage";

/* 노션 '묵상대학 비전' 페이지 내용 기반 */
const VISION_POINTS = [
  {
    num: "01",
    emoji: "🌍",
    title: "선교",
    desc: "묵상 대학을 통해서 발생하는 수익금은 선교와 하나님 나라의 확장에 기여하고자 합니다.",
  },
  {
    num: "02",
    emoji: "📖",
    title: "말씀 전문가",
    desc: "묵상 대학을 통해서 말씀의 전문가로 거듭나는 경험과 신앙의 성장을 만들고자 합니다.",
  },
  {
    num: "03",
    emoji: "🤝",
    title: "공동체",
    desc: "일상에서 받은 은혜를 나눌 수 있는 모임이 되고자 합니다.",
  },
  {
    num: "04",
    emoji: "🌱",
    title: "다음세대",
    desc: "다음세대를 위한 장학금을 주고자 합니다.",
  },
];

export default function VisionPage() {
  return (
    <SubPage
      eyebrow="Vision"
      title="묵상대학 비전"
      subtitle="✈️ 묵상대학 : 온라인 마가 다락방"
      description="마가의 다락방에 모여 기도하던 이들처럼, 온라인에서 매일 말씀으로 모이는 공동체를 꿈꿉니다."
      ctaTitle="이 비전에 함께하고 싶다면"
      ctaDesc="하루 한 장의 묵상이 선교와 다음세대를 세우는 걸음이 됩니다."
    >
      <section className="px-5 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {VISION_POINTS.map((v) => (
              <div
                key={v.num}
                className="relative overflow-hidden rounded-3xl border border-card-border bg-card-subtle p-8 transition hover:-translate-y-1 hover:shadow-cardHover"
              >
                <div className="pointer-events-none absolute -right-2 -top-6 font-display text-8xl font-bold text-accent/10">
                  {v.num}
                </div>
                <div className="text-3xl">{v.emoji}</div>
                <h2 className="mt-4 font-display text-xl font-bold">
                  <span className="mr-2 text-accent-deep">{v.num}.</span>
                  {v.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#3D3654]/70">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SubPage>
  );
}
