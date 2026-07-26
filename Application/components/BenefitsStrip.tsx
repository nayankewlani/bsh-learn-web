import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";
import TherapyModal, { type TherapyDef } from "./TherapyModal";

// ─── Professional SVG Icons ────────────────────────────────────────────────────

const SoundIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect x="1"  y="16" width="4" height="8"  rx="2" fill={c} opacity="0.55"/>
    <rect x="7"  y="10" width="4" height="14" rx="2" fill={c} opacity="0.75"/>
    <rect x="13" y="4"  width="4" height="20" rx="2" fill={c}/>
    <rect x="19" y="12" width="4" height="12" rx="2" fill={c} opacity="0.75"/>
    <rect x="25" y="18" width="2" height="6"  rx="1" fill={c} opacity="0.45"/>
  </svg>
);

const ReikiIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M5 20 C5 14 21 14 21 20" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <line x1="8"  y1="14" x2="8"  y2="7"  stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="11" y1="14" x2="11" y2="5"  stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="14" y1="14" x2="14" y2="5"  stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="17" y1="14" x2="17" y2="7"  stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="13" cy="2.5" r="2" fill={c} opacity="0.8"/>
    <path d="M9 2.5 L7 1 M17 2.5 L19 1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const HypnoIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="13" r="11" stroke={c} strokeWidth="1.5" opacity="0.3"/>
    <circle cx="13" cy="13" r="7.5" stroke={c} strokeWidth="1.5" opacity="0.55"/>
    <circle cx="13" cy="13" r="4" stroke={c} strokeWidth="1.5" opacity="0.8"/>
    <circle cx="13" cy="13" r="1.5" fill={c}/>
    <path d="M13 2 A11 11 0 0 1 24 13" stroke={c} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ShadowIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M20 13 A9 9 0 1 1 13 4 A6.5 6.5 0 0 0 20 13Z" fill={c} opacity="0.85"/>
    <circle cx="19" cy="5" r="2"   fill={c}/>
    <circle cx="22.5" cy="9" r="1.2" fill={c} opacity="0.7"/>
    <circle cx="23.5" cy="13" r="0.8" fill={c} opacity="0.5"/>
  </svg>
);

const BreathIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M13 4 C13 4 7 4 5 9 C3 14 7 16 7 19" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M13 4 C13 4 19 4 21 9 C23 14 19 16 19 19" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M7 19 C7 22 9 23 10 23" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M19 19 C19 22 17 23 16 23" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="13" cy="4" r="2.2" fill={c} opacity="0.9"/>
  </svg>
);

const AkashikIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect x="3" y="8" width="20" height="15" rx="2.5" stroke={c} strokeWidth="1.6" fill="none"/>
    <path d="M3 11 L13 15 L23 11" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="13" y1="8" x2="13" y2="23" stroke={c} strokeWidth="1.2" opacity="0.5"/>
    <path d="M13 2 L14.2 5.3 H17.8 L14.8 7.3 L15.8 10.5 L13 8.2 L10.2 10.5 L11.2 7.3 L8.2 5.3 H11.8Z" fill={c} opacity="0.9"/>
  </svg>
);

const NLPIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <path d="M13 3 C8 3 4 7 4 12 C4 15.5 6 18.5 9 20 L9 23 L17 23 L17 20 C20 18.5 22 15.5 22 12 C22 7 18 3 13 3Z" stroke={c} strokeWidth="1.6" fill="none"/>
    <circle cx="9"  cy="10" r="1.5" fill={c}/>
    <circle cx="13" cy="8"  r="1.5" fill={c}/>
    <circle cx="17" cy="10" r="1.5" fill={c}/>
    <circle cx="11" cy="14" r="1.5" fill={c} opacity="0.7"/>
    <circle cx="15" cy="14" r="1.5" fill={c} opacity="0.7"/>
    <line x1="9"  y1="10" x2="13" y2="8"  stroke={c} strokeWidth="1" opacity="0.5"/>
    <line x1="13" y1="8"  x2="17" y2="10" stroke={c} strokeWidth="1" opacity="0.5"/>
    <line x1="9"  y1="10" x2="11" y2="14" stroke={c} strokeWidth="1" opacity="0.5"/>
    <line x1="17" y1="10" x2="15" y2="14" stroke={c} strokeWidth="1" opacity="0.5"/>
  </svg>
);

