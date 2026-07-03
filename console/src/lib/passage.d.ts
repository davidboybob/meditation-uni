/** 문자열에서 모든 (책, 장) 토큰을 정규화 문자열 배열로 반환. 예: ["에스겔:3"] */
export function extractPassages(text: string | null | undefined): string[];
/** 통독 일정 본문("에스겔 3장")을 정규화 토큰으로. 실패 시 null. */
export function parsePassage(passage: string | null | undefined): string | null;
/** 메시지 텍스트가 오늘 본문(planPassage)을 담고 있는가. */
export function messageMatchesPassage(text: string | null | undefined, planPassage: string | null | undefined): boolean;
