// 카카오톡 대화 내보내기(.txt) 파서 — iOS/안드로이드/PC 주요 포맷 대응 (순수 함수)
// 반환: [{ date: 'YYYY-MM-DD'|null, time: 'HH:MM'|null, sender, text, url }]

function to24h(ampm, h, m) {
  let hh = parseInt(h, 10);
  if (ampm === "오전") hh = hh === 12 ? 0 : hh;
  else hh = hh === 12 ? 12 : hh + 12;
  return `${String(hh).padStart(2, "0")}:${m}`;
}
function ymd(y, mo, d) {
  return `${y}-${String(parseInt(mo, 10)).padStart(2, "0")}-${String(parseInt(d, 10)).padStart(2, "0")}`;
}
const URL_RE = /(https?:\/\/[^\s]+)/;

// 날짜 구분선: "--------------- 2026년 7월 3일 금요일 ---------------" 또는 "2026년 7월 3일 금요일"
const DATE_LINE = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/;
// [이름] [오전 6:12] 메시지  (iOS/PC 최신)
const BRACKET = /^\[([^\]]+)\]\s*\[(오전|오후)\s*(\d{1,2}):(\d{2})\]\s*([\s\S]*)$/;
// 2026. 7. 3. 오전 6:12, 이름 : 메시지  (안드/iOS 구형)
const INLINE_DOT = /^(\d{4})[.\s]+(\d{1,2})[.\s]+(\d{1,2})[.\s]+(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*([\s\S]*)$/;
// 2026년 7월 3일 오전 6:12, 이름 : 메시지
const INLINE_KR = /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(오전|오후)\s*(\d{1,2}):(\d{2}),\s*(.+?)\s*:\s*([\s\S]*)$/;

const SYSTEM_HINT = /(님이 들어왔습니다|님이 나갔습니다|님을 초대|저장한 날짜|채팅방 관리자|삭제된 메시지)/;

export function parseKakaoExport(raw) {
  const lines = String(raw ?? "").split(/\r?\n/);
  const msgs = [];
  let curDate = null;

  const push = (sender, time, text) => {
    const s = sender.trim();
    if (!s || SYSTEM_HINT.test(text)) return;
    const urlM = text.match(URL_RE);
    msgs.push({ date: curDate, time, sender: s, text: text.trim(), url: urlM ? urlM[1] : null });
  };

  for (const line of lines) {
    if (!line.trim()) continue;

    // 순수 날짜 구분선(메시지 아님)
    const isBracket = BRACKET.test(line);
    if (!isBracket && DATE_LINE.test(line) && !INLINE_DOT.test(line) && !INLINE_KR.test(line)) {
      const d = line.match(DATE_LINE);
      // 날짜만 있고 시각/발신자 없는 줄만 구분선으로 취급
      if (!/(오전|오후)/.test(line) || /요일/.test(line)) {
        curDate = ymd(d[1], d[2], d[3]);
        continue;
      }
    }

    let m;
    if ((m = line.match(BRACKET))) {
      push(m[1], to24h(m[2], m[3], m[4]), m[5]);
    } else if ((m = line.match(INLINE_DOT))) {
      curDate = ymd(m[1], m[2], m[3]);
      push(m[7], to24h(m[4], m[5], m[6]), m[8]);
    } else if ((m = line.match(INLINE_KR))) {
      curDate = ymd(m[1], m[2], m[3]);
      push(m[7], to24h(m[4], m[5], m[6]), m[8]);
    } else if (msgs.length) {
      // 헤더 없는 줄 → 직전 메시지의 이어짐(멀티라인)
      const last = msgs[msgs.length - 1];
      last.text += "\n" + line.trim();
      if (!last.url) {
        const u = line.match(URL_RE);
        if (u) last.url = u[1];
      }
    }
  }
  return msgs;
}

/** 내보내기에 등장하는 발신자 목록(중복 제거). */
export function distinctSenders(messages) {
  return [...new Set(messages.map((m) => m.sender))];
}
