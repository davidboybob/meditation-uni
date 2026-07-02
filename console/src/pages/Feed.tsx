import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../auth/AuthContext";
import { STATUS_LABEL, STATUS_STYLE, type AttendanceStatus } from "../lib/types";

interface FeedComment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string };
}

interface FeedItem {
  id: string;
  date: string;
  status: AttendanceStatus;
  note: string;
  user_id: string;
  profiles: { display_name: string };
  comments: FeedComment[];
}

function CommentBox({ onSubmit }: { onSubmit: (text: string) => Promise<boolean> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        setBusy(true);
        void onSubmit(text.trim()).then((ok) => {
          setBusy(false);
          if (ok) setText(""); // 실패 시 입력 보존
        });
      }}
    >
      <input
        type="text"
        className="flex-1 !py-1.5 text-sm"
        placeholder="따뜻한 답글로 나눔에 참여해요…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn-primary !px-3 !py-1.5 text-xs" disabled={busy || !text.trim()}>
        등록
      </button>
    </form>
  );
}

export default function Feed() {
  const { ctx } = useAuth();
  const group = ctx!.group;
  const isAdmin = ctx!.role === "owner" || ctx!.role === "admin";

  const [items, setItems] = useState<FeedItem[]>([]);
  const [limit, setLimit] = useState(20);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("attendance_records")
      .select(
        "id, date, status, note, user_id, profiles!attendance_records_user_id_fkey(display_name), comments(id, user_id, content, created_at, profiles(display_name))",
      )
      .eq("group_id", group.id)
      .not("note", "is", null)
      .order("date", { ascending: false })
      .order("created_at", { referencedTable: "comments", ascending: true })
      .limit(limit);
    if (error) return toast.error(error.message);
    setItems((data as unknown as FeedItem[]) ?? []);
  }, [group.id, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const addComment = async (item: FeedItem, text: string): Promise<boolean> => {
    const { error } = await supabase.from("comments").insert({
      record_id: item.id,
      group_id: group.id,
      user_id: ctx!.userId,
      content: text,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("답글을 남겼어요 💬");
    void load();
    return true;
  };

  const removeComment = async (c: FeedComment) => {
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <h1 className="text-xl font-bold">나눔 피드</h1>
        <p className="mt-1 text-sm text-base-text/50">
          서로의 묵상을 읽고 자유롭게 답해요. 다른 사람 질문에 답변 1회 — 오늘의 목표 중 하나예요.
        </p>
      </header>

      <div className="mt-5 flex flex-col gap-4">
        {items.map((item) => (
          <article key={item.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <b>{item.profiles.display_name}</b>
              <span className="text-xs text-base-text/40">{item.date}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[item.status]}`}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{item.note}</p>

            {item.comments.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-card-border pt-3">
                {item.comments.map((c) => (
                  <li key={c.id} className="group flex items-start gap-2 text-sm">
                    <b className="shrink-0 text-accent-deep">{c.profiles.display_name}</b>
                    <span className="min-w-0 flex-1 text-base-text/80">{c.content}</span>
                    {(c.user_id === ctx!.userId || isAdmin) && (
                      <button
                        type="button"
                        className="hidden text-xs text-base-text/30 hover:text-rose-500 group-hover:block"
                        onClick={() => void removeComment(c)}
                        title="답글 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <CommentBox onSubmit={(text) => addComment(item, text)} />
          </article>
        ))}
        {items.length === 0 && (
          <div className="card py-12 text-center text-sm text-base-text/40">
            아직 나눔 글이 없어요. ‘내 묵상’에서 오늘 묵상을 제출하면 여기에 표시됩니다.
          </div>
        )}
        {items.length >= limit && (
          <button type="button" className="btn-ghost self-center" onClick={() => setLimit((n) => n + 20)}>
            더 보기
          </button>
        )}
      </div>
    </div>
  );
}