const PranicIcon = ({ c }: { c: string }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <ellipse cx="13" cy="13" rx="11" ry="12" stroke={c} strokeWidth="1.2" opacity="0.25"/>
    <ellipse cx="13" cy="13" rx="7.5" ry="8.5" stroke={c} strokeWidth="1.2" opacity="0.45"/>
    <ellipse cx="13" cy="13" rx="4" ry="5" stroke={c} strokeWidth="1.5" opacity="0.7"/>
    <circle cx="13" cy="6.5" r="2.5" fill={c}/>
    <line x1="13" y1="9" x2="13" y2="22" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="9"  y1="13" x2="17" y2="13" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    <line x1="9"  y1="16.5" x2="17" y2="16.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const ICON_MAP: Record<string, React.FC<{ c: string }>> = {
  "Sound Therapy":   SoundIcon,
  "Reiki Healing":   ReikiIcon,
  "Hypnotherapy":    HypnoIcon,
  "Shadow Work":     ShadowIcon,
  "Breathwork":      BreathIcon,
  "Akashik Records": AkashikIcon,
  "NLP Coaching":    NLPIcon,
  "Pranic Healing":  PranicIcon,
};

// ─── Therapy Data ─────────────────────────────────────────────────────────────

const THERAPIES: TherapyDef[] = [
  {
    icon: "🎵", label: "Sound Therapy",   type: "Vibrational Healing", color: "#7c3aed",
    desc: "Restore balance through Tibetan singing bowls, tuning forks and binaural beats — healing at a cellular level.",
    benefits: ["Reduces anxiety & stress", "Deepens sleep quality", "Clears energy blockages"],
    duration: "60 min session",
  },
  {
    icon: "✋", label: "Reiki Healing",   type: "Energy Medicine",     color: "#16a34a",
    desc: "Channel universal life-force energy through the healer's hands to unblock stagnant energy and activate self-healing.",
    benefits: ["Balances all 7 chakras", "Accelerates recovery", "Releases emotional trauma"],
    duration: "45 min session",
  },
  {
    icon: "🌀", label: "Hypnotherapy",    type: "Subconscious Work",   color: "#9333ea",
    desc: "Deep relaxation state giving direct access to the subconscious mind — dissolving limiting beliefs and phobias.",
    benefits: ["Overcome phobias & fears", "Break compulsive habits", "Heal unresolved trauma"],
    duration: "90 min session",
  },
  {
    icon: "🌑", label: "Shadow Work",     type: "Inner Child Healing", color: "#0d9488",
    desc: "A guided journey to meet, integrate and heal the parts of yourself repressed in childhood — ending self-sabotage.",
    benefits: ["Heal the inner child", "End self-sabotage cycles", "Achieve wholeness"],
    duration: "75 min session",
  },
  {
    icon: "🌬️", label: "Breathwork",      type: "Pranayama & Soma",    color: "#0891b2",
    desc: "Intentional breathing patterns that shift your nervous system and release stored emotional charge from the body.",
    benefits: ["Release body trauma", "Achieve altered states", "Boost immune system"],
    duration: "60 min session",
  },
  {
    icon: "🔮", label: "Akashik Records", type: "Soul-Level Reading",  color: "#d97706",
    desc: "Access the cosmic record of your soul's journey to reveal your true purpose and clear karmic debts.",
    benefits: ["Discover soul's purpose", "Clear karmic blocks", "Past-life understanding"],
    duration: "60 min session",
  },
  {
    icon: "🧠", label: "NLP Coaching",    type: "Mind Reprogramming",  color: "#2563eb",
    desc: "Neuro-linguistic programming rapidly shifts thought patterns and installs empowering beliefs at a subconscious level.",
    benefits: ["Break limiting beliefs", "Build confidence", "Peak performance"],
    duration: "60 min session",
  },
  {
    icon: "⚡", label: "Pranic Healing",  type: "No-Touch Therapy",    color: "#e11d48",
    desc: "Advanced energy system that scans and cleanses diseased prana from the aura and chakras — no physical contact needed.",
    benefits: ["Remove diseased energy", "Accelerate recovery", "Psychic self-defence"],
    duration: "45 min session",
  },
];

// ─── Checkmark ───────────────────────────────────────────────────────────────

const Check = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="6" cy="6" r="6" fill={color} fillOpacity="0.15"/>
    <path d="M3 6L5 8L9 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Therapy Card ─────────────────────────────────────────────────────────────

