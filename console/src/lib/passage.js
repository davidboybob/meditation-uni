// 성경 본문 정규화·매칭 (순수 함수, DOM/의존 없음)
// "에스겔 3장" / "겔3장" / "에스겔 3:1-5" 등을 { book, chapter } 토큰으로 정규화해 비교한다.

// 개신교 66권: 정식명 → 별칭들(정식명·표준 약자·흔한 변형)
const BOOKS = [
  ["창세기", ["창"]], ["출애굽기", ["출"]], ["레위기", ["레"]], ["민수기", ["민"]], ["신명기", ["신"]],
  ["여호수아", ["수"]], ["사사기", ["삿"]], ["룻기", ["룻"]], ["사무엘상", ["삼상"]], ["사무엘하", ["삼하"]],
  ["열왕기상", ["왕상"]], ["열왕기하", ["왕하"]], ["역대상", ["대상"]], ["역대하", ["대하"]], ["에스라", ["스"]],
  ["느헤미야", ["느"]], ["에스더", ["에"]], ["욥기", ["욥"]], ["시편", ["시"]], ["잠언", ["잠"]],
  ["전도서", ["전"]], ["아가", ["아가서", "아"]], ["이사야", ["사"]], ["예레미야", ["렘"]],
  ["예레미야애가", ["애가", "애"]], ["에스겔", ["겔"]], ["다니엘", ["단"]], ["호세아", ["호"]], ["요엘", ["욜"]],
  ["아모스", ["암"]], ["오바댜", ["옵"]], ["요나", ["욘"]], ["미가", ["미"]], ["나훔", ["나"]],
  ["하박국", ["합"]], ["스바냐", ["습"]], ["학개", ["학"]], ["스가랴", ["슥"]], ["말라기", ["말"]],
  ["마태복음", ["마태", "마"]], ["마가복음", ["마가", "막"]], ["누가복음", ["누가", "눅"]],
  ["요한복음", ["요한복음", "요"]], ["사도행전", ["행"]], ["로마서", ["롬"]],
  ["고린도전서", ["고전"]], ["고린도후서", ["고후"]], ["갈라디아서", ["갈"]], ["에베소서", ["엡"]],
  ["빌립보서", ["빌"]], ["골로새서", ["골"]], ["데살로니가전서", ["살전"]], ["데살로니가후서", ["살후"]],
  ["디모데전서", ["딤전"]], ["디모데후서", ["딤후"]], ["디도서", ["딛"]], ["빌레몬서", ["몬"]],
  ["히브리서", ["히"]], ["야고보서", ["약"]], ["베드로전서", ["벧전"]], ["베드로후서", ["벧후"]],
  ["요한일서", ["요일"]], ["요한이서", ["요이"]], ["요한삼서", ["요삼"]], ["유다서", ["유"]],
  ["요한계시록", ["계시록", "계"]],
];

// 별칭 → 정식명. 긴 별칭이 먼저 매칭되도록 길이 내림차순으로 정렬한 alternation을 만든다.
const aliasToBook = new Map();
for (const [book, aliases] of BOOKS) {
  aliasToBook.set(book, book);
  for (const a of aliases) aliasToBook.set(a, book);
}
const allAliases = [...aliasToBook.keys()].sort((a, b) => b.length - a.length);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// (책별칭)(공백)(장번호)(장|편 optional). 책 별칭 뒤에 숫자가 와야만 매칭 → 오탐 억제.
const RE = new RegExp("(" + allAliases.map(escapeRe).join("|") + ")\\s*(\\d{1,3})\\s*(?:장|편)?", "g");

/** 문자열에서 모든 (책, 장) 토큰을 뽑아 정규화 문자열 배열로 반환. 예: ["에스겔:3"] */
export function extractPassages(text) {
  if (!text) return [];
  const out = [];
  const seen = new Set();
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(text)) !== null) {
    const book = aliasToBook.get(m[1]);
    const chapter = parseInt(m[2], 10);
    if (!book || !chapter) continue;
    const key = `${book}:${chapter}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

/** "에스겔 3장" 같은 통독 일정 본문을 정규화 토큰으로. 실패 시 null. */
export function parsePassage(passage) {
  const list = extractPassages(passage);
  return list.length ? list[0] : null;
}

/** 메시지 텍스트가 오늘 본문(planPassage)을 담고 있는가. */
export function messageMatchesPassage(text, planPassage) {
  const target = parsePassage(planPassage);
  if (!target) return false;
  return extractPassages(text).includes(target);
}
