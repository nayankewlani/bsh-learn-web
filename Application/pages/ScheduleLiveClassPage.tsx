import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import client from "../api/client";
import Button from "../components/ui/Button";

interface Course { _id: string; title: string; }

interface LiveClassInfo { status: string; agoraChannel?: string; scheduledAt?: string; }

interface LivePermission {
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt?: string;
}

interface ConsultBooking {
  _id: string;
  trainerName: string;
  sessions: number;
  bonusSessions: number;
  durationMins: number;
  totalPaise: number;
  status: string;
  clientNote?: string;
  preferredTime?: string;
  createdAt: string;
  client?: { _id: string; name: string; email: string; phone?: string };
  liveClassId?: LiveClassInfo;
}

const ScheduleLiveClassPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useThemeStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [accessType, setAccessType] = useState<"free" | "course" | "session">(
    searchParams.get("type") === "course" ? "course" :
    searchParams.get("type") === "session" ? "session" : "free"
  );
  const [startNow, setStartNow] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", scheduledAt: "", duration: "60", courseId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Session tab state
  const [consultBookings, setConsultBookings] = useState<ConsultBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");
  const [scheduledAts, setScheduledAts] = useState<Record<string, string>>({});

  // Free-live permission gate — matches the same admin-approval flow already
  // built into LivePage.tsx, but lives directly on this page now so submitting
  // "Free for Everyone" doesn't just bounce off a backend 403 with no recourse.
  const [livePermission, setLivePermission] = useState<LivePermission | null>(null);
  const [permChecking, setPermChecking] = useState(true);
  const [permLoading, setPermLoading] = useState(false);
  const [permReason, setPermReason] = useState("");

  const inputStyle: React.CSSProperties = {
    width: "100%", background: t.bgInput, border: `1.5px solid ${t.border}`, borderRadius: 10,
    color: t.textPrimary, padding: "11px 14px", fontSize: 14, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", color: t.textAccent, fontSize: 13, fontWeight: 600, marginBottom: 6,
  };

  useEffect(() => {
    client.get("/educator/courses").then(({ data }) => setCourses(data.courses || [])).catch(() => {});
    const now = new Date();
    now.setSeconds(0, 0);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setForm((f) => ({ ...f, scheduledAt: local }));
  }, []);

  useEffect(() => {
    if (accessType !== "session") return;
    setBookingsLoading(true);
    client.get("/consultation-bookings/for-trainer")
      .then(({ data }) => setConsultBookings(data.bookings || []))
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, [accessType]);

  useEffect(() => {
    if (accessType !== "free") return;
    setPermChecking(true);
    client.get("/educator/live-permission-status")
      .then(({ data }) => setLivePermission(data.permission))
      .catch(() => {})
      .finally(() => setPermChecking(false));
  }, [accessType]);

  const hasFreeAccess = !!(livePermission?.status === "approved" && livePermission.expiresAt && new Date(livePermission.expiresAt) > new Date());

  const requestPermission = async () => {
    setPermLoading(true);
    try {
      const { data } = await client.post("/educator/request-live-permission", { reason: permReason.trim() });
      setLivePermission(data.permission);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setPermLoading(false);
    }
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (accessType === "course" && !form.courseId) { setError("Please select a course"); return; }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        duration: Number(form.duration) || 60,
        scheduledAt: startNow ? new Date().toISOString() : new Date(form.scheduledAt).toISOString(),
      };
      if (accessType === "course" && form.courseId) payload.course = form.courseId;
      await client.post("/live-classes", payload);
      setSubmitted(true);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to schedule class");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLive = async (booking: ConsultBooking) => {
    setRequestError("");
    setRequestingId(booking._id);
    try {
      const scheduledAt = scheduledAts[booking._id];
      const { data } = await client.post(`/consultation-bookings/${booking._id}/request-live`, {
        title: `1:1 Session — ${booking.trainerName} × ${booking.client?.name || "Client"}`,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      setConsultBookings(prev => prev.map(b =>
        b._id === booking._id ? { ...b, status: "scheduled", liveClassId: data.liveClass } : b
      ));
    } catch (err: any) {
      setRequestError(err.response?.data?.message || "Failed to request live class");
    } finally {
      setRequestingId(null);
    }
  };

  const getLiveStatusPill = (booking: ConsultBooking) => {
    const lc = booking.liveClassId as LiveClassInfo | undefined;
    if (!lc) {
      if (booking.status === "paid") return { label: "Paid – Awaiting Schedule", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
      return { label: booking.status, color: t.textSecond, bg: t.bgPrimary };
    }
    if (lc.status === "pending_approval") return { label: "⏳ Pending Admin Approval", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (lc.status === "scheduled") return { label: "✅ Ready – Approved", color: "#16a34a", bg: "rgba(22,163,74,0.12)" };
    if (lc.status === "live") return { label: "🔴 Live Now", color: "#dc2626", bg: "rgba(220,38,38,0.12)" };
    if (lc.status === "ended") return { label: "Ended", color: t.textSecond, bg: t.bgPrimary };
    if (lc.status === "rejected") return { label: "Rejected", color: "#dc2626", bg: "rgba(220,38,38,0.08)" };
    return { label: lc.status, color: t.textSecond, bg: t.bgPrimary };
  };

  if (submitted) {
    return (
      <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: "48px 40px", maxWidth: 460, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
          <h2 style={{ color: t.textPrimary, fontSize: 22, fontWeight: 800, margin: "0 0 12px" }}>Request Submitted!</h2>
          <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.6, margin: "0 0 28px" }}>
            Your live class request has been sent to the admin for approval. You will be able to start it once approved.
          </p>
          <button onClick={() => navigate("/live")}
            style={{ background: t.accent, color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            View My Classes
          </button>
        </div>
      </div>
    );
  }

  const paidCount = consultBookings.filter(b => b.status === "paid" && !b.liveClassId).length;

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <button onClick={() => navigate("/educator")}
          style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 14, marginBottom: 24, padding: 0 }}>
          ← Back to Dashboard
        </button>
        <h1 style={{ color: t.textPrimary, fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Request Live Class</h1>
        <p style={{ color: t.textSecond, fontSize: 14, marginBottom: 32 }}>Schedule a live class — admin will approve before you can go live</p>

        {/* Access type selector */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Who can join?</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {([
              { key: "free", icon: "🌍", title: "Free for Everyone", desc: "Open to all — great for demos" },
              { key: "course", icon: "🔒", title: "Course Students", desc: "Enrolled students only" },
              { key: "session", icon: "👤", title: "1:1 Sessions", desc: `${consultBookings.length || ""} booked` },
            ] as const).map((opt) => (
              <button key={opt.key} type="button" onClick={() => setAccessType(opt.key)}
                style={{
                  padding: "14px 10px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                  border: `2px solid ${accessType === opt.key ? t.accent : t.border}`,
                  background: accessType === opt.key ? `rgba(124,58,237,0.12)` : t.bgCard,
                  position: "relative",
                }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                <div style={{ color: t.textPrimary, fontSize: 12, fontWeight: 700 }}>{opt.title}</div>
                <div style={{ color: t.textSecond, fontSize: 11, marginTop: 2 }}>{opt.desc}</div>
                {opt.key === "session" && paidCount > 0 && (
                  <span style={{ position: "absolute", top: -8, right: -8, background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>{paidCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── 1:1 Sessions tab ── */}
        {accessType === "session" && (
          <div>
            {bookingsLoading ? (
              <div style={{ textAlign: "center", padding: 48, color: t.textSecond }}>Loading sessions...</div>
            ) : consultBookings.length === 0 ? (
              <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 40, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ color: t.textSecond, fontSize: 14 }}>No paid consultation sessions yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {requestError && (
                  <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                    ⚠️ {requestError}
                  </div>
                )}
                {consultBookings.map(booking => {
                  const pill = getLiveStatusPill(booking);
                  const lc = booking.liveClassId as LiveClassInfo | undefined;
                  const canRequest = booking.status === "paid" && !lc;
                  const canGoLive = lc?.status === "scheduled";
                  return (
                    <div key={booking._id} style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 20px" }}>
                      {/* Client + status */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                            {booking.client?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 14 }}>{booking.client?.name || "Client"}</div>
                            <div style={{ color: t.textSecond, fontSize: 12 }}>{booking.client?.email}</div>
                          </div>
                        </div>
                        <span style={{ background: pill.bg, color: pill.color, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>{pill.label}</span>
                      </div>

                      {/* Session details */}
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                        <div style={{ background: t.bgPrimary, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: t.textSecond }}>
                          📅 <strong style={{ color: t.textPrimary }}>{booking.sessions}</strong> session{booking.sessions > 1 ? "s" : ""}
                          {booking.bonusSessions > 0 && <span style={{ color: "#16a34a" }}> +{booking.bonusSessions} free</span>}
                        </div>
                        <div style={{ background: t.bgPrimary, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: t.textSecond }}>
                          ⏱ <strong style={{ color: t.textPrimary }}>{booking.durationMins} min</strong>/session
                        </div>
                        <div style={{ background: t.bgPrimary, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: t.textSecond }}>
                          💰 ₹{(booking.totalPaise / 100).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {booking.preferredTime && (
                        <div style={{ color: t.textSecond, fontSize: 12, marginBottom: 10 }}>
                          🕐 Preferred: <span style={{ color: t.textPrimary }}>{booking.preferredTime}</span>
                        </div>
                      )}
                      {booking.clientNote && (
                        <div style={{ color: t.textSecond, fontSize: 12, marginBottom: 14, background: t.bgPrimary, borderRadius: 8, padding: "8px 12px", fontStyle: "italic" }}>
                          "{booking.clientNote}"
                        </div>
                      )}

                      {/* Schedule date picker when requesting */}
                      {canRequest && (
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ ...labelStyle, marginBottom: 4 }}>Proposed session date & time</label>
                          <input type="datetime-local"
                            value={scheduledAts[booking._id] || ""}
                            onChange={e => setScheduledAts(prev => ({ ...prev, [booking._id]: e.target.value }))}
                            style={{ ...inputStyle, maxWidth: 280 }} />
                        </div>
                      )}

                      {/* Action button */}
                      {canRequest && (
                        <button
                          onClick={() => handleRequestLive(booking)}
                          disabled={requestingId === booking._id}
                          style={{
                            background: requestingId === booking._id ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
                            color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px",
                            fontWeight: 700, fontSize: 14, cursor: requestingId === booking._id ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 8,
                          }}>
                          {requestingId === booking._id ? (
                            <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Sending Request...</>
                          ) : "📅 Schedule Class / Request Live"}
                        </button>
                      )}
                      {canGoLive && lc && (
                        <button
                          onClick={() => navigate("/live")}
                          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                          🔴 Go Live
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Free live: permission gate ── */}
        {accessType === "free" && permChecking ? (
          <div style={{ textAlign: "center", padding: 48, color: t.textSecond }}>Checking permission…</div>
        ) : accessType === "free" && !hasFreeAccess ? (
          <div>
            <p style={{ margin: "0 0 14px", color: t.textSecond, fontSize: 13 }}>Free live sessions require admin approval each time. Once approved, permission is valid for 4 hours.</p>
            {livePermission?.status === "pending" ? (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontWeight: 700, color: "#d97706", fontSize: 14 }}>Request Pending Review</div>
                <div style={{ color: t.textSecond, fontSize: 12, marginTop: 4 }}>Admin has been notified. You'll receive a notification once approved.</div>
              </div>
            ) : (
              <div>
                {livePermission?.status === "rejected" && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, color: "#dc2626", fontSize: 13 }}>
                    Previous request was declined. You can submit a new request.
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Reason for going live (optional)</label>
                  <input value={permReason} onChange={e => setPermReason(e.target.value)}
                    placeholder="e.g. Demo session for new students" style={inputStyle} />
                </div>
                {error && <div style={{ background: "#450a0a", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
                <Button onClick={requestPermission} loading={permLoading}>Apply — Request Permission to Go Live</Button>
              </div>
            )}
          </div>
        ) : accessType !== "session" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>

            {accessType === "free" && hasFreeAccess && (
              <div style={{ background: "rgba(22,163,74,0.1)", border: "1.5px solid rgba(22,163,74,0.3)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 14 }}>Permission Granted!</div>
                <div style={{ color: t.textSecond, fontSize: 12, marginTop: 4 }}>Valid until {new Date(livePermission!.expiresAt!).toLocaleTimeString()}. Go live now or schedule a class.</div>
              </div>
            )}

            {/* Course picker */}
            {accessType === "course" && (
              <div>
                <label style={labelStyle}>Select Course *</label>
                {courses.length === 0 ? (
                  <p style={{ color: "#f87171", fontSize: 13 }}>
                    You have no courses yet. <button type="button" onClick={() => navigate("/educator/create")} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: 13, padding: 0 }}>Create one first →</button>
                  </p>
                ) : (
                  <select value={form.courseId} onChange={(e) => set("courseId", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    <option value="">— Choose a course —</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label style={labelStyle}>Class Title *</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Introduction to Hypnosis — Q&A Session" style={inputStyle} required />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description (optional)</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="What will you cover in this class?" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            </div>

            {/* Duration */}
            <div>
              <label style={labelStyle}>Duration (minutes)</label>
              <input type="number" value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="60" style={{ ...inputStyle, maxWidth: 120 }} min="15" max="480" />
            </div>

            {/* Start now vs schedule */}
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: t.accent }} />
                <div>
                  <div style={{ color: t.textPrimary, fontSize: 14, fontWeight: 700 }}>🔴 Go Live Now</div>
                  <div style={{ color: t.textSecond, fontSize: 12, marginTop: 2 }}>Start broadcasting immediately after clicking the button</div>
                </div>
              </label>
              {!startNow && (
                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Scheduled Date & Time</label>
                  <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} style={inputStyle} required={!startNow} />
                </div>
              )}
            </div>

            {error && <div style={{ background: "#450a0a", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>⚠️ {error}</div>}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {startNow ? "🔴 Go Live Now" : "📅 Schedule Class"}
            </Button>
          </form>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ScheduleLiveClassPage;
