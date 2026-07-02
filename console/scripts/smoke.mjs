/**
 * 콘솔 e2e 스모크 테스트 — 정산 엔진·RLS·셀프 제출을 실서버(Supabase)에 대해 검증.
 * 실행: MUKSANG_TEST_PW='<테스트계정 비밀번호>' node scripts/smoke.mjs
 * 테스트 계정: test-operator@qtuniv.com(owner), test-member1@qtuniv.com(member)
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL ?? "https://csqcnvckyuaknjcrwlrl.supabase.co";
const KEY = process.env.SUPABASE_ANON_KEY ?? "sb_publishable_X6oZqOS4nX1-dq-mbhoXvw_IWsV1kPM";
const PW = process.env.MUKSANG_TEST_PW;
if (!PW) {
  console.error("MUKSANG_TEST_PW 환경변수가 필요합니다.");
  process.exit(2);
}

const client = () => createClient(URL, KEY, { auth: { persistSession: false } });
let failures = 0;
const check = (name, cond, detail = "") => {
  console.log(`${cond ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
};

// ── 운영자 컨텍스트 ─────────────────────────────
const op = client();
{
  const { error } = await op.auth.signInWithPassword({ email: "test-operator@qtuniv.com", password: PW });
  check("운영자 로그인", !error, error?.message);
}
const { data: g } = await op.from("groups").select("id, monthly_fee").limit(1).single();
check("그룹 조회", !!g?.id);

// 정산 계산 (지난달) — 확정 상태면 스킵
const prev = (() => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();
const { data: stl } = await op.from("settlements").select("id,status").eq("group_id", g.id).eq("month", prev).maybeSingle();
if (stl?.status === "confirmed") {
  check(`정산(${prev}) 확정 상태 — 재계산 차단 확인`, true);
  const { error } = await op.rpc("calculate_settlement", { p_group_id: g.id, p_month: prev });
  check("확정 정산 재계산 거부", !!error, error?.message);
} else {
  const { data: id, error } = await op.rpc("calculate_settlement", { p_group_id: g.id, p_month: prev });
  check(`정산 계산 RPC (${prev})`, !error && !!id, error?.message);
  const { data: items } = await op.from("settlement_items").select("deduction,refund").eq("settlement_id", id);
  const sane = (items ?? []).every((i) => i.deduction >= 0 && i.refund >= 0 && i.deduction + i.refund === g.monthly_fee);
  check("정산 항등식(차감+환급=회비)", sane, JSON.stringify(items));
}

// ── 멤버 권한 경계 ─────────────────────────────
const mem = client();
{
  const { error } = await mem.auth.signInWithPassword({ email: "test-member1@qtuniv.com", password: PW });
  check("멤버 로그인", !error, error?.message);
}
const { data: me } = await mem.auth.getUser();

const { error: calcDeny } = await mem.rpc("calculate_settlement", { p_group_id: g.id, p_month: prev });
check("멤버 정산 계산 차단", !!calcDeny);

const { data: upd } = await mem.from("groups").update({ monthly_fee: 1 }).eq("id", g.id).select();
check("멤버 그룹 설정 변경 차단", (upd ?? []).length === 0);

const kstYesterday = new Date(Date.now() + 9 * 3600 * 1000 - 86400000).toISOString().slice(0, 10);
const { error: pastDeny } = await mem.from("attendance_records").insert({
  group_id: g.id, user_id: me.user.id, date: kstYesterday, status: "present", source: "self",
});
check("멤버 과거 날짜 셀프 기록 차단", !!pastDeny);

const { error: dup } = await mem.rpc("submit_meditation", { p_group_id: g.id, p_note: "smoke" });
check("셀프 제출 RPC 응답(성공 또는 중복 안내)", !dup || dup.message.includes("이미"), dup?.message);

const { data: fee } = await op.from("groups").select("monthly_fee").eq("id", g.id).single();
check("회비 원상 유지", fee.monthly_fee === g.monthly_fee, String(fee.monthly_fee));

console.log(failures === 0 ? "\n🎉 SMOKE PASS" : `\n💥 ${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
