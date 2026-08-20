import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useThemeStore } from "../stores/themeStore";
import seedhiBaatImg from "../assets/seedhi-baat.jpeg";
import pradeepKumarImg from "../assets/IMG_8265.JPG.jpeg";
import geetaMakhijaniImg from "../assets/geeta-makhijani.png";
import puneetJainImg from "../assets/Dr.punnet jain.jpeg";
import vandanaKhuranaImg from "../assets/Vandana khurana.jpeg";
import sumanBatraImg from "../assets/suamn batra.jpeg";
import bijuBalkrishnanImg from "../assets/biju balkrishnan.png";
import ratnaSwantImg from "../assets/dr. ratna sawant.jpeg";
import shrutiSaxenaImg from "../assets/shruti saxena.jpeg";
import ankitVigImg from "../assets/Ankit Vig.jpeg";
import deepikaHandaImg from "../assets/deepika handa.jpeg";
import rajeshKumarImg from "../assets/Rajesh kumar.jpeg";
import abhinnavKumarImg from "../assets/Arishnav B Kumar.jpeg";
import naliniYadavImg from "../assets/Nalini-J-Yadav.jpg.jpeg";
import vikasBhardwajImg from "../assets/Vikas-Bhardwaj.jpg.jpeg";

// ─── Data ──────────────────────────────────────────────────────────────────

const EXPERTS = [
  {
    name: "Dr. Pradeep Kumar",
    role: "Clinical Hypnotherapist & NLP Master",
    exp: "20+ Years",
    sessions: "5,000+",
    rating: 4.9,
    img: seedhiBaatImg,
    badge: "MASTER",
    specialties: ["Deep Trance", "Subconscious Reprogramming", "NLP", "Past Life"],
    color: "#7c3aed",
  },
  {
    name: "Geeta Makhijani",
    role: "Shadow Work & Emotional Healing Expert",
    exp: "15+ Years",
    sessions: "3,200+",
    rating: 4.8,
    img: geetaMakhijaniImg,
    badge: "MASTER",
    specialties: ["Inner Child", "Trauma Release", "Mirror Work", "Shadow Work"],
    color: "#0d9488",
  },
];

