import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import client from "../api/client";
import ChatPanel from "../components/ChatPanel";

interface Analytics {
  totalStudents: number;
  totalRevenuePaise: number;
  totalLiveClasses: number;
}

interface SessionBooking {
  _id: string;
  client: { _id: string; name: string; email: string };
  amount: number;
  status: string;
  clientNote?: string;
  proposedSlots: { datetime: string; duration: number }[];
  confirmedSlot?: { datetime: string; duration: number };
  liveClassId?: string;
  createdAt: string;
}

interface ConsultationBooking {
  _id: string;
  client: { _id: string; name: string; email: string; phone?: string };
  trainerName: string;
  sessions: number;
  bonusSessions: number;
  durationMins: number;
  ratePerMin: number;
  totalPaise: number;
  status: "paid" | "scheduled" | "completed" | "cancelled";
  clientNote?: string;
  preferredTime?: string;
  liveClassId?: { _id: string; status: string; agoraChannel: string; scheduledAt: string } | null;
  createdAt: string;
}

interface Payout {
  _id: string;
  course: { _id: string; title: string };
  student: { name: string; email: string };
  totalPaise: number;
  gstPaise: number;
  netPaise: number;
  trainerSharePaise: number;
  status: "pending" | "paid";
  paidAt?: string;
  paymentNote?: string;
  createdAt: string;
}

