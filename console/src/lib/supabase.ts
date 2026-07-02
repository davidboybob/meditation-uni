import { createSupabase } from "@kit/auth-supabase";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// @kit/auth-supabase 래퍼로 생성 — 인증 헬퍼(signInWithOAuth/signOut 등)를 킷과 공유.
// publishable(anon) 키는 클라이언트 공개용으로 설계된 키 — 실제 접근 통제는 RLS가 담당.
export const supabase = createSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
