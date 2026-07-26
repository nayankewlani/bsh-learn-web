import React, { useEffect, useRef, useState } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import { useAuthStore } from "../stores/authStore";
import client from "../api/client";
import HealingToolModal from "./HealingToolModal";

declare global {
  interface Window { Razorpay: new (opts: unknown) => { open(): void }; }
}

// ─── Types & Data ──────────────────────────────────────────────────────────

const HEALING_CATEGORIES = ["All", "Breathing", "Focus", "Sleep", "Healing", "Student"];
const CAT_ICONS: Record<string, string> = {
  All: "✨", Breathing: "🫁", Focus: "⏱️", Sleep: "🌙", Healing: "💛", Student: "🎓",
};

interface HealTool {
  id: number; category: string; title: string; desc: string;
  icon: string; duration: string; type: string; free: boolean;
  gradient: [string, string]; interactive?: "breathing" | "pomodoro";
}

const HEALING_TOOLS: HealTool[] = [
  { id: 1,  category: "Breathing", title: "Box Breathing",             desc: "4-4-4-4 technique for instant calm & anxiety relief",              icon: "🫁", duration: "5 min",  type: "INTERACTIVE", free: true,  gradient: ["#4facfe","#00f2fe"], interactive: "breathing"  },
  { id: 2,  category: "Breathing", title: "Deep Belly Breathing",      desc: "Activate parasympathetic nervous system for deep calm",            icon: "🌬️", duration: "7 min",  type: "GUIDED",      free: true,  gradient: ["#43e97b","#38f9d7"]                            },
  { id: 3,  category: "Focus",     title: "Pomodoro Focus Timer",      desc: "25+5 deep work cycles with focus affirmations & streaks",          icon: "⏱️", duration: "25 min", type: "TIMER",       free: true,  gradient: ["#fa709a","#fee140"], interactive: "pomodoro"   },
  { id: 4,  category: "Healing",   title: "Gratitude Meditation",      desc: "5-minute heart-opening gratitude practice to shift your energy",   icon: "🙏", duration: "5 min",  type: "AUDIO",       free: true,  gradient: ["#f6d365","#fda085"]                            },
  { id: 5,  category: "Breathing", title: "4-7-8 Sleep Breathing",     desc: "Dr. Weil's proven technique to fall asleep in minutes",            icon: "🌙", duration: "10 min", type: "GUIDED",      free: false, gradient: ["#667eea","#764ba2"]                            },
  { id: 6,  category: "Breathing", title: "Alternate Nostril",         desc: "Ancient Pranayama for left-right brain hemisphere balance",         icon: "🧘", duration: "8 min",  type: "GUIDED",      free: false, gradient: ["#f093fb","#f5576c"]                            },
  { id: 7,  category: "Healing",   title: "Inner Child Healing",       desc: "Deep hypnotic journey to heal childhood wounds & trauma",          icon: "💛", duration: "20 min", type: "HYPNOSIS",    free: false, gradient: ["#4facfe","#43e97b"]                            },
  { id: 8,  category: "Healing",   title: "Fear Release Hypnosis",     desc: "Reprogram your subconscious mind for courage & freedom",           icon: "🦁", duration: "15 min", type: "HYPNOSIS",    free: false, gradient: ["#43e97b","#38f9d7"]                            },
  { id: 9,  category: "Sleep",     title: "Deep Sleep Hypnosis",       desc: "Guided sleep induction for deep restorative nights",               icon: "💤", duration: "30 min", type: "HYPNOSIS",    free: false, gradient: ["#a18cd1","#fbc2eb"]                            },
  { id: 10, category: "Sleep",     title: "Night Affirmations",        desc: "Program your subconscious for success while you sleep",            icon: "⭐", duration: "12 min", type: "AUDIO",       free: false, gradient: ["#667eea","#764ba2"]                            },
  { id: 11, category: "Sleep",     title: "Stress Detox Meditation",   desc: "Release the day's tension for deep restorative sleep",             icon: "🌊", duration: "18 min", type: "GUIDED",      free: false, gradient: ["#4facfe","#00f2fe"]                            },
  { id: 12, category: "Student",   title: "Exam Confidence Hypnosis",  desc: "Unlock peak mental performance before any exam or test",           icon: "🎓", duration: "18 min", type: "HYPNOSIS",    free: false, gradient: ["#fa709a","#fee140"]                            },
  { id: 13, category: "Student",   title: "Memory Activation Audio",   desc: "Alpha waves + visualization for superior memory retention",         icon: "🧠", duration: "10 min", type: "AUDIO",       free: false, gradient: ["#30cfd0","#330867"]                            },
  { id: 14, category: "Focus",     title: "Alpha Frequency Meditation",desc: "8-12Hz brainwave sync for razor-sharp laser focus",                icon: "🔮", duration: "20 min", type: "AUDIO",       free: false, gradient: ["#667eea","#764ba2"]                            },
  { id: 15, category: "Healing",   title: "Chakra Balancing",          desc: "Complete 7-chakra energy cleanse and alignment session",           icon: "🌈", duration: "25 min", type: "AUDIO",       free: false, gradient: ["#f6d365","#fda085"]                            },
  { id: 16, category: "Healing",   title: "Self Confidence Builder",   desc: "Hypnotic confidence installation — unlock your true power",        icon: "💪", duration: "15 min", type: "HYPNOSIS",    free: false, gradient: ["#fa709a","#fee140"]                            },
  { id: 17, category: "Healing",   title: "Anger Release Therapy",     desc: "Safe emotional release & deep forgiveness practice",               icon: "🕊️", duration: "12 min", type: "GUIDED",      free: false, gradient: ["#43e97b","#38f9d7"]                            },
  { id: 18, category: "Focus",     title: "Concentration Visualization",desc: "Train your mind to stay laser-focused on any task",               icon: "🎯", duration: "15 min", type: "GUIDED",      free: false, gradient: ["#30cfd0","#330867"]                            },
  { id: 19, category: "Student",   title: "Study Hypnosis Session",    desc: "Enter deep study mode & absorb information 3x faster",             icon: "📚", duration: "22 min", type: "HYPNOSIS",    free: false, gradient: ["#4facfe","#00f2fe"]                            },
  { id: 20, category: "Healing",   title: "Past Life Regression",      desc: "Guided journey to understand and heal karmic patterns",            icon: "🔮", duration: "40 min", type: "HYPNOSIS",    free: false, gradient: ["#a18cd1","#fbc2eb"]                            },
];

