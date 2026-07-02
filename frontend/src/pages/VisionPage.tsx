import { useEffect } from "react";
import { Link } from "react-router-dom";

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

const NOTION_VISION_URL = "https://davidboy7780.notion.site/52b63252b94f4bf19d5b30a877002ad1";

export default function VisionPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#3D3654]">
      {/* ───── 히어로 ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-5 pb-24 pt-6 text-center">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

        {/* 상단 바 */}
        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex flex-col text-left leading-tight">
            <span className="text-[11px] font-medium tracking-wide text-white/80">1일 1묵상 · 4년 성경통독</span>
            <span className="font-display text-xl font-bold tracking-tight text-white">묵상 대학</span>
          </Link>
          <Link
            to="/"
            className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ← 홈으로
          </Link>
        </nav>

        <div className="relative z-10 mx-auto mt-20 max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-white/70">Vision</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-6xl">묵상대학 비전</h1>
          <p className="mt-6 text-lg text-white/90 sm:text-xl">✈️ 묵상대학 : 온라인 마가 다락방</p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            마가의 다락방에 모여 기도하던 이들처럼, 온라인에서 매일 말씀으로 모이는 공동체를 꿈꿉니다.
          </p>
        </div>
      </section>

      {/* ───── 비전 4가지 ───── */}
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

          <p className="mt-10 text-center text-xs text-[#3D3654]/40">
            <a href={NOTION_VISION_URL} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4 hover:text-accent-deep">
              노션 원문 보기 ↗
            </a>
          </p>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="bg-accent-soft/60 px-5 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">이 비전에 함께하고 싶다면</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3654]/60">
            하루 한 장의 묵상이 선교와 다음세대를 세우는 걸음이 됩니다.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block rounded-full bg-accent px-8 py-3.5 text-base font-semibold text-white shadow-button transition hover:bg-accent-deep"
          >
            묵상 대학 소개 보러가기
          </Link>
        </div>
      </section>

      {/* ───── 미니 푸터 ───── */}
      <footer className="bg-[#1c1830] px-5 py-8 text-center text-xs text-white/40">
        © {new Date().getFullYear()} 묵상 대학 (Meditation University). All rights reserved.
      </footer>
    </div>
  );
}
