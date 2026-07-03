export interface KakaoMessage {
  date: string | null; // YYYY-MM-DD
  time: string | null; // HH:MM (24h)
  sender: string;
  text: string;
  url: string | null;
}
/** 카카오톡 대화 내보내기(.txt) 원문을 메시지 배열로 파싱. */
export function parseKakaoExport(raw: string | null | undefined): KakaoMessage[];
/** 내보내기에 등장하는 발신자 목록(중복 제거). */
export function distinctSenders(messages: KakaoMessage[]): string[];
