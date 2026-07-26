import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import client from "../api/client";
import advHypnosisImg from "../assets/advanced-hypnosis.png";

declare global {
  interface Window { Razorpay: new (opts: unknown) => { open(): void }; }
}

const MASTERY = [
  { icon: "🧘", name: "Self Hypnosis",        desc: "Master self-induction & deepening techniques" },
  { icon: "👥", name: "Hetero Hypnosis",       desc: "Guide others into deep therapeutic trance" },
  { icon: "🌆", name: "Street Hypnosis",       desc: "Rapid inductions in everyday environments" },
  { icon: "⚡", name: "Instant Hypnosis",      desc: "Split-second hypnotic induction mastery" },
  { icon: "🎭", name: "Stage Hypnosis",         desc: "Performance & group demonstration expertise" },
  { icon: "🌀", name: "Ericksonian Hypnosis",  desc: "Conversational & indirect hypnotic approach" },
  { icon: "🤝", name: "Non-Verbal Hypnosis",   desc: "Body language & silent induction methods" },
];

const STATS = [
  { num: "6",    label: "Month Program",  icon: "📅" },
  { num: "60+",  label: "Video Lessons",  icon: "🎬" },
  { num: "80+",  label: "Learning Hours", icon: "⏱" },
  { num: "25+",  label: "Modalities",     icon: "🔮" },
  { num: "Live", label: "+ Virtual",      icon: "💻" },
];

const LIBRARY_ITEMS   = [
  { icon: "🎬", text: "60 Videos" },
  { icon: "⏱", text: "Approx. 80 Hours of Learning" },
  { icon: "♾️", text: "Lifetime LMS Access" },
];
const LIVE_ITEMS      = [
  { icon: "💻", text: "Zoom Classes" },
  { icon: "📅", text: "Saturday & Sunday Sessions" },
  { icon: "🔄", text: "Follow-up Meetings" },
];
const COMMUNITY_ITEMS = [
  { icon: "👥", text: "Practice Group Access" },
  { icon: "🎓", text: "Trainer Support" },
  { icon: "💬", text: "Community Discussion" },
];

