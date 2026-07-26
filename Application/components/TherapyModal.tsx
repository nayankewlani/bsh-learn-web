import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../stores/themeStore";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface TherapyDef {
  icon: string;
  label: string;
  type: string;
  color: string;
  desc: string;
  benefits: string[];
  duration: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SOUND THERAPY — Web Audio API + Solfeggio frequencies
// ═══════════════════════════════════════════════════════════════════════════════

const SOLFEGGIO = [
  { hz: 396,  name: "Liberation",   benefit: "Release guilt & fear",          color: "#ef4444" },
  { hz: 432,  name: "Miracle Tone", benefit: "Universal calm & harmony",      color: "#7c3aed" },
  { hz: 528,  name: "Love / DNA",   benefit: "Repair & transformation",        color: "#16a34a" },
  { hz: 639,  name: "Connection",   benefit: "Heal relationships",             color: "#0891b2" },
  { hz: 741,  name: "Intuition",    benefit: "Awaken clarity & intuition",     color: "#d97706" },
  { hz: 852,  name: "Third Eye",    benefit: "Return to spiritual order",      color: "#9333ea" },
  { hz: 963,  name: "Nirvana",      benefit: "Divine consciousness & oneness", color: "#e11d48" },
];

const SoundTherapyXP: React.FC = () => {
  const { t } = useThemeStore();
  const [sel, setSel] = useState(SOLFEGGIO[1]);
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(0.25);
  const [elapsed, setElapsed] = useState(0);
  const ctxRef  = useRef<AudioContext | null>(null);
  const oscRef  = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSound = useCallback(() => {
    oscRef.current?.stop();
    oscRef.current  = null;
    ctxRef.current?.close();
    ctxRef.current  = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setPlaying(false);
    setElapsed(0);
  }, []);

  const playSound = useCallback((freq: typeof SOLFEGGIO[0], volume: number) => {
    stopSound();
    const ctx  = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq.hz;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    ctxRef.current  = ctx;
    oscRef.current  = osc;
    gainRef.current = gain;
    setPlaying(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }, [stopSound]);

  useEffect(() => () => stopSound(), [stopSound]);

  // update volume live
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = vol;
  }, [vol]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div>
      <style>{`
        @keyframes soundBar {
          0%,100% { transform: scaleY(0.3); }
          50%      { transform: scaleY(1); }
        }
      `}</style>

      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
        Select a Solfeggio frequency below. Each tone targets a specific area of healing.
        Use headphones for best results — even 10 minutes can shift your state.
      </p>

      {/* Frequency grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 24 }}>
        {SOLFEGGIO.map(f => (
          <button key={f.hz}
            onClick={() => { setSel(f); if (playing) playSound(f, vol); }}
            style={{
              background: sel.hz === f.hz ? `${f.color}20` : "rgba(255,255,255,0.04)",
              border: `1.5px solid ${sel.hz === f.hz ? f.color : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12, padding: "10px 12px", cursor: "pointer",
              textAlign: "left", transition: "all 0.2s",
            }}
          >
            <div style={{ fontWeight: 800, color: f.color, fontSize: 14 }}>{f.hz} Hz</div>
            <div style={{ color: "#f3f4f6", fontSize: 11, fontWeight: 600, marginTop: 2 }}>{f.name}</div>
            <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>{f.benefit}</div>
          </button>
        ))}
      </div>

      {/* Wave visualiser (CSS bars) */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, height: 48, marginBottom: 20 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{
            width: 5, height: 40, background: sel.color,
            borderRadius: 4, transformOrigin: "bottom",
            animation: playing ? `soundBar ${0.4 + (i % 5) * 0.12}s ease-in-out infinite` : "none",
            opacity: playing ? 0.85 : 0.2,
            transform: "scaleY(0.3)",
          }} />
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => playing ? stopSound() : playSound(sel, vol)}
          style={{
            background: sel.color, border: "none", color: "#fff",
            fontWeight: 800, fontSize: 13, padding: "10px 26px", borderRadius: 50,
            cursor: "pointer", boxShadow: `0 4px 20px ${sel.color}66`,
          }}
        >
          {playing ? "⏹ Stop" : "▶ Play Tone"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 140 }}>
          <span style={{ color: "#6b7280", fontSize: 11 }}>🔊</span>
          <input type="range" min={0} max={1} step={0.01} value={vol}
            onChange={e => setVol(Number(e.target.value))}
            style={{ flex: 1, accentColor: sel.color }} />
        </div>

        {playing && (
          <div style={{ background: `${sel.color}20`, border: `1px solid ${sel.color}44`, borderRadius: 20, padding: "4px 12px" }}>
            <span style={{ color: sel.color, fontWeight: 700, fontSize: 12 }}>⏱ {fmt(elapsed)}</span>
          </div>
        )}
      </div>

      {playing && (
        <p style={{ color: "#6b7280", fontSize: 11, marginTop: 14, lineHeight: 1.6 }}>
          💡 Relax your jaw, drop your shoulders and breathe naturally. Let the tone work through you.
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BREATHWORK — 4-7-8 or Box breathing with animated circle
// ═══════════════════════════════════════════════════════════════════════════════

type BPhase = "ready" | "inhale" | "hold1" | "exhale" | "hold2";
const PATTERNS = {
  "4-7-8": { inhale: 4, hold1: 7, exhale: 8, hold2: 0, name: "4-7-8 Relaxation (Dr. Weil)" },
  "box":   { inhale: 4, hold1: 4, exhale: 4, hold2: 4, name: "Box Breathing (Navy SEALs)" },
};

const BreathworkXP: React.FC = () => {
  const [pattern, setPattern] = useState<keyof typeof PATTERNS>("4-7-8");
  const [phase, setPhase]     = useState<BPhase>("ready");
  const [count, setCount]     = useState(0);
  const [cycles, setCycles]   = useState(0);
  const [active, setActive]   = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);

  const applyCircle = (ph: BPhase, dur: number) => {
    if (!circleRef.current) return;
    const el = circleRef.current;
    const big = "180px", sml = "80px";
    if (ph === "inhale") {
      el.style.transition = `all ${dur}s ease-in-out`;
      el.style.width = big; el.style.height = big;
    } else if (ph === "exhale") {
      el.style.transition = `all ${dur}s ease-in-out`;
      el.style.width = sml; el.style.height = sml;
    } else {
      el.style.transition = "none";
    }
  };

  useEffect(() => {
    if (!active) { setPhase("ready"); setCount(0); return; }
    const p = PATTERNS[pattern];
    const seq: BPhase[] = ["inhale", "hold1", "exhale", ...(p.hold2 > 0 ? ["hold2" as BPhase] : [])];
    const durs: Record<BPhase, number> = { ready: 0, inhale: p.inhale, hold1: p.hold1, exhale: p.exhale, hold2: p.hold2 };

    let phIdx = 0;
    let c = durs[seq[0]];
    setPhase(seq[0]);
    setCount(c);
    applyCircle(seq[0], durs[seq[0]]);

    const tick = setInterval(() => {
      c--;
      setCount(c);
      if (c <= 0) {
        phIdx = (phIdx + 1) % seq.length;
        if (phIdx === 0) setCycles(cy => cy + 1);
        const next = seq[phIdx];
        c = durs[next];
        setPhase(next);
        setCount(c);
        applyCircle(next, durs[next]);
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [active, pattern]);

  const LABEL: Record<BPhase, string> = {
    ready: "Press Start", inhale: "Breathe In", hold1: "Hold",
    exhale: "Breathe Out", hold2: "Hold",
  };
  const COLOR: Record<BPhase, string> = {
    ready: "#6b7280", inhale: "#7c3aed", hold1: "#0891b2",
    exhale: "#16a34a", hold2: "#d97706",
  };

  return (
    <div style={{ textAlign: "center" }}>
      {/* Pattern picker */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 28 }}>
        {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map(k => (
          <button key={k} onClick={() => { setPattern(k); setActive(false); }}
            style={{
              background: pattern === k ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)",
              border: `1.5px solid ${pattern === k ? "#7c3aed" : "rgba(255,255,255,0.12)"}`,
              color: pattern === k ? "#a78bfa" : "#9ca3af",
              fontWeight: 700, fontSize: 12, borderRadius: 50, padding: "7px 18px", cursor: "pointer",
            }}>{PATTERNS[k].name}</button>
        ))}
      </div>

      {/* Animated circle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 210, marginBottom: 20 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Outer glow ring */}
          <div style={{
            position: "absolute",
            width: 210, height: 210, borderRadius: "50%",
            border: `1.5px solid ${active ? COLOR[phase] : "rgba(255,255,255,0.06)"}44`,
            transition: "border-color 1s",
          }} />
          {/* Breathing circle */}
          <div ref={circleRef} style={{
            width: 80, height: 80, borderRadius: "50%",
            background: `radial-gradient(circle, ${active ? COLOR[phase] : "#374151"}cc, ${active ? COLOR[phase] : "#1f2937"}44)`,
            boxShadow: active ? `0 0 40px ${COLOR[phase]}66` : "none",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            transition: "background 0.8s, box-shadow 0.8s",
          }}>
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>
              {active ? count : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Phase label */}
      <div style={{ fontSize: 20, fontWeight: 800, color: active ? COLOR[phase] : "#6b7280", marginBottom: 6, transition: "color 0.4s" }}>
        {LABEL[phase]}
      </div>

      {cycles > 0 && (
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>Cycles completed: {cycles}</div>
      )}

      <button onClick={() => setActive(a => !a)}
        style={{
          background: active ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
          border: `1.5px solid ${active ? "#ef4444" : "transparent"}`,
          color: active ? "#f87171" : "#fff",
          fontWeight: 800, fontSize: 14, padding: "11px 32px", borderRadius: 50, cursor: "pointer",
          marginTop: 8, boxShadow: active ? "none" : "0 6px 20px rgba(124,58,237,0.45)",
        }}>
        {active ? "⏸ Pause Session" : "▶ Begin Breathing"}
      </button>

      <p style={{ color: "#4b5268", fontSize: 11, marginTop: 16, lineHeight: 1.7 }}>
        The extended exhale activates your vagus nerve — signalling your body it is safe to rest and recover.
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. REIKI — 7 Chakra healing visualisation
// ═══════════════════════════════════════════════════════════════════════════════

const CHAKRAS = [
  { name: "Crown",        sanskrit: "Sahasrara", color: "#a855f7", element: "Thought",   location: "Top of head",    desc: "Divine connection, pure consciousness and enlightenment." },
  { name: "Third Eye",    sanskrit: "Ajna",      color: "#6366f1", element: "Light",     location: "Between brows",  desc: "Intuition, imagination, wisdom and the ability to think clearly." },
  { name: "Throat",       sanskrit: "Vishuddha", color: "#0891b2", element: "Sound",     location: "Throat",         desc: "Communication, truth, self-expression and authenticity." },
  { name: "Heart",        sanskrit: "Anahata",   color: "#16a34a", element: "Air",       location: "Chest centre",   desc: "Love, compassion, forgiveness and emotional balance." },
  { name: "Solar Plexus", sanskrit: "Manipura",  color: "#d97706", element: "Fire",      location: "Upper abdomen",  desc: "Personal power, confidence, willpower and self-esteem." },
  { name: "Sacral",       sanskrit: "Svadhisthana", color: "#ea580c", element: "Water", location: "Lower abdomen",  desc: "Creativity, passion, pleasure and emotional fluidity." },
  { name: "Root",         sanskrit: "Muladhara", color: "#dc2626", element: "Earth",     location: "Base of spine",  desc: "Survival, grounding, stability and physical vitality." },
];

const ReikiXP: React.FC = () => {
  const [active, setActive]   = useState<number | null>(null);
  const [healed, setHealed]   = useState<Set<number>>(new Set());

  const heal = (i: number) => {
    setActive(i);
    setHealed(h => new Set([...h, i]));
  };

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <style>{`
        @keyframes chakraPulse {
          0%,100% { box-shadow: 0 0 0 0 currentcolor88; }
          50%      { box-shadow: 0 0 0 14px transparent; }
        }
      `}</style>

      {/* Spine column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: "center", position: "relative" }}>
        <div style={{ position: "absolute", top: 22, bottom: 22, width: 2, background: "rgba(255,255,255,0.08)", left: "50%", transform: "translateX(-50%)" }} />
        {CHAKRAS.map((c, i) => (
          <div key={i} onClick={() => heal(i)} style={{ position: "relative", zIndex: 1, padding: "5px 0", cursor: "pointer" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: healed.has(i) ? `radial-gradient(circle, ${c.color}, ${c.color}66)` : "rgba(255,255,255,0.06)",
              border: `2px solid ${active === i ? c.color : healed.has(i) ? c.color + "88" : "rgba(255,255,255,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.4s",
              boxShadow: active === i ? `0 0 0 6px ${c.color}33` : healed.has(i) ? `0 0 12px ${c.color}55` : "none",
              color: c.color,
              animation: active === i ? "chakraPulse 1.5s ease-in-out infinite" : "none",
            }}>
              <span style={{ fontSize: 18 }}>
                {["👑", "👁", "🗣", "💚", "☀️", "🌊", "🌍"][i]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Info panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {active !== null ? (
          <div style={{ animation: "ddFadeIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: CHAKRAS[active].color, flexShrink: 0, boxShadow: `0 0 8px ${CHAKRAS[active].color}` }} />
              <span style={{ fontWeight: 900, fontSize: 18, color: CHAKRAS[active].color }}>{CHAKRAS[active].name}</span>
              <span style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>{CHAKRAS[active].sanskrit}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[["📍", CHAKRAS[active].location], ["🌀", CHAKRAS[active].element]].map(([e, v]) => (
                <span key={v as string} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#9ca3af" }}>
                  {e} {v}
                </span>
              ))}
            </div>
            <p style={{ color: "#d1d5db", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{CHAKRAS[active].desc}</p>
            <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.7, fontStyle: "italic" }}>
              Place your hands on this area. Breathe into it. Visualise a spinning wheel of{" "}
              <span style={{ color: CHAKRAS[active].color }}>{CHAKRAS[active].color === "#16a34a" ? "emerald green" : CHAKRAS[active].color === "#a855f7" ? "violet light" : "warm light"}</span>{" "}
              clearing and expanding with each exhale.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
              Tap each chakra point along the spine to direct Reiki energy and receive its healing guidance.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => CHAKRAS.forEach((_, i) => setTimeout(() => heal(i), i * 300))}
                style={{ background: "rgba(124,58,237,0.2)", border: "1.5px solid #7c3aed", color: "#a78bfa", fontWeight: 700, fontSize: 12, padding: "7px 16px", borderRadius: 50, cursor: "pointer" }}>
                ✨ Heal All Chakras
              </button>
              {healed.size > 0 && (
                <button onClick={() => { setHealed(new Set()); setActive(null); }}
                  style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.12)", color: "#6b7280", fontWeight: 600, fontSize: 12, padding: "7px 16px", borderRadius: 50, cursor: "pointer" }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
        {healed.size === 7 && (
          <div style={{ marginTop: 16, background: "rgba(16,163,74,0.12)", border: "1.5px solid rgba(16,163,74,0.3)", borderRadius: 14, padding: "12px 16px" }}>
            <p style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>
              ✓ All 7 chakras balanced — your energy field is clear and flowing. 🙏
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. HYPNOTHERAPY — Progressive relaxation with pendulum
// ═══════════════════════════════════════════════════════════════════════════════

const HYPNO_SCRIPT = [
  "Find a comfortable position. Close your eyes and let your body sink into the surface beneath you.",
  "Take a slow, deep breath in... and release. With each breath, your body grows heavier and more relaxed.",
  "Feel the tension leaving your forehead... your jaw... your shoulders... your hands.",
  "You are safe. You are calm. There is nothing to do right now but allow yourself to let go.",
  "Imagine a warm golden light above you, slowly descending through the crown of your head.",
  "This golden light fills every cell in your body — warm, healing, peaceful.",
  "On the count of 5, you will be deeply relaxed... 5... 4... 3... 2... 1.",
  "You are now in a deep state of healing. Your subconscious mind is open and receptive.",
  "Any limiting belief or fear you carry is dissolving now — gently, easily, completely.",
  "In this stillness, you are whole. You are healed. You are free.",
];

const HypnotherapyXP: React.FC = () => {
  const [step, setStep]   = useState(0);
  const [active, setActive] = useState(false);
  const [done, setDone]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setActive(true); setDone(false); setStep(0);
    timerRef.current = setInterval(() => {
      setStep(s => {
        if (s >= HYPNO_SCRIPT.length - 1) {
          clearInterval(timerRef.current!);
          setActive(false); setDone(true);
          return s;
        }
        return s + 1;
      });
    }, 5000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <style>{`
        @keyframes swing {
          0%   { transform: rotate(-20deg); }
          50%  { transform: rotate(20deg); }
          100% { transform: rotate(-20deg); }
        }
        @keyframes scriptFade {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Pendulum */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28, height: 120 }}>
        <div style={{ width: 2, height: 80, background: "rgba(255,255,255,0.12)", transformOrigin: "top center", animation: active ? "swing 2.4s ease-in-out infinite" : "none" }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "radial-gradient(circle, #a78bfa, #7c3aed)",
            boxShadow: "0 0 16px rgba(124,58,237,0.7)",
            position: "absolute", bottom: -13, left: -12,
          }} />
        </div>
      </div>

      {/* Script text */}
      <div style={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        {!active && !done ? (
          <p style={{ color: "#6b7280", fontSize: 14 }}>Press begin to start your hypnotherapy session.</p>
        ) : done ? (
          <p style={{ color: "#a78bfa", fontSize: 15, fontStyle: "italic", lineHeight: 1.7 }}>
            Your session is complete. Sit quietly for a moment before opening your eyes. 🙏
          </p>
        ) : (
          <p key={step} style={{ color: "#e5e7eb", fontSize: 15, fontStyle: "italic", lineHeight: 1.8, maxWidth: 420, animation: "scriptFade 0.8s ease" }}>
            "{HYPNO_SCRIPT[step]}"
          </p>
        )}
      </div>

      {/* Progress dots */}
      {(active || done) && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {HYPNO_SCRIPT.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= step ? "#7c3aed" : "rgba(255,255,255,0.12)", transition: "background 0.4s" }} />
          ))}
        </div>
      )}

      {!active && (
        <button onClick={start}
          style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, padding: "11px 30px", borderRadius: 50, cursor: "pointer", boxShadow: "0 6px 20px rgba(124,58,237,0.45)" }}>
          {done ? "↺ Repeat Session" : "✦ Begin Session"}
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SHADOW WORK — Guided journaling
// ═══════════════════════════════════════════════════════════════════════════════

