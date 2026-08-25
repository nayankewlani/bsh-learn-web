import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import hypnosis2Img from "../assets/hypnosis-2.png";
import client from "../api/client";
import ProgramPostsBoard from "../components/ProgramPostsBoard";

declare global {
  interface Window { Razorpay: new (opts: unknown) => { open(): void }; }
}

const buildPlans = (monthly: number) => [
  {
    id: "monthly",
    label: "1 Month",
    price: monthly,
    original: null as number | null,
    period: "/ month",
    tag: null as string | null,
    highlight: false,
    desc: "Perfect to explore and experience the full power of live hypnotherapy sessions.",
  },
  {
    id: "quarterly",
    label: "3 Months",
    price: Math.round(monthly * 3 * 0.934),
    original: monthly * 3,
    period: "/ 3 months",
    tag: "Most Popular",
    highlight: true,
    desc: "Build real practice depth with three months of continuous expert-led training.",
  },
  {
    id: "biannual",
    label: "6 Months",
    price: Math.round(monthly * 6 * 0.901),
    original: monthly * 6,
    period: "/ 6 months",
    tag: "Best Value",
    highlight: false,
    desc: "Full transformation journey — master multiple modalities with maximum savings.",
  },
];

const BENEFITS = [
  { icon: "🎥", title: "40+ Live Classes / Month",      desc: "Expert-led live sessions covering a wide range of hypnotherapy modalities — every single month." },
  { icon: "📼", title: "Full Past Recordings Library",   desc: "Instant access to the entire archive of past classes. Never miss a session — watch at your own pace." },
  { icon: "🧠", title: "Multi-Modality Training",        desc: "Sessions span Self-Hypnosis, Ericksonian techniques, NLP integration, regression, street hypnosis & more." },
  { icon: "👨‍⚕️", title: "Learn from Top Experts",        desc: "India's best clinical hypnotherapists teach every session — not pre-recorded content from unknowns." },
  { icon: "🤝", title: "Live Practice Groups",           desc: "Weekly practice circles where you apply what you learn with fellow students under trainer supervision." },
  { icon: "💬", title: "Doubt-Clearing Q&A",             desc: "Every session ends with a live Q&A. Ask anything — get real-time feedback from the instructor." },
  { icon: "📈", title: "Become a More Efficient Practitioner", desc: "Structured progressive curriculum designed to sharpen your induction speed, depth calibration, and client rapport." },
  { icon: "🏅", title: "Certificate of Participation",   desc: "Monthly certificates recognising your consistent practice — valuable proof of CPD for your clients." },
  { icon: "🔄", title: "New Content Every Week",         desc: "Fresh classes added weekly so the content stays current, diverse, and always challenging." },
];

const MODALITIES = [
  "Self Hypnosis", "Ericksonian Hypnosis", "NLP Integration", "Past Life Regression",
  "Street Hypnosis", "Stage Hypnosis", "Non-Verbal Hypnosis", "Instant Induction",
  "Parts Therapy", "Inner Child Work", "Trauma Release", "Age Regression",
];

