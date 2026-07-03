// 카톡 메시지 × 멤버 × 통독일정 → 출석 매칭 (순수 함수)
import { messageMatchesPassage } from "./passage.js";

// 이름 정규화: 공백/이모지/괄호수식 제거 + 소문자
export function normName(s) {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}️]/gu, "")
    .replace(/[()[\]{}<>].*$/, "")
    .toLowerCase();
}

/**
 * @param messages parseKakaoExport 결과
 * @param members  [{ user_id, name, kakao_name }]
 * @param plans    { 'YYYY-MM-DD': '에스겔 3장' }
 * @param options  { lateCutoff?: 'HH:MM' | null }
 * @returns {
 *   matches: [{ user_id, name, date, status, time, note, matchedText, via }],  // via: 'text' | 'link'
 *   unmappedSenders: string[],   // 멤버로 매핑 안 된 발신자
 *   senderMap: { [sender]: user_id }
 * }
 */
export function matchAttendance(messages, members, plans, options = {}) {
  const lateCutoff = options.lateCutoff || null;

  // 발신자 → 멤버 자동 매핑(정규화된 kakao_name 우선, 없으면 name)
  const byNorm = new Map();
  for (const mem of members) {
    if (mem.kakao_name) byNorm.set(normName(mem.kakao_name), mem);
    byNorm.set(normName(mem.name), mem); // name도 폴백(이미 있으면 kakao_name 우선 유지 위해 뒤에)
  }
  // kakao_name 우선을 보장: 다시 덮어쓰기
  for (const mem of members) if (mem.kakao_name) byNorm.set(normName(mem.kakao_name), mem);

  const senderMap = {};
  const unmapped = new Set();
  const matches = [];
  const takenPerMemberDate = new Set(); // user_id|date 중복 방지

  for (const msg of messages) {
    if (!msg.date || !plans[msg.date]) continue; // 그날 통독 일정 없으면 스킵
    const mem = byNorm.get(normName(msg.sender));
    if (!mem) {
      unmapped.add(msg.sender);
      continue;
    }
    senderMap[msg.sender] = mem.user_id;

    const key = `${mem.user_id}|${msg.date}`;
    if (takenPerMemberDate.has(key)) continue;

    const passage = plans[msg.date];
    if (!messageMatchesPassage(msg.text, passage)) continue;

    takenPerMemberDate.add(key);
    const status = lateCutoff && msg.time && msg.time > lateCutoff ? "late" : "present";
    matches.push({
      user_id: mem.user_id,
      name: mem.name,
      date: msg.date,
      status,
      time: msg.time,
      note: msg.url ? `${passage} · ${msg.url}` : `${passage} · ${msg.text.slice(0, 120)}`,
      matchedText: msg.text.slice(0, 200),
      via: msg.url ? "link" : "text",
    });
  }

  return {
    matches,
    unmappedSenders: [...unmapped],
    senderMap,
  };
}