const fmtPrice = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const AdvanceHypnosisPage: React.FC = () => {
  const { t, isDark } = useThemeStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [sticky, setSticky]   = useState(false);
  const [price, setPrice]           = useState(3000000);
  const [discountPrice, setDiscountPrice] = useState<number | null>(null);

  useEffect(() => {
    client.get("/courses/programs/public")
      .then(({ data }) => {
        const p = (data.programs as Array<{ programId: string; price: number; discountPrice?: number }>)
          .find(p => p.programId === "advance-hypnosis");
        if (p) {
          setPrice(p.price);
          setDiscountPrice(p.discountPrice ?? null);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 520);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleJoinNow = async () => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await client.post("/payments/create-order", {
        type: "program",
        programId: "advance-hypnosis",
      });
      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "BSH Healers",
        description: "Advanced Diploma in Clinical Hypnotherapy",
        order_id: data.order.id,
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await client.post("/payments/verify", {
              razorpayOrderId: r.razorpay_order_id,
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            });
            setSuccess(true);
          } catch {
            setError("Payment received but verification failed. Please contact support with your payment ID.");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#7c3aed" },
      }).open();
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const JoinBtn: React.FC<{ size?: "sm" | "lg" }> = ({ size = "lg" }) => (
    <button
      onClick={handleJoinNow}
      disabled={loading || success}
      style={{
        background: success
          ? "linear-gradient(135deg,#22c55e,#16a34a)"
          : "linear-gradient(135deg,#7c3aed,#5b21b6)",
        border: "none",
        color: "#fff",
        padding: size === "lg" ? "16px 40px" : "12px 24px",
        borderRadius: 50,
        fontWeight: 800,
        fontSize: size === "lg" ? 17 : 14,
        cursor: loading || success ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 28px rgba(124,58,237,0.45)",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(124,58,237,0.6)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.45)"; }}
    >
      {loading
        ? <><span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Processing…</>
        : success
          ? "✅ Payment Successful!"
          : "Join Now →"}
    </button>
  );

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh" }}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1a0533 0%,#0d082a 45%,#081828 100%)", padding: "48px 24px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.1) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -120, left: "35%", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            <span style={{ cursor: "pointer", color: "#a78bfa" }} onClick={() => navigate("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer", color: "#a78bfa" }} onClick={() => navigate("/explore")}>Courses</span>
            <span>/</span>
            <span>Advanced Hypnosis</span>
          </div>

          <div style={{ display: "flex", gap: 52, alignItems: "center", flexWrap: "wrap" }}>

            {/* Left: Info */}
            <div style={{ flex: "1 1 460px", minWidth: 0 }}>
              {/* Badges */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ background: "rgba(124,58,237,0.28)", border: "1px solid rgba(124,58,237,0.55)", color: "#c4b5fd", borderRadius: 50, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>🏆 Best Seller</span>
                <span style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.45)", color: "#86efac", borderRadius: 50, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>🎓 Certified Program</span>
                <span style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.45)", color: "#fcd34d", borderRadius: 50, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>💻 Live + Virtual</span>
              </div>

              {/* Title */}
              <h1 style={{ fontSize: "clamp(32px,4.5vw,56px)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.08, color: "#fff", letterSpacing: -1.5 }}>
                Advanced<br />
                <span style={{ background: "linear-gradient(90deg,#c4b5fd,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Hypnosis</span>
                <br />Diploma
              </h1>

              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.75, marginBottom: 24, maxWidth: 500 }}>
                Master <strong style={{ color: "#c4b5fd" }}>7 hypnosis modalities</strong> — from self-hypnosis to Ericksonian techniques — through live Zoom sessions, weekend batches, and a vibrant practice community.
              </p>

              {/* Mastery chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {MASTERY.map(m => (
                  <span key={m.name} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.78)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
                    {m.icon} {m.name}
                  </span>
                ))}
              </div>

              {/* Quick facts */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 34 }}>
                {[["📅","6 Months"],["🎬","60+ Videos"],["⏱","80+ Hours"],["🔮","25+ Modalities"]].map(([ic,lb]) => (
                  <div key={lb} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                    <span>{ic}</span><span>{lb}</span>
                  </div>
                ))}
              </div>

              {/* Price + CTA */}
              <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 2 }}>Course Fee</div>
                  {discountPrice ? (
                    <div>
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: 36, lineHeight: 1 }}>{fmtPrice(discountPrice)}</div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, textDecoration: "line-through", marginTop: 2 }}>{fmtPrice(price)}</div>
                    </div>
                  ) : (
                    <div style={{ color: "#fff", fontWeight: 900, fontSize: 36, lineHeight: 1 }}>{fmtPrice(price)}</div>
                  )}
                </div>
                <JoinBtn size="lg" />
              </div>
              {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
              {success && (
                <div style={{ marginTop: 14, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 10, padding: "12px 16px", color: "#86efac", fontSize: 14 }}>
                  Payment received! Our team will reach out within 24 hours to set up your access.
                </div>
              )}
            </div>

            {/* Right: Image */}
            <div style={{ flex: "0 0 auto", width: "min(390px, 100%)" }}>
              <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 28px 80px rgba(124,58,237,0.45), 0 8px 32px rgba(0,0,0,0.65)", border: "1px solid rgba(124,58,237,0.35)", position: "relative" }}>
                <img src={advHypnosisImg} alt="Advanced Hypnosis" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 340 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,8,42,0.85) 0%, transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
                  <div style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>Certification</div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.4 }}>Advanced Diploma in Clinical Hypnotherapy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <div style={{ background: isDark ? t.bgSecondary : "#fff", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-around", flexWrap: "wrap" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "24px 16px", borderRight: i < STATS.length - 1 ? `1px solid ${t.border}` : "none", flex: "1 1 100px" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ color: t.accent, fontWeight: 900, fontSize: 28, lineHeight: 1 }}>{s.num}</div>
              <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>

        {/* ── MASTERY CATEGORIES ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: t.accentLight, borderRadius: 50, padding: "4px 16px", fontSize: 12, fontWeight: 700 }}>
              MASTERY CATEGORIES
            </span>
            <h2 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "14px 0 10px", letterSpacing: -0.5 }}>
              What You Will Master
            </h2>
            <p style={{ color: t.textSecond, fontSize: 15, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Progress through 7 distinct hypnosis modalities, from foundational self-mastery to professional-grade induction techniques
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
            {MASTERY.map((m, i) => (
              <div key={m.name}
                style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "22px 20px", display: "flex", alignItems: "flex-start", gap: 14, transition: "all 0.22s", cursor: "default" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.18)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {m.icon}
                </div>
                <div>
                  <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                    <span style={{ color: t.textMuted, fontSize: 12, marginRight: 6, fontWeight: 400 }}>{String(i + 1).padStart(2, "0")}.</span>
                    {m.name}
                  </div>
                  <div style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.55 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHAT YOU GET ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 50, padding: "4px 16px", fontSize: 12, fontWeight: 700 }}>
              COMPLETE LEARNING PACKAGE
            </span>
            <h2 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "14px 0 10px", letterSpacing: -0.5 }}>
              Everything Included
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {/* Learning Library */}
            {[
              { accent: "#7c3aed", icon: "📚", label: "Learning Library",  sub: "On-demand content",     items: LIBRARY_ITEMS },
              { accent: "#22c55e", icon: "🎥", label: "Live Learning",     sub: "Real-time instruction", items: LIVE_ITEMS },
              { accent: "#3b82f6", icon: "🌐", label: "Community",         sub: "Practice & support",    items: COMMUNITY_ITEMS },
            ].map(col => (
              <div key={col.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: "28px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${col.accent}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                    {col.icon}
                  </div>
                  <div>
                    <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 16 }}>{col.label}</div>
                    <div style={{ color: t.textMuted, fontSize: 12 }}>{col.sub}</div>
                  </div>
                </div>
                {col.items.map((item, idx) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: idx < col.items.length - 1 ? `1px solid ${t.border}` : "none" }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ color: t.textSecond, fontSize: 14 }}>{item.text}</span>
                    <span style={{ marginLeft: "auto", color: "#22c55e", fontWeight: 700 }}>✓</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── CERTIFICATION ── */}
        <div style={{ marginBottom: 72 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", borderRadius: 50, padding: "4px 16px", fontSize: 12, fontWeight: 700 }}>
              INDUSTRY CERTIFICATION
            </span>
            <h2 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "14px 0 10px", letterSpacing: -0.5 }}>
              Your Certificate
            </h2>
            <p style={{ color: t.textSecond, fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
              Graduate with a nationally recognised diploma and a professional title you can use immediately
            </p>
          </div>

          {/* Diploma card */}
          <div style={{ maxWidth: 660, margin: "0 auto", background: isDark ? "linear-gradient(135deg,#1a0533,#0a1a3a)" : "linear-gradient(135deg,#f4f3ff,#ede9fe)", border: `2px solid ${isDark ? "rgba(167,139,250,0.3)" : "#c4b5fd"}`, borderRadius: 24, overflow: "hidden", boxShadow: isDark ? "0 24px 70px rgba(124,58,237,0.28)" : "0 24px 70px rgba(124,58,237,0.14)" }}>

            {/* Diploma header */}
            <div style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", padding: "30px 36px", textAlign: "center" }}>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, letterSpacing: 3.5, textTransform: "uppercase", marginBottom: 8 }}>
                Blessings School of Hypnosis
              </div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, marginBottom: 5 }}>Certificate of Achievement</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>This is to certify that the learner has successfully completed</div>
            </div>

            {/* Diploma body */}
            <div style={{ padding: "36px" }}>
              <div style={{ textAlign: "center", marginBottom: 28, paddingBottom: 28, borderBottom: `1px dashed ${isDark ? "rgba(255,255,255,0.14)" : "#ddd6fe"}` }}>
                <div style={{ color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Certificate Title</div>
                <div style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(17px,2.5vw,26px)", lineHeight: 1.3 }}>
                  Advanced Diploma in<br />
                  <span style={{ color: "#7c3aed" }}>Clinical Hypnotherapy</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 0, justifyContent: "center", flexWrap: "wrap" }}>
                {[
                  { title: "Awarded Title",    line1: "Certified Clinical", line2: "Hypnotherapist", color: "#7c3aed" },
                  { title: "Duration",         line1: "6 Months",           line2: "Intensive Program", color: null },
                  { title: "Learning Mode",    line1: "Live + Virtual",     line2: "Zoom Sessions",     color: null },
                ].map((item, i) => (
                  <React.Fragment key={item.title}>
                    {i > 0 && <div style={{ width: "1px", background: isDark ? "rgba(255,255,255,0.1)" : "#ddd6fe", margin: "0 24px" }} />}
                    <div style={{ textAlign: "center", flex: "1 1 120px" }}>
                      <div style={{ color: t.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>{item.title}</div>
                      <div style={{ color: item.color || t.textPrimary, fontWeight: 800, fontSize: 15, lineHeight: 1.4 }}>{item.line1}</div>
                      <div style={{ color: item.color || t.textMuted, fontWeight: item.color ? 800 : 400, fontSize: 13, marginTop: 2 }}>{item.line2}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Diploma footer */}
            <div style={{ padding: "16px 36px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.04)", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#ddd6fe"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>🏅</span>
              <span style={{ color: t.textMuted, fontSize: 13 }}>Internationally recognised accreditation & certification branding</span>
            </div>
          </div>
        </div>

        {/* ── FINAL CTA ── */}
        <div style={{ background: isDark ? "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(13,148,136,0.1))" : "linear-gradient(135deg,rgba(124,58,237,0.07),rgba(13,148,136,0.04))", border: `1px solid ${isDark ? "rgba(124,58,237,0.3)" : "#c4b5fd"}`, borderRadius: 24, padding: "52px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🎓</div>
          <h3 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(20px,3vw,34px)", marginBottom: 14, letterSpacing: -0.5 }}>
            Ready to Become a<br />Certified Clinical Hypnotherapist?
          </h3>
          <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.75, maxWidth: 560, margin: "0 auto 32px" }}>
            6 months. 7 modalities. Lifetime access. Join India's most comprehensive hypnosis training program and transform lives — starting with your own.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: t.textMuted, fontSize: 13, marginBottom: 2 }}>One-time Fee</div>
              {discountPrice ? (
                <div>
                  <div style={{ color: t.textPrimary, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>{fmtPrice(discountPrice)}</div>
                  <div style={{ color: t.textMuted, fontSize: 14, textDecoration: "line-through", marginTop: 2 }}>{fmtPrice(price)}</div>
                </div>
              ) : (
                <div style={{ color: t.textPrimary, fontWeight: 900, fontSize: 40, lineHeight: 1 }}>{fmtPrice(price)}</div>
              )}
            </div>
            <JoinBtn size="lg" />
          </div>

          {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 14 }}>{error}</div>}
          {success && (
            <div style={{ marginTop: 20, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: 12, padding: "14px 20px", color: "#86efac", fontSize: 14, display: "inline-block" }}>
              🎉 Payment successful! Our team will contact you within 24 hours to set up your access.
            </div>
          )}
          {!user && (
            <p style={{ color: t.textMuted, fontSize: 13, marginTop: 18 }}>
              Already have an account?{" "}
              <span style={{ color: t.accentLight, cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/login")}>Login to continue</span>
            </p>
          )}
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: isDark ? "rgba(10,9,20,0.96)" : "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: `1px solid ${isDark ? "rgba(124,58,237,0.3)" : "#ddd6fe"}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100, transform: sticky ? "translateY(0)" : "translateY(100%)", transition: "transform 0.3s ease", boxShadow: "0 -8px 32px rgba(0,0,0,0.2)" }}>
        <div>
          <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 1 }}>Advanced Hypnosis Diploma</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ color: t.textPrimary, fontWeight: 900, fontSize: 22 }}>{fmtPrice(discountPrice ?? price)}</div>
            {discountPrice && <div style={{ color: t.textMuted, fontSize: 13, textDecoration: "line-through" }}>{fmtPrice(price)}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ color: t.textMuted, fontSize: 12 }}>📅 6 Months &nbsp;·&nbsp; 🎬 60+ Videos &nbsp;·&nbsp; 🏅 Certified</div>
          <JoinBtn size="sm" />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdvanceHypnosisPage;
