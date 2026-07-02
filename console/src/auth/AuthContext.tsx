import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Group, Role } from "../lib/types";

interface OperatorContext {
  group: Group;
  role: Role;
  userId: string;
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  ctx: OperatorContext | null; // null = 소속 없음 또는 로딩 전
  signOut: () => Promise<void>;
  refreshCtx: () => Promise<void>;
}

const AuthCtx = createContext<AuthState>({
  loading: true,
  session: null,
  ctx: null,
  signOut: async () => {},
  refreshCtx: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [ctx, setCtx] = useState<OperatorContext | null>(null);

  async function loadCtx(s: Session | null) {
    if (!s) {
      setCtx(null);
      return;
    }
    const { data, error } = await supabase
      .from("memberships")
      .select("role, groups(*)")
      .eq("user_id", s.user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data || !data.groups) {
      setCtx(null);
      return;
    }
    setCtx({
      group: data.groups as unknown as Group,
      role: data.role as Role,
      userId: s.user.id,
    });
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadCtx(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      await loadCtx(s);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider
      value={{
        loading,
        session,
        ctx,
        signOut: async () => {
          await supabase.auth.signOut();
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
