import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import type { Membership, Role } from "../lib/types";

const ROLE_LABEL: Record<Role, string> = { owner: "운영자(소유)", admin: "운영자", member: "멤버" };

export default function Members() {
  const { ctx } = useAuth();
  const group = ctx!.group;
  const [members, setMembers] = useState<Membership[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("memberships")
      .select("*, profiles(*)")
      .eq("group_id", group.id)
      .order("joined_at");
    if (error) toast.error(error.message);
    setMembers((data as Membership[] | null) ?? []);
  }, [group.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const setRole = async (m: Membership, role: Role) => {
    if (m.user_id === ctx!.userId && role === "member") {
      toast.error("자기 자신의 운영자 권한은 해제할 수 없어요.");
      return;
    }
    const { error } = await supabase.from("memberships").update({ role }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(`${m.profiles.display_name} → ${ROLE_LABEL[role]}`);
    void load();
  };

  const toggleActive = async (m: Membership) => {
    const { error } = await supabase.from("memberships").update({ active: !m.active }).eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(`${m.profiles.display_name} — ${m.active ? "휴면 처리" : "활성화"}`);
    void load();
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(
      [
        "🙌 묵상대학에 초대합니다!",
        "1일 1묵상으로 4년 성경통독을 함께 완주해요.",
        "👉 콘솔 가입: " + window.location.origin + "/login",
        `초대코드: ${group.join_code}`,
      ].join("\n"),
    );
    toast.success("초대 안내를 복사했어요.");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">멤버 관리</h1>
          <p className="mt-1 text-sm text-base-text/50">
            총 {members.length}명 · 활성 {members.filter((m) => m.active).length}명
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-deep">
            초대코드: {group.join_code}
          </span>
          <button type="button" className="btn-primary" onClick={() => void copyInvite()}>
            초대 안내 복사
          </button>
        </div>
      </header>

      <div className="card mt-5 p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-card-subtle text-left text-xs text-base-text/50">
              <th className="px-4 py-2.5 font-semibold">이름</th>
              <th className="px-4 py-2.5 font-semibold">역할</th>
              <th className="px-4 py-2.5 font-semibold">상태</th>
              <th className="px-4 py-2.5 font-semibold">가입일</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className={`border-b border-card-border/60 ${m.active ? "" : "opacity-45"}`}>
                <td className="px-4 py-2.5 font-medium">{m.profiles.display_name}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={m.role}
                    onChange={(e) => void setRole(m, e.target.value as Role)}
                    className="!px-2 !py-1 text-xs"
                  >
                    <option value="owner">운영자(소유)</option>
                    <option value="admin">운영자</option>
                    <option value="member">멤버</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      m.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {m.active ? "활성" : "휴면"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-base-text/50">{m.joined_at.slice(0, 10)}</td>
                <td className="px-4 py-2.5 text-right">
                  <button type="button" className="text-xs text-accent-deep underline" onClick={() => void toggleActive(m)}>
                    {m.active ? "휴면 처리" : "활성화"}
                  </button>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-base-text/40">
                  멤버가 없습니다. 초대 안내를 공유해 보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-base-text/40">
        가입한 계정은 자동으로 이 그룹에 멤버로 편입됩니다. 휴면 멤버는 출석부·정산에서 제외돼요.
      </p>
    </div>
  );
}
