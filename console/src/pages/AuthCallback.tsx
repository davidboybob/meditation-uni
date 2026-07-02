import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

/** OAuth 리다이렉트 착지점. supabase-js가 URL의 세션을 자동 교환하면
 *  onAuthStateChange가 발화하므로, 세션이 잡히는 즉시 콘솔로 보낸다. */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        navigate("/", { replace: true });
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) finish();
    });
    // URL에 error 파라미터가 있거나 8초 내 세션이 안 잡히면 안내
    const params = new URLSearchParams(window.location.hash.slice(1) + "&" + window.location.search.slice(1));
    if (params.get("error")) setFailed(true);
    const t = setTimeout(() => !done && setFailed(true), 8000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      {failed ? (
        <>
          <div className="text-4xl">🔒</div>
          <h1 className="text-lg font-bold">로그인을 완료하지 못했어요</h1>
          <p className="max-w-sm text-sm text-base-text/60">
            다시 시도하거나 이메일 로그인을 이용해 주세요.
          </p>
          <button type="button" className="btn-primary" onClick={() => navigate("/login", { replace: true })}>
            로그인으로
          </button>
        </>
      ) : (
        <div className="text-sm text-base-text/50">로그인 처리 중…</div>
      )}
    </div>
  );
}
