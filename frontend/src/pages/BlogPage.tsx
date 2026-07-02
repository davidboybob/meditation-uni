import SubPage from "../components/SubPage";

/* 노션 '묵상 참고 사이트' 페이지 내용 기반 */
const BLOGS = [
  {
    num: "01",
    emoji: "🌏",
    name: "다윗소년의 블로그",
    title: "누가복음 묵상 목차 (23.01.01 ~ 23.01.28)",
    desc: "매일 한 장씩 쌓아 올린 누가복음 묵상 기록의 목차입니다.",
    href: "https://home.dailyqtweblog.pw/luke",
  },
  {
    num: "02",
    emoji: "🤓",
    name: "남매공작소",
    title: "남매공작소 : 네이버 블로그",
    desc: "매일 한 장 묵상의 힘을 담아내는 네이버 블로그입니다.",
    href: "https://blog.naver.com/lee111ms/223002417534",
  },
  {
    num: "03",
    emoji: "✨",
    name: "JINNI",
    title: "[묵상대학] 느헤미야 4장 묵상 '미움받을 용기'",
    desc: "시기와 비교의 마음을 돌아보고 공동체를 향한 시선을 다듬은 묵상.",
    href: "https://m.blog.naver.com/aromascent512/223004731410",
  },
  {
    num: "04",
    emoji: "✈️",
    name: "Maranatha Travel Agency",
    title: "[매일 큐티] 느헤미야 1장 묵상 '원하는 것을 이루는 방법'",
    desc: "황폐한 예루살렘을 슬퍼하며 기도로 나아간 느헤미야를 따라가는 묵상.",
    href: "https://m.blog.naver.com/PostView.naver?blogId=aster1040&logNo=223001233566&navType=by",
  },
  {
    num: "05",
    emoji: "🎠",
    name: "캐롤",
    title: "느헤미야 1장 묵상 '인생의 문제를 넘어가는 방법'",
    desc: "감당할 수 없어 보이는 문제 앞에서 느헤미야가 택한 길을 묵상합니다.",
    href: "https://m.blog.naver.com/allthingsgrowup/223002257717",
  },
];

export default function BlogPage() {
  return (
    <SubPage
      eyebrow="Reference"
      title="묵상 참고 블로그"
      subtitle="📒 멤버들의 실제 묵상 기록"
      description="묵상을 어떻게 써야 할지 막막하다면, 먼저 걸어간 멤버들의 기록을 참고해 보세요."
      ctaTitle="나도 이렇게 기록하고 싶다면"
      ctaDesc="양식은 자유! 오늘부터 나만의 묵상 기록을 시작해 보세요."
    >
      <section className="px-5 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-5">
            {BLOGS.map((b) => (
              <a
                key={b.num}
                href={b.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group relative overflow-hidden rounded-3xl border border-card-border bg-card-subtle p-7 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-cardHover"
              >
                <div className="pointer-events-none absolute -right-2 -top-7 font-display text-8xl font-bold text-accent/10">
                  {b.num}
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
                    {b.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-wide text-accent-deep">{b.name}</div>
                    <h2 className="mt-1 font-display text-lg font-bold leading-snug group-hover:text-accent-deep">
                      {b.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#3D3654]/60">{b.desc}</p>
                  </div>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mt-1 shrink-0 text-[#3D3654]/30 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </SubPage>
  );
}
