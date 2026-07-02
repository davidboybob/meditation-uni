import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./auth/AuthContext";
import Shell from "./components/Shell";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Members from "./pages/Members";
import SettlementPage from "./pages/Settlement";
import Plan from "./pages/Plan";
import Settings from "./pages/Settings";
import MyPage from "./pages/MyPage";
import Feed from "./pages/Feed";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<Shell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/members" element={<Members />} />
            <Route path="/settlement" element={<SettlementPage />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/my" element={<MyPage />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
        <Toaster position="top-center" richColors theme="light" />
      </AuthProvider>
    </ErrorBoundary>
  );
}
