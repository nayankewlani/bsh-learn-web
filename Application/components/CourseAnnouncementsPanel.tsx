import React, { useEffect, useRef, useState } from "react";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import client from "../api/client";
import Avatar from "./ui/Avatar";

interface Announcement {
  _id: string;
  text: string;
  link?: string;
  linkLabel?: string;
  createdAt: string;
  sender: { _id: string; name: string; avatar?: string };
}

interface Props {
  courseId: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const CourseAnnouncementsPanel: React.FC<Props> = ({ courseId }) => {
  const { t } = useThemeStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLoading(true);
    client
      .get(`/courses/${courseId}/announcements`)
      .then((r) => setItems(r.data.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true);
    setPostError("");
    try {
      const { data } = await client.post(`/courses/${courseId}/announcements`, {
        text: text.trim(),
        link: link.trim() || undefined,
        linkLabel: linkLabel.trim() || undefined,
      });
      setItems((prev) => [data.announcement, ...prev]);
      setText("");
      setLink("");
      setLinkLabel("");
    } catch (err: any) {
      setPostError(err.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (annId: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await client.delete(`/courses/${courseId}/announcements/${annId}`);
      setItems((prev) => prev.filter((a) => a._id !== annId));
    } catch {}
  };

  return (
    <div style={{ marginTop: 48 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#5b21b6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          📢
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>
            Course Announcements
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: t.textSecond }}>
            Messages from the admin — only enrolled students can view these
          </p>
        </div>
      </div>

      {/* Admin compose box */}
      {isAdmin && (
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.accent}44`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.accent, marginBottom: 12 }}>
            Post New Announcement
          </div>

          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message here… (links, session info, batch updates)"
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", padding: "12px 14px",
              border: `1.5px solid ${t.border}`, borderRadius: 10,
              fontSize: 14, lineHeight: 1.6,
              background: t.bgPrimary, color: t.textPrimary,
              resize: "vertical", outline: "none", fontFamily: "inherit",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.target.style.borderColor = t.border)}
          />

          {/* Optional link row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 8, marginTop: 10 }}>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Optional link URL (e.g. https://drive.google.com/...)"
              style={{ padding: "10px 12px", border: `1.5px solid ${t.border}`, borderRadius: 9, fontSize: 13, background: t.bgPrimary, color: t.textPrimary, outline: "none" }}
            />
            <input
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="Link label"
              style={{ padding: "10px 12px", border: `1.5px solid ${t.border}`, borderRadius: 9, fontSize: 13, background: t.bgPrimary, color: t.textPrimary, outline: "none" }}
            />
          </div>

          {postError && (
            <div style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{postError}</div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={handlePost}
              disabled={posting || !text.trim()}
              style={{
                background: posting || !text.trim() ? "#4b5563" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
                border: "none", color: "#fff", padding: "10px 24px", borderRadius: 10,
                cursor: posting || !text.trim() ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 700,
                boxShadow: posting || !text.trim() ? "none" : "0 4px 16px rgba(124,58,237,0.35)",
              }}
            >
              {posting ? "Posting…" : "Send Announcement"}
            </button>
          </div>
        </div>
      )}

      {/* Messages list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: t.textSecond }}>Loading announcements…</div>
      ) : items.length === 0 ? (
        <div style={{ background: t.bgCard, border: `1.5px dashed ${t.borderLight}`, borderRadius: 16, padding: "36px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ color: t.textPrimary, fontWeight: 700, marginBottom: 6 }}>No announcements yet</div>
          <p style={{ color: t.textSecond, fontSize: 14, margin: 0 }}>
            The admin will post batch updates, session links, and course materials here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((ann) => (
            <div
              key={ann._id}
              style={{
                background: t.bgCard,
                border: `1.5px solid ${t.border}`,
                borderLeft: "4px solid #7c3aed",
                borderRadius: 14,
                padding: "18px 20px",
                position: "relative",
              }}
            >
              {/* Sender + time */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Avatar src={ann.sender?.avatar} name={ann.sender?.name || "Admin"} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>
                    {ann.sender?.name || "Admin"}
                    <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: "#a78bfa", background: "rgba(124,58,237,0.12)", borderRadius: 6, padding: "2px 7px" }}>
                      ADMIN
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>{fmtDate(ann.createdAt)}</div>
                </div>

                {/* Delete (admin only) */}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(ann._id)}
                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 13, opacity: 0.7, padding: "4px 8px", borderRadius: 6 }}
                    title="Delete announcement"
                  >
                    🗑
                  </button>
                )}
              </div>

              {/* Message text */}
              <p style={{ margin: "0 0 0", color: t.textPrimary, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {ann.text}
              </p>

              {/* Optional link button */}
              {ann.link && (
                <a
                  href={ann.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14,
                    background: "rgba(124,58,237,0.12)", border: "1.5px solid rgba(124,58,237,0.3)",
                    color: "#a78bfa", borderRadius: 9, padding: "8px 16px",
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                  }}
                >
                  🔗 {ann.linkLabel || "Open Link"}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseAnnouncementsPanel;
