import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

type SubPageProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaTitle?: string;
  ctaDesc?: string;
  children: ReactNode;
};

/* 랜딩과 동일한 톤의 서브페이지 공용 레이아웃 (그라데이션 히어로 + CTA + 미니 푸터) */
export default function SubPage({
  eyebrow,
  title,
  subtitle,
  description,
  ctaTitle = "함께 묵상을 시작하고 싶다면",
  ctaDesc = "하루 한 장의 묵상이 4년 성경통독의 여정을 만듭니다.",
  children,
}: SubPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-[#3D3654]">
      {/* ───── 히어로 ───── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-5 pb-24 pt-6 text-center">
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

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
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-white/70">{eyebrow}</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-6xl">{title}</h1>
          {subtitle && <p className="mt-6 text-lg text-white/90 sm:text-xl">{subtitle}</p>}
          {description && (
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/60">{description}</p>
          )}
        </div>
      </section>

      {/* ───── 본문 ───── */}
      {children}

      {/* ───── CTA ───── */}
      <section className="bg-accent-soft/60 px-5 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{ctaTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#3D3654]/60">{ctaDesc}</p>
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