const TRAINERS = [
  {
    name: "Dr. Pradeep Kumar",
    role: "Clinical Hypnotherapist & NLP Master",
    subject: "Hypnotherapy",
    subjectColor: "#7c3aed",
    exp: "20+ Years",
    sessions: "5,000+",
    rating: 4.9,
    img: pradeepKumarImg,
    badge: "POPULAR",
    bg: "linear-gradient(135deg,#1e1044 0%,#3b0764 100%)",
    specialties: ["Deep Trance", "Subconscious Reprogramming", "NLP", "Past Life"],
    imgPosition: "top center",
    imgSize: 130,
    photoHeight: 190,
  },
  {
    name: "Geeta Makhijani",
    role: "Shadow Work & Emotional Healing Expert",
    subject: "Shadow Work",
    subjectColor: "#0d9488",
    exp: "15+ Years",
    sessions: "3,200+",
    rating: 4.8,
    img: geetaMakhijaniImg,
    badge: "POPULAR",
    bg: "linear-gradient(135deg,#042f2e 0%,#134e4a 100%)",
    specialties: ["Inner Child", "Trauma Release", "Mirror Work", "Shadow Work"],
  },
  {
    name: "Nalini J. Yadav",
    role: "Emotional Healing Expert",
    subject: "Shadow Work",
    subjectColor: "#0d9488",
    exp: "14+ Years",
    sessions: "3,500+",
    rating: 4.8,
    img: naliniYadavImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#042f2e 0%,#134e4a 100%)",
    specialties: ["Inner Child", "Trauma Release", "Shadow Work", "Women's Healing"],
  },
  {
    name: "Vikas Bhardwaj",
    role: "NLP & Life Transformation Coach",
    subject: "NLP Coaching",
    subjectColor: "#2563eb",
    exp: "12+ Years",
    sessions: "2,800+",
    rating: 4.9,
    img: vikasBhardwajImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#0c1a3d 0%,#1e3a8a 100%)",
    specialties: ["NLP", "Life Coaching", "Success Mindset", "Confidence Building"],
  },
  {
    name: "Dr. Puneet Jain",
    role: "Autism & Special Needs Expert",
    subject: "Autism Healing",
    subjectColor: "#059669",
    exp: "10+ Years",
    sessions: "2,100+",
    rating: 4.9,
    img: puneetJainImg,
    badge: "EXPERT",
    bg: "linear-gradient(135deg,#022c22 0%,#064e3b 100%)",
    specialties: ["Autism Spectrum", "Child Development", "Behavioural Therapy", "Family Support"],
    imgPosition: "top center",
  },
  {
    name: "Vandana Khurana",
    role: "Mind Healing & Wellness Coach",
    subject: "Mind Wellness",
    subjectColor: "#be185d",
    exp: "16+ Years",
    sessions: "3,800+",
    rating: 4.8,
    img: vandanaKhuranaImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#3b0a20 0%,#831843 100%)",
    specialties: ["Mind Healing", "Stress Relief", "Wellness Coaching", "Emotional Balance"],
    imgPosition: "top center",
  },
  {
    name: "Dr. Suman Batra",
    role: "Hypnotherapy & Spiritual Healing Expert",
    subject: "Spiritual Healing",
    subjectColor: "#9333ea",
    exp: "13+ Years",
    sessions: "2,600+",
    rating: 4.9,
    img: sumanBatraImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#2e1065 0%,#4c1d95 100%)",
    specialties: ["Spiritual Healing", "Hypnotherapy", "Chakra Balancing", "Past Life Regression"],
    imgPosition: "top center",
  },
  {
    name: "Biju Balkrishnan",
    role: "Corporate Trainer & Leadership Coach",
    subject: "Corporate Training",
    subjectColor: "#1d4ed8",
    exp: "15+ Years",
    sessions: "3,000+",
    rating: 4.9,
    img: bijuBalkrishnanImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)",
    specialties: ["Leadership", "Corporate Wellness", "Team Dynamics", "Executive Coaching"],
    imgPosition: "top center",
  },
  {
    name: "Dr. Ratna Sawant",
    role: "Clinical Hypnotherapist",
    subject: "Hypnotherapy",
    subjectColor: "#7c3aed",
    exp: "17+ Years",
    sessions: "4,000+",
    rating: 4.9,
    img: ratnaSwantImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#1e1044 0%,#3b0764 100%)",
    specialties: ["Clinical Hypnosis", "Regression Therapy", "Anxiety Relief", "Subconscious Healing"],
    imgPosition: "top center",
  },
  {
    name: "Shruti Saxena",
    role: "Emotional Healing & Wellness Coach",
    subject: "Emotional Healing",
    subjectColor: "#db2777",
    exp: "11+ Years",
    sessions: "2,400+",
    rating: 4.8,
    img: shrutiSaxenaImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#3b0a20 0%,#831843 100%)",
    specialties: ["Emotional Healing", "Stress Relief", "Inner Child", "Women's Wellness"],
    imgPosition: "top center",
  },
  {
    name: "Ankit Vig",
    role: "NLP Coach & Motivational Speaker",
    subject: "NLP Coaching",
    subjectColor: "#2563eb",
    exp: "10+ Years",
    sessions: "2,200+",
    rating: 4.9,
    img: ankitVigImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#0c1a3d 0%,#1e3a8a 100%)",
    specialties: ["NLP", "Motivation", "Confidence Building", "Peak Performance"],
    imgPosition: "top center",
  },
  {
    name: "Deepika Handa",
    role: "Hypnotherapy & Mind Wellness Coach",
    subject: "Mind Wellness",
    subjectColor: "#0891b2",
    exp: "9+ Years",
    sessions: "1,800+",
    rating: 4.8,
    img: deepikaHandaImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#0c2340 0%,#0e4f6e 100%)",
    specialties: ["Hypnotherapy", "Mind Wellness", "Anxiety Relief", "Self-Confidence"],
    imgPosition: "top center",
  },
  {
    name: "Rajesh Kumar",
    role: "Vastu Master & Energy Healing Expert",
    subject: "Vastu Shastra",
    subjectColor: "#d97706",
    exp: "12+ Years",
    sessions: "2,500+",
    rating: 4.9,
    img: rajeshKumarImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#1c0f00 0%,#451a03 100%)",
    specialties: ["Vastu Shastra", "Energy Healing", "Space Alignment", "Feng Shui"],
    imgPosition: "top center",
  },
  {
    name: "Abhinnav Kumar",
    role: "Hypnotherapy & Transformation Coach",
    subject: "Hypnotherapy",
    subjectColor: "#7c3aed",
    exp: "8+ Years",
    sessions: "1,600+",
    rating: 4.8,
    img: abhinnavKumarImg,
    badge: "MASTER TRAINER",
    bg: "linear-gradient(135deg,#1e1044 0%,#3b0764 100%)",
    specialties: ["Hypnotherapy", "Mind Transformation", "Stress Relief", "Self-Mastery"],
    imgPosition: "top center",
  },
];

