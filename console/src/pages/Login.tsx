import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { signInWithOAuth } from "@kit/auth-supabase";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() || email.split("@")[0] } },
        });
        if (error) throw error;
        toast.success("가입 요청 완료. 이메일 인증(또는 운영자 확인) 후 로그인해 주세요.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    // 킷 헬퍼로 통일. redirectTo는 /auth/callback으로 고정(스킴 일관).
    const { error } = await signInWithOAuth(supabase, "google", `${window.location.origin}/auth/callback`);
    if (error) {
      // 킷 wrap은 error를 문자열로 반환
      const notEnabled = /provider is not enabled|Unsupported provider/i.test(error);
      toast.error(
        notEnabled
          ? "구글 로그인이 아직 준비되지 않았어요. 운영자가 Supabase에 구글 제공자를 켜야 합니다."
          : `구글 로그인 실패: ${error}`,
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#a855f7] px-5">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-xl">
        <div className="text-center leading-tight">
          <div className="text-[11px] font-medium tracking-wide text-accent-deep">1일 1묵상 · 4년 성경통독</div>
          <h1 className="mt-1 text-2xl font-bold">묵상대학 콘솔</h1>
          <p className="mt-2 text-xs text-base-text/50">가입하면 자동으로 묵상대학 그룹에 참여됩니다.</p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="이름 (표시명)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={busy} className="btn-primary py-2.5">
            {busy ? "처리 중…" : mode === "signin" ? "로그인" : "가입하기"}
          </button>
        </form>

        <button type="button" onClick={() => void google()} className="btn-ghost mt-3 w-full py-2.5">
          Google로 계속하기
        </button>

        <p className="mt-5 text-center text-xs text-base-text/50">
          {mode === "signin" ? (
            <>
              계정이 없나요?{" "}
              <button type="button" className="font-semibold text-accent-deep underline" onClick={() => setMode("signup")}>
                가입하기
              </button>
            </>
          ) : (
            <>
              이미 계정이 있나요?{" "}
              <button type="button" className="font-semibold text-accent-deep underline" onClick={() => setMode("signin")}>
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
