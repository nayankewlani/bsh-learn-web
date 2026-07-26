import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import client from "../api/client";

declare const Razorpay: any;

const FALLBACK_RATE = 86; // ₹86 per minute — used only when trainer has no price set

const ConsultBookingPage: React.FC = () => {
  const { state } = useLocation() as { state: { expert: any; sessionPricePaise?: number } };
  const { user } = useAuthStore();
  const { t } = useThemeStore();
  const navigate = useNavigate();
  const expert = state?.expert;
  // Use DB session price if available; fallback to per-minute model
  const dbSessionPricePaise: number = state?.sessionPricePaise || 0;
  const usePerSession = dbSessionPricePaise > 0;

  const [sessions, setSessions]         = useState(1);
  const [duration, setDuration]         = useState(60);
  const [preferredTime, setPreferredTime] = useState("");
  const [clientNote, setClientNote]     = useState("");
  const [paying, setPaying]             = useState(false);
  const [error, setError]               = useState("");
  const [booked, setBooked]             = useState(false);

  if (!expert) return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: t.textSecond }}>No trainer selected.</p>
        <button onClick={() => navigate("/consultation")} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, cursor: "pointer", marginTop: 12 }}>Back</button>
      </div>
    </div>
  );

  const DURATIONS = [60, 90, 120];
  const SESSION_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10];

  const bonusSessions = sessions >= 5 ? Math.floor(sessions / 5) : 0;
  const effectiveSessions = sessions + bonusSessions;
  const totalMins = effectiveSessions * duration;

  // Pricing: per-minute rate × duration per session
  const ratePerMin = usePerSession ? dbSessionPricePaise / 100 : FALLBACK_RATE;
  const pricePerSessionRupees = ratePerMin * duration;
  const totalRupees = sessions * pricePerSessionRupees;
  const totalPaise  = Math.round(totalRupees * 100);
  const savedRupees = bonusSessions * pricePerSessionRupees;

  const handlePay = async () => {
    if (!user) { navigate("/login"); return; }
    setError("");
    setPaying(true);
    try {
      const { data } = await client.post("/consultation-bookings/create-order", {
        trainerName: expert.name,
        trainerId: expert.dbId,
        sessions, durationMins: duration, bonusSessions, totalPaise,
        clientNote, preferredTime,
      });

      const rzp = new Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "BSH Healers",
        description: `${sessions} session${sessions > 1 ? "s" : ""} with ${expert.name}`,
        order_id: data.order.id,
        handler: async (response: any) => {
          try {
            await client.post("/consultation-bookings/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setBooked(true);
          } catch { setError("Payment verification failed. Contact support."); }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || "" },
        theme: { color: "#7c3aed" },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initiate payment");
    } finally { setPaying(false); }
  };

  if (booked) return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: t.bgCard, border: "1.5px solid rgba(22,163,74,0.3)", borderRadius: 24, padding: 48, textAlign: "center", maxWidth: 520 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ margin: "0 0 12px", color: t.textPrimary, fontSize: 24, fontWeight: 800 }}>Sessions Booked!</h2>
        <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
          Payment confirmed! <strong>{expert.name}</strong> has been notified.
        </p>
        <p style={{ color: t.textSecond, fontSize: 14, marginBottom: 8 }}>
          You've booked <strong>{sessions} session{sessions > 1 ? "s" : ""}</strong>
          {bonusSessions > 0 && <span style={{ color: "#16a34a" }}> + {bonusSessions} FREE session{bonusSessions > 1 ? "s" : ""}</span>} of <strong>{duration} minutes</strong> each.
        </p>
        <p style={{ color: t.textSecond, fontSize: 14, marginBottom: 28 }}>
          The trainer will propose a schedule. Once admin approves, you'll be notified with your session link.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Go to Dashboard</button>
          <button onClick={() => navigate("/consultation")} style={{ background: "none", border: `1.5px solid ${t.border}`, color: t.textPrimary, borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Browse Trainers</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: t.textSecond, cursor: "pointer", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: t.textPrimary }}>Book Sessions</h1>
        <p style={{ margin: "0 0 28px", color: t.textSecond, fontSize: 14 }}>with {expert.name}</p>

        {/* Trainer summary */}
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: `2px solid ${expert.color}`, overflow: "hidden", flexShrink: 0 }}>
            <img src={expert.img} alt={expert.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: t.textPrimary, fontSize: 15 }}>{expert.name}</div>
            <div style={{ color: t.textSecond, fontSize: 12 }}>{expert.role}</div>
            <div style={{ color: "#7c3aed", fontSize: 12, fontWeight: 700, marginTop: 2 }}>
              {`₹${ratePerMin.toLocaleString("en-IN")}/min`}
            </div>
          </div>
        </div>

        {/* Session count */}
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 14 }}>Number of Sessions</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SESSION_OPTIONS.map(n => (
              <button key={n} onClick={() => setSessions(n)}
                style={{
                  width: 52, height: 52, borderRadius: 12, border: `2px solid ${sessions === n ? "#7c3aed" : t.border}`,
                  background: sessions === n ? "rgba(124,58,237,0.12)" : t.bgPrimary,
                  color: sessions === n ? "#7c3aed" : t.textPrimary, fontWeight: sessions === n ? 800 : 500,
                  fontSize: 15, cursor: "pointer", position: "relative",
                }}>
                {n}
                {n >= 5 && n % 5 === 0 && (
                  <span style={{ position: "absolute", top: -8, right: -4, background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 4px", borderRadius: 6 }}>FREE</span>
                )}
              </button>
            ))}
          </div>
          {bonusSessions > 0 && (
            <div style={{ marginTop: 12, background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.3)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🎁</span>
              <div>
                <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 13 }}>Buy {sessions} Get {bonusSessions} Free!</div>
                <div style={{ color: "#16a34a", fontSize: 12 }}>You save ₹{savedRupees.toLocaleString("en-IN")} on {bonusSessions} free session{bonusSessions > 1 ? "s" : ""}</div>
              </div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 4 }}>Session Duration</div>
          <div style={{ color: t.textSecond, fontSize: 12, marginBottom: 14 }}>Minimum 60 minutes per session</div>
          <div style={{ display: "flex", gap: 10 }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                style={{
                  flex: 1, padding: "12px 8px", borderRadius: 12, border: `2px solid ${duration === d ? "#7c3aed" : t.border}`,
                  background: duration === d ? "rgba(124,58,237,0.12)" : t.bgPrimary,
                  color: duration === d ? "#7c3aed" : t.textPrimary, fontWeight: duration === d ? 800 : 500,
                  fontSize: 14, cursor: "pointer", textAlign: "center",
                }}>
                <div>{d} min</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{d >= 60 ? `${d / 60}hr` : ""}{d === 90 ? " 30m" : ""}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred time */}
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 20px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 4 }}>Convenient Time (Optional)</div>
          <div style={{ color: t.textSecond, fontSize: 12, marginBottom: 12 }}>Let the trainer know when you're usually free</div>
          <input value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
            placeholder="e.g. Weekday evenings 6-9 PM, Saturday mornings"
            style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${t.border}`, borderRadius: 10, background: t.bgPrimary, color: t.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Note */}
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 20px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 12 }}>What would you like to work on? (Optional)</div>
          <textarea value={clientNote} onChange={e => setClientNote(e.target.value)} rows={3}
            placeholder="Share what you'd like to focus on…"
            style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${t.border}`, borderRadius: 10, background: t.bgPrimary, color: t.textPrimary, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>

        {/* Order summary */}
        <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: "20px 20px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15, marginBottom: 16 }}>Order Summary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: t.textSecond, fontSize: 13 }}>
              <span>{sessions} session{sessions > 1 ? "s" : ""} × {duration} min × ₹{ratePerMin.toLocaleString("en-IN")}/min</span>
              <span style={{ color: t.textPrimary, fontWeight: 600 }}>₹{totalRupees.toLocaleString("en-IN")}</span>
            </div>
            {bonusSessions > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontSize: 13 }}>
                <span>🎁 {bonusSessions} free session{bonusSessions > 1 ? "s" : ""} included</span>
                <span style={{ fontWeight: 600 }}>₹0</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", color: t.textSecond, fontSize: 13 }}>
              <span>Total sessions × minutes</span>
              <span style={{ color: t.textPrimary }}>{effectiveSessions} sessions · {totalMins} min total</span>
            </div>
            <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: t.textPrimary, fontWeight: 800, fontSize: 16 }}>Total</span>
              <span style={{ color: "#7c3aed", fontWeight: 900, fontSize: 20 }}>₹{totalRupees.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {error && <div style={{ color: "#dc2626", background: "rgba(239,68,68,0.08)", padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>⚠️ {error}</div>}

        <button onClick={handlePay} disabled={paying}
          style={{ width: "100%", padding: "16px", background: paying ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", border: "none", borderRadius: 14, fontWeight: 800, fontSize: 17, cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}>
          {paying
            ? <><div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing...</>
            : `Pay ₹${totalRupees.toLocaleString("en-IN")}`}
        </button>
        <p style={{ textAlign: "center", color: t.textSecond, fontSize: 12, marginTop: 12 }}>
          Secured by Razorpay · Trainer will schedule sessions after payment
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ConsultBookingPage;
