import { useEffect, useState } from "react";
import { toast } from "sonner";

/* ───────────────────────── 데이터 ───────────────────────── */

const NAV_LINKS = [
  { href: "#about", label: "소개" },
  { href: "#vision", label: "비전" },
  { href: "#rule", label: "규칙·가이드" },
  { href: "#staff", label: "운영진" },
  { href: "#review", label: "후기" },
  { href: "#contact", label: "문의" },
];

const VISION_URL = "https://davidboy7780.notion.site/52b63252b94f4bf19d5b30a877002ad1";

const VISION_ITEMS = [
  { num: "1일", label: "하루 한 장 묵상", desc: "매일 한 장씩, 작은 습관이 4년의 여정을 만듭니다." },
  { num: "4년", label: "성경 통독 완주", desc: "1일 1묵상으로 4년 동안 성경 전체를 통독합니다." },
  { num: "함께", label: "공동체 묵상", desc: "혼자가 아니라 함께, 서로의 기록으로 격려합니다." },
];

const RULES = [
  { icon: "📖", title: "묵상대학 규칙", desc: "매일 정해진 시간까지 묵상 기록을 제출합니다. 지각·결석은 자동으로 집계되어 작은 벌금으로 책임을 더합니다." },
  { icon: "📒", title: "1일 묵상 가이드", desc: "본문 한 장을 읽고 마음에 남는 구절, 깨달음, 적용을 짧게 기록합니다. 길이보다 꾸준함이 중요합니다." },
  { icon: "🔖", title: "묵상 참고 사이트", desc: "추천 묵상 자료와 통독표를 따라가며 흐름을 놓치지 않고 말씀을 이어갑니다." },
];

const STAFF = [
  { emoji: "🌏", name: "다윗소년", desc: "세월을 아끼는 마음으로 말씀에 올인! 하고자 하는 뜨거운 마음을 가진 직장인입니다." },
  { emoji: "🤓", name: "남매공작소", desc: "매일 한 장 묵상의 힘을 믿고 함께 걷는 동역자입니다." },
];

const PARTNERS = [
  {
    emoji: "🏤",
    name: "홍콩 에클레시아 동아리",
    desc: "바다 건너 홍콩에서 함께 말씀으로 모이는 묵상 공동체",
    href: "https://ecclessia.notion.site/p/6342e00e4df4437dbe8915e08d76e773?pvs=24",
  },
];

const REVIEWS = [
  { name: "참여자 A", text: "혼자서는 며칠 만에 포기했을 텐데, 함께 기록을 남기니 매일 자리에 앉게 됩니다." },
  { name: "참여자 B", text: "벌금이 부담이 아니라 동기부여가 됐어요. 4년 통독이라는 목표가 멀게만 느껴졌는데 하루치는 할 만합니다." },
  { name: "참여자 C", text: "한 장씩 쌓이는 묵상 기록을 돌아보면 말씀이 제 일상에 스며든 게 보여요." },
];