const TherapyCard: React.FC<{ th: TherapyDef; onClick: () => void }> = ({ th, onClick }) => {
  const { t } = useThemeStore();
  const [hov, setHov] = useState(false);
  const Icon = ICON_MAP[th.label];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `linear-gradient(150deg, ${t.bgCard} 0%, ${th.color}0e 100%)` : t.bgCard,
        border: `1.5px solid ${hov ? th.color : t.border}`,
        borderRadius: 18,
        padding: "18px 18px 16px",
        display: "flex", flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.24s cubic-bezier(0.4,0,0.2,1)",
        transform: hov ? "translateY(-5px)" : "none",
        boxShadow: hov ? `0 16px 36px ${th.color}22` : `0 1px 4px ${t.shadow}`,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2.5,
        background: th.color,
        opacity: hov ? 1 : 0,
        transition: "opacity 0.24s",
        borderRadius: "18px 18px 0 0",
      }} />

      {/* Icon + header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `${th.color}18`,
          border: `1.5px solid ${th.color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.24s",
          boxShadow: hov ? `0 0 16px ${th.color}44` : "none",
          transform: hov ? "scale(1.06)" : "scale(1)",
        }}>
          {Icon ? <Icon c={th.color} /> : null}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.textPrimary, lineHeight: 1.25, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {th.label}
          </div>
          <span style={{
            display: "inline-block",
            fontSize: 8.5, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase",
            color: th.color, background: `${th.color}14`,
            border: `1px solid ${th.color}28`, borderRadius: 20, padding: "2px 7px",
          }}>
            {th.type}
          </span>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 11.5, color: t.textSecond, lineHeight: 1.65, margin: "0 0 12px", flexGrow: 1 }}>
        {th.desc}
      </p>

      {/* Benefits */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
        {th.benefits.map(b => (
          <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <Check color={th.color} />
            <span style={{ fontSize: 10.5, color: t.textSecond, lineHeight: 1.45 }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 12,
        borderTop: `1px solid ${hov ? th.color + "30" : t.border}`,
        transition: "border-color 0.24s",
      }}>
        <span style={{ fontSize: 10, color: t.textMuted, fontWeight: 600 }}>⏱ {th.duration}</span>
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: hov ? th.color : `${th.color}14`,
          border: `1.5px solid ${th.color}44`,
          borderRadius: 50, padding: "5px 12px",
          transition: "all 0.24s",
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: hov ? "#fff" : th.color }}>Try Now</span>
          <span style={{ fontSize: 11, color: hov ? "#fff" : th.color, lineHeight: 1 }}>→</span>
        </div>
      </div>
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const BenefitsStrip: React.FC = () => {
  const { t, isDark } = useThemeStore();
  const nav = useNavigate();
  const [open, setOpen] = useState<TherapyDef | null>(null);

  return (
    <>
      {open && <TherapyModal therapy={open} onClose={() => setOpen(null)} />}

      <style>{`
        @keyframes therapyScrollH {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .therapy-scroll-inner {
          animation: therapyScrollH 70s linear infinite;
        }
        .therapy-scroll-wrap:hover .therapy-scroll-inner {
          animation-play-state: paused;
        }
      `}</style>

      <section style={{ background: t.bgSecondary, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "56px 0" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40, padding: "0 24px" }}>
          <p style={{ color: "#7c3aed", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 10 }}>
            What We Offer
          </p>
          <h2 style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: t.textPrimary, letterSpacing: -0.6, margin: "0 0 12px", lineHeight: 1.15 }}>
            Healing Therapies &amp; Treatments
          </h2>
          <p style={{ color: t.textSecond, fontSize: 14, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Click any therapy to try an interactive session — then connect with a certified healer.
          </p>
          <p style={{ color: t.textMuted, fontSize: 11, marginTop: 8, fontStyle: "italic" }}>Hover to pause · Click a card to begin</p>
        </div>

        {/* Horizontal infinite scroller */}
        <div className="therapy-scroll-wrap" style={{ position: "relative", overflow: "hidden", marginBottom: 40 }}>
          {/* Left fade */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, pointerEvents: "none", background: `linear-gradient(to right, ${t.isDark ? "#0f172a" : "#f8fafc"}, transparent)` }} />
          {/* Right fade */}
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, pointerEvents: "none", background: `linear-gradient(to left, ${t.isDark ? "#0f172a" : "#f8fafc"}, transparent)` }} />

          <div className="therapy-scroll-inner" style={{ display: "flex", gap: 16, padding: "12px 16px", width: "max-content" }}>
            {[...THERAPIES, ...THERAPIES].map((th, i) => (
              <div key={i} style={{ flexShrink: 0, width: 260 }}>
                <TherapyCard th={th} onClick={() => setOpen(th)} />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{
            background: isDark
              ? "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(13,148,136,0.08))"
              : "linear-gradient(135deg,rgba(124,58,237,0.06),rgba(13,148,136,0.04))",
            border: `1.5px solid ${isDark ? "rgba(124,58,237,0.22)" : "rgba(124,58,237,0.16)"}`,
            borderRadius: 18, padding: "24px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: t.textPrimary, marginBottom: 4 }}>Not sure which therapy suits you?</div>
              <div style={{ fontSize: 13, color: t.textSecond }}>Free 15-min discovery call — our healers find your best match.</div>
            </div>
            <button
              onClick={() => nav("/consultation")}
              style={{
                background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 800,
                padding: "12px 24px", borderRadius: 50, cursor: "pointer",
                boxShadow: "0 6px 20px rgba(124,58,237,0.4)", transition: "all 0.2s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(124,58,237,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,58,237,0.4)"; }}
            >
              💬 Book Free Discovery Call
            </button>
          </div>
        </div>

      </section>
    </>
  );
};

export default BenefitsStrip;
