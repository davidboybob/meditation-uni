/** 프로젝트 공통 설정 — 앱과 스크립트(scripts/smoke.mjs)가 같은 소스를 참조. */
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://csqcnvckyuaknjcrwlrl.supabase.co";
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  "sb_publishable_X6oZqOS4nX1-dq-mbhoXvw_IWsV1kPM";

export const HOME_URL = (import.meta.env.VITE_HOME_URL as string | undefined) ?? "https://home.qtuniv.com";
