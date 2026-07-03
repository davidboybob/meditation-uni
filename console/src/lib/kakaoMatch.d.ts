import type { KakaoMessage } from "./kakaoParse";

export interface MatchMember {
  user_id: string;
  name: string;
  kakao_name?: string | null;
}
export interface AttendanceMatch {
  user_id: string;
  name: string;
  date: string;
  status: "present" | "late";
  time: string | null;
  note: string;
  matchedText: string;
  via: "text" | "link";
}
export interface MatchResult {
  matches: AttendanceMatch[];
  unmappedSenders: string[];
  senderMap: Record<string, string>;
}
export function normName(s: string | null | undefined): string;
export function matchAttendance(
  messages: KakaoMessage[],
  members: MatchMember[],
  plans: Record<string, string>,
  options?: { lateCutoff?: string | null },
): MatchResult;
