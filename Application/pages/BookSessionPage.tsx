import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import client from "../api/client";

declare const Razorpay: any;

interface Trainer {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  sessionFee?: number;
}

const SESSION_FEE = 2000; // ₹2000 default — trainer-specific pricing TBD

const BookSessionPage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useThemeStore();
  const navigate = useNavigate();

  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Trainer | null>(null);
  const [clientNote, setClientNote] = useState("");
  const [paying, setPaying] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/session-bookings/trainers")
      .then(r => setTrainers(r.data.trainers || []))
      .catch(() => setError("Failed to load trainers"))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = async () => {
    if (!selected || !user) return;
    if (!user._id) { navigate("/login"); return; }
    setError("");
    setPaying(true);
    try {
      const fee = selected.sessionFee || SESSION_FEE;
      const { data } = await client.post("/session-bookings/create-order", {
        trainerId: selected._id, amount: fee, clientNote,
      });

      const rzp = new Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "BSH Healers",
        description: `1:1 Session with ${selected.name}`,
        order_id: data.order.id,
        handler: async (response: any) => {
          try {
            await client.post("/session-bookings/verify", {
              razorpayOrderId:    response.razorpay_order_id,
              razorpayPaymentId:  response.razorpay_payment_id,
              razorpaySignature:  response.razorpay_signature,
            });
            setBooked(true);
          } catch {
            setError("Payment verification failed. Contact support.");
          }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone || "" },
        theme: { color: "#FF1E56" },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaying(false);
    }
  };

  if (!user) return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: t.textSecond, marginBottom: 16 }}>Please log in to book a session</p>
        <button onClick={() => navigate("/login")} style={{ background: "#FF1E56", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>Log In</button>
      </div>
    </div>
  );

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: t.textSecond, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 14, marginBottom: 12 }}>
            ← Back
          </button>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: t.textPrimary }}>Book a 1:1 Session</h1>
          <p style={{ margin: 0, color: t.textSecond, fontSize: 14 }}>Choose an educator and book a private live session</p>
        </div>

        {booked ? (
          /* Success screen */
          <div style={{ background: t.bgCard, border: `1.5px solid rgba(22,163,74,0.3)`, borderRadius: 20, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
            <h2 style={{ margin: "0 0 12px", color: t.textPrimary, fontSize: 24, fontWeight: 800 }}>Session Booked Successfully!</h2>
            <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 10px" }}>
              Your payment is confirmed. <strong>{selected?.name}</strong> has been notified and will propose available time slots shortly.
            </p>
            <p style={{ color: t.textSecond, fontSize: 14, marginBottom: 28 }}>
              Once the educator proposes a time and admin approves, you'll receive a notification with your session schedule.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/dashboard")} style={{ background: "#FF1E56", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Go to Dashboard
              </button>
              <button onClick={() => navigate("/live")} style={{ background: "none", border: `1.5px solid ${t.border}`, color: t.textPrimary, borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                View Live Page
              </button>
            </div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: t.textSecond }}>Loading educators...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

            {/* Trainer list */}
            <div>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: t.textPrimary }}>Select an Educator</h2>
              {trainers.length === 0 ? (
                <div style={{ color: t.textSecond, fontSize: 14, padding: "24px 0" }}>No educators are currently available for 1:1 sessions.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {trainers.map(tr => (
                    <button key={tr._id} onClick={() => setSelected(tr)}
                      style={{ background: selected?._id === tr._id ? "rgba(255,30,86,0.08)" : t.bgCard, border: `2px solid ${selected?._id === tr._id ? "#FF1E56" : t.border}`, borderRadius: 16, padding: "16px 18px", textAlign: "left", cursor: "pointer", transition: "all 0.15s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 50, height: 50, borderRadius: "50%", background: tr.avatar ? `url(${tr.avatar}) center/cover` : "linear-gradient(135deg,#FF1E56,#D4003F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                          {!tr.avatar && tr.name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 15 }}>{tr.name}</div>
                          <div style={{ color: t.textSecond, fontSize: 12, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tr.bio || "Certified Educator"}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, color: "#FF1E56", fontSize: 16 }}>₹{(tr.sessionFee || SESSION_FEE).toLocaleString()}</div>
                          <div style={{ color: t.textSecond, fontSize: 11 }}>per session</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booking panel */}
            <div style={{ background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 20, padding: 24, position: "sticky", top: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: t.textPrimary }}>Session Summary</h3>

              {!selected ? (
                <p style={{ color: t.textSecond, fontSize: 14, textAlign: "center", padding: "20px 0" }}>Select an educator to continue</p>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: "12px 14px", background: "rgba(255,30,86,0.06)", borderRadius: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#FF1E56,#D4003F)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                      {selected.name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: t.textPrimary, fontSize: 14 }}>{selected.name}</div>
                      <div style={{ color: t.textSecond, fontSize: 12 }}>1:1 Private Session</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: t.textSecond, display: "block", marginBottom: 6 }}>Note for educator (optional)</label>
                    <textarea value={clientNote} onChange={e => setClientNote(e.target.value)} rows={3}
                      placeholder="What would you like to focus on in this session?"
                      style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${t.border}`, borderRadius: 10, fontSize: 13, background: t.bgPrimary, color: t.textPrimary, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                  </div>

                  <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: t.textSecond, fontSize: 14 }}>Session Fee</span>
                      <span style={{ color: t.textPrimary, fontWeight: 600 }}>₹{(selected.sessionFee || SESSION_FEE).toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: t.textSecond, fontSize: 14 }}>Platform Fee</span>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>Free</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                      <span style={{ color: t.textPrimary, fontWeight: 700, fontSize: 15 }}>Total</span>
                      <span style={{ color: "#FF1E56", fontWeight: 800, fontSize: 17 }}>₹{(selected.sessionFee || SESSION_FEE).toLocaleString()}</span>
                    </div>
                  </div>

                  {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 8 }}>⚠️ {error}</div>}

                  <button onClick={handleBook} disabled={paying}
                    style={{ width: "100%", padding: "14px", background: paying ? "#9ca3af" : "linear-gradient(135deg,#FF1E56,#D4003F)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {paying
                      ? <><div style={{ width: 18, height: 18, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Processing...</>
                      : "Pay & Book Session"}
                  </button>

                  <p style={{ margin: "12px 0 0", color: t.textSecond, fontSize: 11, textAlign: "center", lineHeight: 1.5 }}>
                    Secured by Razorpay. After payment the educator will propose a time slot, which admin will then confirm and share with you.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default BookSessionPage;
