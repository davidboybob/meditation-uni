const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface PostCreate {
  user_email: string;
  content: string;
  submission_time: string;
  deadline_time: string;
}

export interface PostResponse {
  status: "present" | "late";
  message: string;
  submission_time: string;
  deadline_time: string;
}

export interface PostRecord {
  id: number;
  user_email: string;
  content: string;
  submission_time: string;
  deadline_time: string;
  status: "present" | "late";
  submitted_date: string;
}

export interface TodayStatus {
  submitted: boolean;
  status?: "present" | "late";
  message?: string;
  submission_time?: string;
}

export interface AttendanceSummary {
  total_days: number;
  present_count: number;
  late_count: number;
  absent_count: number;
}

export interface FineRequest {
  late_count: number;
  absent_count: number;
}

export interface FineResponse {
  total_fine: number;
  converted_absences: number;
  detail: string;
}

export async function submitPost(data: PostCreate): Promise<PostResponse> {
  const res = await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (res.status === 409) throw new Error("duplicate");
  if (!res.ok) throw new Error("제출 실패");
  return res.json();
}

export async function getTodayStatus(userEmail: string): Promise<TodayStatus> {
  const res = await fetch(`${API_BASE}/api/posts/today?user_email=${encodeURIComponent(userEmail)}`);
  if (!res.ok) throw new Error("상태 조회 실패");
  return res.json();
}

export async function getPosts(userEmail: string): Promise<PostRecord[]> {
  const res = await fetch(`${API_BASE}/api/posts?user_email=${encodeURIComponent(userEmail)}`);
  if (!res.ok) throw new Error("이력 조회 실패");
  return res.json();
}

export async function getAttendanceSummary(userEmail: string): Promise<AttendanceSummary> {
  const res = await fetch(`${API_BASE}/api/posts/summary?user_email=${encodeURIComponent(userEmail)}`);
  if (!res.ok) throw new Error("통계 조회 실패");
  return res.json();
}

export interface ChallengeCreate {
  name: string;
  start_date: string;
  end_date: string;
  deadline_time: string;
}

export interface ChallengeResponse {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  deadline_time: string;
  member_count: number;
}

export interface MemberAttendance {
  user_email: string;
  submitted: boolean;
  status?: "present" | "late";
  submission_time?: string;
}

export interface ChallengeTodayResponse {
  challenge: ChallengeResponse;
  date: string;
  members: MemberAttendance[];
}

export async function createChallenge(data: ChallengeCreate): Promise<ChallengeResponse> {
  const res = await fetch(`${API_BASE}/api/challenges`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("챌린지 생성 실패");
  return res.json();
}

export async function listChallenges(): Promise<ChallengeResponse[]> {
  const res = await fetch(`${API_BASE}/api/challenges`);
  if (!res.ok) throw new Error("챌린지 목록 조회 실패");
  return res.json();
}

export async function joinChallenge(challengeId: number, userEmail: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/challenges/${challengeId}/join?user_email=${encodeURIComponent(userEmail)}`,
    { method: "POST" },
  );
  if (res.status === 409) throw new Error("already_joined");
  if (!res.ok) throw new Error("참여 실패");
}

export async function leaveChallenge(challengeId: number, userEmail: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/challenges/${challengeId}/leave?user_email=${encodeURIComponent(userEmail)}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error("탈퇴 실패");
}

export async function getChallengeToday(challengeId: number): Promise<ChallengeTodayResponse> {
  const res = await fetch(`${API_BASE}/api/challenges/${challengeId}/today`);
  if (!res.ok) throw new Error("출석 현황 조회 실패");
  return res.json();
}

// --- Admin API ---

const ADMIN_PIN_KEY = "meditation_admin_pin";

function getAdminPin(): string {
  return sessionStorage.getItem(ADMIN_PIN_KEY) || "";
}

function adminHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "X-Admin-Pin": getAdminPin(), ...extra };
}

export function saveAdminPin(pin: string): void {
  sessionStorage.setItem(ADMIN_PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/admin/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  if (res.status === 401) return false;
  if (!res.ok) throw new Error("인증 실패");
  saveAdminPin(pin);
  return true;
}

export interface ChallengeUpdate {
  name?: string;
  start_date?: string;
  end_date?: string;
  deadline_time?: string;
}

export async function updateChallenge(id: number, data: ChallengeUpdate): Promise<ChallengeResponse> {
  const res = await fetch(`${API_BASE}/api/admin/challenges/${id}`, {
    method: "PUT",
    headers: adminHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("챌린지 수정 실패");
  return res.json();
}

export async function deleteChallenge(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/challenges/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("챌린지 삭제 실패");
}

export async function listMembers(challengeId: number): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/admin/challenges/${challengeId}/members`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("멤버 목록 조회 실패");
  return res.json();
}

export async function removeMember(challengeId: number, userEmail: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/admin/challenges/${challengeId}/members/${encodeURIComponent(userEmail)}`,
    { method: "DELETE", headers: adminHeaders() },
  );
  if (!res.ok) throw new Error("멤버 제거 실패");
}

export interface MemberStats {
  user_email: string;
  present_count: number;
  late_count: number;
  absent_count: number;
  total_fine: number;
}

export interface ChallengeAttendance {
  challenge: ChallengeResponse;
  members: MemberStats[];
  dates: string[];
  grid: Record<string, Record<string, string>>;
}

export async function getChallengeAttendance(challengeId: number): Promise<ChallengeAttendance> {
  const res = await fetch(`${API_BASE}/api/admin/challenges/${challengeId}/attendance`, {
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error("출석 데이터 조회 실패");
  return res.json();
}

export async function calculateFine(data: FineRequest): Promise<FineResponse> {
  const res = await fetch(`${API_BASE}/api/fines/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("계산 실패");
  return res.json();
}
