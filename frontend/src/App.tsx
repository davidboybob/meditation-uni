import { BrowserRouter, Routes, Route, NavLink, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import HomeScreen from "./pages/HomeScreen";
import FineCalculator from "./pages/FineCalculator";
import HistoryScreen from "./pages/HistoryScreen";
import ChallengeScreen from "./pages/ChallengeScreen";
import AdminScreen from "./pages/AdminScreen";
import NotFound from "./pages/NotFound";

const tabs = [
  { path: "/", label: "📖 홈" },
  { path: "/history", label: "📅 이력" },
  { path: "/challenge", label: "🏆 챌린지" },
  { path: "/fine", label: "💰 벌금" },
];

function AppLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/challenge" element={<ChallengeScreen />} />
        <Route path="/fine" element={<FineCalculator />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdmin && (
        <>
          <nav className="fixed bottom-0 left-0 right-0 flex border-t border-accent bg-base-dark">
            {tabs.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/"}
                className={({ isActive }) =>
                  `flex-1 py-3 text-sm font-medium transition text-center ${
                    isActive ? "text-accent-light" : "text-gray-500"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="h-14" />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
