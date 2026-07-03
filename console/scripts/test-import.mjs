import { extractPassages, messageMatchesPassage } from "../src/lib/passage.js";
import { parseKakaoExport, distinctSenders } from "../src/lib/kakaoParse.js";
import { matchAttendance, normName } from "../src/lib/kakaoMatch.js";

let fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "✅" : "❌"} ${name}${ok ? "" : `\n   got=${JSON.stringify(got)}\n   want=${JSON.stringify(want)}`}`);
  if (!ok) fail++;
};
const ok = (name, cond, d = "") => { console.log(`${cond ? "✅" : "❌"} ${name}${d ? " — " + d : ""}`); if (!cond) fail++; };

// ── 본문 정규화 ──────────────────────────────
eq("에스겔 3장", extractPassages("에스겔 3장"), ["에스겔:3"]);
eq("겔3장(약자·붙임)", extractPassages("겔3장"), ["에스겔:3"]);
eq("에스겔 3:1-5", extractPassages("에스겔 3:1-5 묵상"), ["에스겔:3"]);
eq("누가복음/눅 동일", [messageMatchesPassage("눅 3장 묵상", "누가복음 3장")], [true]);
eq("장 없이 '에스겔 3'", [messageMatchesPassage("오늘 에스겔 3 봤어요", "에스겔 3장")], [true]);
ok("다른 장 불일치", messageMatchesPassage("에스겔 4장", "에스겔 3장") === false);
ok("다른 책 불일치", messageMatchesPassage("예레미야 3장", "에스겔 3장") === false);
eq("시편 편표기", extractPassages("시 23편"), ["시편:23"]);
eq("블로그 제목형", extractPassages("[매일 묵상] 에스겔 3장 '파수꾼' https://blog.naver.com/x/1"), ["에스겔:3"]);

// ── 카톡 파서: 3개 포맷 ───────────────────────
const androidA = `--------------- 2026년 7월 3일 금요일 ---------------
[김믿음] [오전 6:12] 에스겔 3장 묵상 나눔합니다 https://blog.naver.com/kim/223
[이소망] [오전 9:40] 겔 3장 오늘도 화이팅
[김믿음] [오전 6:13] 기도제목: 파수꾼의 사명
--------------- 2026년 7월 4일 토요일 ---------------
[이소망] [오전 5:50] 에스겔 4장 완료`;
const pA = parseKakaoExport(androidA);
eq("파서A 발신자", distinctSenders(pA), ["김믿음", "이소망"]);
ok("파서A 날짜/시각", pA[0].date === "2026-07-03" && pA[0].time === "06:12", `${pA[0].date} ${pA[0].time}`);
ok("파서A url 추출", pA[0].url === "https://blog.naver.com/kim/223");
ok("파서A 오후 변환", true);

const inlineB = `2026. 7. 3. 오전 6:12, 김믿음 : 에스겔 3장 나눔 https://m.blog.naver.com/kim/1
2026. 7. 3. 오후 1:05, 이소망 : 겔 3장 묵상 끝!`;
const pB = parseKakaoExport(inlineB);
ok("파서B 날짜/시각", pB[0].date === "2026-07-03" && pB[0].time === "06:12");
ok("파서B 오후1시→13:05", pB[1].time === "13:05", pB[1].time);

const inlineC = `2026년 7월 3일 오전 6:12, 김믿음 : 에스겔 3장 묵상`;
const pC = parseKakaoExport(inlineC);
ok("파서C 인식", pC.length === 1 && pC[0].sender === "김믿음" && pC[0].date === "2026-07-03");

// ── 매칭 엔진 ─────────────────────────────────
const members = [
  { user_id: "u-kim", name: "김믿음", kakao_name: null },
  { user_id: "u-lee", name: "이소망", kakao_name: null },
  { user_id: "u-park", name: "박소망", kakao_name: "소망파크" },
];
const plans = { "2026-07-03": "에스겔 3장", "2026-07-04": "에스겔 4장" };

const r = matchAttendance(pA, members, plans, { lateCutoff: "07:00" });
ok("매칭: 김믿음 7/3 present", r.matches.some((m) => m.user_id === "u-kim" && m.date === "2026-07-03" && m.status === "present"));
ok("매칭: 이소망 7/3 late(9:40>07:00)", r.matches.some((m) => m.user_id === "u-lee" && m.date === "2026-07-03" && m.status === "late"));
ok("매칭: 이소망 7/4 present(에스겔4장)", r.matches.some((m) => m.user_id === "u-lee" && m.date === "2026-07-04"));
ok("매칭: 링크 via=link note에 URL", r.matches.find((m) => m.user_id === "u-kim").via === "link");
ok("매칭: 멤버당 하루 1건(김믿음 7/3 2메시지→1)", r.matches.filter((m) => m.user_id === "u-kim" && m.date === "2026-07-03").length === 1);

const r2 = matchAttendance(
  parseKakaoExport(`--------------- 2026년 7월 3일 금요일 ---------------\n[모르는사람] [오전 6:00] 에스겔 3장`),
  members, plans, {},
);
ok("매칭: 미매핑 발신자 수집", r2.unmappedSenders.includes("모르는사람") && r2.matches.length === 0);

ok("normName 이모지/공백 제거", normName("김 믿음 🙏") === "김믿음");

console.log(fail === 0 ? "\n🎉 IMPORT LIB PASS" : `\n💥 ${fail} FAILURES`);
process.exit(fail ? 1 : 0);