const fmt = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EducatorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Earnings state
  const [activeTab, setActiveTab] = useState<"earnings" | "sessions" | "applications" | "messages" | "consultations">("consultations");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [earningsTab, setEarningsTab] = useState<"pending" | "paid">("pending");
  const [pendingTotal, setPendingTotal] = useState(0);
  const [paidTotal, setPaidTotal] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);

  // Sessions state
  const [sessionBookings, setSessionBookings] = useState<SessionBooking[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [proposingId, setProposingId] = useState<string | null>(null);
  const [proposedDate, setProposedDate] = useState("");
  const [proposedDuration, setProposedDuration] = useState(60);
  const [proposing, setProposing] = useState(false);

  // Consultation bookings (paid sessions via book-session flow)
  const [consultBookings, setConsultBookings] = useState<ConsultationBooking[]>([]);
  const [consultLoading, setConsultLoading] = useState(false);
  const [requestingLiveId, setRequestingLiveId] = useState<string | null>(null);

  // 1:1 Applications state
  interface MyApplication {
    _id: string; clientName: string; clientPhone: string; clientEmail: string;
    issue: string; preferredTime?: string; message?: string;
    status: string; proposedSchedule?: string; agoraChannel?: string; createdAt: string;
  }
  const [myApps, setMyApps]             = useState<MyApplication[]>([]);
  const [appsLoading, setAppsLoading]   = useState(false);
  const [proposingAppId, setProposingAppId] = useState<string | null>(null);
  const [startingAppId, setStartingAppId] = useState<string | null>(null);
  const [appSchedule, setAppSchedule]   = useState("");
  const [appNote, setAppNote]           = useState("");
  const [appSubmitting, setAppSubmitting] = useState(false);

  // Online status + messages
  const [isOnline, setIsOnline] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [openChat, setOpenChat] = useState<{ id: string; name: string; online: boolean } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadDashboard = () => {
    setLoading(true);
    setError("");
    client.get("/educator/analytics")
      .then(r => setAnalytics(r.data ?? null))
      .catch(() => setError("Failed to load dashboard. Please try again."))
      .finally(() => setLoading(false));
  };

  const loadEarnings = async () => {
    setEarningsLoading(true);
    try {
      const { data } = await client.get("/educator/earnings");
      setPayouts(data.payouts ?? []);
      setPendingTotal(data.pendingTotal ?? 0);
      setPaidTotal(data.paidTotal ?? 0);
    } finally {
      setEarningsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadConsultBookings();
    // Load initial online status from user object
    if ((user as any)?.isOnline) setIsOnline(true);
    // Load unread count
    client.get("/chat/unread-count").then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
    const countPoll = setInterval(() => {
      client.get("/chat/unread-count").then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
    }, 10000);
    return () => clearInterval(countPoll);
  }, []);

  const toggleOnline = async () => {
    setTogglingOnline(true);
    const next = !isOnline;
    try {
      await client.put("/educator/online-status", { isOnline: next });
      setIsOnline(next);
      if (next) {
        client.get("/chat/conversations").then(r => setConversations(r.data.conversations || [])).catch(() => {});
      }
    } catch {} finally { setTogglingOnline(false); }
  };

  const loadConversations = () => {
    setConvsLoading(true);
    client.get("/chat/conversations")
      .then(r => setConversations(r.data.conversations || []))
      .catch(() => {})
      .finally(() => setConvsLoading(false));
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { data } = await client.get("/session-bookings/for-me");
      setSessionBookings(data.bookings ?? []);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadConsultBookings = async () => {
    setConsultLoading(true);
    try {
      const { data } = await client.get("/consultation-bookings/for-trainer");
      setConsultBookings(data.bookings ?? []);
    } finally {
      setConsultLoading(false);
    }
  };

  const requestLiveClass = async (bookingId: string) => {
    setRequestingLiveId(bookingId);
    try {
      await client.post(`/consultation-bookings/${bookingId}/request-live`);
      await loadConsultBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to request live class");
    } finally {
      setRequestingLiveId(null);
    }
  };

  const loadMyApps = async () => {
    setAppsLoading(true);
    try {
      const { data } = await client.get("/session-applications/for-trainer");
      setMyApps(data.applications ?? []);
    } finally { setAppsLoading(false); }
  };

  const proposeAppSchedule = async (appId: string) => {
    if (!appSchedule.trim()) return;
    setAppSubmitting(true);
    try {
      await client.patch(`/session-applications/${appId}/propose`, {
        proposedSchedule: appSchedule.trim(), trainerNote: appNote.trim(),
      });
      setProposingAppId(null); setAppSchedule(""); setAppNote("");
      await loadMyApps();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to propose schedule");
    } finally { setAppSubmitting(false); }
  };

  // Approving an application used to just stamp a random channel string with no real
  // Agora token route behind it, so this button went nowhere. It now resolves (or lazily
  // creates, for applications approved before this fix) a real LiveClass and hands off
  // to the same /live page flow that already works for consultation-booking sessions.
  const startApplicationSession = async (appId: string) => {
    setStartingAppId(appId);
    try {
      const { data } = await client.post(`/session-applications/${appId}/live-class`);
      navigate("/live", { state: { autoStart: data.liveClassId } });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start live session");
    } finally { setStartingAppId(null); }
  };

  useEffect(() => {
    if (activeTab === "earnings") loadEarnings();
    if (activeTab === "sessions") loadSessions();
    if (activeTab === "applications") loadMyApps();
    if (activeTab === "messages") loadConversations();
    if (activeTab === "consultations") loadConsultBookings();
  }, [activeTab]);

  const proposeSlot = async (bookingId: string) => {
    if (!proposedDate) return;
    setProposing(true);
    try {
      await client.post(`/session-bookings/${bookingId}/propose`, {
        slots: [{ datetime: proposedDate, duration: proposedDuration }],
      });
      await client.post(`/session-bookings/${bookingId}/share`);
      setProposingId(null);
      setProposedDate("");
      setProposedDuration(60);
      await loadSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to propose slot");
    } finally {
      setProposing(false);
    }
  };

  const stats = analytics ? [
    { label: "Total Students", value: analytics.totalStudents.toLocaleString(), icon: "👥", color: "#FF6B8A" },
    { label: "My Income (Pending)", value: fmt(pendingTotal), icon: "💰", color: "#4ade80" },
    { label: "Live Classes", value: analytics.totalLiveClasses, icon: "🎥", color: "#f59e0b" },
  ] : [];

  const filteredPayouts = payouts.filter((p) => p.status === earningsTab);

  return (
    <div style={{ background: "#0D0D0D", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f3f4f6" }}>Educator Dashboard</h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>Hello, {user?.name}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Messages button */}
            <button onClick={() => { setActiveTab("messages"); loadConversations(); }}
              style={{ position: "relative", background: activeTab === "messages" ? "#FF1E56" : "#13122a", border: `1px solid ${activeTab === "messages" ? "#FF1E56" : "#222222"}`, borderRadius: 10, padding: "9px 16px", color: "#FF6B8A", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              💬 Messages
              {unreadCount > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            {/* Online/Offline toggle */}
            <button onClick={toggleOnline} disabled={togglingOnline}
              style={{ background: isOnline ? "rgba(34,197,94,0.12)" : "rgba(156,163,175,0.12)", border: `1.5px solid ${isOnline ? "#22c55e" : "#6b7280"}`, borderRadius: 10, padding: "9px 18px", color: isOnline ? "#22c55e" : "#9ca3af", fontWeight: 700, fontSize: 13, cursor: togglingOnline ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isOnline ? "#22c55e" : "#9ca3af", display: "inline-block", animation: isOnline ? "pulse 1.5s infinite" : "none" }} />
              {togglingOnline ? "Saving…" : isOnline ? "Online" : "Go Online"}
            </button>
            <Button variant="secondary" onClick={() => navigate("/")}>← Home</Button>
            <Button variant="secondary" onClick={() => navigate("/live/schedule")}>Schedule Live</Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#FF1E56" }}>Loading dashboard...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ color: "#f87171", marginBottom: 16 }}>{error}</div>
            <Button variant="secondary" onClick={loadDashboard}>Retry</Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 36 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tab switcher */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {([
                { key: "consultations", label: `💳 Paid Sessions${consultBookings.filter(b => b.status === "paid").length > 0 ? ` (${consultBookings.filter(b => b.status === "paid").length} new)` : consultBookings.length > 0 ? ` (${consultBookings.length})` : ""}` },
                { key: "applications", label: `✋ 1:1 Applications${myApps.filter(a => a.status === "pending").length > 0 ? ` (${myApps.filter(a => a.status === "pending").length} new)` : myApps.length > 0 ? ` (${myApps.length})` : ""}` },
                { key: "sessions",     label: `📅 1:1 Sessions${sessionBookings.filter(b => b.status === "paid").length > 0 ? ` (${sessionBookings.filter(b => b.status === "paid").length} need action)` : ""}` },
                { key: "messages",     label: `💬 Messages${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
                { key: "earnings",     label: "💰 My Earnings" },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "9px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                    cursor: "pointer", border: "none",
                    background: activeTab === key ? "#FF1E56" : "#13122a",
                    color: activeTab === key ? "#fff" : "#9ca3af",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Consultation Bookings tab — paid sessions booked via mobile book-session flow */}
            {activeTab === "consultations" && (
              <div>
                {consultLoading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#FF1E56" }}>Loading paid sessions…</div>
                ) : consultBookings.length === 0 ? (
                  <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
                    <p>No paid sessions yet. When a client books and pays for a session with you, it will appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {consultBookings.map(b => {
                      const statusColors: Record<string, string> = {
                        paid: "#3b82f6", scheduled: "#f59e0b",
                        completed: "#22c55e", cancelled: "#ef4444",
                      };
                      const color = statusColors[b.status] ?? "#6b7280";
                      const totalRs = Math.round(b.totalPaise / 100);
                      return (
                        <div key={b._id} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: "20px 22px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: "#f3f4f6", fontSize: 15 }}>
                                  {b.client?.name ?? "Client"}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}22`, color }}>
                                  {b.status.replace(/_/g, " ")}
                                </span>
                              </div>
                              <div style={{ color: "#9ca3af", fontSize: 12 }}>
                                {b.client?.email}
                                {b.client?.phone ? ` · ${b.client.phone}` : ""}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ color: "#4ade80", fontWeight: 800, fontSize: 18 }}>₹{totalRs.toLocaleString("en-IN")}</div>
                              <div style={{ color: "#6b7280", fontSize: 12 }}>
                                {b.sessions} session{b.sessions > 1 ? "s" : ""} × {b.durationMins} min
                                {b.bonusSessions > 0 && <span style={{ color: "#f59e0b" }}> + {b.bonusSessions} bonus</span>}
                              </div>
                              <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>
                                {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </div>
                            </div>
                          </div>

                          {(b.clientNote || b.preferredTime) && (
                            <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                              {b.preferredTime && (
                                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: b.clientNote ? 4 : 0 }}>
                                  Preferred time: <strong style={{ color: "#e2e8f0" }}>{b.preferredTime}</strong>
                                </div>
                              )}
                              {b.clientNote && (
                                <div style={{ fontSize: 13, color: "#cbd5e1" }}>{b.clientNote}</div>
                              )}
                            </div>
                          )}

                          {/* Status-specific actions */}
                          {b.status === "paid" && !b.liveClassId && (
                            <button
                              onClick={() => requestLiveClass(b._id)}
                              disabled={requestingLiveId === b._id}
                              style={{
                                width: "100%", padding: "11px", borderRadius: 10, border: "none",
                                background: requestingLiveId === b._id ? "#374151" : "linear-gradient(90deg,#FF1E56,#D4003F)",
                                color: "#fff", fontWeight: 700, fontSize: 14,
                                cursor: requestingLiveId === b._id ? "not-allowed" : "pointer",
                              }}
                            >
                              {requestingLiveId === b._id ? "Requesting…" : "📅 Schedule Live Session → Send to Admin"}
                            </button>
                          )}

                          {b.status === "scheduled" && b.liveClassId && (
                            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 2 }}>Live class requested — pending admin approval</div>
                                {b.liveClassId.scheduledAt && (
                                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                                    Scheduled: {new Date(b.liveClassId.scheduledAt).toLocaleString("en-IN")}
                                  </div>
                                )}
                              </div>
                              {b.liveClassId.status === "approved" && (
                                <button
                                  onClick={() => navigate("/live")}
                                  style={{ padding: "8px 18px", background: "#FF1E56", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                                >
                                  🔴 Go to Live Page
                                </button>
                              )}
                            </div>
                          )}

                          {b.status === "completed" && (
                            <div style={{ fontSize: 12, color: "#22c55e", background: "rgba(34,197,94,0.08)", padding: "8px 12px", borderRadius: 8 }}>
                              ✅ Session completed
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 1:1 Applications tab */}
            {activeTab === "applications" && (
              <div>
                {appsLoading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#FF1E56" }}>Loading applications…</div>
                ) : myApps.length === 0 ? (
                  <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✋</div>
                    <p>No 1:1 session applications yet. When customers apply from your consultation page, they'll appear here.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {myApps.map(a => {
                      const statusColor = a.status === "approved" ? "#22c55e" : a.status === "rejected" ? "#ef4444" : a.status === "trainer_proposed" ? "#f59e0b" : a.status === "completed" ? "#FF6B8A" : "#60a5fa";
                      const statusLabel = a.status === "trainer_proposed" ? "Awaiting Admin Approval" : a.status;
                      return (
                        <div key={a._id} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 20 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontWeight: 800, fontSize: 15, color: "#e2e8f0" }}>{a.clientName}</span>
                                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: `${statusColor}18`, color: statusColor }}>
                                  {statusLabel.replace("_", " ")}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>{a.clientPhone}{a.clientEmail ? ` · ${a.clientEmail}` : ""} · {new Date(a.createdAt).toLocaleDateString("en-IN")}</div>
                            </div>
                          </div>
                          <div style={{ background: "#0f172a", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>What they want to work on</div>
                            <div style={{ fontSize: 13, color: "#cbd5e1" }}>{a.issue}</div>
                            {a.preferredTime && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Preferred time: {a.preferredTime}</div>}
                            {a.message && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{a.message}</div>}
                          </div>
                          {a.status === "approved" && (
                            <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 6 }}>Session Approved — Ready to Start!</div>
                              <button
                                onClick={() => startApplicationSession(a._id)}
                                disabled={startingAppId === a._id}
                                style={{ background: startingAppId === a._id ? "#4b5563" : "linear-gradient(90deg,#FF1E56,#D4003F)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: startingAppId === a._id ? "not-allowed" : "pointer" }}>
                                {startingAppId === a._id ? "Starting…" : "🔴 Start Live Session"}
                              </button>
                            </div>
                          )}
                          {a.status === "trainer_proposed" && (
                            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ fontSize: 12, color: "#f59e0b" }}>Your proposed schedule: <strong>{a.proposedSchedule}</strong></div>
                              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Waiting for admin to approve. You'll see a "Start Live" button here once approved.</div>
                            </div>
                          )}
                          {a.status === "pending" && (
                            proposingAppId === a._id ? (
                              <div style={{ marginTop: 4 }}>
                                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>Propose your availability for this session</div>
                                <input
                                  value={appSchedule}
                                  onChange={e => setAppSchedule(e.target.value)}
                                  placeholder="e.g. Saturday 15 June, 5:00 PM – 6:00 PM IST"
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                                />
                                <input
                                  value={appNote}
                                  onChange={e => setAppNote(e.target.value)}
                                  placeholder="Note to admin (optional)"
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
                                />
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => proposeAppSchedule(a._id)} disabled={appSubmitting || !appSchedule.trim()}
                                    style={{ flex: 1, padding: "10px", background: "linear-gradient(90deg,#FF1E56,#D4003F)", border: "none", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: appSubmitting ? "not-allowed" : "pointer" }}>
                                    {appSubmitting ? "Submitting…" : "Submit to Admin"}
                                  </button>
                                  <button onClick={() => { setProposingAppId(null); setAppSchedule(""); setAppNote(""); }}
                                    style={{ padding: "10px 16px", background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setProposingAppId(a._id); setAppSchedule(""); setAppNote(""); }}
                                style={{ width: "100%", padding: "10px", background: "rgba(255,30,86,0.12)", border: "1px solid rgba(255,30,86,0.3)", color: "#FF6B8A", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 4 }}>
                                📅 Propose Schedule → Send to Admin
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sessions tab */}
            {activeTab === "sessions" && (
              <div>
                {sessionsLoading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#FF1E56" }}>Loading sessions...</div>
                ) : sessionBookings.length === 0 ? (
                  <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 40, textAlign: "center", color: "#6b7280" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                    <p>No 1:1 sessions booked yet. Make sure you're listed as an available trainer.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {sessionBookings.map(b => {
                      const statusColors: Record<string, string> = {
                        paid: "#3b82f6", trainer_proposed: "#f59e0b",
                        admin_approved: "#FF1E56", live: "#ef4444",
                        completed: "#16a34a", cancelled: "#dc2626",
                      };
                      const color = statusColors[b.status] ?? "#6b7280";
                      return (
                        <div key={b._id} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: "20px 22px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, color: "#f3f4f6", fontSize: 15 }}>{b.client.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${color}22`, color }}>{b.status.replace(/_/g, " ")}</span>
                              </div>
                              <div style={{ color: "#9ca3af", fontSize: 12 }}>{b.client.email} · ₹{(b.amount / 100).toLocaleString()}</div>
                              {b.clientNote && <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>Client note: {b.clientNote}</div>}
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(b.createdAt).toLocaleDateString("en-IN")}</div>
                          </div>

                          {b.status === "paid" && (
                            proposingId === b._id ? (
                              <div style={{ background: "rgba(255,30,86,0.08)", border: "1px solid rgba(255,30,86,0.2)", borderRadius: 12, padding: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#FF6B8A", marginBottom: 12 }}>Propose a Time Slot</div>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                                  <div>
                                    <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 4 }}>Date & Time</label>
                                    <input type="datetime-local" value={proposedDate} onChange={e => setProposedDate(e.target.value)}
                                      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #1e1b4b", background: "#0D0D0D", color: "#f3f4f6", fontSize: 13 }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 12, color: "#9ca3af", display: "block", marginBottom: 4 }}>Duration (min)</label>
                                    <select value={proposedDuration} onChange={e => setProposedDuration(Number(e.target.value))}
                                      style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #1e1b4b", background: "#0D0D0D", color: "#f3f4f6", fontSize: 13 }}>
                                      {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                                    </select>
                                  </div>
                                  <button onClick={() => proposeSlot(b._id)} disabled={proposing || !proposedDate}
                                    style={{ padding: "9px 20px", background: proposing || !proposedDate ? "#374151" : "#FF1E56", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: proposing || !proposedDate ? "not-allowed" : "pointer" }}>
                                    {proposing ? "Sending..." : "Propose & Send to Admin"}
                                  </button>
                                  <button onClick={() => setProposingId(null)}
                                    style={{ padding: "9px 14px", background: "transparent", color: "#9ca3af", border: "1px solid #1e1b4b", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setProposingId(b._id); setProposedDate(""); setProposedDuration(60); }}
                                style={{ padding: "10px 22px", background: "linear-gradient(135deg,#FF1E56,#D4003F)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                                Propose Time Slot
                              </button>
                            )
                          )}

                          {b.status === "trainer_proposed" && (
                            <div style={{ fontSize: 13, color: "#f59e0b", background: "rgba(245,158,11,0.08)", padding: "8px 12px", borderRadius: 8 }}>
                              ⏳ Time slot sent to admin for approval. Awaiting confirmation.
                            </div>
                          )}

                          {b.confirmedSlot && (
                            <div style={{ fontSize: 13, color: "#4ade80", background: "rgba(74,222,128,0.08)", padding: "8px 12px", borderRadius: 8 }}>
                              ✅ Confirmed: {new Date(b.confirmedSlot.datetime).toLocaleString("en-IN")} · {b.confirmedSlot.duration} min
                              {b.status === "admin_approved" && (
                                <button onClick={() => navigate("/live")}
                                  style={{ marginLeft: 12, padding: "5px 14px", background: "#FF1E56", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                                  Go to Live Page →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Messages tab */}
            {activeTab === "messages" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800, margin: 0 }}>Client Messages</h3>
                    <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>Click a conversation to open the chat</p>
                  </div>
                  <button onClick={loadConversations}
                    style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 8, padding: "7px 14px", color: "#9ca3af", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                    ↻ Refresh
                  </button>
                </div>

                {convsLoading ? (
                  <div style={{ textAlign: "center", padding: 60, color: "#FF1E56", fontSize: 14 }}>Loading conversations…</div>
                ) : conversations.length === 0 ? (
                  <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 60, textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 14 }}>💬</div>
                    <div style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>No messages yet</div>
                    <div style={{ color: "#6b7280", fontSize: 13, maxWidth: 340, margin: "0 auto", lineHeight: 1.6 }}>
                      When students send you a message from the Consultation page, their conversation will appear here.
                    </div>
                    <div style={{ marginTop: 20, fontSize: 12, color: "#4b5563", background: "rgba(255,30,86,0.08)", border: "1px solid rgba(255,30,86,0.2)", borderRadius: 10, padding: "10px 16px", display: "inline-block" }}>
                      Tip: Go online using the button above so students can see and message you
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {conversations.map((conv: any) => (
                      <button
                        key={conv._id}
                        onClick={() => setOpenChat({ id: conv.user._id, name: conv.user.name, online: conv.user.isOnline || false })}
                        style={{ background: "#13122a", border: conv.unread > 0 ? "1.5px solid rgba(239,68,68,0.45)" : "1px solid #1e1b4b", borderRadius: 14, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "border-color 0.15s, background 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#1a1830"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#13122a"; }}
                      >
                        {/* Avatar */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#FF1E56,#D4003F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>
                            {(conv.user.name?.[0] || "?").toUpperCase()}
                          </div>
                          {conv.user.isOnline && (
                            <span style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, background: "#22c55e", borderRadius: "50%", border: "2px solid #0D0D0D" }} />
                          )}
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 14 }}>{conv.user.name}</span>
                            {conv.unread > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{conv.unread} new</span>}
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {conv.lastMessage?.text || "No messages yet"}
                          </div>
                        </div>
                        {/* Time */}
                        {conv.lastMessage?.createdAt && (
                          <div style={{ color: "#6b7280", fontSize: 11, flexShrink: 0 }}>
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                        {/* Arrow */}
                        <div style={{ color: "#4b5563", fontSize: 16, flexShrink: 0 }}>›</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Earnings tab */}
            {activeTab === "earnings" && (
              <div>
                {/* GST breakdown info */}
                <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 32, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>How it works</div>
                    <div style={{ color: "#FF6B8A", fontSize: 13 }}>Sale price → <span style={{ color: "#f87171" }}>18% GST deducted</span> → remaining split <span style={{ color: "#FF6B8A" }}>50% to you</span> + <span style={{ color: "#60a5fa" }}>50% to admin</span></div>
                  </div>
                  <div style={{ borderLeft: "1px solid #1e1b4b", paddingLeft: 32 }}>
                    <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>Pending Income</div>
                    <div style={{ color: "#4ade80", fontSize: 20, fontWeight: 800 }}>{fmt(pendingTotal)}</div>
                  </div>
                  <div style={{ borderLeft: "1px solid #1e1b4b", paddingLeft: 32 }}>
                    <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 4 }}>Total Received</div>
                    <div style={{ color: "#60a5fa", fontSize: 20, fontWeight: 800 }}>{fmt(paidTotal)}</div>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {(["pending", "paid"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setEarningsTab(t)}
                      style={{
                        padding: "7px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13,
                        cursor: "pointer", border: "none",
                        background: earningsTab === t ? "#FF1E56" : "#13122a",
                        color: earningsTab === t ? "#fff" : "#9ca3af",
                      }}
                    >
                      {t === "pending" ? "⏳ Pending Payment" : "✅ Received"}
                    </button>
                  ))}
                </div>

                <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, overflow: "hidden" }}>
                  {earningsLoading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#FF1E56" }}>Loading earnings...</div>
                  ) : filteredPayouts.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>💸</div>
                      <p>{earningsTab === "pending" ? "No pending payments" : "No received payments yet"}</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #1e1b4b" }}>
                            {["Course", "Student", "Sale Price", "GST (18%)", "Net", "Your Share (50%)", earningsTab === "pending" ? "Pending Since" : "Received On"].map((h) => (
                              <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#9ca3af", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayouts.map((p) => (
                            <tr key={p._id} style={{ borderBottom: "1px solid #1e1b4b" }}>
                              <td style={{ padding: "12px 14px", color: "#FF6B8A", fontSize: 13, maxWidth: 200 }}>
                                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.course.title}</div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ color: "#f3f4f6", fontSize: 13 }}>{p.student.name}</div>
                                <div style={{ color: "#6b7280", fontSize: 11 }}>{p.student.email}</div>
                              </td>
                              <td style={{ padding: "12px 14px", color: "#f3f4f6", fontSize: 13, fontWeight: 600 }}>{fmt(p.totalPaise)}</td>
                              <td style={{ padding: "12px 14px", color: "#f87171", fontSize: 13 }}>−{fmt(p.gstPaise)}</td>
                              <td style={{ padding: "12px 14px", color: "#34d399", fontSize: 13 }}>{fmt(p.netPaise)}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ color: "#FF6B8A", fontSize: 14, fontWeight: 800 }}>{fmt(p.trainerSharePaise)}</span>
                              </td>
                              <td style={{ padding: "12px 14px", color: "#9ca3af", fontSize: 12 }}>
                                {earningsTab === "pending"
                                  ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : p.paidAt
                                  ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                  : "—"}
                                {p.paymentNote && <div style={{ color: "#6b7280", fontSize: 11, marginTop: 2 }}>{p.paymentNote}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating chat panel for educator replies */}
      {openChat && (
        <ChatPanel
          trainerId={openChat.id}
          trainerName={openChat.name}
          trainerOnline={openChat.online}
          onClose={() => {
            setOpenChat(null);
            loadConversations();
            client.get("/chat/unread-count").then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
          }}
        />
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.3)} }`}</style>
    </div>
  );
};

export default EducatorDashboard;
