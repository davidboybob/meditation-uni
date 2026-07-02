import { createClient } from "@supabase/supabase-js";

// publishable(anon) 키는 클라이언트 공개용으로 설계된 키 — RLS가 실제 접근을 통제한다.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://csqcnvckyuaknjcrwlrl.supabase.co";
const key =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_X6oZqOS4nX1-dq-mbhoXvw_IWsV1kPM";

export const supabase = createClient(url, key);
