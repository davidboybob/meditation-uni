import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const MENU = [
  { to: "/", label: "대시보드", icon: "🏠", end: true, adminOnly: true },
  { to: "/attendance", label: "출석부", icon: "📅", end: false, adminOnly: true },
  { to: "/members", label: "멤버", icon: "👥", end: false, adminOnly: true },
  { to: "/settlement", label: "정산", icon: "💰", end: false, adminOnly: true },
  { to: "/plan", label: "통독 일정", icon: "📖", end: false, adminOnly: true },
  { to: "/my", label: "내 묵상", icon: "🌱", end: false, adminOnly: false },
  { to: "/settings", label: "설정", icon: "⚙️", end: false, adminOnly: true },
];

export default function Shell() {
  const { loading, session, ctx, signOut } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-base-text/50">
        불러오는 중…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;

  // 소속 그룹이 없는 계정 (비정상 상태)
  if (!ctx) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <div className="text-4xl">🔍</div>
        <h1 className="text-lg font-bold">소속된 그룹이 없습니다</h1>
        <p className="max-w-sm text-sm text-base-text/60">
          계정({session.user.email})이 아직 그룹에 편입되지 않았어요. 운영자에게 문의해 주세요.
        </p>
        <button type="button" className="btn-ghost" onClick={() => void signOut()}>
          로그아웃
        </button>
      </div>
    );
  }

  const isAdmin = ctx.role === "owner" || ctx.role === "admin";
  const menu = MENU.filter((m) => isAdmin || !m.adminOnly);

  // 멤버가 운영자 전용 경로 접근 시 내 묵상으로
  const target = MENU.find((m) => (m.end ? pathname === m.to : pathname.startsWith(m.to) && m.to !== "/"));
  const isAdminPath = pathname === "/" || (target?.adminOnly ?? false);
  if (!isAdmin && isAdminPath && pathname !== "/my") {
    return <Navigate to="/my" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 (데스크톱) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col bg-sidebar text-white/80 md:flex">
        <div className="px-5 py-6 leading-tight">
          <div className="text-[11px] font-medium tracking-wide text-white/50">
            {isAdmin ? "운영자 콘솔" : "1일 1묵상 · 4년 성경통독"}
          </div>
          <div className="text-lg font-bold text-white">묵상 대학</div>
        </div>
        <nav className="flex-1 px-3">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                `mb-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-accent-deep text-white" : "hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span>{m.icon}</span>
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs">
          <div className="truncate text-white/60">{session.user.email}</div>
          <button type="button" onClick={() => void signOut()} className="mt-2 text-white/50 underline underline-offset-2 hover:text-white">
            로그아웃
          </button>
        </div>
      </aside>

      {/* 본문 */}
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 md:ml-56 md:px-8 md:pb-10">
        <Outlet />
      </main>

      {/* 하단 탭 (모바일) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-card-border bg-white/95 backdrop-blur md:hidden">
        {menu.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.end}
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-[11px] font-medium ${
                isActive ? "text-accent-deep" : "text-base-text/40"
              }`
            }
          >
            <div className="text-base">{m.icon}</div>
            {m.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
