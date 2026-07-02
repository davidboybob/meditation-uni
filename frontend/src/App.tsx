import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import VisionPage from "./pages/VisionPage";
import RulesPage from "./pages/RulesPage";
import GuidePage from "./pages/GuidePage";
import BlogPage from "./pages/BlogPage";

// 묵상대학 홈페이지(정적). 콘솔 앱은 별도 앱으로 분리 예정 — 여기서는 홈페이지만 서빙한다.
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/vision" element={<VisionPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors theme="light" />
    </ErrorBoundary>
  );
}