const ISSUE_TAGS = [
  "Anxiety & Stress", "Depression", "Relationship Issues", "Trauma & Wounds",
  "Sleep Problems", "Fear & Phobias", "Anger Management", "Low Confidence",
  "Career Block", "Grief & Loss", "Childhood Healing", "Spiritual Growth",
  "Physical Pain", "Addiction", "Exam Fear", "Family Conflict",
];

const PROCESS_STEPS = [
  { num: "01", icon: "📋", title: "Fill the Form", desc: "Share your name, contact, date of birth & what you're going through" },
  { num: "02", icon: "📞", title: "Expert Connects", desc: "Our healer personally reviews your details and calls within 24 hours" },
  { num: "03", icon: "✨", title: "Heal & Transform", desc: "Attend your personalized 1-on-1 session and feel the shift" },
];

const BENEFITS = [
  { icon: "🔒", title: "100% Confidential", desc: "Everything shared stays strictly private" },
  { icon: "🎯", title: "Deeply Personalized", desc: "Session tailored to your unique soul journey" },
  { icon: "⚡", title: "Felt in First Session", desc: "Notice inner shifts from the very first hour" },
  { icon: "🌍", title: "Online & Offline", desc: "Connect from anywhere on the planet" },
];

// ─── Floating orb component ────────────────────────────────────────────────
const Orb: React.FC<{ top: string; left?: string; right?: string; size: number; color: string; anim: string; delay: string; opacity: number }> =
  ({ top, left, right, size, color, anim, delay, opacity }) => (
    <div style={{
      position: "absolute", top, left, right,
      width: size, height: size, borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      animation: `${anim} 8s ease-in-out infinite`,
      animationDelay: delay,
      opacity,
      pointerEvents: "none",
      filter: "blur(1px)",
    }} />
  );

// ─── Star particles ────────────────────────────────────────────────────────
const STARS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 3 + 1,
  delay: `${Math.random() * 4}s`,
  dur: `${Math.random() * 3 + 2}s`,
}));

// ─── Form ─────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  phone: string;
  dob: string;
  selectedIssues: string[];
  detail: string;
  preferredTime: string;
}

const EMPTY_FORM: FormData = {
  name: "", email: "", phone: "", dob: "",
  selectedIssues: [], detail: "", preferredTime: "",
};

const BookingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, isDark } = useThemeStore();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const toggleIssue = (tag: string) => {
    setForm(f => ({
      ...f,
      selectedIssues: f.selectedIssues.includes(tag)
        ? f.selectedIssues.filter(i => i !== tag)
        : [...f.selectedIssues, tag],
    }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email required";
    if (!form.dob) e.dob = "Date of birth required";
    if (form.selectedIssues.length === 0) e.selectedIssues = "Select at least one concern";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep("loading");
    // TODO: wire to POST /api/private-sessions
    await new Promise(r => setTimeout(r, 1800));
    setStep("success");
  };

  const set = (key: keyof FormData) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: t.bgInput, border: `1.5px solid ${t.border}`,
    borderRadius: 10, padding: "12px 14px", color: t.textPrimary, fontSize: 14,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  };
  const labelStyle: React.CSSProperties = { color: t.textAccent, fontSize: 12, fontWeight: 700, marginBottom: 6, display: "block", letterSpacing: 0.4 };
  const errStyle: React.CSSProperties = { color: "#f87171", fontSize: 11, marginTop: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,3,14,0.94)", backdropFilter: "blur(18px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16, overflowY: "auto" }}>
      <div style={{ background: isDark ? "linear-gradient(160deg,#0d0c1d,#1a0f2e)" : t.bgCard, border: `1px solid ${t.borderLight}`, borderRadius: 28, width: "100%", maxWidth: 560, animation: "modalSlideUp 0.35s ease", boxShadow: "0 40px 100px rgba(0,0,0,0.85), 0 0 60px rgba(124,58,237,0.15)", overflow: "hidden", position: "relative" }}>

        {/* Header gradient strip */}
        <div style={{ background: "linear-gradient(135deg,#3b0764,#1e1b4b,#064e3b)", padding: "28px 28px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, zIndex: 1 }}>✕</button>
          <div style={{ position: "relative" }}>
            <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#e9d5ff", fontWeight: 700, letterSpacing: 0.5 }}>✦ PRIVATE SESSION</span>
            <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "10px 0 4px", letterSpacing: -0.4 }}>Book Your 1-on-1 Healing</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, margin: 0 }}>Our expert healer will personally reach out within 24 hours</p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px", maxHeight: "70vh", overflowY: "auto" }}>

          {step === "loading" && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", border: "4px solid #7c3aed", borderTopColor: "transparent", animation: "spin 0.9s linear infinite", margin: "0 auto 20px" }} />
              <p style={{ color: t.textAccent, fontSize: 16, fontWeight: 700 }}>Submitting your request…</p>
              <p style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>Please wait a moment</p>
            </div>
          )}

          {step === "success" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#10b981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", animation: "successBounce 0.6s ease", boxShadow: "0 0 40px rgba(16,185,129,0.4)" }}>
                <span style={{ fontSize: 38 }}>✓</span>
              </div>
              <h3 style={{ color: t.textPrimary, fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Request Sent! 🎉</h3>
              <p style={{ color: t.textSecond, fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 24px" }}>
                Thank you, <strong style={{ color: "#a78bfa" }}>{form.name}</strong>!<br />
                Our healer will personally connect with you at <strong style={{ color: "#a78bfa" }}>{form.email}</strong> within 24 hours.
              </p>
              <div style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 14, padding: "14px 20px", marginBottom: 24 }}>
                <p style={{ color: "#c4b5fd", fontSize: 13, margin: 0 }}>🙏 Your session details have been received. Prepare yourself for a transformational experience.</p>
              </div>
              <button onClick={onClose} style={{ background: "linear-gradient(90deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", padding: "12px 32px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>Done</button>
            </div>
          )}

          {step === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Row: Name + Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={form.name} onChange={e => set("name")(e.target.value)} placeholder="Your full name" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#7c3aed")} onBlur={e => (e.target.style.borderColor = t.border)} />
                  {errors.name && <p style={errStyle}>{errors.name}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input value={form.phone} onChange={e => set("phone")(e.target.value)} placeholder="+91 XXXXX XXXXX" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#7c3aed")} onBlur={e => (e.target.style.borderColor = t.border)} />
                </div>
              </div>

              {/* Row: Email + DOB */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" value={form.email} onChange={e => set("email")(e.target.value)} placeholder="you@example.com" style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = "#7c3aed")} onBlur={e => (e.target.style.borderColor = t.border)} />
                  {errors.email && <p style={errStyle}>{errors.email}</p>}
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth *</label>
                  <input type="date" value={form.dob} onChange={e => set("dob")(e.target.value)} style={{ ...inputStyle, colorScheme: isDark ? "dark" : "light" }}
                    onFocus={e => (e.target.style.borderColor = "#7c3aed")} onBlur={e => (e.target.style.borderColor = t.border)} />
                  {errors.dob && <p style={errStyle}>{errors.dob}</p>}
                </div>
              </div>

              {/* Issue tags */}
              <div>
                <label style={labelStyle}>What are you struggling with? * <span style={{ color: "#6b7280", fontWeight: 400 }}>(select all that apply)</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ISSUE_TAGS.map(tag => {
                    const sel = form.selectedIssues.includes(tag);
                    return (
                      <button key={tag} onClick={() => toggleIssue(tag)}
                        style={{ padding: "7px 14px", borderRadius: 50, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s", border: sel ? "1.5px solid #7c3aed" : `1.5px solid ${t.border}`, background: sel ? "rgba(124,58,237,0.25)" : "transparent", color: sel ? t.textAccent : t.textSecond }}>
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {errors.selectedIssues && <p style={errStyle}>{errors.selectedIssues}</p>}
              </div>

              {/* Detail textarea */}
              <div>
                <label style={labelStyle}>Describe your situation <span style={{ color: "#6b7280", fontWeight: 400 }}>(optional but helps us prepare)</span></label>
                <textarea value={form.detail} onChange={e => set("detail")(e.target.value)} placeholder="Share anything you feel comfortable with — the more context, the more personalized your session…" rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                  onFocus={e => (e.target.style.borderColor = "#7c3aed")} onBlur={e => (e.target.style.borderColor = t.border)} />
              </div>

              {/* Preferred time */}
              <div>
                <label style={labelStyle}>Preferred Session Time</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {["Morning (8-12)", "Afternoon (12-5)", "Evening (5-9)"].map(timeSlot => {
                    const sel = form.preferredTime === timeSlot;
                    return (
                      <button key={timeSlot} onClick={() => setForm(f => ({ ...f, preferredTime: sel ? "" : timeSlot }))}
                        style={{ padding: "9px 8px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, border: sel ? "1.5px solid #7c3aed" : `1.5px solid ${t.border}`, background: sel ? "rgba(124,58,237,0.22)" : "transparent", color: sel ? t.textAccent : t.textSecond, transition: "all 0.15s" }}>
                        {timeSlot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy note */}
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: isDark ? "rgba(255,255,255,0.03)" : t.bgTertiary, borderRadius: 10, border: `1px solid ${t.border}` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>🔒</span>
                <p style={{ color: t.textMuted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Your information is 100% confidential. We never share your details with anyone outside of BSH's healing team.</p>
              </div>

              {/* Submit */}
              <button onClick={handleSubmit}
                style={{ background: "linear-gradient(90deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", padding: "15px 32px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 800, width: "100%", animation: "ctaPulse 2.5s ease-in-out infinite", letterSpacing: 0.3 }}>
                ✨ Book My Private Healing Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── PrivateSession (main export) ─────────────────────────────────────────

const PrivateSession: React.FC = () => {
  const navigate = useNavigate();
  const { t, isDark } = useThemeStore();
  const [modalOpen, setModalOpen] = useState(false);
  const trainersRef = useRef<HTMLDivElement>(null);
  const [activeNames, setActiveNames] = useState<Set<string> | null>(null);

  useEffect(() => {
    client.get("/chat/online-educators")
      .then(r => {
        const names: string[] = ((r.data as any).educators || []).map((e: any) => (e.name as string).toLowerCase());
        setActiveNames(new Set(names));
      })
      .catch(() => {
        setActiveNames(new Set(TRAINERS.map(tr => tr.name.toLowerCase())));
      });
  }, []);

  // null = loading (show nothing to avoid flash of paused trainers)
  const visibleTrainers = activeNames === null
    ? []
    : TRAINERS.filter(tr => activeNames.has(tr.name.toLowerCase()));

  const scrollTrainers = (dir: "left" | "right") => {
    if (trainersRef.current) {
      trainersRef.current.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" });
    }
  };

  return (
    <>
      <section id="healing-sessions" style={{ position: "relative", overflow: "hidden", padding: "80px 24px", background: isDark ? "linear-gradient(160deg,#040312 0%,#0d0824 40%,#0c1a14 100%)" : "linear-gradient(160deg,#f4f3ff 0%,#ede9fe 40%,#ddd6fe 100%)" }}>

        {/* ── Floating orbs ── */}
        <Orb top="10%" left="5%"  size={320} color="rgba(124,58,237,0.18)" anim="orbFloat1" delay="0s"   opacity={0.8} />
        <Orb top="50%" right="4%" size={260} color="rgba(13,148,136,0.18)" anim="orbFloat2" delay="2s"   opacity={0.7} />
        <Orb top="70%" left="30%" size={200} color="rgba(79,172,254,0.12)" anim="orbFloat3" delay="1.2s" opacity={0.6} />
        <Orb top="5%"  right="25%" size={150} color="rgba(246,211,101,0.1)" anim="orbFloat1" delay="3s"  opacity={0.5} />

        {/* ── Star particles ── */}
        {STARS.map(s => (
          <div key={s.id} style={{
            position: "absolute", top: s.top, left: s.left,
            width: s.size, height: s.size, borderRadius: "50%",
            background: "#fff", pointerEvents: "none",
            animation: `starTwinkle ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
          }} />
        ))}

        {/* ── Top decorative border ── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #7c3aed, #0d9488, transparent)" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>

          {/* ── Section pill ── */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)", borderRadius: 40, padding: "7px 18px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa", display: "inline-block", animation: "pulse 1.8s infinite" }} />
              <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700, letterSpacing: 0.4 }}>One-on-One with India's Best Healers</span>
            </div>
          </div>

          {/* ── Trainer Cards ── */}
          <div style={{ marginBottom: 40 }}>
            {/* Banner header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: t.textPrimary, margin: "0 0 4px" }}>Meet Your Personal Healers</h3>
                <p style={{ color: t.textMuted, fontSize: 13, margin: 0 }}>Hand-picked masters — each session is 1-on-1, deeply personal</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setModalOpen(true)} style={{ background: "none", border: "none", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  BOOK SESSION →
                </button>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["left", "right"] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => scrollTrainers(dir)}
                      style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${t.borderLight}`, background: "none", cursor: "pointer", color: t.textAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.borderColor = "#7c3aed"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = t.borderLight; }}
                    >
                      {dir === "left" ? "‹" : "›"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cards row */}
            <div ref={trainersRef} style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
              {visibleTrainers.map((trainer) => (
                <div
                  key={trainer.name}
                  onClick={() => setModalOpen(true)}
                  style={{ minWidth: 220, maxWidth: 220, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", flexShrink: 0, transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.6), 0 0 20px ${trainer.subjectColor}33`; e.currentTarget.style.borderColor = trainer.subjectColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = t.border; }}
                >
                  {/* Photo area */}
                  <div style={{ position: "relative", height: (trainer as any).photoHeight ?? 160, background: trainer.bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img
                      src={trainer.img}
                      alt={trainer.name}
                      style={{ width: (trainer as any).imgSize ?? 100, height: (trainer as any).imgSize ?? 100, borderRadius: "50%", objectFit: "cover", objectPosition: (trainer as any).imgPosition ?? "top center", border: `3px solid ${trainer.subjectColor}66`, zIndex: 1, boxShadow: `0 0 24px ${trainer.subjectColor}55` }}
                    />
                    {/* Glow */}
                    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, ${trainer.subjectColor}22 0%, transparent 70%)` }} />
                    {/* Badge */}
                    <div style={{ position: "absolute", top: 10, left: 10, background: trainer.badge === "POPULAR" ? "linear-gradient(90deg,#d97706,#f59e0b)" : `${trainer.subjectColor}cc`, borderRadius: 6, padding: "3px 8px", backdropFilter: "blur(4px)", boxShadow: trainer.badge === "POPULAR" ? "0 0 12px rgba(245,158,11,0.5)" : "none" }}>
                      <span style={{ color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 0.8 }}>★ {trainer.badge}</span>
                    </div>
                    {/* Rating */}
                    <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.7)", borderRadius: 8, padding: "3px 8px", backdropFilter: "blur(4px)" }}>
                      <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>⭐ {trainer.rating}</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: "14px 14px 16px" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: trainer.subjectColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: trainer.subjectColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{trainer.subject}</span>
                    </div>
                    <p style={{ color: t.textPrimary, fontSize: 14, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.3 }}>{trainer.name}</p>
                    <p style={{ color: t.textSecond, fontSize: 11, margin: "0 0 10px", lineHeight: 1.4 }}>{trainer.role}</p>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 800 }}>{trainer.exp}</div>
                        <div style={{ color: t.textMuted, fontSize: 10 }}>Experience</div>
                      </div>
                      <div style={{ width: 1, background: t.border }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 800 }}>{trainer.sessions}</div>
                        <div style={{ color: t.textMuted, fontSize: 10 }}>Sessions</div>
                      </div>
                    </div>
                    {/* Specialty tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {trainer.specialties.slice(0, 2).map(s => (
                        <span key={s} style={{ fontSize: 10, color: t.textSecond, background: isDark ? "rgba(255,255,255,0.05)" : t.bgTertiary, border: `1px solid ${t.border}`, borderRadius: 4, padding: "2px 7px" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Central CTA ── */}
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-block", position: "relative" }}>
              {/* Glow behind button */}
              <div style={{ position: "absolute", inset: -8, borderRadius: 20, background: "radial-gradient(ellipse,rgba(124,58,237,0.4) 0%,transparent 70%)", filter: "blur(8px)", zIndex: 0 }} />
              <button
                onClick={() => navigate("/consultation")}
                style={{ position: "relative", zIndex: 1, background: "linear-gradient(135deg,#7c3aed,#6d28d9,#0d9488)", border: "none", color: "#fff", padding: "18px 52px", borderRadius: 16, cursor: "pointer", fontSize: 17, fontWeight: 900, letterSpacing: 0.3, animation: "ctaPulse 2.5s ease-in-out infinite", display: "inline-flex", alignItems: "center", gap: 12 }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                <span style={{ fontSize: 22 }}>✨</span>
                Book My Private Healing Session
                <span style={{ fontSize: 18 }}>→</span>
              </button>
            </div>
            <p style={{ color: t.textMuted, fontSize: 13, marginTop: 16 }}>Free consultation call · No commitment · Results guaranteed</p>
          </div>

        </div>

        {/* Bottom decorative border */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#0d9488,#7c3aed,transparent)" }} />
      </section>

      {modalOpen && <BookingModal onClose={() => setModalOpen(false)} />}
    </>
  );
};

export default PrivateSession;