const SHADOW_PROMPTS = [
  { q: "What emotion do you resist or judge most in yourself?", hint: "Anger, shame, jealousy, neediness — all are valid. There is no wrong answer." },
  { q: "When was the first time you remember feeling that way?", hint: "Let a memory surface without forcing it. It might be a scene, a feeling, or just a sense." },
  { q: "What did you decide about yourself or the world in that moment?", hint: "\"I am not enough\", \"It isn't safe to be myself\", \"Love has conditions\" — what did you learn?" },
  { q: "How does carrying this belief serve you — what has it protected you from?", hint: "The shadow always served a purpose once. Honour its protective intention." },
  { q: "What would you say to that younger version of yourself right now?", hint: "Speak with complete kindness. They were doing the best they could." },
];

const ShadowWorkXP: React.FC = () => {
  const [step, setStep]       = useState(0);
  const [responses, setResp]  = useState<string[]>(Array(SHADOW_PROMPTS.length).fill(""));
  const [done, setDone]       = useState(false);

  const curr = SHADOW_PROMPTS[step];

  return (
    <div>
      <style>{`@keyframes promptIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {!done ? (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {SHADOW_PROMPTS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= step ? "#0d9488" : "rgba(255,255,255,0.1)", transition: "background 0.4s" }} />
            ))}
          </div>

          <div key={step} style={{ animation: "promptIn 0.5s ease" }}>
            <p style={{ color: "#5eead4", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
              Reflection {step + 1} of {SHADOW_PROMPTS.length}
            </p>
            <h3 style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
              {curr.q}
            </h3>
            <p style={{ color: "#6b7280", fontSize: 12, fontStyle: "italic", lineHeight: 1.6, marginBottom: 16 }}>
              {curr.hint}
            </p>
            <textarea
              value={responses[step]}
              onChange={e => setResp(r => { const c = [...r]; c[step] = e.target.value; return c; })}
              placeholder="Write freely, without judgment…"
              rows={4}
              style={{
                width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)",
                border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px",
                color: "#f3f4f6", fontSize: 13, lineHeight: 1.7, resize: "vertical",
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.12)", color: "#9ca3af", fontWeight: 600, fontSize: 13, padding: "8px 20px", borderRadius: 50, cursor: "pointer" }}>
                ← Back
              </button>
            )}
            <button
              onClick={() => step < SHADOW_PROMPTS.length - 1 ? setStep(s => s + 1) : setDone(true)}
              style={{ marginLeft: "auto", background: "rgba(13,148,136,0.2)", border: "1.5px solid #0d9488", color: "#5eead4", fontWeight: 800, fontSize: 13, padding: "9px 22px", borderRadius: 50, cursor: "pointer" }}>
              {step < SHADOW_PROMPTS.length - 1 ? "Next Reflection →" : "Complete Session ✓"}
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>🌑</div>
          <h3 style={{ color: "#5eead4", fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
            You have done courageous work today.
          </h3>
          <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.8, maxWidth: 380, margin: "0 auto 20px" }}>
            Shadow integration is a lifelong practice. Every time you turn towards the parts of yourself you've been avoiding, you reclaim your wholeness. Be gentle with yourself today.
          </p>
          <button onClick={() => { setStep(0); setDone(false); setResp(Array(SHADOW_PROMPTS.length).fill("")); }}
            style={{ background: "transparent", border: "1.5px solid #0d9488", color: "#5eead4", fontWeight: 700, fontSize: 13, padding: "9px 22px", borderRadius: 50, cursor: "pointer" }}>
            ↺ Begin Again
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. AKASHIK RECORDS — Cosmic starfield meditation
// ═══════════════════════════════════════════════════════════════════════════════

const AKASHIK_STAGES = [
  "Close your eyes. Take three slow breaths. Feel yourself becoming very still.",
  "Imagine you are standing at the entrance to a vast, luminous library — the Akashik Records.",
  "A warm golden door appears before you. State your intention: 'I access my records with love and for my highest good.'",
  "The door opens. You enter a space of infinite light and knowledge. Feel total peace.",
  "Ask your question — silently, from your heart. Notice the first impression that arises, however faint.",
  "Receive without judgement. Images, words, sensations — all are valid answers from your soul.",
  "Thank your guides and the Record Keepers. Slowly return your awareness to the room.",
];

const AkashikXP: React.FC = () => {
  const [stage, setStage]   = useState(0);
  const [active, setActive] = useState(false);
  const [done, setDone]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const STARS = useRef(Array.from({ length: 70 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100,
    s: 0.5 + Math.random() * 2.5,
    d: 2 + Math.random() * 5,
    del: Math.random() * 4,
  }))).current;

  const begin = () => {
    setActive(true); setDone(false); setStage(0);
    timerRef.current = setInterval(() => {
      setStage(s => {
        if (s >= AKASHIK_STAGES.length - 1) {
          clearInterval(timerRef.current!); setActive(false); setDone(true); return s;
        }
        return s + 1;
      });
    }, 6000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return (
    <div>
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:.15;} 50%{opacity:.9;} }
        @keyframes akashikIn { from{opacity:0;transform:translateY(12px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Starfield */}
      <div style={{ position: "relative", height: 160, background: "radial-gradient(ellipse at 50% 50%, #0d0b1e, #050308)", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
        {STARS.map((st, i) => (
          <div key={i} style={{
            position: "absolute", left: `${st.x}%`, top: `${st.y}%`,
            width: st.s, height: st.s, borderRadius: "50%", background: "#d4b5fd",
            animation: `twinkle ${st.d}s ease-in-out infinite ${st.del}s`,
          }} />
        ))}
        {/* Central glow */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: active ? 80 : 40, height: active ? 80 : 40, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.6), transparent)",
            transition: "all 2s ease", boxShadow: "0 0 40px rgba(167,139,250,0.4)",
          }} />
        </div>
      </div>

      {/* Stage text */}
      <div style={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", marginBottom: 20 }}>
        {!active && !done ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>Enter a sincere question you wish to explore — then begin your journey.</p>
        ) : done ? (
          <p key="done" style={{ color: "#c4b5fd", fontSize: 15, fontStyle: "italic", lineHeight: 1.8, animation: "akashikIn 1s ease" }}>
            Your records have been accessed. Trust whatever arose — no matter how subtle. The answer was always within you. 🌟
          </p>
        ) : (
          <p key={stage} style={{ color: "#e5e7eb", fontSize: 14, fontStyle: "italic", lineHeight: 1.8, maxWidth: 400, animation: "akashikIn 0.8s ease" }}>
            {AKASHIK_STAGES[stage]}
          </p>
        )}
      </div>

      {!active && (
        <div style={{ textAlign: "center" }}>
          <button onClick={begin}
            style={{ background: "linear-gradient(135deg,#7c3aed,#9333ea)", border: "none", color: "#fff", fontWeight: 800, fontSize: 14, padding: "11px 30px", borderRadius: 50, cursor: "pointer", boxShadow: "0 6px 20px rgba(147,51,234,0.5)" }}>
            {done ? "✦ Access Again" : "✦ Enter the Records"}
          </button>
        </div>
      )}

      {active && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {AKASHIK_STAGES.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= stage ? "#a78bfa" : "rgba(255,255,255,0.1)", transition: "background 0.4s" }} />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. NLP COACHING — Swish Pattern / Confidence Anchor
// ═══════════════════════════════════════════════════════════════════════════════

const NLP_STEPS = [
  { title: "Identify the trigger",         inst: "Think of a situation where you feel stuck, anxious, or unconfident. See it as a dim, distant image in your mind. Notice how it feels.",                     action: "I have the image" },
  { title: "Build your confident self",    inst: "Now create a vivid image of yourself at your absolute best — confident, capable, totally at ease. Make it bright, close and life-size.",                  action: "My ideal image is clear" },
  { title: "The SWISH — fire the pattern", inst: "Hold both images. Place your small limiting image in front. Now SWISH — let your ideal self-image explode forward, replacing the old image completely. Do this 5 times fast.", action: "Swish done ✓" },
  { title: "Create your anchor",           inst: "Step into your confident image fully. As you feel it peak, press your thumb and first finger together firmly. Hold for 6 seconds. This is your anchor.", action: "Anchor set" },
  { title: "Test and fire",                inst: "Let go. Think of something neutral. Now squeeze your anchor. Notice the confident feeling returning instantly. This is now yours, any time you need it.", action: "Anchor works!" },
];

const NLPCoachingXP: React.FC = () => {
  const [step, setStep] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div>
      {step === null && !done ? (
        <>
          <p style={{ color: "#93c5fd", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>NLP Technique: Swish Pattern + Confidence Anchor</p>
          <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
            This 5-step exercise installs a new, empowering response in place of an old limiting one using your brain's natural pattern-making mechanism.
          </p>
          <button onClick={() => setStep(0)}
            style={{ background: "rgba(37,99,235,0.2)", border: "1.5px solid #2563eb", color: "#93c5fd", fontWeight: 800, fontSize: 14, padding: "11px 28px", borderRadius: 50, cursor: "pointer" }}>
            🧠 Begin Exercise
          </button>
        </>
      ) : done ? (
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🏆</div>
          <h3 style={{ color: "#93c5fd", fontSize: 17, fontWeight: 800, marginBottom: 12 }}>Your anchor is installed.</h3>
          <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.8, maxWidth: 380, margin: "0 auto 20px" }}>
            Each time you fire your anchor over the next 21 days, you strengthen the neural pathway. Use it before presentations, conversations or any situation where you want to perform at your best.
          </p>
          <button onClick={() => { setStep(null); setDone(false); }}
            style={{ background: "transparent", border: "1.5px solid #2563eb", color: "#93c5fd", fontWeight: 700, fontSize: 13, padding: "9px 22px", borderRadius: 50, cursor: "pointer" }}>
            ↺ Repeat
          </button>
        </div>
      ) : step !== null && (
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
            {NLP_STEPS.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= step ? "#2563eb" : "rgba(255,255,255,0.1)", transition: "background 0.4s" }} />)}
          </div>
          <div style={{ animation: "ddFadeIn 0.3s ease" }}>
            <p style={{ color: "#60a5fa", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Step {step + 1} of {NLP_STEPS.length}</p>
            <h3 style={{ color: "#f3f4f6", fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{NLP_STEPS[step].title}</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, lineHeight: 1.8, marginBottom: 20 }}>{NLP_STEPS[step].inst}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => (s ?? 1) - 1)}
                style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.12)", color: "#6b7280", fontWeight: 600, fontSize: 13, padding: "9px 20px", borderRadius: 50, cursor: "pointer" }}>
                ← Back
              </button>
            )}
            <button onClick={() => step < NLP_STEPS.length - 1 ? setStep(s => (s ?? 0) + 1) : setDone(true)}
              style={{ background: "rgba(37,99,235,0.2)", border: "1.5px solid #2563eb", color: "#93c5fd", fontWeight: 800, fontSize: 13, padding: "9px 22px", borderRadius: 50, cursor: "pointer" }}>
              {NLP_STEPS[step].action} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. PRANIC HEALING — Aura scan & chakra cleanse
// ═══════════════════════════════════════════════════════════════════════════════

const PRANIC_ZONES = [
  { name: "Crown aura",    y: 8,  color: "#a855f7" },
  { name: "Mental body",   y: 22, color: "#6366f1" },
  { name: "Throat field",  y: 35, color: "#0891b2" },
  { name: "Heart aura",    y: 49, color: "#16a34a" },
  { name: "Vital solar",   y: 63, color: "#d97706" },
  { name: "Sacral prana",  y: 76, color: "#ea580c" },
  { name: "Ground prana",  y: 89, color: "#dc2626" },
];

const PranicXP: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [scanY, setScanY]       = useState(0);
  const [cleansed, setCleansed] = useState<Set<number>>(new Set());
  const [active, setActive]     = useState<number | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startScan = () => {
    setScanning(true); setScanY(0); setCleansed(new Set()); setActive(null);
    let y = 0;
    scanRef.current = setInterval(() => {
      y += 1.2;
      setScanY(y);
      PRANIC_ZONES.forEach((z, i) => {
        if (Math.abs(y - z.y) < 3) setCleansed(c => new Set([...c, i]));
      });
      if (y >= 100) { clearInterval(scanRef.current!); setScanning(false); }
    }, 60);
  };

  useEffect(() => () => { if (scanRef.current) clearInterval(scanRef.current); }, []);

  const sel = active !== null ? PRANIC_ZONES[active] : null;

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {/* Aura body */}
      <div style={{ position: "relative", width: 140, flexShrink: 0, height: 340 }}>
        {/* Aura rings */}
        {[1, 0.6, 0.3].map((op, ri) => (
          <div key={ri} style={{
            position: "absolute",
            left: `${ri * 10}%`, right: `${ri * 10}%`,
            top: `${ri * 4}%`, bottom: `${ri * 4}%`,
            border: `1.5px solid rgba(167,139,250,${op * 0.3})`,
            borderRadius: "50% 50% 40% 40%",
            background: `rgba(124,58,237,${op * 0.04})`,
          }} />
        ))}

        {/* Body silhouette */}
        <div style={{
          position: "absolute", left: "28%", right: "28%", top: "8%", bottom: "2%",
          background: "linear-gradient(to bottom, rgba(167,139,250,0.15), rgba(124,58,237,0.08))",
          borderRadius: "45% 45% 30% 30%",
          border: "1px solid rgba(167,139,250,0.2)",
        }} />

        {/* Scanner beam */}
        {scanning && (
          <div style={{
            position: "absolute", left: 0, right: 0, height: 3,
            top: `${scanY}%`,
            background: "linear-gradient(90deg, transparent, #a78bfa, #5eead4, #a78bfa, transparent)",
            boxShadow: "0 0 12px #a78bfa",
            transition: "top 0.06s linear",
          }} />
        )}

        {/* Prana zone dots */}
        {PRANIC_ZONES.map((z, i) => (
          <div key={i} onClick={() => setActive(i === active ? null : i)}
            style={{
              position: "absolute", left: "50%", top: `${z.y}%`,
              transform: "translate(-50%, -50%)",
              width: 16, height: 16, borderRadius: "50%",
              background: cleansed.has(i) ? z.color : "rgba(255,255,255,0.1)",
              border: `2px solid ${active === i ? z.color : cleansed.has(i) ? z.color + "88" : "rgba(255,255,255,0.15)"}`,
              boxShadow: cleansed.has(i) ? `0 0 10px ${z.color}88` : "none",
              cursor: "pointer", transition: "all 0.4s", zIndex: 2,
            }} />
        ))}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
            Pranic Healing works by scanning the body's energy field for blockages, then sweeping and energising with clean prana.
          </p>

          {sel ? (
            <div style={{ background: `${sel.color}12`, border: `1.5px solid ${sel.color}33`, borderRadius: 14, padding: "14px 16px", marginBottom: 16, animation: "ddFadeIn 0.2s ease" }}>
              <div style={{ fontWeight: 800, color: sel.color, fontSize: 14, marginBottom: 6 }}>{sel.name}</div>
              <p style={{ color: "#9ca3af", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                {cleansed.has(active!) ? "✓ This zone has been scanned and energised with clean prana. The stagnant energy has been swept away." : "This prana zone has not yet been scanned. Run a full body scan to cleanse it."}
              </p>
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
              <p style={{ color: "#6b7280", fontSize: 12, margin: 0 }}>Tap a prana point on the body to view its status, or run a full scan.</p>
            </div>
          )}

          {cleansed.size === PRANIC_ZONES.length && !scanning && (
            <div style={{ background: "rgba(16,163,74,0.1)", border: "1.5px solid rgba(16,163,74,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ color: "#4ade80", fontWeight: 700, fontSize: 12, margin: 0 }}>✓ All prana zones cleansed — your energy body is fully vitalized. 🙏</p>
            </div>
          )}
        </div>

        <button onClick={startScan} disabled={scanning}
          style={{
            background: scanning ? "rgba(255,255,255,0.04)" : "rgba(167,139,250,0.15)",
            border: `1.5px solid ${scanning ? "rgba(255,255,255,0.1)" : "#a78bfa"}`,
            color: scanning ? "#6b7280" : "#c4b5fd",
            fontWeight: 800, fontSize: 13, padding: "10px 22px",
            borderRadius: 50, cursor: scanning ? "not-allowed" : "pointer",
          }}>
          {scanning ? "⚡ Scanning…" : cleansed.size === PRANIC_ZONES.length ? "↺ Re-scan Aura" : "⚡ Scan Aura Field"}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const XP_MAP: Record<string, React.FC> = {
  "Sound Therapy":   SoundTherapyXP,
  "Reiki Healing":   ReikiXP,
  "Hypnotherapy":    HypnotherapyXP,
  "Shadow Work":     ShadowWorkXP,
  "Breathwork":      BreathworkXP,
  "Akashik Records": AkashikXP,
  "NLP Coaching":    NLPCoachingXP,
  "Pranic Healing":  PranicXP,
};

interface Props {
  therapy: TherapyDef;
  onClose: () => void;
}

const TherapyModal: React.FC<Props> = ({ therapy, onClose }) => {
  const nav = useNavigate();
  const Experience = XP_MAP[therapy.label];

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(5,3,8,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        animation: "ddFadeIn 0.18s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 680,
          background: "linear-gradient(160deg, #0f0e1a 0%, #13112a 100%)",
          border: `1.5px solid ${therapy.color}44`,
          borderRadius: 24,
          boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px ${therapy.color}22`,
          overflow: "hidden",
          display: "flex", flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${therapy.color}22`,
          display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
          background: `linear-gradient(90deg, ${therapy.color}10, transparent)`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: `${therapy.color}20`,
            border: `1.5px solid ${therapy.color}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>
            {therapy.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#f3f4f6", fontWeight: 900, fontSize: 18, margin: 0, lineHeight: 1.2 }}>{therapy.label}</h2>
            <span style={{
              display: "inline-block", marginTop: 4,
              fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7,
              color: therapy.color, background: `${therapy.color}18`,
              border: `1px solid ${therapy.color}30`, borderRadius: 20, padding: "2px 8px",
            }}>{therapy.type}</span>
          </div>
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af", fontSize: 18, flexShrink: 0 }}>
            ✕
          </button>
        </div>

        {/* Therapy experience */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {Experience ? <Experience /> : (
            <p style={{ color: "#6b7280", textAlign: "center" }}>Experience coming soon.</p>
          )}
        </div>

        {/* Search Live Therapist CTA */}
        <div style={{
          flexShrink: 0,
          background: "linear-gradient(90deg, rgba(124,58,237,0.12), rgba(13,148,136,0.08))",
          borderTop: `1px solid rgba(255,255,255,0.07)`,
          padding: "16px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ color: "#f3f4f6", fontWeight: 700, fontSize: 14 }}>Want a personalised {therapy.label} session?</div>
            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 3 }}>Connect with a certified healer for live 1:1 guidance.</div>
          </div>
          <button
            onClick={() => { onClose(); nav("/consultation"); }}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #0d9488)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 13,
              padding: "11px 22px", borderRadius: 50, cursor: "pointer",
              boxShadow: "0 4px 18px rgba(124,58,237,0.45)",
              whiteSpace: "nowrap", flexShrink: 0,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(124,58,237,0.45)"; }}
          >
            🔍 Search Live Therapist →
          </button>
        </div>
      </div>
    </div>
  );
};

export default TherapyModal;