const TYPE_COLORS: Record<string, string> = {
  INTERACTIVE: "#4facfe", GUIDED: "#43e97b", TIMER: "#fa709a",
  AUDIO: "#f6d365", HYPNOSIS: "#a78bfa",
};

// ─── ToolCard ──────────────────────────────────────────────────────────────

const ToolCard: React.FC<{
  tool: HealTool;
  hasAccess: boolean;
  onBreath: () => void;
  onPomodoro: () => void;
  onUnlock: () => void;
  onOpen: (t: HealTool) => void;
}> = ({ tool, hasAccess, onBreath, onPomodoro, onUnlock, onOpen }) => {
  const [shaking, setShaking] = useState(false);
  const { t } = useThemeStore();

  const handleClick = () => {
    if (tool.free || hasAccess) {
      if (tool.interactive === "breathing") onBreath();
      else if (tool.interactive === "pomodoro") onPomodoro();
      else onOpen(tool);
    } else {
      setShaking(true);
      onUnlock();
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: `linear-gradient(145deg, ${tool.gradient[0]}18, ${tool.gradient[1]}08)`,
        border: `1px solid ${tool.gradient[0]}35`,
        borderRadius: 20, overflow: "hidden", cursor: "pointer", position: "relative",
        transition: "transform 0.22s, box-shadow 0.22s",
        animation: shaking ? "lockShake 0.5s ease" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = `0 20px 48px ${tool.gradient[0]}28`;
        e.currentTarget.style.borderColor = `${tool.gradient[0]}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = `${tool.gradient[0]}35`;
      }}
    >
      {/* Gradient header */}
      <div style={{
        height: 128, position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Subtle grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <span style={{ fontSize: 52, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))", animation: "healFloat 3s ease-in-out infinite" }}>{tool.icon}</span>

        {/* Type badge top-right */}
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", borderRadius: 6, padding: "3px 8px", border: `1px solid ${TYPE_COLORS[tool.type] ?? "#fff"}45` }}>
          <span style={{ color: TYPE_COLORS[tool.type] ?? "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>{tool.type}</span>
        </div>

        {/* Free / Premium / Unlocked badge top-left */}
        {tool.free ? (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(34,197,94,0.88)", borderRadius: 8, padding: "3px 10px", backdropFilter: "blur(6px)" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>✓ FREE</span>
          </div>
        ) : hasAccess ? (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(34,197,94,0.88)", borderRadius: 8, padding: "3px 10px", backdropFilter: "blur(6px)" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>✓ UNLOCKED</span>
          </div>
        ) : (
          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(124,58,237,0.88)", borderRadius: 8, padding: "3px 10px", backdropFilter: "blur(6px)" }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>🔒 PREMIUM</span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 16px 18px" }}>
        <h3 style={{ color: t.textPrimary, fontSize: 15, fontWeight: 800, marginBottom: 5, lineHeight: 1.3 }}>{tool.title}</h3>
        <p style={{
          color: t.textSecond, fontSize: 13, lineHeight: 1.55, marginBottom: 14,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        } as React.CSSProperties}>{tool.desc}</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          {/* Duration chip */}
          <span style={{
            background: `${tool.gradient[0]}22`,
            border: `1px solid ${tool.gradient[0]}45`,
            borderRadius: 20, padding: "3px 10px",
            color: tool.gradient[0], fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
          }}>⏱ {tool.duration}</span>

          {/* CTA */}
          {tool.free || hasAccess ? (
            <button style={{
              background: `linear-gradient(90deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
              border: "none", color: "#fff", padding: "6px 14px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            }}>
              {tool.interactive ? "Start Now →" : "Begin Session →"}
            </button>
          ) : (
            <button style={{
              background: "rgba(124,58,237,0.18)", border: "1px solid #7c3aed",
              color: "#a78bfa", padding: "6px 14px", borderRadius: 8,
              cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            }}>
              🔒 Unlock ₹99
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Breathing Modal ────────────────────────────────────────────────────────

type BreathPhase = "inhale" | "hold1" | "exhale" | "hold2";
const BREATH_PHASES: Array<{ phase: BreathPhase; dur: number }> = [
  { phase: "inhale", dur: 4 },
  { phase: "hold1",  dur: 4 },
  { phase: "exhale", dur: 4 },
  { phase: "hold2",  dur: 4 },
];
const BREATH_LABELS: Record<BreathPhase, string> = {
  inhale: "Inhale",  hold1: "Hold",  exhale: "Exhale",  hold2: "Hold",
};
const BREATH_SUB: Record<BreathPhase, string> = {
  inhale: "Breathe in slowly through your nose ↑",
  hold1:  "Hold your breath gently •",
  exhale: "Exhale slowly through your mouth ↓",
  hold2:  "Rest and prepare •",
};
const BREATH_COLORS: Record<BreathPhase, string> = {
  inhale: "#4facfe", hold1: "#00f2fe", exhale: "#a78bfa", hold2: "#fbc2eb",
};

const BreathingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [secs, setSecs] = useState(4);
  const [cycles, setCycles] = useState(0);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseIdxRef = useRef(0);
  const secsRef = useRef(BREATH_PHASES[0].dur);

  useEffect(() => {
    ivRef.current = setInterval(() => {
      secsRef.current--;
      if (secsRef.current <= 0) {
        phaseIdxRef.current = (phaseIdxRef.current + 1) % BREATH_PHASES.length;
        if (phaseIdxRef.current === 0) setCycles(c => c + 1);
        secsRef.current = BREATH_PHASES[phaseIdxRef.current].dur;
      }
      setPhase(BREATH_PHASES[phaseIdxRef.current].phase);
      setSecs(secsRef.current);
    }, 1000);
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, []);

  const isExpanded = phase === "inhale" || phase === "hold1";
  const circleScale = isExpanded ? 1.45 : 1;
  const transDur = phase === "inhale" || phase === "exhale" ? "3.9s" : "0.15s";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,3,14,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "linear-gradient(160deg, #0f0e1a, #1a1040)", border: "1px solid #3730a3", borderRadius: 28, padding: "40px 32px 36px", maxWidth: 440, width: "100%", textAlign: "center", animation: "modalSlideUp 0.3s ease", boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,58,237,0.2)", position: "relative" }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", color: "#9ca3af", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: "#f3f4f6", fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>Box Breathing 🫁</h3>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>4-4-4-4 technique · Cycle {cycles + 1}</p>
        </div>

        {/* Animated circle */}
        <div style={{ margin: "0 auto 28px", width: 200, height: 200, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Pulse ring behind */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${BREATH_COLORS[phase]}`,
            animation: "ringPulse 2s ease-out infinite",
          }} />
          {/* Main orb */}
          <div style={{
            width: "100%", height: "100%", borderRadius: "50%",
            background: `radial-gradient(circle, ${BREATH_COLORS[phase]}cc 0%, ${BREATH_COLORS[phase]}55 60%, transparent 100%)`,
            border: `2px solid ${BREATH_COLORS[phase]}`,
            transform: `scale(${circleScale})`,
            transition: `transform ${transDur} cubic-bezier(0.4,0,0.2,1)`,
            boxShadow: `0 0 ${isExpanded ? "60px" : "24px"} ${BREATH_COLORS[phase]}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Inner dark hole */}
            <div style={{ width: "66%", height: "66%", borderRadius: "50%", background: "#0f0e1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: "#f3f4f6", lineHeight: 1 }}>{secs}</span>
              <span style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>sec</span>
            </div>
          </div>
        </div>

        {/* Phase label */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: BREATH_COLORS[phase], letterSpacing: -0.5 }}>{BREATH_LABELS[phase]}</div>
          <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>{BREATH_SUB[phase]}</div>
        </div>

        {/* Phase progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
          {BREATH_PHASES.map((p, i) => (
            <div key={i} style={{ textAlign: "center", opacity: p.phase === phase ? 1 : 0.35, transition: "opacity 0.3s" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: BREATH_COLORS[p.phase], margin: "0 auto 5px", boxShadow: p.phase === phase ? `0 0 10px ${BREATH_COLORS[p.phase]}` : "none" }} />
              <span style={{ fontSize: 10, color: "#9ca3af" }}>{["In","Hold","Out","Hold"][i]}</span>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div style={{ marginTop: 24, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: 12, padding: "10px 16px" }}>
          <p style={{ color: "#c4b5fd", fontSize: 12, margin: 0, lineHeight: 1.6 }}>✨ Do this for 3–5 minutes daily to reduce cortisol and activate your relaxation response.</p>
        </div>
      </div>
    </div>
  );
};

// ─── Pomodoro Modal ─────────────────────────────────────────────────────────

type PomPhase = "focus" | "shortBreak" | "longBreak";
const POM_TOTALS: Record<PomPhase, number> = { focus: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
const POM_LABELS: Record<PomPhase, string> = { focus: "Focus Time", shortBreak: "Short Break ☕", longBreak: "Long Break 🎉" };
const POM_COLORS: Record<PomPhase, string> = { focus: "#7c3aed", shortBreak: "#059669", longBreak: "#d97706" };
const POM_TIPS: Record<PomPhase, string> = {
  focus: "Silence your phone, close distractions, and go deep.",
  shortBreak: "Stand up, stretch, drink water. Rest your eyes.",
  longBreak: "Great work! Take a walk, eat a snack, breathe deeply.",
};

const PomodoroModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phase, setPhase] = useState<PomPhase>("focus");
  const [secs, setSecs] = useState(POM_TOTALS.focus);
  const [session, setSession] = useState(1);
  const [running, setRunning] = useState(false);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseRef = useRef<PomPhase>("focus");
  const secsRef = useRef(POM_TOTALS.focus);
  const sessionRef = useRef(1);
  phaseRef.current = phase;
  secsRef.current = secs;
  sessionRef.current = session;

  useEffect(() => {
    if (!running) { if (ivRef.current) clearInterval(ivRef.current); return; }
    ivRef.current = setInterval(() => {
      const next = secsRef.current - 1;
      if (next > 0) { setSecs(next); return; }
      setRunning(false);
      const curPhase = phaseRef.current;
      const curSession = sessionRef.current;
      if (curPhase === "focus") {
        if (curSession >= 4) {
          setPhase("longBreak"); setSecs(POM_TOTALS.longBreak); setSession(1);
        } else {
          setPhase("shortBreak"); setSecs(POM_TOTALS.shortBreak); setSession(s => s + 1);
        }
      } else {
        setPhase("focus"); setSecs(POM_TOTALS.focus);
      }
    }, 1000);
    return () => { if (ivRef.current) clearInterval(ivRef.current); };
  }, [running]);

  const reset = () => { setRunning(false); setPhase("focus"); setSecs(POM_TOTALS.focus); setSession(1); };

  const circumference = 2 * Math.PI * 96;
  const progress = secs / POM_TOTALS[phase];
  const strokeDashoffset = circumference * (1 - progress);
  const mins = Math.floor(secs / 60).toString().padStart(2, "0");
  const secsDisp = (secs % 60).toString().padStart(2, "0");
  const color = POM_COLORS[phase];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,3,14,0.92)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
      <div style={{ background: "linear-gradient(160deg, #0f0e1a, #1a0f2e)", border: "1px solid #3730a3", borderRadius: 28, padding: "40px 32px 36px", maxWidth: 440, width: "100%", textAlign: "center", animation: "modalSlideUp 0.3s ease", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", position: "relative" }}>

        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", color: "#9ca3af", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

        {/* Phase label */}
        <div style={{ marginBottom: 6 }}>
          <span style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: 20, padding: "5px 16px", color, fontSize: 13, fontWeight: 700 }}>{POM_LABELS[phase]}</span>
        </div>
        <h3 style={{ color: "#f3f4f6", fontSize: 20, fontWeight: 900, margin: "10px 0 0" }}>Pomodoro Focus Timer ⏱️</h3>

        {/* SVG ring */}
        <div style={{ margin: "24px auto", position: "relative", width: 220, height: 220 }}>
          <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="110" cy="110" r="96" fill="none" stroke="#1e1b4b" strokeWidth="12" />
            <circle cx="110" cy="110" r="96" fill="none" stroke={color} strokeWidth="12"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.4s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 46, fontWeight: 900, color: "#f3f4f6", letterSpacing: -2, lineHeight: 1 }}>{mins}:{secsDisp}</span>
            <span style={{ color: "#6b7280", fontSize: 11, marginTop: 4 }}>min : sec</span>
          </div>
        </div>

        {/* Session dots */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ width: 12, height: 12, borderRadius: "50%", transition: "background 0.3s", background: s < session ? POM_COLORS.focus : s === session && phase === "focus" ? POM_COLORS.focus : "#1e1b4b", boxShadow: s === session && phase === "focus" ? `0 0 10px ${POM_COLORS.focus}` : "none" }} />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          <button onClick={reset} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid #3730a3", color: "#9ca3af", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>↺ Reset</button>
          <button onClick={() => setRunning(r => !r)} style={{ background: running ? "rgba(239,68,68,0.2)" : `${color}22`, border: `1.5px solid ${running ? "#ef4444" : color}`, color: running ? "#f87171" : color, padding: "10px 32px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 800, minWidth: 120 }}>
            {running ? "⏸ Pause" : "▶ Start"}
          </button>
        </div>

        {/* Tip */}
        <div style={{ background: `${color}14`, border: `1px solid ${color}30`, borderRadius: 12, padding: "10px 16px" }}>
          <p style={{ color: "#c4b5fd", fontSize: 12, margin: 0, lineHeight: 1.6 }}>💡 {POM_TIPS[phase]}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────

const PaymentModal: React.FC<{
  paying: boolean;
  error: string;
  onPay: () => void;
  onClose: () => void;
  onLogin: () => void;
  isLoggedIn: boolean;
}> = ({ paying, error, onPay, onClose, onLogin, isLoggedIn }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(4,3,14,0.88)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
    <div style={{ background: "linear-gradient(160deg,#0f0e1a,#1a0f2e)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 24, padding: "40px 36px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", position: "relative" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.08)", border: "none", color: "#9ca3af", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>

      <div style={{ fontSize: 52, marginBottom: 16 }}>🌟</div>
      <h3 style={{ color: "#f3f4f6", fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>Unlock All Healing Tools</h3>
      <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.65, margin: "0 0 24px" }}>
        Get lifetime access to all <strong style={{ color: "#c4b5fd" }}>16 premium tools</strong> — sleep hypnosis, inner child healing, chakra balancing, fear release, confidence builder & more.
      </p>

      {/* What's included */}
      <div style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 14, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
        {["💤 Deep Sleep Hypnosis", "💛 Inner Child Healing", "🌈 Chakra Balancing", "🦁 Fear Release Hypnosis", "💪 Self Confidence Builder", "🎓 Exam Confidence Hypnosis", "+ 10 more premium tools"].map(item => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, color: "#c4b5fd", fontSize: 13, padding: "4px 0" }}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> {item}
          </div>
        ))}
      </div>

      {/* Price */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 4 }}>One-time payment · Lifetime access</div>
        <div style={{ color: "#f3f4f6", fontSize: 42, fontWeight: 900, lineHeight: 1 }}>₹99</div>
      </div>

      {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {isLoggedIn ? (
        <button onClick={onPay} disabled={paying}
          style={{ width: "100%", padding: "15px", background: paying ? "#374151" : "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: paying ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}>
          {paying
            ? <><span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} /> Processing…</>
            : "Pay ₹99 with Razorpay →"}
        </button>
      ) : (
        <button onClick={onLogin}
          style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}>
          Login to Unlock →
        </button>
      )}
      <p style={{ color: "#4b5563", fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
        Secure payment via Razorpay · Instant access after payment
      </p>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── HealingHub (main export) ──────────────────────────────────────────────

const HealingHub: React.FC = () => {
  const navigate = useNavigate();
  const { t, isDark } = useThemeStore();
  const { user } = useAuthStore();
  const [healQ, setHealQ] = useState("");
  const [healCat, setHealCat] = useState("All");
  const [breathOpen, setBreathOpen] = useState(false);
  const [pomOpen, setPomOpen] = useState(false);
  const [openTool, setOpenTool] = useState<HealTool | null>(null);
  const [payModal, setPayModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  const toolsRef = useRef<HTMLDivElement>(null);
  const scrollTools = (dir: "left" | "right") => {
    toolsRef.current?.scrollBy({ left: dir === "right" ? 290 : -290, behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;
    client.get("/payments/program-access/healing-tools")
      .then(r => { if (r.data.hasAccess) setHasAccess(true); })
      .catch(() => {});
  }, [user]);

  const handleUnlock = async () => {
    if (!user) { navigate("/login"); return; }
    setPaying(true);
    setPayError("");
    try {
      const { data } = await client.post("/payments/create-order", {
        type: "program",
        programId: "healing-tools",
      });
      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "BSH Healers",
        description: "Healing Tools — Lifetime Access",
        order_id: data.order.id,
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await client.post("/payments/verify", {
              razorpayOrderId: r.razorpay_order_id,
              razorpayPaymentId: r.razorpay_payment_id,
              razorpaySignature: r.razorpay_signature,
            });
            setHasAccess(true);
            setPayModal(false);
          } catch {
            setPayError("Payment received but verification failed. Please contact support with your payment ID.");
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: "#7c3aed" },
      }).open();
    } catch {
      setPayError("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const showUnlock = () => { setPayModal(true); };

  const filtered = HEALING_TOOLS.filter(t =>
    (healCat === "All" || t.category === healCat) &&
    (healQ === "" || t.title.toLowerCase().includes(healQ.toLowerCase()) || t.desc.toLowerCase().includes(healQ.toLowerCase()))
  );

  return (
    <>
      <section id="healing-tools" style={{ background: isDark ? "linear-gradient(180deg, #06050f 0%, #0d0c1d 100%)" : "linear-gradient(180deg, #f4f3ff 0%, #ede9fe 100%)", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "72px 24px", position: "relative", overflow: "hidden" }}>
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.07) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
        {/* Glow orb */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}>

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #7c3aed, #4facfe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: "0 8px 28px rgba(124,58,237,0.45)" }}>🌟</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: t.textPrimary, margin: 0, letterSpacing: -0.5 }}>Daily Healing Tools</h2>
                <span style={{ background: "linear-gradient(90deg,#7c3aed,#4facfe)", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>POWERED BY BSH</span>
              </div>
              <p style={{ color: t.textSecond, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                {hasAccess
                  ? "All 20 tools unlocked — enjoy your premium healing journey ✓"
                  : "4 tools forever free · Unlock all 16 premium tools for just ₹99"}
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "4 Free Tools", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
              { label: "20K+ Daily Users", color: "#a78bfa", bg: "rgba(124,58,237,0.1)" },
              { label: "Clinically Backed", color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
              { label: "No App Required", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
            ].map(p => (
              <span key={p.label} style={{ background: p.bg, borderRadius: 20, padding: "5px 14px", color: p.color, fontSize: 12, fontWeight: 700 }}>{p.label}</span>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, background: t.bgInput, border: `1.5px solid ${t.borderLight}`, borderRadius: 12, padding: "0 18px", height: 52, maxWidth: 600, transition: "border-color 0.2s" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
            onBlur={(e) => (e.currentTarget.style.borderColor = t.borderLight)}>
            <HiOutlineSearch size={18} style={{ color: t.textMuted, flexShrink: 0 }} />
            <input
              value={healQ}
              onChange={e => setHealQ(e.target.value)}
              placeholder="Search breathing, meditation, hypnosis, sleep tools..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: t.textPrimary, fontSize: 14 }}
            />
            {healQ && <button onClick={() => setHealQ("")} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 4, fontSize: 16 }}>✕</button>}
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
            {HEALING_CATEGORIES.map(cat => {
              const active = cat === healCat;
              return (
                <button key={cat} onClick={() => setHealCat(cat)}
                  style={{ padding: "7px 18px", borderRadius: 50, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s", border: active ? "2px solid #7c3aed" : `1.5px solid ${t.borderLight}`, background: active ? "rgba(124,58,237,0.18)" : "transparent", color: active ? t.textAccent : t.textSecond }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = t.textAccent; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = t.borderLight; e.currentTarget.style.color = t.textSecond; } }}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              );
            })}
          </div>

          {/* Scroll controls */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", color: "#a78bfa", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, whiteSpace: "nowrap", padding: 0 }}>
              EXPLORE TOOLS →
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              {(["left", "right"] as const).map((dir) => (
                <button key={dir} onClick={() => scrollTools(dir)}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${t.borderLight}`, background: "none", cursor: "pointer", color: t.textAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = t.borderLight; e.currentTarget.style.color = t.textAccent; }}>
                  {dir === "left" ? "‹" : "›"}
                </button>
              ))}
            </div>
          </div>

          {/* Tools horizontal scroll */}
          {filtered.length > 0 ? (
            <div ref={toolsRef} style={{ display: "flex", gap: 18, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
              {filtered.map(tool => (
                <div key={tool.id} style={{ minWidth: 270, maxWidth: 270, flexShrink: 0 }}>
                  <ToolCard tool={tool} hasAccess={hasAccess} onBreath={() => setBreathOpen(true)} onPomodoro={() => setPomOpen(true)} onUnlock={showUnlock} onOpen={setOpenTool} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 0", color: t.textMuted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 15 }}>No tools found for "{healQ}" — try another keyword</p>
            </div>
          )}

          {/* Legend + CTA */}
          <div style={{ marginTop: 36, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { dot: "#22c55e", label: "4 tools free forever" },
                { dot: "#7c3aed", label: hasAccess ? "16 premium tools — UNLOCKED ✓" : "16 premium tools — ₹99 one-time" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, color: t.textSecond, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.dot, display: "inline-block" }} />
                  {l.label}
                </div>
              ))}
            </div>
            {!hasAccess && (
              <button onClick={showUnlock}
                style={{ background: "linear-gradient(90deg,#7c3aed,#6d28d9)", border: "none", color: "#fff", padding: "11px 28px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: "0 8px 24px rgba(124,58,237,0.35)", transition: "transform 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "none")}>
                Unlock All Tools — ₹99 →
              </button>
            )}
            {hasAccess && (
              <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "10px 20px", color: "#22c55e", fontWeight: 700, fontSize: 14 }}>
                ✓ All Tools Unlocked
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modals */}
      {breathOpen && <BreathingModal onClose={() => setBreathOpen(false)} />}
      {pomOpen && <PomodoroModal onClose={() => setPomOpen(false)} />}
      {openTool && <HealingToolModal tool={openTool} onClose={() => setOpenTool(null)} />}
      {payModal && (
        <PaymentModal
          paying={paying}
          error={payError}
          isLoggedIn={!!user}
          onPay={handleUnlock}
          onClose={() => { setPayModal(false); setPayError(""); }}
          onLogin={() => navigate("/login")}
        />
      )}
    </>
  );
};

export default HealingHub;
