import React, { useState, useEffect } from "react";
import client from "../../api/client";
import { useThemeStore } from "../../stores/themeStore";

const PROGRAMS = [
  { id: "advance-hypnosis", label: "Advanced Hypnosis Diploma" },
  { id: "hypnosis-2",       label: "Hypnosis 2.0 — Live Subscription" },
  { id: "reiki",            label: "Reiki" },
  { id: "akashic-records",  label: "Akashic Records" },
  { id: "shadow-work",      label: "Art of Shadow Work" },
  { id: "vedic-astrology",  label: "Vedic Astrology" },
];

interface Link { label: string; url: string; }
interface Post {
  _id: string; programId: string; title?: string; content: string;
  type: "announcement" | "live_class"; scheduledAt?: string;
  links: Link[]; isActive: boolean; createdAt: string;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminProgramPosts() {
  const { t } = useThemeStore();
  const [programId, setProgramId] = useState(PROGRAMS[0].id);
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Form state
  const [type, setType]             = useState<"announcement" | "live_class">("announcement");
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [links, setLinks]           = useState<Link[]>([{ label: "", url: "" }]);
  const [posting, setPosting]       = useState(false);
  const [postError, setPostError]   = useState("");
  const [postOk, setPostOk]         = useState(false);

  const load = async (pid: string) => {
    setLoadingPosts(true);
    try {
      const r = await client.get(`/admin/programs/${pid}/posts`);
      setPosts((r.data as any).posts || []);
    } catch { setPosts([]); }
    finally { setLoadingPosts(false); }
  };

  useEffect(() => { load(programId); }, [programId]);

  const handleAddLink = () => setLinks(l => [...l, { label: "", url: "" }]);
  const handleLinkChange = (i: number, field: "label" | "url", val: string) => {
    setLinks(l => l.map((lk, idx) => idx === i ? { ...lk, [field]: val } : lk));
  };
  const handleRemoveLink = (i: number) => setLinks(l => l.filter((_, idx) => idx !== i));

  const handlePost = async () => {
    if (!content.trim()) { setPostError("Message content is required"); return; }
    setPosting(true); setPostError(""); setPostOk(false);
    try {
      const validLinks = links.filter(l => l.url.trim());
      await client.post(`/admin/programs/${programId}/posts`, {
        title: title.trim() || undefined,
        content: content.trim(),
        type,
        scheduledAt: scheduledAt || undefined,
        links: validLinks,
      });
      setPostOk(true);
      setTitle(""); setContent(""); setScheduledAt("");
      setLinks([{ label: "", url: "" }]); setType("announcement");
      await load(programId);
      setTimeout(() => setPostOk(false), 3000);
    } catch (e: any) {
      setPostError(e?.response?.data?.message || "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await client.delete(`/admin/programs/${programId}/posts/${id}`);
      setPosts(p => p.filter(x => x._id !== id));
    } catch {}
  };

  const S = {
    card: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 } as React.CSSProperties,
    label: { fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 6, display: "block" },
    input: { width: "100%", background: t.bgPrimary, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", color: t.textPrimary, fontSize: 14, boxSizing: "border-box" as const },
    textarea: { width: "100%", background: t.bgPrimary, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", color: t.textPrimary, fontSize: 14, boxSizing: "border-box" as const, resize: "vertical" as const, minHeight: 120 },
  };

  const progLabel = PROGRAMS.find(p => p.id === programId)?.label ?? programId;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: t.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 }}>Program Updates</h1>
        <p style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>
          Post announcements and live-class links visible only to enrolled members.
        </p>
      </div>

      {/* Program selector */}
      <div style={S.card}>
        <label style={S.label}>Select Program</label>
        <select
          value={programId}
          onChange={e => setProgramId(e.target.value)}
          style={{ ...S.input, cursor: "pointer" }}
        >
          {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {/* Compose */}
      <div style={S.card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 16 }}>
          New Post → {progLabel}
        </div>

        {/* Type */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {([["announcement","📢 Announcement"],["live_class","🔴 Live Class"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => setType(val)}
              style={{ padding: "8px 18px", borderRadius: 50, fontSize: 13, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${type === val ? "#7c3aed" : t.border}`, background: type === val ? "rgba(124,58,237,0.15)" : "transparent", color: type === val ? "#a78bfa" : t.textMuted, transition: "all 0.15s" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Scheduled at — only for live class */}
        {type === "live_class" && (
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Scheduled Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={S.input} />
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Title <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
          <input placeholder="e.g. Saturday Live Session – Advanced Inductions" value={title} onChange={e => setTitle(e.target.value)} style={S.input} />
        </div>

        {/* Content */}
        <div style={{ marginBottom: 14 }}>
          <label style={S.label}>Message <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea
            placeholder={type === "live_class"
              ? "Session details, what to prepare, dress code, etc."
              : "Write your announcement here…"}
            value={content}
            onChange={e => setContent(e.target.value)}
            style={S.textarea}
          />
        </div>

        {/* Links */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Links <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
            <button onClick={handleAddLink} style={{ fontSize: 12, color: "#7c3aed", background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}>+ Add Link</button>
          </div>
          {links.map((lk, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input placeholder="Label (e.g. Join Zoom)" value={lk.label} onChange={e => handleLinkChange(i, "label", e.target.value)} style={{ ...S.input, margin: 0 }} />
              <input placeholder="URL (https://…)" value={lk.url} onChange={e => handleLinkChange(i, "url", e.target.value)} style={{ ...S.input, margin: 0 }} />
              {links.length > 1 && (
                <button onClick={() => handleRemoveLink(i)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</button>
              )}
            </div>
          ))}
        </div>

        {postError && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 13, marginBottom: 14 }}>{postError}</div>}
        {postOk    && <div style={{ padding: "10px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, color: "#4ade80", fontSize: 13, marginBottom: 14 }}>✓ Posted successfully</div>}

        <button onClick={handlePost} disabled={posting} style={{ padding: "12px 28px", background: posting ? "#4c1d95" : "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: posting ? "not-allowed" : "pointer", opacity: posting ? 0.7 : 1 }}>
          {posting ? "Posting…" : "⬆ Post Update"}
        </button>
      </div>

      {/* Posted items */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {loadingPosts ? "Loading…" : `${posts.length} post${posts.length !== 1 ? "s" : ""} for ${progLabel}`}
        </div>

        {!loadingPosts && posts.length === 0 && (
          <div style={{ padding: "24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, color: t.textMuted, fontSize: 14, textAlign: "center" }}>
            No posts yet for this program.
          </div>
        )}

        {posts.map(post => (
          <div key={post._id} style={{ background: t.bgCard, border: `1px solid ${post.type === "live_class" ? "rgba(124,58,237,0.4)" : t.border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 50, background: post.type === "live_class" ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.06)", border: `1px solid ${post.type === "live_class" ? "rgba(124,58,237,0.4)" : t.border}`, color: post.type === "live_class" ? "#a78bfa" : t.textMuted }}>
                    {post.type === "live_class" ? "🔴 LIVE CLASS" : "📢 ANNOUNCEMENT"}
                  </span>
                  <span style={{ color: t.textMuted, fontSize: 11 }}>{fmtDate(post.createdAt)}</span>
                  {!post.isActive && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>DELETED</span>}
                </div>
                {post.scheduledAt && <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>📅 {fmtDate(post.scheduledAt)}</div>}
                {post.title && <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{post.title}</div>}
                <div style={{ color: t.textSecond, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 100, overflow: "hidden", textOverflow: "ellipsis" }}>{post.content}</div>
                {post.links?.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {post.links.map((lk, i) => (
                      <a key={i} href={lk.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "underline" }}>{lk.label || lk.url}</a>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(post._id)} style={{ padding: "6px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
