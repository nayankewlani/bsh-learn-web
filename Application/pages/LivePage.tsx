import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import LiveClassRoom from "../components/live/LiveClassRoom";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import client from "../api/client";

interface LiveClass {
  _id: string;
  title: string;
  description?: string;
  educator: { _id: string; name: string; avatar?: string };
  course?: { _id: string; title: string } | string;
  scheduledAt: string;
  duration: number;
  status: string;
  enrolledStudents: string[];
}

interface ActiveRoom {
  appId: string;
  channel: string;
  token: string;
  uid: number;
  role: "host" | "audience";
  classId: string;
  title: string;
  oneToOne?: boolean;
}

const LivePage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [myClasses, setMyClasses] = useState<LiveClass[]>([]);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [waitingRoom, setWaitingRoom] = useState<{ classId: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "free" | "course">("all");
  const [liveMode, setLiveMode] = useState<"sessions" | "course" | "free">("sessions");
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myStudentBookings, setMyStudentBookings] = useState<any[]>([]);
  const [livePermission, setLivePermission] = useState<any>(null);
  const [permReason, setPermReason] = useState("");
  const [permLoading, setPermLoading] = useState(false);
  const activeRoomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [scheduled, live] = await Promise.all([
        client.get("/live-classes?status=scheduled"),
        client.get("/live-classes?status=live"),
      ]);
      const all: LiveClass[] = [...live.data.classes, ...scheduled.data.classes];
      setClasses(all);

      if (user?.role === "educator" || user?.role === "admin") {
        const mine = all.filter((c) => {
          const eduId = typeof c.educator === "object" ? c.educator._id : c.educator;
          return eduId === user._id;
        });
        setMyClasses(mine);
      }
      setLoading(false);

      // Auto-start if navigated here with autoStart state
      const autoStartId = (location.state as { autoStart?: string })?.autoStart;
      if (autoStartId) {
        const cls = all.find((c) => c._id === autoStartId);
        if (cls) startClass(autoStartId, cls.title);
        // Clear state so refresh doesn't re-trigger
        window.history.replaceState({}, "");
      }
    };
    fetchAll().catch(() => setLoading(false));

    if (user?.role === "educator") {
      client.get("/session-bookings/for-me").then(r => setMyBookings(r.data.bookings || [])).catch(() => {});
      client.get("/educator/live-permission-status").then(r => setLivePermission(r.data.permission)).catch(() => {});
    }
    if (user && user.role !== "educator" && user.role !== "admin") {
      client.get("/session-bookings/my").then(r => setMyStudentBookings(r.data.bookings || [])).catch(() => {});
    }
  }, [user]);

  const startClass = async (classId: string, title: string) => {
    setJoiningId(classId);
    try {
      const { data } = await client.post(`/live-classes/${classId}/start`);
      setClasses((prev) => prev.map((c) => c._id === classId ? { ...c, status: "live" } : c));
      setMyClasses((prev) => prev.map((c) => c._id === classId ? { ...c, status: "live" } : c));
      setActiveRoom({ appId: data.appId, channel: data.channel, token: data.token, uid: data.uid, role: "host", classId, title });
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to start");
    } finally {
      setJoiningId(null);
    }
  };

  const joinClass = async (classId: string, title: string) => {
    if (!user) { navigate("/login"); return; }
    setJoiningId(classId);
    try {
      const { data } = await client.post(`/live-classes/${classId}/join`);
      if (data.waiting) {
        setWaitingRoom({ classId, title });
        setJoiningId(null);
        return;
      }
      setActiveRoom({ appId: data.appId, channel: data.channel, token: data.token, uid: data.uid, role: "audience", classId, title, oneToOne: !!data.canPublish });
      setJoiningId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to join";
      alert(msg);
      setJoiningId(null);
    }
  };

  // Host enabled a waiting room — poll until admitted, then connect automatically.
  useEffect(() => {
    if (!waitingRoom) return;
    const poll = setInterval(async () => {
      try {
        const { data } = await client.get(`/live-classes/${waitingRoom.classId}/state`);
        if (data.amIAdmitted) {
          clearInterval(poll);
          const { data: conn } = await client.post(`/live-classes/${waitingRoom.classId}/join`);
          setActiveRoom({ appId: conn.appId, channel: conn.channel, token: conn.token, uid: conn.uid, role: "audience", classId: waitingRoom.classId, title: waitingRoom.title, oneToOne: !!conn.canPublish });
          setWaitingRoom(null);
        }
      } catch { /* keep polling */ }
    }, 3000);
    return () => clearInterval(poll);
  }, [waitingRoom]);

  const endClass = async (classId: string) => {
    if (!window.confirm("End this live class?")) return;
    setEndingId(classId);
    try {
      await client.post(`/live-classes/${classId}/end`);
      setClasses((prev) => prev.filter((c) => c._id !== classId));
      setMyClasses((prev) => prev.filter((c) => c._id !== classId));
      if (activeRoom?.classId === classId) setActiveRoom(null);
    } finally {
      setEndingId(null);
    }
  };

  // Scroll into view when room becomes active
  useEffect(() => {
    if (activeRoom) {
      setTimeout(() => activeRoomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [activeRoom]);

  const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const badgeAlpha = (hex: string) => hex + "22";

  const isEducator = user?.role === "educator" || user?.role === "admin";
  const isOwner = (cls: LiveClass) => {
    const eduId = typeof cls.educator === "object" ? cls.educator._id : cls.educator;
    return eduId === user?._id;
  };

  const now = new Date();
  const filteredClasses = classes.filter((c) => {
    if (isOwner(c)) return false;
    // Drop scheduled classes whose time has already passed (stale/test data)
    if (c.status === "scheduled" && new Date(c.scheduledAt) <= now) return false;
    if (filter === "free") return !c.course;
    if (filter === "course") return !!c.course;
    return true;
  });

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: t.textPrimary }}>Live Classes</h1>
          <p style={{ margin: 0, color: t.textSecond, fontSize: 14 }}>Join live sessions from educators</p>
        </div>

        {/* ── Student: 1:1 Sessions ── */}
        {!isEducator && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: t.textPrimary }}>My 1:1 Sessions</h2>
                <p style={{ margin: "4px 0 0", color: t.textSecond, fontSize: 13 }}>Private healing sessions booked with a therapist</p>
              </div>
              <button
                onClick={() => navigate("/consultation")}
                style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "10px 22px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 16px rgba(124,58,237,0.35)", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "none")}
              >
                + Book a 1:1 Session
              </button>
            </div>

            {myStudentBookings.length === 0 ? (
              <div style={{ background: t.bgCard, border: `1.5px dashed ${t.borderLight}`, borderRadius: 18, padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                <div style={{ color: t.textPrimary, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No 1:1 sessions booked yet</div>
                <p style={{ color: t.textSecond, fontSize: 14, margin: "0 0 20px", maxWidth: 380, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                  Book a private session with one of our certified healers — hypnotherapy, Reiki, shadow work, NLP coaching and more.
                </p>
                <button
                  onClick={() => navigate("/consultation")}
                  style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 6px 20px rgba(124,58,237,0.38)" }}
                >
                  Browse Healers & Book →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myStudentBookings.map((b: any) => {
                  const statusColor: Record<string, string> = {
                    paid: "#f59e0b", admin_approved: "#7c3aed", confirmed: "#16a34a",
                    completed: "#6b7280", rejected: "#ef4444", pending: "#9ca3af",
                  };
                  const statusLabel: Record<string, string> = {
                    paid: "⏳ Awaiting Confirmation", admin_approved: "✅ Approved — Time Pending",
                    confirmed: "🗓 Confirmed", completed: "✓ Completed",
                    rejected: "❌ Cancelled", pending: "Draft",
                  };
                  const color = statusColor[b.status] ?? "#9ca3af";
                  return (
                    <div key={b._id} style={{ background: t.bgCard, border: `1.5px solid ${color}33`, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      {/* Color stripe */}
                      <div style={{ width: 4, alignSelf: "stretch", background: color, borderRadius: 4, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 20, padding: "2px 10px" }}>
                            {statusLabel[b.status] ?? b.status}
                          </span>
                        </div>
                        <div style={{ color: t.textPrimary, fontSize: 15, fontWeight: 700 }}>
                          Session with {b.educator?.name ?? "Healer"}
                        </div>
                        {b.confirmedSlot?.datetime && (
                          <div style={{ color: t.textSecond, fontSize: 13, marginTop: 4 }}>
                            🗓 {new Date(b.confirmedSlot.datetime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                            {" · "}{b.confirmedSlot.duration ?? 60} min
                          </div>
                        )}
                        {b.clientNote && (
                          <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>"{b.clientNote}"</div>
                        )}
                      </div>
                      {b.status === "confirmed" && b.liveClassId && (
                        <button
                          onClick={() => joinClass(b.liveClassId, `1:1 with ${b.educator?.name}`)}
                          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "none", color: "#fff", padding: "9px 18px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}
                        >
                          Join Session →
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Educator: 3-mode Go Live panel */}
        {isEducator && (
          <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 20, padding: 24, marginBottom: 32 }}>
            <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 800, color: t.textPrimary }}>Go Live</h2>

            {/* Mode tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
              {([
                { key: "sessions", label: "🤝 1:1 Sessions", badge: myBookings.filter(b => b.status === "admin_approved").length },
                { key: "course",   label: "🎓 Course Live",  badge: 0 },
                { key: "free",     label: "🌍 Free Live",    badge: 0 },
              ] as const).map((m) => (
                <button key={m.key} onClick={() => setLiveMode(m.key)}
                  style={{ padding: "8px 18px", borderRadius: 20, border: `1.5px solid ${liveMode === m.key ? t.accent : t.border}`, background: liveMode === m.key ? "rgba(124,58,237,0.12)" : "transparent", color: liveMode === m.key ? t.accent : t.textSecond, fontWeight: liveMode === m.key ? 700 : 500, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {m.label}
                  {m.badge > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{m.badge}</span>}
                </button>
              ))}
            </div>

            {/* 1:1 Sessions mode */}
            {liveMode === "sessions" && (
              <div>
                <p style={{ margin: "0 0 14px", color: t.textSecond, fontSize: 13 }}>Sessions paid by clients and approved by admin for your 1:1 meetings.</p>
                {myBookings.filter(b => b.status === "admin_approved").length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0", color: t.textSecond, fontSize: 14 }}>
                    No approved 1:1 sessions yet. Once a client books and admin approves, it appears here.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {myBookings.filter(b => b.status === "admin_approved").map((b: any) => (
                      <div key={b._id} style={{ background: t.bgPrimary, borderRadius: 12, padding: "14px 16px", border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 14 }}>{b.client?.name}</div>
                          <div style={{ color: t.textSecond, fontSize: 12, marginTop: 2 }}>
                            {b.confirmedSlot?.datetime ? `Scheduled: ${new Date(b.confirmedSlot.datetime).toLocaleString()}` : "Time pending"}
                            {" · "}{b.confirmedSlot?.duration || 60} min
                          </div>
                        </div>
                        {b.liveClassId && (
                          <Button size="sm" onClick={() => startClass(b.liveClassId, `1:1 with ${b.client?.name}`)}>
                            Start Session
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 16, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
                  <p style={{ margin: "0 0 8px", color: t.textSecond, fontSize: 12 }}>Paid bookings waiting for your time proposal:</p>
                  {myBookings.filter(b => b.status === "paid").length === 0 ? (
                    <span style={{ color: t.textSecond, fontSize: 13 }}>None pending</span>
                  ) : myBookings.filter(b => b.status === "paid").map((b: any) => (
                    <div key={b._id} style={{ background: t.bgPrimary, borderRadius: 10, padding: "10px 14px", border: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 600, color: t.textPrimary, fontSize: 13 }}>{b.client?.name}</span>
                        <span style={{ color: t.textSecond, fontSize: 12, marginLeft: 8 }}>{b.clientNote || "No note"}</span>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/sessions/${b._id}/propose`)}>Propose Time</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Live mode */}
            {liveMode === "course" && (
              <div>
                <p style={{ margin: "0 0 14px", color: t.textSecond, fontSize: 13 }}>Start a live session for courses you are appointed to by admin.</p>
                <Button onClick={() => navigate("/live/schedule?type=course")}>
                  Schedule Course Live Class
                </Button>
                {myClasses.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 13, marginBottom: 8 }}>My Scheduled Classes</div>
                    {myClasses.filter(c => c.status !== "live").map(cls => (
                      <div key={cls._id} style={{ background: t.bgPrimary, borderRadius: 10, padding: "10px 14px", border: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, color: t.textPrimary, fontSize: 13 }}>{cls.title}</div>
                          <div style={{ color: t.textSecond, fontSize: 11 }}>{fmtDate(cls.scheduledAt)} · {cls.status}</div>
                        </div>
                        {cls.status === "scheduled" && <Button size="sm" onClick={() => startClass(cls._id, cls.title)} loading={joiningId === cls._id}>Go Live</Button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Free Live mode */}
            {liveMode === "free" && (
              <div>
                <p style={{ margin: "0 0 14px", color: t.textSecond, fontSize: 13 }}>Free live sessions require admin approval each time. Once approved, permission is valid for 4 hours.</p>
                {livePermission?.status === "approved" && new Date(livePermission.expiresAt) > new Date() ? (
                  <div>
                    <div style={{ background: "rgba(22,163,74,0.1)", border: "1.5px solid rgba(22,163,74,0.3)", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                      <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 14 }}>Permission Granted!</div>
                      <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>Valid until {new Date(livePermission.expiresAt).toLocaleTimeString()}. Go live now or schedule a class.</div>
                    </div>
                    <Button onClick={() => navigate("/live/schedule?type=free")}>Schedule Free Live Now</Button>
                  </div>
                ) : livePermission?.status === "pending" ? (
                  <div style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, color: "#d97706", fontSize: 14 }}>Request Pending Review</div>
                    <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>Admin has been notified. You'll receive a notification once approved.</div>
                  </div>
                ) : (
                  <div>
                    {livePermission?.status === "rejected" && (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, color: "#dc2626", fontSize: 13 }}>
                        Previous request was declined. You can submit a new request.
                      </div>
                    )}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: t.textSecond, display: "block", marginBottom: 6 }}>Reason for going live (optional)</label>
                      <input value={permReason} onChange={e => setPermReason(e.target.value)}
                        placeholder="e.g. Demo session for new students"
                        style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${t.border}`, borderRadius: 10, fontSize: 14, background: t.bgPrimary, color: t.textPrimary, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <Button loading={permLoading} onClick={async () => {
                      setPermLoading(true);
                      try {
                        const { data } = await client.post("/educator/request-live-permission", { reason: permReason });
                        setLivePermission(data.permission);
                        alert("Request submitted! Admin will review shortly.");
                      } catch (err: any) {
                        alert(err.response?.data?.message || "Failed to submit request");
                      } finally { setPermLoading(false); }
                    }}>
                      Request Permission to Go Live
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
          {([ ["all", "All Sessions"], ["free", "🌍 Free"], ["course", "🔒 Course Only"] ] as const).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${filter === key ? t.accent : t.border}`, background: filter === key ? `rgba(124,58,237,0.12)` : "none", color: filter === key ? t.accent : t.textSecond, fontSize: 13, fontWeight: filter === key ? 700 : 500, cursor: "pointer", transition: "all .15s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Active room */}
        {activeRoom && (
          <div ref={activeRoomRef} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ margin: 0, color: "#f3f4f6", fontSize: 17, fontWeight: 700 }}>{activeRoom.title}</h2>
              {activeRoom.role === "host" && (
                <Button variant="secondary" size="sm" onClick={() => endClass(activeRoom.classId)} loading={endingId === activeRoom.classId}>
                  End Class
                </Button>
              )}
            </div>
            <LiveClassRoom
              appId={activeRoom.appId}
              channel={activeRoom.channel}
              token={activeRoom.token}
              uid={activeRoom.uid}
              role={activeRoom.role}
              classId={activeRoom.classId}
              oneToOne={activeRoom.oneToOne}
              onLeave={() => setActiveRoom(null)}
            />
          </div>
        )}

        {/* Waiting room */}
        {waitingRoom && !activeRoom && (
          <div style={{ marginBottom: 32, textAlign: "center", padding: "40px 20px", borderRadius: 12, border: `1px solid ${t.border}`, background: t.bgCard }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>⏳</div>
            <h2 style={{ margin: "0 0 6px", color: t.textPrimary, fontSize: 17, fontWeight: 700 }}>Waiting for the host</h2>
            <p style={{ margin: "0 0 14px", color: t.textSecond, fontSize: 13 }}>
              The host has enabled a waiting room for "{waitingRoom.title}". You'll be let in automatically once they admit you.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setWaitingRoom(null)}>Cancel</Button>
          </div>
        )}

        {/* Educator: My Classes */}
        {isEducator && myClasses.length > 0 && !activeRoom && (
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800, color: t.textPrimary }}>My Classes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myClasses.map((cls) => (
                <div key={cls._id} style={{ background: t.bgCard, border: `1px solid ${cls.status === "live" ? "#ef4444" : t.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <Badge color={cls.status === "live" ? "red" : cls.status === "pending_approval" ? "orange" : cls.status === "rejected" ? "red" : "orange"}>
                        {cls.status === "live" ? "🔴 LIVE NOW" : cls.status === "pending_approval" ? "⏳ Awaiting Approval" : cls.status === "rejected" ? "❌ Rejected" : "⏰ Scheduled"}
                      </Badge>
                      {cls.course ? (
                        <Badge color="purple">🔒 Course Only</Badge>
                      ) : (
                        <Badge color="green">🌍 Free for All</Badge>
                      )}
                    </div>
                    <div style={{ color: t.textPrimary, fontSize: 15, fontWeight: 700 }}>{cls.title}</div>
                    <div style={{ color: t.textSecond, fontSize: 12, marginTop: 4 }}>
                      {cls.status === "live" ? `${cls.enrolledStudents.length} joined` : fmtDate(cls.scheduledAt)} · {cls.duration} min
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {cls.status === "live" ? (
                      <>
                        <Button size="sm" onClick={() => startClass(cls._id, cls.title)} loading={joiningId === cls._id}>Re-enter Room</Button>
                        <Button size="sm" variant="danger" onClick={() => endClass(cls._id)} loading={endingId === cls._id}>End</Button>
                      </>
                    ) : cls.status === "pending_approval" ? (
                      <div style={{ fontSize: 12, color: "#f59e0b", padding: "6px 10px", background: "rgba(245,158,11,.1)", borderRadius: 8, textAlign: "center" }}>
                        Waiting for admin approval
                      </div>
                    ) : cls.status === "rejected" ? (
                      <div style={{ fontSize: 12, color: "#ef4444", padding: "6px 10px", background: "rgba(239,68,68,.1)", borderRadius: 8, textAlign: "center" }}>
                        Rejected by admin
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => startClass(cls._id, cls.title)} loading={joiningId === cls._id}>Start Now</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All classes */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: t.accent }}>Loading classes...</div>
        ) : filteredClasses.length === 0 && !activeRoom ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📡</div>
            <h2 style={{ color: t.textPrimary, marginBottom: 8 }}>No {filter !== "all" ? (filter === "free" ? "free " : "course-only ") : ""}live classes right now</h2>
            <p style={{ color: t.textSecond }}>Check back soon, or{isEducator ? " start your own above." : " an educator will schedule one."}</p>
          </div>
        ) : (
          <>
            {filteredClasses.length > 0 && (
              <div>
                <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 800, color: t.textPrimary }}>
                  {filteredClasses.some((c) => c.status === "live") ? "Live Now & Upcoming" : "Upcoming Classes"}
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 20 }}>
                  {filteredClasses.map((cls) => {
                    const courseLinked = !!cls.course;
                    return (
                      <div key={cls._id} style={{ background: t.bgCard, border: `1px solid ${cls.status === "live" ? "#7f1d1d" : t.border}`, borderRadius: 16, padding: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <Badge color={cls.status === "live" ? "red" : "purple"}>
                              {cls.status === "live" ? "🔴 LIVE" : "Scheduled"}
                            </Badge>
                            {courseLinked ? (
                              <Badge color="orange">🔒 Enrolled Only</Badge>
                            ) : (
                              <Badge color="green">🌍 Free</Badge>
                            )}
                          </div>
                          <span style={{ color: t.textSecond, fontSize: 12 }}>{cls.duration} min</span>
                        </div>
                        <h3 style={{ color: t.textPrimary, fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{cls.title}</h3>
                        {cls.description && <p style={{ color: t.textSecond, fontSize: 13, margin: "0 0 10px" }}>{cls.description}</p>}
                        {typeof cls.educator === "object" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Avatar src={cls.educator.avatar} name={cls.educator.name} size={22} />
                            <span style={{ color: t.textAccent, fontSize: 13 }}>{cls.educator.name}</span>
                          </div>
                        )}
                        <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 14 }}>🗓 {fmtDate(cls.scheduledAt)}</div>
                        {cls.status === "live" ? (
                          <Button fullWidth size="sm" onClick={() => joinClass(cls._id, cls.title)} loading={joiningId === cls._id}>
                            Join Now →
                          </Button>
                        ) : (
                          <div style={{ color: t.textMuted, fontSize: 13, textAlign: "center", padding: "8px 0", background: t.bgNav, borderRadius: 8 }}>
                            Starts {fmtDate(cls.scheduledAt)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LivePage;