/* ───────────────────────── 컴포넌트 ───────────────────────── */

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 콘솔 앱은 별도 앱으로 준비 중 — 진입 CTA는 안내만 표시
  const comingSoon = () =>
    toast("콘솔 앱 준비 중입니다 🙏", {
      description: "묵상 기록·출석·벌금 관리는 곧 오픈 예정이에요.",
    });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#3D3654]">
      {/* ───── 네비게이션 ───── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          scrolled || menuOpen ? "bg-white/95 shadow-card backdrop-blur" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#top" className="flex flex-col leading-tight">
            <span className={`text-[11px] font-medium tracking-wide ${scrolled || menuOpen ? "text-accent-deep" : "text-white/80"}`}>
              1일 1묵상 · 4년 성경통독
            </span>
            <span className={`font-display text-xl font-bold tracking-tight ${scrolled || menuOpen ? "text-[#3D3654]" : "text-white"}`}>
              묵상 대학
            </span>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    scrolled ? "text-[#3D3654]" : "text-white/90"
                  }`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={comingSoon}
              className="hidden items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-button transition hover:bg-accent-deep md:inline-flex"
            >
              묵상 시작하기
              <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[10px] font-bold">준비중</span>
            </button>
            <button
              type="button"
              aria-label="메뉴 열기"
              onClick={() => setMenuOpen((v) => !v)}
              className={`md:hidden ${scrolled || menuOpen ? "text-[#3D3654]" : "text-white"}`}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>

        {/* 모바일 메뉴 */}
        {menuOpen && (
          <div className="border-t border-card-border bg-white px-5 pb-5 md:hidden">
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-sm font-medium text-[#3D3654]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                comingSoon();
              }}
              className="mt-2 block w-full rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-white shadow-button"
            >
              묵상 시작하기 <span className="ml-1 text-[10px] font-bold opacity-80">(준비중)</span>
            </button>
          </div>
        )}
      </header>

      {/* ───── 히어로 ───── */}
      <section
        id="top"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-5 text-center"
      >
        {/* 은은한 광원 */}
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl pt-20">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.3em] text-white/70">Meditation University</p>
          <h1 className="font-display text-5xl font-bold leading-[1.1] text-white sm:text-7xl">
            묵상 대학
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl">
            1일 1묵상으로 4년 동안 성경을 통독하는 모임.
            <br className="hidden sm:block" />
            하루 한 장, 함께 걷는 말씀의 여정에 초대합니다.
          </p>
          <p className="mx-auto mt-4 max-w-lg text-sm italic text-white/60">
            “주의 말씀은 내 발에 등이요 내 길에 빛이니이다” (시편 119:105)
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={comingSoon}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-accent-deep shadow-lg transition hover:bg-white/90 sm:w-auto"
            >
              묵상 시작하기
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-deep">준비중</span>
            </button>
            <a
              href="#about"
              className="w-full rounded-full border border-white/40 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              더 알아보기
            </a>
          </div>
        </div>

        {/* 스크롤 인디케이터 */}
        <a
          href="#about"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 transition hover:text-white"
          aria-label="아래로"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      {/* ───── 소개 (묵상대학이란?) ───── */}
      <section id="about" className="bg-white px-5 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Introduce</span>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">묵상 대학이란?</h2>
          <p className="mt-7 text-lg leading-relaxed text-[#3D3654]/80">
            <strong className="text-accent-deep">묵상 대학</strong>은 <strong>1일 1묵상</strong>으로
            <strong> 4년 동안 성경 전체를 통독</strong>하는 모임입니다.
          </p>
          <p className="mt-4 text-base leading-relaxed text-[#3D3654]/60">
            거창한 시작이 아니라 하루 한 장의 꾸준함으로, 매일의 묵상 기록을 함께 남기며
            서로를 격려하는 공동체입니다. 출석과 기록이 쌓여 어느새 말씀이 삶에 스며듭니다.
          </p>
        </div>
      </section>

      {/* ───── 비전 ───── */}
      <section id="vision" className="bg-accent-soft/60 px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Vision</span>
            <a
              href={VISION_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="group mt-3 inline-flex items-center justify-center gap-2"
            >
              <h2 className="font-display text-3xl font-bold underline-offset-8 transition group-hover:text-accent-deep group-hover:underline sm:text-4xl">
                묵상 대학 비전
              </h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
              </svg>
            </a>
            <p className="mt-3 text-sm text-[#3D3654]/50">클릭하면 비전 전문(노션)을 볼 수 있어요</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {VISION_ITEMS.map((v) => (
              <div
                key={v.label}
                className="rounded-3xl bg-white p-8 text-center shadow-card transition hover:-translate-y-1 hover:shadow-cardHover"
              >
                <div className="font-display text-4xl font-bold text-accent-deep">{v.num}</div>
                <h3 className="mt-3 text-lg font-bold">{v.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#3D3654]/60">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 규칙 & 가이드 ───── */}
      <section id="rule" className="bg-white px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Rule &amp; Guide</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">규칙과 묵상 가이드</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {RULES.map((r) => (
              <div key={r.title} className="rounded-3xl border border-card-border bg-card-subtle p-8">
                <div className="text-3xl">{r.icon}</div>
                <h3 className="mt-4 text-lg font-bold">{r.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#3D3654]/60">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 운영진 & 협력단체 ───── */}
      <section id="staff" className="bg-accent-soft/60 px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">People</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">운영진 소개</h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {STAFF.map((s) => (
              <div key={s.name} className="flex items-start gap-5 rounded-3xl bg-white p-7 shadow-card">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-3xl">
                  {s.emoji}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{s.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#3D3654]/60">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-16 text-center text-xl font-bold text-[#3D3654]/80">협력 단체</h3>
          <div className="mx-auto mt-6 flex max-w-md flex-col gap-4">
            {PARTNERS.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex items-center gap-4 rounded-2xl border border-card-border bg-white px-6 py-5 transition hover:border-accent hover:shadow-card"
              >
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold group-hover:text-accent-deep">{p.name}</div>
                  <div className="text-xs text-[#3D3654]/50">{p.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#3D3654]/30 transition group-hover:text-accent" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ───── 후기 ───── */}
      <section id="review" className="bg-white px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Review</span>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">참여자 후기</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {REVIEWS.map((r) => (
              <figure key={r.name} className="flex flex-col rounded-3xl bg-card-subtle p-8 shadow-card">
                <div className="font-display text-5xl leading-none text-accent/40">“</div>
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3654]/80">{r.text}</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-accent-deep">— {r.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA 밴드 ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-5 py-24 text-center">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            오늘부터, 하루 한 장.
          </h2>
          <p className="mt-4 text-lg text-white/85">
            4년 후 성경 통독을 완주한 당신을 상상해 보세요. 그 첫 페이지를 지금 함께 펼칩니다.
          </p>
          <button
            type="button"
            onClick={comingSoon}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-base font-semibold text-accent-deep shadow-lg transition hover:bg-white/90"
          >
            묵상 챌린지 시작하기
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-deep">준비중</span>
          </button>
        </div>
      </section>

      {/* ───── 푸터 ───── */}
      <footer id="contact" className="bg-[#1c1830] px-5 pt-20 pb-10 text-white/70">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="font-display text-xl font-bold tracking-[0.2em] text-white">A B O U T &nbsp; U S</h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed">
              묵상 대학은 1일 1묵상으로 4년 성경통독을 함께 완주하는 묵상 공동체입니다.
              <br />
              하루 한 장의 작은 순종이 모여 말씀이 삶이 되는 여정을 함께 걷습니다.
            </p>
            <div className="mt-6 font-display text-lg font-bold tracking-widest text-white">묵상 대학</div>
          </div>

          <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">
                콘솔 앱 <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/70">준비중</span>
              </h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><button type="button" onClick={comingSoon} className="hover:text-white">묵상 제출</button></li>
                <li><button type="button" onClick={comingSoon} className="hover:text-white">챌린지 현황</button></li>
                <li><button type="button" onClick={comingSoon} className="hover:text-white">제출 이력</button></li>
                <li><button type="button" onClick={comingSoon} className="hover:text-white">벌금 계산</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">협력 단체</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>홍콩 묵상 동아리</li>
                <li>에클레시아 동아리</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white">문의</h3>
              <p className="mt-4 text-sm">전화 · 문자</p>
              <a href="tel:01067628022" className="text-base font-semibold text-white hover:text-accent">
                010-6762-8022
              </a>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-white/40">
            © {new Date().getFullYear()} 묵상 대학 (Meditation University). All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
