import React, { useState, useEffect } from "react";
import client from "../api/client";
import { useThemeStore } from "../stores/themeStore";

interface Post {
  _id: string;
  programId: string;
  title?: string;
  content: string;
  type: "announcement" | "live_class";
  scheduledAt?: string;
  links: { label: string; url: string }[];
  createdAt: string;
}

type Filter = "all" | "live_class" | "announcement";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-IN", {
    weekday: "long", day: "2-digit", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const timeFromNow = (s: string) => {
  const diff = new Date(s).getTime() - Date.now();
  if (diff < 0) return "passed";
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "in less than 1 hour";
  if (h < 24) return `in ${h} hour${h > 1 ? "s" : ""}`;
  const d = Math.floor(h / 24);
  return `in ${d} day${d > 1 ? "s" : ""}`;
};

function LiveClassCard({ post, accent, accentRgb }: { post: Post; accent: string; accentRgb: string }) {
  const { t } = useThemeStore();
  const upcoming = post.scheduledAt ? new Date(post.scheduledAt) > new Date() : false;

  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(${accentRgb},0.12) 0%, rgba(${accentRgb},0.04) 100%)`,
      border: `1.5px solid rgba(${accentRgb},0.45)`,
      borderRadius: 16,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: `radial-gradient(circle, rgba(${accentRgb},0.18) 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: upcoming ? "#ef4444" : "#6b7280", display: "inline-block", boxShadow: upcoming ? "0 0 8px #ef4444" : "none", animation: upcoming ? "pulse 2s infinite" : "none" }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: upcoming ? "#f87171" : t.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>
          {upcoming ? "Live Class" : "Live Class (Ended)"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: t.textMuted }}>{fmtDate(post.createdAt)}</span>
      </div>

      {/* Scheduled time */}
      {post.scheduledAt && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: accent, fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
            📅 {fmtDateTime(post.scheduledAt)}
          </div>
          {upcoming && (
            <div style={{ color: t.textMuted, fontSize: 12 }}>
              Starts {timeFromNow(post.scheduledAt)}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      {post.title && (
        <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{post.title}</div>
      )}

      {/* Content */}
      {post.content && (
        <div style={{ color: t.textSecond, fontSize: 14, lineHeight: 1.7, marginBottom: post.links?.length ? 16 : 0, whiteSpace: "pre-wrap" }}>
          {post.content}
        </div>
      )}

      {/* Join links */}
      {post.links?.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {post.links.map((lk, i) => (
            <a key={i} href={lk.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 22px",
                background: upcoming ? `linear-gradient(135deg,${accent},${accent}cc)` : "rgba(255,255,255,0.08)",
                border: upcoming ? "none" : `1px solid ${t.border}`,
                borderRadius: 50, color: upcoming ? "#fff" : t.textMuted,
                fontSize: 14, fontWeight: 700, textDecoration: "none", cursor: "pointer",
                boxShadow: upcoming ? `0 6px 20px rgba(${accentRgb},0.35)` : "none",
                transition: "all 0.18s",
              }}>
              🎥 {lk.label || "Join Class"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ post, accentRgb }: { post: Post; accentRgb: string }) {
  const { t } = useThemeStore();
  const [expanded, setExpanded] = useState(false);
  const isLong = post.content.length > 220;

  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderLeft: `3px solid rgba(${accentRgb},0.5)`,
      borderRadius: 14,
      padding: "18px 22px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 50, background: `rgba(${accentRgb},0.1)`, border: `1px solid rgba(${accentRgb},0.25)`, color: `rgb(${accentRgb})`, letterSpacing: 0.6, textTransform: "uppercase" as const }}>
          📢 Announcement
        </span>
        <span style={{ marginLeft: "auto", color: t.textMuted, fontSize: 12 }}>{fmtDate(post.createdAt)}</span>
      </div>

      {post.title && (
        <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{post.title}</div>
      )}

      <div style={{ color: t.textSecond, fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: !isLong || expanded ? "none" : "88px" }}>
        {post.content}
      </div>

      {isLong && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", color: `rgb(${accentRgb})`, fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "4px 0", marginTop: 4 }}>
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}

      {post.links?.length > 0 && (
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {post.links.map((lk, i) => (
            <a key={i} href={lk.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `rgba(${accentRgb},0.1)`, border: `1px solid rgba(${accentRgb},0.3)`, borderRadius: 50, color: `rgb(${accentRgb})`, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              🔗 {lk.label || "Open Link"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProgramPostsBoard({ programId, accent = "#7c3aed" }: { programId: string; accent?: string }) {
  const { t, isDark } = useThemeStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const isIndigo = accent.startsWith("#6") || accent.startsWith("#4f");
  const accentRgb = isIndigo ? "99,102,241" : "124,58,237";

  useEffect(() => {
    client.get(`/courses/programs/${programId}/posts`)
      .then(r => setPosts((r.data as any).posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]);

  if (loading) return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,rgba(${accentRgb},0.6),transparent)`, borderRadius: 2, marginBottom: 24 }} />
      <div style={{ display: "flex", gap: 12 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 120, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );

  const livePosts = posts.filter(p => p.type === "live_class");
  const annPosts  = posts.filter(p => p.type === "announcement");
  const nextLive  = livePosts.find(p => p.scheduledAt && new Date(p.scheduledAt) > new Date());

  const visible = filter === "all" ? posts : filter === "live_class" ? livePosts : annPosts;

  return (
    <div style={{
      background: isDark
        ? `linear-gradient(180deg, rgba(${accentRgb},0.06) 0%, transparent 100%)`
        : `linear-gradient(180deg, rgba(${accentRgb},0.04) 0%, transparent 100%)`,
      borderTop: `1px solid rgba(${accentRgb},0.2)`,
      borderBottom: `1px solid rgba(${accentRgb},0.1)`,
      padding: "40px 24px 48px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(${accentRgb},0.15)`, border: `1.5px solid rgba(${accentRgb},0.35)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔐</div>
            <div>
              <div style={{ color: t.textPrimary, fontWeight: 900, fontSize: 20, letterSpacing: -0.4 }}>Member Area</div>
              <div style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>Live classes, links & updates — exclusive to enrolled members</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 700 }}>You're enrolled</span>
          </div>
        </div>

        {/* Next live class hero card */}
        {nextLive && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              🔴 Upcoming Live Class
            </div>
            <LiveClassCard post={nextLive} accent={accent} accentRgb={accentRgb} />
          </div>
        )}

        {/* Stats row */}
        {posts.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            {[
              { label: "Total Posts", value: posts.length, color: t.textPrimary },
              { label: "Live Classes", value: livePosts.length, color: accent },
              { label: "Announcements", value: annPosts.length, color: t.textMuted },
            ].map(s => (
              <div key={s.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 20px", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ color: s.color, fontWeight: 900, fontSize: 22 }}>{s.value}</div>
                <div style={{ color: t.textMuted, fontSize: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {([["all", "All Updates"], ["live_class", "🔴 Live Classes"], ["announcement", "📢 Announcements"]] as const).map(([val, lbl]) => {
            const count = val === "all" ? posts.length : val === "live_class" ? livePosts.length : annPosts.length;
            return (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: "7px 16px", borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", border: `1.5px solid ${filter === val ? accent : t.border}`, background: filter === val ? `rgba(${accentRgb},0.15)` : "transparent", color: filter === val ? accent : t.textMuted }}>
                {lbl} ({count})
              </button>
            );
          })}
        </div>

        {/* Posts feed */}
        {visible.length === 0 ? (
          <div style={{ padding: "40px 24px", background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ color: t.textPrimary, fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No {filter === "all" ? "posts" : filter === "live_class" ? "live classes" : "announcements"} yet</div>
            <div style={{ color: t.textMuted, fontSize: 13 }}>Check back soon — your trainer will post updates here.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {visible.map(post => post.type === "live_class"
              ? <LiveClassCard key={post._id} post={post} accent={accent} accentRgb={accentRgb} />
              : <AnnouncementCard key={post._id} post={post} accentRgb={accentRgb} />
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
