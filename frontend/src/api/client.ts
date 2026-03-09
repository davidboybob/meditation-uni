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
  if (!res.ok) throw new Error("제출 실패");
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
