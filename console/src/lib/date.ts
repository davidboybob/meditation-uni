/** 날짜 유틸 — @kit/challenge 재수출 + 프로젝트 전용 포맷터 */
export { ymd, todayYmd, thisMonth, monthDates, addMonths } from "@kit/challenge";

export function fmtWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
