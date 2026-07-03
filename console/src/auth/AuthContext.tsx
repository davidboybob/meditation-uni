import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { onAuthChange, signOut as kitSignOut } from "@kit/auth-supabase";
import { supabase } from "../lib/supabase";
import type { Group, Role } from "../lib/types";

interface OperatorContext {
  group: Group;
  role: Role;
  userId: string;
}

// ctxState: 로딩 전(null+loading) / 로드 실패(error) / 소속 없음(none) / 정상(ok)
type CtxState =
  | { kind: "none" }
  | { kind: "error" }
  | { kind: "ok"; ctx: OperatorContext };

interface AuthState {
  loading: boolean;
  session: Session | null;
  ctx: OperatorContext | null;
  ctxError: boolean; // true = 조회 실패(네트워크 등) — '소속 없음'과 구분
  signOut: () => Promise<void>;
  refreshCtx: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  loading: true,
  session: null,
  ctx: null,
  ctxError: false,
  signOut: async () => {},
  refreshCtx: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [ctxState, setCtxState] = useState<CtxState>({ kind: "none" });
  const reqSeq = useRef(0); // stale 응답 무시용 요청 버전

  async function loadCtx(s: Session | null) {
    const seq = ++reqSeq.current;
    if (!s) {
      if (seq === reqSeq.current) setCtxState({ kind: "none" });
      return;
    }
    const { data, error } = await supabase
      .from("memberships")
      .select("role, groups(*)")
      .eq("user_id", s.user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (seq !== reqSeq.current) return; // 더 최신 요청이 진행 중 → 스테일 응답 폐기
    if (error) {
      setCtxState({ kind: "error" }); // 네트워크/일시 장애 — '소속 없음'과 구분
    } else if (!data || !data.groups) {
      setCtxState({ kind: "none" });
    } else {
      setCtxState({
        kind: "ok",
        ctx: { group: data.groups as unknown as Group, role: data.role as Role, userId: s.user.id },
      });
    }
  }

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadCtx(data.session);
      if (active) setLoading(false);
    });

    // onAuthChange 콜백은 동기로 유지 — 콜백 안에서 supabase 쿼리를 await하면
    // auth-js initializePromise 순환 대기로 무한 로딩(데드락) 발생. loadCtx는 밖으로 미룬다.
    // 킷 onAuthChange는 (session)만 넘기고 unsubscribe 함수를 반환한다.
    // 주의: 여기서 setLoading(true)를 하면 토큰 갱신(약 1시간)마다 전역 로딩 화면이 떠
    //       화면 전체가 잠깐 언마운트되고 작업 중이던 입력이 날아간다. 전역 로딩은 초기 1회만.
    const unsubscribe = onAuthChange(supabase, (s: Session | null) => {
      setSession(s);
      setTimeout(() => {
        if (active) void loadCtx(s);
      }, 0);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        loading,
        session,
        ctx: ctxState.kind === "ok" ? ctxState.ctx : null,
        ctxError: ctxState.kind === "error",
        signOut: async () => {
          const { error } = await kitSignOut(supabase); // error는 문자열|null
          if (error) throw new Error(error);
        },
        refreshCtx: async () => {
          const { data } = await supabase.auth.getSession();
          await loadCtx(data.session);
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthCtx);
}
