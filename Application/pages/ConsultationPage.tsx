import React, { useEffect, useState, useMemo } from "react";
import { useThemeStore } from "../stores/themeStore";
import { useNavigate } from "react-router-dom";
import { HiOutlineStar, HiOutlineUsers, HiOutlineBadgeCheck } from "react-icons/hi";
import { FiMessageSquare, FiCalendar } from "react-icons/fi";
import ChatPanel from "../components/ChatPanel";
import client from "../api/client";
import { useAuthStore } from "../stores/authStore";

import pradeepKumarImg    from "../assets/IMG_8265.JPG.jpeg";
import geetaMakhijaniImg  from "../assets/geeta-makhijani.png";
import amitNarangImg      from "../assets/Amit-Narang.jpg.jpeg";
import naliniYadavImg     from "../assets/Nalini-J-Yadav.jpg.jpeg";
import vikasBhardwajImg   from "../assets/Vikas-Bhardwaj.jpg.jpeg";
import puneetJainImg      from "../assets/Dr.punnet jain.jpeg";
import vandanaKhuranaImg  from "../assets/Vandana khurana.jpeg";
import sumanBatraImg      from "../assets/suamn batra.jpeg";
import bijuBalkrishnanImg from "../assets/biju balkrishnan.png";
import ratnaSwantImg      from "../assets/dr. ratna sawant.jpeg";
import shrutiSaxenaImg    from "../assets/shruti saxena.jpeg";
import ankitVigImg        from "../assets/Ankit Vig.jpeg";
import deepikaHandaImg    from "../assets/deepika handa.jpeg";
import rajeshKumarImg     from "../assets/Rajesh kumar.jpeg";
import abhinnavKumarImg   from "../assets/Arishnav B Kumar.jpeg";

// Local image map — used for trainers whose photos are bundled locally
const LOCAL_IMAGES: Record<string, string> = {
  "dr. pradeep kumar":   pradeepKumarImg,
  "geeta makhijani":     geetaMakhijaniImg,
  "amit narang":         amitNarangImg,
  "nalini j. yadav":     naliniYadavImg,
  "nalini j yadav":      naliniYadavImg,
  "vikas bhardwaj":      vikasBhardwajImg,
  "dr. puneet jain":     puneetJainImg,
  "vandana khurana":     vandanaKhuranaImg,
  "dr. suman batra":     sumanBatraImg,
  "biju balkrishnan":    bijuBalkrishnanImg,
  "dr. ratna sawant":    ratnaSwantImg,
  "shruti saxena":       shrutiSaxenaImg,
  "ankit vig":           ankitVigImg,
  "deepika handa":       deepikaHandaImg,
  "rajesh kumar":        rajeshKumarImg,
  "abhinnav kumar":      abhinnavKumarImg,
};

// (booking options now come from DB per-trainer — no hardcoded list needed)

// All possible specialties for filter tabs
const SPECIALTIES = ["All","Hypnotherapy","Shadow Work","NLP Coaching","Spiritual Healing","Mind Wellness","Emotional Healing","Vastu Shastra","Autism Healing","Corporate Training"];
const LANGUAGES   = ["English","Hindi","Telugu"];

// DB trainer shape (from /chat/online-educators)
interface DBTrainer {
  _id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  trainerRole: string;
  trainerColor: string;
  specialties: string[];
  experience: string;
  sessionsDisplay: string;
  rating: number;
  followers: number;
  trainerLanguages: string[];
  isVerifiedBadge: boolean;
  sessionPricePaise: number;
  sessionRazorpayLink: string;
  canOfferSessions: boolean;
  hasPayBooking: boolean;
  hasApplyBooking: boolean;
}

// Merged expert shape used throughout the page
interface Expert {
  _id: string;
  name: string;
  role: string;      // trainerRole
  subject: string;   // primary specialty (first item)
  color: string;     // trainerColor
  img: string;       // local photo or avatar URL
  exp: string;       // experience
  sessions: string;  // sessionsDisplay
  rating: number;
  followers: number;
  languages: string[];
  verified: boolean;
  isOnline: boolean;
  sessionPricePaise: number;
  sessionRazorpayLink: string;
  canOfferSessions: boolean;
  hasPayBooking: boolean;
  hasApplyBooking: boolean;
  dbId: string;        // same as _id, passed to apply modal for the API call
}

