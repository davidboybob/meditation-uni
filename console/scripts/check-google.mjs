/** 구글 OAuth 제공자 활성 상태 점검 (공개 settings 엔드포인트, 비밀값 노출 없음). */
const URL = process.env.SUPABASE_URL ?? "https://csqcnvckyuaknjcrwlrl.supabase.co";
const KEY = process.env.SUPABASE_ANON_KEY ?? "sb_publishable_X6oZqOS4nX1-dq-mbhoXvw_IWsV1kPM";

const res = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY } });
if (!res.ok) {
  console.error(`❌ settings 조회 실패: HTTP ${res.status}`);
  process.exit(2);
}
const s = await res.json();
const on = s.external?.google === true;
console.log(on ? "✅ google: enabled — 콘솔에서 'Google로 계속하기' 사용 가능" : "⏳ google: disabled — docs/GOOGLE_OAUTH_SETUP.md 참고해 켜세요");
console.log(`   (email: ${s.external?.email ? "on" : "off"}, kakao: ${s.external?.kakao ? "on" : "off"})`);
process.exit(on ? 0 : 1);