const Hypnosis2Page: React.FC = () => {
  const { t, isDark } = useThemeStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [sticky, setSticky] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [monthlyPrice, setMonthlyPrice] = useState(999);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessExpiry, setAccessExpiry] = useState<string | null>(null);

  useEffect(() => {
    client.get("/courses/programs/public")
      .then(({ data }) => {
        const p = (data.programs as Array<{ programId: string; price: number }>)
          .find(p => p.programId === "hypnosis-2");
        if (p && p.price > 0) setMonthlyPrice(Math.round(p.price / 100));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) { setHasAccess(false); return; }
    client.get("/payments/program-access/hypnosis-2")
      .then(({ data }) => {
        setHasAccess(!!data.hasAccess);
        if (data.access?.accessExpiresAt) {
          setAccessExpiry(new Date(data.access.accessExpiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }));
        }
      })
      .catch(() => setHasAccess(false));
  }, [user]);

  const PLANS = buildPlans(monthlyPrice);

  const handleJoin = async (planId?: string) => {
    const plan = planId || selectedPlan;
    if (!user) { navigate("/login?redirect=/courses/hypnosis-2"); return; }
    setLoading(true);
    setError("");
    try {
      const { data } = await client.post("/payments/create-order", {
        type: "hypnosis2",
        plan: `hypnosis-2-${plan}`,
      });
      const planLabel = PLANS.find(p => p.id === plan)?.label ?? plan;
      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "BSH Healers",
        description: `Hypnosis 2.0 — ${planLabel}`,
        order_id: data.order.id,
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await client.post("/payments/verify", {
              razorpayOrderId: r.razorpay_order_id,
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            });
            setSuccess(true);
            setHasAccess(true);
          } catch {
            setError("Payment received but verification failed — please contact support with your payment ID.");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#6366f1" },
      }).open();
    } catch {
      setError("Payment initiation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const activePlan = PLANS.find(p => p.id === selectedPlan)!;

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (hasAccess === null && !!user) {
    return (
      <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 44, height: 44, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.9s linear infinite", margin: "0 auto 16px" }} />
          <div style={{ color: t.textMuted, fontSize: 14 }}>Loading your access…</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── MEMBER VIEW — enrolled or admin ─────────────────────────────────────────
  if (hasAccess === true || user?.role === "admin") {
    return (
      <div style={{ background: t.bgPrimary, minHeight: "100vh" }}>
        {/* Compact top bar */}
        <div style={{ background: "linear-gradient(135deg,#0d0824 0%,#1a0a3a 100%)", padding: "16px 24px", borderBottom: "1px solid rgba(99,102,241,0.25)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              <span style={{ cursor: "pointer", color: "#a78bfa" }} onClick={() => navigate("/")}>Home</span>
              <span>/</span>
              <span style={{ cursor: "pointer", color: "#a78bfa" }} onClick={() => navigate("/explore")}>Courses</span>
              <span>/</span>
              <span style={{ color: "rgba(255,255,255,0.7)" }}>Hypnosis 2.0</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {accessExpiry && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                  Access until: <strong style={{ color: "#86efac" }}>{accessExpiry}</strong>
                </span>
              )}
              {user?.role === "admin" && (
                <span style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.5)", color: "#c7d2fe", borderRadius: 50, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
                  Admin Preview
                </span>
              )}
            </div>
          </div>
        </div>

        <ProgramPostsBoard programId="hypnosis-2" accent="#6366f1" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── MARKETING VIEW — not enrolled ───────────────────────────────────────────
  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh" }}>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#0d0824 0%,#1a0a3a 45%,#0a1020 100%)", padding: "48px 24px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.09) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -80, right: "20%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
            <span style={{ cursor: "pointer", color: "#a78bfa" }} onClick={() => navigate("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer", color: "#a78bfa" }} onClick={() => navigate("/explore")}>Courses</span>
            <span>/</span>
            <span>Hypnosis 2.0</span>
          </div>

          <div style={{ display: "flex", gap: 52, alignItems: "center", flexWrap: "wrap" }}>

            {/* Left */}
            <div style={{ flex: "1 1 460px", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                <span style={{ background: "rgba(99,102,241,0.28)", border: "1px solid rgba(99,102,241,0.55)", color: "#c7d2fe", borderRadius: 50, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>🔴 Live Classes</span>
                <span style={{ background: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.45)", color: "#86efac", borderRadius: 50, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>📼 All Recordings Included</span>
                <span style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.45)", color: "#fcd34d", borderRadius: 50, padding: "4px 14px", fontSize: 11, fontWeight: 700 }}>🔥 Subscription Based</span>
              </div>

              <h1 style={{ fontSize: "clamp(34px,5vw,58px)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.07, color: "#fff", letterSpacing: -1.5 }}>
                Hypnosis
                <br />
                <span style={{ background: "linear-gradient(90deg,#818cf8,#a78bfa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>2.0</span>
                <br />
                <span style={{ fontSize: "clamp(18px,2.5vw,28px)", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: -0.5 }}>Live Subscription Programme</span>
              </h1>

              <p style={{ color: "rgba(255,255,255,0.68)", fontSize: 16, lineHeight: 1.75, marginBottom: 28, maxWidth: 500 }}>
                India's most active hypnotherapy subscription — <strong style={{ color: "#c7d2fe" }}>40+ expert-led live classes</strong> every month, full past recordings library, and a hands-on practice community to turn you into a truly efficient practitioner.
              </p>

              {/* Modality chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 32 }}>
                {MODALITIES.map(m => (
                  <span key={m} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)", color: "rgba(255,255,255,0.72)", borderRadius: 8, padding: "4px 11px", fontSize: 12, fontWeight: 600 }}>
                    {m}
                  </span>
                ))}
              </div>

              <button onClick={() => handleJoin()} disabled={loading || success}
                style={{ background: success ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff", padding: "16px 40px", borderRadius: 50, fontWeight: 800, fontSize: 17, cursor: loading || success ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 10, boxShadow: "0 8px 28px rgba(99,102,241,0.5)", transition: "all 0.2s" }}
                onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(99,102,241,0.65)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.5)"; }}>
                {loading ? "Processing…" : success ? "✅ Subscribed!" : "Join Now →"}
              </button>
              {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 10 }}>{error}</div>}
              {success && <div style={{ marginTop: 12, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 10, padding: "12px 16px", color: "#86efac", fontSize: 14 }}>Subscription active! You now have full access to live classes and recordings.</div>}
              {!user && <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 12 }}>Already have an account? <span style={{ color: "#a78bfa", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/login?redirect=/courses/hypnosis-2")}>Login to subscribe</span></p>}
            </div>

            {/* Right: Image */}
            <div style={{ flex: "0 0 auto", width: "min(380px, 100%)" }}>
              <div style={{ borderRadius: 22, overflow: "hidden", boxShadow: "0 28px 80px rgba(99,102,241,0.4), 0 8px 32px rgba(0,0,0,0.65)", border: "1px solid rgba(99,102,241,0.35)", position: "relative" }}>
                <img src={hypnosis2Img} alt="Hypnosis 2.0" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 340 }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,8,36,0.85) 0%, transparent 55%)" }} />
                <div style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
                  <div style={{ color: "#818cf8", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>Live Subscription</div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 14, lineHeight: 1.4 }}>40+ Expert Live Classes Monthly · Full Archive Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICING PLANS ──────────────────────────────────────────── */}
      <div style={{ background: isDark ? t.bgSecondary : "#fff", borderBottom: `1px solid ${t.border}`, padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8", borderRadius: 50, padding: "4px 16px", fontSize: 12, fontWeight: 700 }}>
              SUBSCRIPTION PLANS
            </span>
            <h2 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "14px 0 10px", letterSpacing: -0.5 }}>
              Choose Your Plan
            </h2>
            <p style={{ color: t.textSecond, fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
              All plans give full access to live classes and the entire recordings library. Save more with longer commitments.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {PLANS.map(plan => (
              <div key={plan.id}
                style={{ position: "relative", background: plan.highlight ? (isDark ? "linear-gradient(135deg,#1e1b4b,#2e1065)" : "linear-gradient(135deg,#ede9fe,#ddd6fe)") : t.bgCard, border: `2px solid ${plan.highlight ? "#6366f1" : t.border}`, borderRadius: 20, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 16, boxShadow: plan.highlight ? "0 16px 48px rgba(99,102,241,0.25)" : "none", transition: "all 0.22s" }}
                onMouseEnter={e => { if (!plan.highlight) { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.18)"; e.currentTarget.style.transform = "translateY(-3px)"; } }}
                onMouseLeave={e => { if (!plan.highlight) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; } }}
              >
                {plan.tag && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: plan.tag === "Most Popular" ? "linear-gradient(90deg,#6366f1,#4f46e5)" : "linear-gradient(90deg,#f59e0b,#d97706)", color: "#fff", borderRadius: 50, padding: "4px 18px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(0,0,0,0.3)" }}>
                    {plan.tag === "Most Popular" ? "⭐ Most Popular" : "💎 Best Value"}
                  </div>
                )}
                <div style={{ color: plan.highlight ? "#818cf8" : t.textAccent, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>{plan.label}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <div style={{ color: plan.highlight ? (isDark ? "#fff" : "#1e1040") : t.textPrimary, fontWeight: 900, fontSize: 42, lineHeight: 1 }}>
                    ₹{plan.price.toLocaleString()}
                  </div>
                  <div style={{ color: plan.highlight ? (isDark ? "rgba(255,255,255,0.55)" : "#6b7280") : t.textMuted, fontSize: 14, paddingBottom: 4 }}>{plan.period}</div>
                </div>
                {plan.original && (
                  <div style={{ color: t.textMuted, fontSize: 13, marginTop: -10 }}>
                    <span style={{ textDecoration: "line-through" }}>₹{plan.original.toLocaleString()}</span>
                    <span style={{ color: "#22c55e", fontWeight: 700, marginLeft: 8 }}>
                      Save ₹{(plan.original - plan.price).toLocaleString()}
                    </span>
                  </div>
                )}
                <p style={{ color: plan.highlight ? (isDark ? "rgba(255,255,255,0.65)" : "#4b5563") : t.textSecond, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{plan.desc}</p>
                <div style={{ borderTop: `1px solid ${plan.highlight ? "rgba(99,102,241,0.3)" : t.border}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {["40+ Live Classes / Month", "Full Past Recordings", "Practice Group Access", "Expert Q&A Sessions", "Monthly Certificate"].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, color: plan.highlight ? (isDark ? "rgba(255,255,255,0.75)" : "#374151") : t.textSecond, fontSize: 13 }}>
                      <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span>
                      {item}
                    </div>
                  ))}
                </div>
                <button onClick={() => { setSelectedPlan(plan.id); handleJoin(plan.id); }} disabled={loading || success}
                  style={{ marginTop: 4, width: "100%", background: success ? "linear-gradient(135deg,#22c55e,#16a34a)" : plan.highlight ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "transparent", border: plan.highlight || success ? "none" : `2px solid #6366f1`, color: plan.highlight || success ? "#fff" : "#6366f1", padding: "14px", borderRadius: 50, fontWeight: 800, fontSize: 15, cursor: loading || success ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: plan.highlight ? "0 6px 20px rgba(99,102,241,0.4)" : "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.background = "linear-gradient(135deg,#6366f1,#4f46e5)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.4)"; e.currentTarget.style.border = "none"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
                  onMouseLeave={e => { if (!plan.highlight && !success) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.border = "2px solid #6366f1"; } e.currentTarget.style.transform = "none"; }}>
                  {loading && selectedPlan === plan.id ? "Processing…" : success ? "✅ Subscribed!" : "Join Now →"}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
            {[["🔒","Secure Payment"],["⚡","Instant Access"],["🔄","Cancel Anytime"],["🌐","Online Anywhere"]].map(([ic,lb]) => (
              <span key={lb as string} style={{ color: t.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <span>{ic as string}</span>{lb as string}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHAT YOU GET ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", borderRadius: 50, padding: "4px 16px", fontSize: 12, fontWeight: 700 }}>
            WHAT'S INCLUDED
          </span>
          <h2 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(22px,3vw,36px)", margin: "14px 0 10px", letterSpacing: -0.5 }}>
            Everything You Get with Hypnosis 2.0
          </h2>
          <p style={{ color: t.textSecond, fontSize: 15, maxWidth: 580, margin: "0 auto", lineHeight: 1.7 }}>
            Designed to take you from knowing hypnosis to <strong style={{ color: t.textAccent }}>confidently practising it</strong> — with real clients, real sessions, and real results
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {BENEFITS.map((b) => (
            <div key={b.title}
              style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "24px 22px", display: "flex", alignItems: "flex-start", gap: 16, transition: "all 0.22s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.16)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                {b.icon}
              </div>
              <div>
                <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{b.title}</div>
                <div style={{ color: t.textMuted, fontSize: 13, lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── MODALITIES SECTION ── */}
        <div style={{ marginTop: 64, background: isDark ? "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(79,70,229,0.08))" : "linear-gradient(135deg,rgba(99,102,241,0.06),rgba(79,70,229,0.04))", border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "#c7d2fe"}`, borderRadius: 24, padding: "44px 36px" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h3 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(20px,2.5vw,30px)", marginBottom: 10, letterSpacing: -0.5 }}>
              Modalities Covered Every Month
            </h3>
            <p style={{ color: t.textSecond, fontSize: 14, maxWidth: 480, margin: "0 auto" }}>
              Our live calendar rotates across 12+ distinct hypnotherapy modalities so your skillset stays broad and deep
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {MODALITIES.map(m => (
              <span key={m} style={{ background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)", border: `1px solid ${isDark ? "rgba(99,102,241,0.35)" : "#a5b4fc"}`, color: isDark ? "#c7d2fe" : "#4338ca", borderRadius: 50, padding: "8px 18px", fontSize: 13, fontWeight: 700 }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* ── FINAL CTA ── */}
        <div style={{ marginTop: 64, textAlign: "center", background: isDark ? "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(13,148,136,0.1))" : "linear-gradient(135deg,rgba(99,102,241,0.08),rgba(13,148,136,0.04))", border: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#c7d2fe"}`, borderRadius: 24, padding: "52px 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🧠</div>
          <h3 style={{ color: t.textPrimary, fontWeight: 900, fontSize: "clamp(20px,3vw,34px)", marginBottom: 14, letterSpacing: -0.5 }}>
            Ready to Accelerate Your<br />Hypnotherapy Practice?
          </h3>
          <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.75, maxWidth: 560, margin: "0 auto 32px" }}>
            Join hundreds of practitioners who use Hypnosis 2.0 to stay sharp, stay current, and build the confidence to work with any client. Subscribe today and get instant access.
          </p>

          {/* Plan selector */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
            {PLANS.map(p => (
              <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                style={{ padding: "10px 22px", borderRadius: 50, fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "all 0.18s", border: `2px solid ${selectedPlan === p.id ? "#6366f1" : t.border}`, background: selectedPlan === p.id ? "rgba(99,102,241,0.15)" : "transparent", color: selectedPlan === p.id ? "#818cf8" : t.textSecond }}>
                {p.label} — ₹{p.price.toLocaleString()}
              </button>
            ))}
          </div>

          <button onClick={() => handleJoin()} disabled={loading || success}
            style={{ background: success ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff", padding: "18px 52px", borderRadius: 50, fontWeight: 800, fontSize: 18, cursor: loading || success ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 12, boxShadow: "0 10px 32px rgba(99,102,241,0.5)", transition: "all 0.2s" }}
            onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 42px rgba(99,102,241,0.65)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(99,102,241,0.5)"; }}>
            {loading ? "Processing…" : success ? "✅ Subscribed!" : `Join ${activePlan.label} — ₹${activePlan.price.toLocaleString()} →`}
          </button>
          {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 14 }}>{error}</div>}
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: isDark ? "rgba(10,9,20,0.96)" : "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", borderTop: `1px solid ${isDark ? "rgba(99,102,241,0.3)" : "#c7d2fe"}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100, transform: sticky ? "translateY(0)" : "translateY(100%)", transition: "transform 0.3s ease", boxShadow: "0 -8px 32px rgba(0,0,0,0.2)" }}>
        <div>
          <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 1 }}>Hypnosis 2.0 — Live Subscription</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {PLANS.map(p => (
              <button key={p.id} onClick={() => setSelectedPlan(p.id)}
                style={{ background: selectedPlan === p.id ? "rgba(99,102,241,0.18)" : "transparent", border: `1.5px solid ${selectedPlan === p.id ? "#6366f1" : t.border}`, color: selectedPlan === p.id ? "#818cf8" : t.textMuted, borderRadius: 50, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                {p.label} · ₹{p.price.toLocaleString()}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => handleJoin()} disabled={loading || success}
          style={{ background: success ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#6366f1,#4f46e5)", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 50, fontWeight: 800, fontSize: 14, cursor: loading || success ? "default" : "pointer", whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(99,102,241,0.4)", transition: "all 0.2s" }}
          onMouseEnter={e => { if (!loading && !success) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
          {loading ? "Processing…" : success ? "✅ Subscribed!" : "Join Now →"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Hypnosis2Page;