// ─── Apply 1:1 Modal (for Dr. Pradeep & Geeta) ───────────────────────────────

const ApplyModal: React.FC<{ expert: Expert; onClose: () => void }> = ({ expert, onClose }) => {
  const { t } = useThemeStore();
  const { user } = useAuthStore();
  const [name, setName]           = useState(user?.name || "");
  const [phone, setPhone]         = useState(user?.phone || "");
  const [email, setEmail]         = useState(user?.email || "");
  const [issue, setIssue]         = useState("");
  const [preferred, setPreferred] = useState("");
  const [msg, setMsg]             = useState("");
  const [done, setDone]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !issue.trim()) return;
    setLoading(true); setError("");
    try {
      await client.post("/session-applications", {
        trainerId:    expert.dbId,
        trainerName:  expert.name,
        clientId:     user?._id,
        clientName:   name.trim(),
        clientEmail:  email.trim(),
        clientPhone:  phone.trim(),
        issue:        issue.trim(),
        preferredTime: preferred.trim(),
        message:      msg.trim(),
      });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width: "100%", background: t.bgInput, border: `1.5px solid ${t.border}`, borderRadius: 10, padding: "11px 14px", color: t.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,3,14,0.88)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div style={{ background: t.bgCard, border: `1px solid ${t.borderLight}`, borderRadius: 24, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: `0 32px 80px ${t.shadow}` }}>
        <div style={{ background: `linear-gradient(135deg,${expert.color}cc,${expert.color}88)`, padding: "22px 24px", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <img src={expert.img} alt={expert.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.6)" }} />
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{expert.name}</div>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Apply for 1:1 Private Session</div>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Application Sent!</div>
              <div style={{ color: t.textSecond, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                <strong style={{ color: t.textAccent }}>{expert.name}</strong> will personally reach out within 24 hours.
              </div>
              <button onClick={onClose} style={{ background: `linear-gradient(135deg,${expert.color},${expert.color}cc)`, border: "none", color: "#fff", padding: "11px 28px", borderRadius: 50, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Done</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <p style={{ color: t.textSecond, fontSize: 13, margin: "0 0 2px", lineHeight: 1.6 }}>
                Apply for a private 1:1 session with <strong style={{ color: t.textAccent }}>{expert.name}</strong>. Your request will be reviewed and a schedule will be proposed.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Full Name *" style={inp} />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number *" style={inp} />
              </div>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address (optional)" style={inp} />
              <textarea value={issue} onChange={e => setIssue(e.target.value)} rows={2} placeholder="What would you like to work on? (required) *" style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
              <input value={preferred} onChange={e => setPreferred(e.target.value)} placeholder="Preferred time slot (e.g. Weekday evenings 7–9 PM)" style={inp} />
              <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={2} placeholder="Anything else you'd like to share (optional)" style={{ ...inp, resize: "none", lineHeight: 1.5 }} />
              {error && <div style={{ color: "#f87171", fontSize: 12, background: "rgba(239,68,68,0.08)", borderRadius: 8, padding: "8px 12px" }}>⚠️ {error}</div>}
              <button onClick={submit} disabled={loading || !name.trim() || !phone.trim() || !issue.trim()}
                style={{ background: loading || !name.trim() || !phone.trim() || !issue.trim() ? t.textMuted : `linear-gradient(135deg,${expert.color},${expert.color}cc)`, border: "none", color: "#fff", padding: "13px", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading ? <><div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Sending…</> : "✋ Submit Application"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Expert Card ──────────────────────────────────────────────────────────────

interface CardProps {
  expert: Expert;
  onApply: () => void;
  onChat: () => void;
  onBook: () => void;
}

const ExpertCard: React.FC<CardProps> = ({ expert, onApply, onChat, onBook }) => {
  const { t, isDark } = useThemeStore();
  const showApply = expert.hasApplyBooking;
  const showPay   = expert.hasPayBooking;
  const isOnline  = expert.isOnline;
  const stars     = Math.round(expert.rating);

  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 16px", transition: "all 0.22s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = expert.color; e.currentTarget.style.boxShadow = `0 8px 28px ${expert.color}22`; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>

      {/* Photo + info */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 62, height: 62, borderRadius: "50%", border: `2.5px solid ${expert.color}`, overflow: "hidden" }}>
            <img src={expert.img} alt={expert.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          </div>
          {/* Online indicator: red pulsing = online, grey = offline */}
          <span style={{
            position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%",
            background: isOnline ? "#ef4444" : "#94a3b8",
            border: `2px solid ${t.bgCard}`,
            boxShadow: isOnline ? "0 0 0 2px rgba(239,68,68,0.4)" : "none",
            display: "block",
            animation: isOnline ? "redPulse 1.6s infinite" : "none",
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <span style={{ color: t.textPrimary, fontWeight: 800, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{expert.name}</span>
            {expert.verified && <HiOutlineBadgeCheck size={15} style={{ color: "#3b82f6", flexShrink: 0 }} />}
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{expert.role}</div>
          {expert.subject && <span style={{ background: `${expert.color}20`, border: `1px solid ${expert.color}50`, color: expert.color, borderRadius: 50, padding: "2px 9px", fontSize: 10, fontWeight: 700 }}>{expert.subject}</span>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10, background: isDark ? "rgba(255,255,255,0.03)" : t.bgTertiary, borderRadius: 10, padding: "8px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: t.textSecond, fontSize: 11 }}><span>⏱</span>{expert.exp || "—"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: t.textSecond, fontSize: 11 }}><HiOutlineUsers size={11} />{expert.sessions || "—"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: t.textSecond, fontSize: 11 }}><span>🌐</span>{expert.languages.slice(0,2).join(", ") || "—"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: t.textSecond, fontSize: 11 }}><span>👥</span>{expert.followers > 0 ? (expert.followers/1000).toFixed(1) + "k" : "—"}</div>
      </div>

      {/* Rating + price/status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {Array.from({ length: 5 }).map((_,i) => (
            <HiOutlineStar key={i} size={13} style={{ color: i < stars ? "#f59e0b" : t.border, fill: i < stars ? "#f59e0b" : "none" }} />
          ))}
          <span style={{ color: t.textSecond, fontSize: 12, marginLeft: 3 }}>{expert.rating}</span>
        </div>
        {showPay && (expert.sessionPricePaise ?? 0) > 0 && (
          <div style={{ textAlign: "right" }}>
            <span style={{ color: t.textPrimary, fontWeight: 800, fontSize: 14 }}>
              ₹{((expert.sessionPricePaise ?? 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
            <span style={{ color: t.textMuted, fontSize: 10 }}>/min</span>
          </div>
        )}
        {showApply && !showPay && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: isOnline ? "#ef4444" : "#94a3b8", display: "inline-block", animation: isOnline ? "redPulse 1.6s infinite" : "none" }} />
            <span style={{ color: isOnline ? "#ef4444" : t.textMuted, fontSize: 11, fontWeight: 600 }}>{isOnline ? "Online Now" : "Offline"}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {/* Apply for 1:1 button */}
        {showApply && (
          <button onClick={onApply} style={{ width: "100%", background: `linear-gradient(135deg,${expert.color},${expert.color}cc)`, border: "none", color: "#fff", padding: "10px", borderRadius: 50, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            ✋ Apply for 1:1 Session
          </button>
        )}
        {/* Pay / Chat / Book row */}
        {(showPay || !showApply) && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onChat} style={{ flex: 1, padding: "10px 8px", borderRadius: 50, border: `1.5px solid ${isOnline ? "#ef4444" : t.border}`, background: isOnline ? "rgba(239,68,68,0.08)" : "transparent", color: isOnline ? "#ef4444" : t.textSecond, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <FiMessageSquare size={13} />
              {isOnline ? "Chat (Online)" : "Chat"}
            </button>
            {showPay && (
              <button onClick={onBook} style={{ flex: 1, padding: "10px 8px", background: "linear-gradient(90deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", borderRadius: 50, cursor: "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, boxShadow: "0 3px 10px rgba(124,58,237,0.35)" }}>
                <FiCalendar size={13} /> Book
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ConsultationPage: React.FC = () => {
  const { t, isDark } = useThemeStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLangs, setSelectedLangs]       = useState<string[]>([]);
  const [onlineOnly, setOnlineOnly]             = useState(false);
  const [activeTab, setActiveTab]               = useState("All");
  const [applying, setApplying]                 = useState<Expert | null>(null);
  const [signupPhone, setSignupPhone]           = useState("");

  // Chat state
  const [chat, setChat] = useState<{ id: string; name: string; online: boolean } | null>(null);

  // Trainers loaded from DB
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loadedExperts, setLoadedExperts] = useState(false);

  // These 4 people always appear first in the hero circles (order matters)
  const HERO_PIN = ["pradeep", "geeta makhijani", "sindu", "puneet"];
  const heroPinIndex = (name: string) => {
    const lower = name.toLowerCase();
    const idx = HERO_PIN.findIndex(p => lower.includes(p));
    return idx; // -1 if not pinned
  };

  useEffect(() => {
    client.get("/chat/online-educators")
      .then(r => {
        const trainers: Expert[] = (r.data.educators || []).map((e: DBTrainer) => ({
          _id:               e._id,
          name:              e.name,
          role:              e.trainerRole || "",
          subject:           e.specialties?.[0] || "",
          color:             e.trainerColor || "#7c3aed",
          img:               LOCAL_IMAGES[e.name.toLowerCase()] || e.avatar || "",
          exp:               e.experience || "",
          sessions:          e.sessionsDisplay || "",
          rating:            e.rating || 0,
          followers:         e.followers || 0,
          languages:         e.trainerLanguages?.length ? e.trainerLanguages : ["English"],
          verified:          e.isVerifiedBadge || false,
          isOnline:          e.isOnline || false,
          sessionPricePaise: e.sessionPricePaise || 0,
          sessionRazorpayLink: e.sessionRazorpayLink || "",
          canOfferSessions:  e.canOfferSessions ?? true,
          hasPayBooking:     e.hasPayBooking ?? true,
          hasApplyBooking:   e.hasApplyBooking ?? false,
          dbId:              e._id,
        }));

        // Sort so Pradeep, Geeta, Sindu, Puneet always occupy the first 4 hero slots
        const sorted = [...trainers].sort((a, b) => {
          const ai = heroPinIndex(a.name);
          const bi = heroPinIndex(b.name);
          if (ai !== -1 && bi !== -1) return ai - bi;
          if (ai !== -1) return -1;
          if (bi !== -1) return 1;
          return 0;
        });

        setExperts(sorted);
      })
      .catch(() => {})
      .finally(() => setLoadedExperts(true));
  }, []);

  const toggleFilter = (arr: string[], val: string, set: (v: string[]) => void) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const filtered = useMemo(() => {
    return experts.filter(e => {
      if (activeTab !== "All" && e.subject !== activeTab) return false;
      if (selectedSubjects.length && !selectedSubjects.includes(e.subject)) return false;
      if (selectedLangs.length && !e.languages.some(l => selectedLangs.includes(l))) return false;
      if (onlineOnly && !e.isOnline) return false;
      return true;
    }).sort((a, b) => Number(b.isOnline) - Number(a.isOnline)); // online first
  }, [experts, activeTab, selectedSubjects, selectedLangs, onlineOnly]);

  // Derive filter tabs dynamically from loaded trainers (includes custom modalities)
  const allTabs = useMemo(() => {
    const base = SPECIALTIES.slice(1); // remove "All"
    const fromExperts = experts.map(e => e.subject).filter(Boolean);
    return ["All", ...Array.from(new Set([...base, ...fromExperts]))];
  }, [experts]);

  const handleChat = (expert: Expert) => {
    if (!expert._id) {
      alert(`${expert.name}'s chat will be available soon.`);
      return;
    }
    setChat({ id: expert._id, name: expert.name, online: expert.isOnline });
  };

  const handleBook = (expert: Expert) => {
    if (!user) { navigate("/login"); return; }
    navigate("/consult-book", { state: { expert, sessionPricePaise: expert.sessionPricePaise || 0 } });
  };

  const onlineCount = experts.filter(e => e.isOnline).length;

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh" }}>

      {/* Hero */}
      <div style={{ background: isDark ? "linear-gradient(135deg,#1a0533,#0d0824,#051a10)" : "linear-gradient(135deg,#f4f3ff,#ede9fe,#d1fae5)", padding: "40px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle,rgba(124,58,237,0.06) 1px,transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, position: "relative", flexWrap: "wrap" }}>
          <div style={{ maxWidth: 560 }}>
            {loadedExperts && onlineCount > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 40, padding: "5px 14px", marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "redPulse 1.5s infinite" }} />
                <span style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>{onlineCount} Healer{onlineCount !== 1 ? 's' : ''} Online Now</span>
              </div>
            )}
            <h1 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 900, margin: "0 0 12px", lineHeight: 1.15, color: t.textPrimary, letterSpacing: -1 }}>
              Talk To<br />
              <span style={{ background: "linear-gradient(90deg,#7c3aed,#ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Expert Healers</span>
            </h1>
            <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.7, marginBottom: 24, maxWidth: 420 }}>
              India's finest hypnotherapists, shadow work experts & NLP coaches. Deeply personal. Completely confidential.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={{ background: isDark ? "#fff" : "#111", color: isDark ? "#111" : "#fff", border: "none", padding: "14px 28px", borderRadius: 50, fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                onClick={() => document.getElementById("experts-grid")?.scrollIntoView({ behavior: "smooth" })}>
                Chat Free →
              </button>
              <button style={{ background: "transparent", border: `2px solid ${t.borderLight}`, color: t.textAccent, padding: "14px 24px", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                onClick={() => navigate("/register")}>
                Sign Up Free
              </button>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              {[["⭐","4.9 Avg Rating"],["🔒","100% Confidential"],["⚡","24hr Response"],["💬","Chat Free"]].map(([ic,lb]) => (
                <span key={lb} style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: t.textSecond, fontWeight: 600 }}>{ic} {lb}</span>
              ))}
            </div>
          </div>

          {/* Hero expert previews */}
          <div className="nav-desktop" style={{ display: "flex", gap: 14, flexShrink: 0 }}>
            {experts.slice(0,4).map((e, i) => (
              <div key={e.name} style={{ textAlign: "center", width: 84, animation: `heroFloat ${2 + i * 0.4}s ease-in-out infinite alternate` }}>
                <div style={{ position: "relative", width: 68, height: 68, margin: "0 auto" }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `3px solid ${e.color}`, overflow: "hidden" }}>
                    <img src={e.img} alt={e.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  </div>
                  {e.isOnline && <span style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: "#ef4444", border: `2px solid ${t.bgPrimary}`, display: "block", animation: "redPulse 1.5s infinite" }} />}
                </div>
                <div style={{ color: t.textMuted, fontSize: 10, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name.startsWith("Dr.") ? e.name.split(" ").slice(0, 2).join(" ") : e.name.split(" ")[0]}</div>
                {e.rating > 0 && <div style={{ color: "#f59e0b", fontSize: 9 }}>⭐ {e.rating}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signup strip */}
      <div style={{ background: isDark ? t.bgSecondary : "#fff", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "14px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <span style={{ color: t.textSecond, fontSize: 14 }}><strong style={{ color: t.textPrimary }}>Sign Up for Free</strong> to chat with India's best healers</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", background: t.bgInput }}>
              <span style={{ padding: "0 12px", color: t.textMuted, fontSize: 13, borderRight: `1px solid ${t.border}`, height: "100%", display: "flex", alignItems: "center" }}>🇮🇳 +91</span>
              <input value={signupPhone} onChange={e => setSignupPhone(e.target.value.replace(/\D/g,""))} placeholder="Mobile number" style={{ padding: "10px 14px", background: "none", border: "none", outline: "none", color: t.textPrimary, fontSize: 14, width: 160 }} />
            </div>
            <button onClick={() => navigate("/register")} style={{ background: "linear-gradient(90deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "10px 22px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              Sign Up →
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px", display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Filter Sidebar */}
        <aside className="nav-desktop" style={{ width: 220, flexShrink: 0, position: "sticky", top: 80 }}>
          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 16px" }}>
            <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 15, marginBottom: 16 }}>🎛 Filter</div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div onClick={() => setOnlineOnly(!onlineOnly)} style={{ width: 36, height: 20, borderRadius: 10, background: onlineOnly ? "#ef4444" : t.border, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 2, left: onlineOnly ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
                <span style={{ color: t.textSecond, fontSize: 13 }}>Online Only</span>
              </label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: t.textAccent, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Expertise</div>
              {allTabs.filter(s => s !== "All").map(s => (
                <label key={s} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedSubjects.includes(s)} onChange={() => toggleFilter(selectedSubjects, s, setSelectedSubjects)} style={{ accentColor: "#7c3aed", width: 14, height: 14 }} />
                  <span style={{ color: t.textSecond, fontSize: 13 }}>{s}</span>
                  <span style={{ color: t.textMuted, fontSize: 11, marginLeft: "auto" }}>({experts.filter(e => e.subject === s).length})</span>
                </label>
              ))}
            </div>
            <div>
              <div style={{ color: t.textAccent, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Language</div>
              {LANGUAGES.map(l => (
                <label key={l} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedLangs.includes(l)} onChange={() => toggleFilter(selectedLangs, l, setSelectedLangs)} style={{ accentColor: "#7c3aed", width: 14, height: 14 }} />
                  <span style={{ color: t.textSecond, fontSize: 13 }}>{l}</span>
                </label>
              ))}
            </div>
            {(selectedSubjects.length > 0 || selectedLangs.length > 0 || onlineOnly) && (
              <button onClick={() => { setSelectedSubjects([]); setSelectedLangs([]); setOnlineOnly(false); }}
                style={{ marginTop: 14, width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Clear Filters
              </button>
            )}
          </div>
        </aside>

        {/* Expert Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
            {allTabs.map(tab => {
              const active = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: "7px 16px", borderRadius: 50, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500, whiteSpace: "nowrap", transition: "all 0.15s", border: `1.5px solid ${active ? "#7c3aed" : t.border}`, background: active ? "rgba(124,58,237,0.14)" : "transparent", color: active ? t.accentLight : t.textSecond }}>
                  {tab}{tab !== "All" && <span style={{ marginLeft: 5, opacity: 0.6 }}>({experts.filter(e => e.subject === tab).length})</span>}
                </button>
              );
            })}
          </div>

          {/* Section heading */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }} id="experts-grid">
            <div>
              <h2 style={{ color: t.textPrimary, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
                {activeTab === "All" ? "All Expert Healers" : activeTab}
              </h2>
              <p style={{ color: t.textMuted, fontSize: 13, margin: 0 }}>
                {filtered.length} experts · {filtered.filter(e => e.isOnline).length} online now
              </p>
            </div>
            <span style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 50, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>
              ● {filtered.filter(e => e.isOnline).length} Live
            </span>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {filtered.map(expert => (
                <ExpertCard
                  key={expert.name}
                  expert={expert}
                  onApply={() => setApplying(expert)}
                  onChat={() => handleChat(expert)}
                  onBook={() => handleBook(expert)}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: t.textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p>No experts match your filters.</p>
            </div>
          )}

          {/* Bottom CTA */}
          <div style={{ marginTop: 40, background: isDark ? "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(13,148,136,0.1))" : "linear-gradient(135deg,rgba(124,58,237,0.07),rgba(13,148,136,0.05))", border: `1px solid ${t.border}`, borderRadius: 20, padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🙏</div>
            <h3 style={{ color: t.textPrimary, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Not sure which expert is right for you?</h3>
            <p style={{ color: t.textSecond, fontSize: 14, marginBottom: 20 }}>Chat with us free and we'll match you with the perfect healer for your journey.</p>
            <button onClick={() => { if (experts[0]) setApplying(experts[0]); }} style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "13px 32px", borderRadius: 50, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: "0 6px 20px rgba(124,58,237,0.4)" }}>
              ✨ Get Matched For Free
            </button>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {applying && <ApplyModal expert={applying} onClose={() => setApplying(null)} />}

      {/* Chat panel */}
      {chat && (
        <ChatPanel
          trainerId={chat.id}
          trainerName={chat.name}
          trainerOnline={chat.online}
          onClose={() => setChat(null)}
        />
      )}

      <style>{`
        @keyframes redPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50%      { box-shadow: 0 0 0 5px rgba(239,68,68,0); }
        }
        @keyframes heroFloat { from{transform:translateY(0)} to{transform:translateY(-8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
};

export default ConsultationPage;
