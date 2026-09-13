import React, { useState, useEffect, useRef, useCallback } from "react";
import { useThemeStore } from "../stores/themeStore";
import client from "../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlaceSuggestion {
  displayName: string;
  osmId: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset: string;
}

interface PlanetPos {
  planet: string;
  displayName: string;
  abbr: string;
  signIndex: number;
  signName: string;
  degree: number;
  minute: number;
  house: number;
  nakshatraName: string;
  nakshatraLord: string;
  pada: number;
  isRetrograde: boolean;
  isExalted: boolean;
  isDebilitated: boolean;
  isOwnSign: boolean;
  isVargottama: boolean;
}

interface DivisionalPos {
  planet: string;
  signIndex: number;
  signName: string;
}

interface DashaPeriod {
  lord: string;
  displayName: string;
  startDate: string;
  endDate: string;
  durationYears?: number;
  durationDays?: number;
  isCurrent: boolean;
  antardashas?: DashaPeriod[];
}

interface Yoga {
  name: string;
  isPresent: boolean;
  description: string;
  significance: string;
  planets: string[];
}

interface Dosha {
  name: string;
  isPresent: boolean;
  description: string;
  severity: string;
  remedies?: string[];
}

interface KundliResult {
  person: { name: string; gender: string; dob: string; time: string };
  location: { placeResolved: string; timezone: string; utcOffset: string };
  ascendant: { signIndex: number; signName: string; degree: number; minute: number; nakshatraName: string };
  planets: PlanetPos[];
  charts: {
    d1: { positions: DivisionalPos[] };
    d9: { positions: DivisionalPos[] };
  };
  dashas: { vimshottari: DashaPeriod[] };
  yogas: Yoga[];
  doshas: Dosha[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SIGN_NAMES = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGN_SYMBOLS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

// North Indian grid: [row, col, house]
const NI_GRID: Array<[number, number, number]> = [
  [0,0,12],[0,1,1],[0,2,2],[0,3,3],
  [1,0,11],                [1,3,4],
  [2,0,10],                [2,3,5],
  [3,0,9],[3,1,8],[3,2,7],[3,3,6],
];

const PLANET_COLOR: Record<string, string> = {
  sun: "#f59e0b", moon: "#94a3b8", mars: "#ef4444", mercury: "#22c55e",
  jupiter: "#f97316", venus: "#ec4899", saturn: "#818cf8",
  rahu: "#a78bfa", ketu: "#84cc16",
};

const PLANET_ABBR: Record<string, string> = {
  sun:"Su", moon:"Mo", mars:"Ma", mercury:"Me",
  jupiter:"Ju", venus:"Ve", saturn:"Sa", rahu:"Ra", ketu:"Ke",
  ascendant:"As",
};

const TAB_LIST = [
  { id: "chart",   label: "D1 Chart"  },
  { id: "d9",      label: "D9 Chart"  },
  { id: "planets", label: "Planets"   },
  { id: "dasha",   label: "Dasha"     },
  { id: "yogas",   label: "Yogas"     },
];

// ── North Indian Chart SVG ────────────────────────────────────────────────────

function NiChart({
  ascSignIdx,
  signPlanets,
  centerLabel,
  centerSub,
  isDark,
}: {
  ascSignIdx: number;
  signPlanets: Record<number, Array<{ abbr: string; deg: number; planet: string; retro: boolean }>>;
  centerLabel: string;
  centerSub: string;
  isDark: boolean;
}) {
  const SIZE = 320;
  const CELL = SIZE / 4;
  const lineC   = isDark ? "rgba(251,146,60,0.75)" : "rgba(234,88,12,0.65)";
  const bgC     = isDark ? "#13122a" : "#ffffff";
  const textC   = isDark ? "#f3f4f6" : "#1a2035";
  const mutedC  = isDark ? "#9ca3af" : "#6b7280";
  const accentC = "#7c3aed";

  const houseSign = (h: number) => (ascSignIdx + h - 1) % 12;

  const cellAnchor = (row: number, col: number): [number, number] => {
    if (row === 0 && col === 0) return [CELL * 0.30, CELL * 0.30];
    if (row === 0 && col === 3) return [CELL * 3.70, CELL * 0.30];
    if (row === 3 && col === 0) return [CELL * 0.30, CELL * 3.70];
    if (row === 3 && col === 3) return [CELL * 3.70, CELL * 3.70];
    return [col * CELL + CELL / 2, row * CELL + CELL / 2 - 6];
  };

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: "block", borderRadius: 8, overflow: "hidden" }}>
      {/* Background */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill={bgC} rx={8} />

      {/* Grid lines */}
      {[1, 2, 3].map(i => (
        <React.Fragment key={i}>
          <line x1={0} y1={i * CELL} x2={SIZE} y2={i * CELL} stroke={lineC} strokeWidth={1} />
          <line x1={i * CELL} y1={0} x2={i * CELL} y2={SIZE} stroke={lineC} strokeWidth={1} />
        </React.Fragment>
      ))}

      {/* Corner diagonals */}
      <line x1={CELL} y1={0} x2={0} y2={CELL} stroke={lineC} strokeWidth={1.2} />
      <line x1={CELL * 3} y1={0} x2={SIZE} y2={CELL} stroke={lineC} strokeWidth={1.2} />
      <line x1={0} y1={CELL * 3} x2={CELL} y2={SIZE} stroke={lineC} strokeWidth={1.2} />
      <line x1={CELL * 3} y1={SIZE} x2={SIZE} y2={CELL * 3} stroke={lineC} strokeWidth={1.2} />

      {/* Center X */}
      <line x1={CELL} y1={CELL} x2={CELL * 3} y2={CELL * 3} stroke={lineC} strokeWidth={1.2} />
      <line x1={CELL * 3} y1={CELL} x2={CELL} y2={CELL * 3} stroke={lineC} strokeWidth={1.2} />

      {/* Outer border */}
      <rect x={0.5} y={0.5} width={SIZE - 1} height={SIZE - 1} fill="none" stroke={lineC} strokeWidth={1.5} rx={8} />

      {/* Lagna highlight */}
      {(() => {
        const entry = NI_GRID.find(([,,h]) => h === 1);
        if (!entry) return null;
        const [lr, lc] = entry;
        return <rect x={lc * CELL + 1} y={lr * CELL + 1} width={CELL - 2} height={CELL - 2} fill={isDark ? "rgba(99,102,241,0.12)" : "rgba(79,70,229,0.07)"} />;
      })()}

      {/* Houses */}
      {NI_GRID.map(([row, col, house]) => {
        const signIdx = houseSign(house);
        const planetsHere = signPlanets[signIdx] ?? [];
        const isLagna = house === 1;
        const [ax, ay] = cellAnchor(row, col);

        // House number (small, bottom-left of cell)
        const numX = col * CELL + 4;
        const numY = (row + 1) * CELL - 4;

        return (
          <g key={house}>
            {/* House number */}
            <text x={numX} y={numY} fill={mutedC} fontSize={8} fontWeight="500">{house}</text>

            {/* Lagna triangle marker */}
            {isLagna && (
              <text x={ax} y={ay - 2} fill={accentC} fontSize={8} fontWeight="800" textAnchor="middle">▲</text>
            )}

            {/* Planets */}
            {planetsHere.slice(0, 5).map(({ abbr, deg, planet, retro }, pi) => {
              const fill = planet === "ascendant" ? accentC : (PLANET_COLOR[planet] ?? textC);
              const label = abbr + (retro ? "ᴿ" : "");
              const py = ay + (isLagna ? 8 : 0) + pi * 14;
              const halfW = (label.length * 4.5) / 2;

              return (
                <g key={abbr + pi}>
                  <text x={ax - (deg > 0 ? 3 : 0)} y={py}
                    fill={fill} fontSize={9.5} fontWeight="700" textAnchor="middle">
                    {label}
                  </text>
                  {deg > 0 && (
                    <text x={ax - 3 + halfW + 3} y={py - 3.5}
                      fill={fill} fontSize={6} fontWeight="700" textAnchor="start" opacity={0.85}>
                      {deg}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Center label */}
      <text x={SIZE / 2} y={SIZE / 2 - 8} fill={textC} fontSize={10} fontWeight="700" textAnchor="middle">{centerLabel}</text>
      <text x={SIZE / 2} y={SIZE / 2 + 6} fill={mutedC} fontSize={8.5} textAnchor="middle">{centerSub}</text>
    </svg>
  );
}

// ── Planet status badge ───────────────────────────────────────────────────────

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "1px 7px", borderRadius: 20,
      fontSize: 10, fontWeight: 700, background: color + "22", color,
      border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

// ── Debounce helper ───────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KundliPage() {
  const { t, isDark } = useThemeStore();

  // Form state
  const [name, setName]           = useState("");
  const [gender, setGender]       = useState<"male"|"female"|"other">("male");
  const [dob, setDob]             = useState("");
  const [time, setTime]           = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const placeRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(placeQuery, 380);

  // Result state
  const [kundli, setKundli]   = useState<KundliResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setActiveTab] = useState("chart");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (placeRef.current && !placeRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Place search
  useEffect(() => {
    if (debouncedQuery.length < 2 || selectedPlace) { setSuggestions([]); return; }
    client.get(`/kundli/places?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => { setSuggestions(r.data.data ?? []); setShowDropdown(true); })
      .catch(() => setSuggestions([]));
  }, [debouncedQuery, selectedPlace]);

  const pickPlace = (p: PlaceSuggestion) => {
    setSelectedPlace(p);
    setPlaceQuery(p.displayName);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const clearPlace = () => {
    setSelectedPlace(null);
    setPlaceQuery("");
    setSuggestions([]);
  };

  const calculate = async () => {
    if (!name.trim())         { setError("Enter name."); return; }
    if (!dob)                 { setError("Enter date of birth."); return; }
    if (!time)                { setError("Enter birth time."); return; }
    if (!selectedPlace)       { setError("Select a birth place from the list."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await client.post("/kundli/calculate", {
        name: name.trim(), gender, dob, time,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        timezone: selectedPlace.timezone,
        placeLabel: selectedPlace.displayName,
      });
      setKundli(res.data.data);
      setActiveTab("chart");
      setTimeout(() => document.getElementById("kundli-result")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message;
      setError(msg || "Calculation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Build signPlanets map for chart: signIndex → list of planet entries
  const buildSignPlanets = useCallback((
    planets: PlanetPos[],
    ascSignIdx: number,
    d9Positions?: DivisionalPos[]
  ) => {
    const map: Record<number, Array<{ abbr: string; deg: number; planet: string; retro: boolean }>> = {};

    if (d9Positions) {
      for (const p of d9Positions) {
        const si = p.signIndex;
        if (!map[si]) map[si] = [];
        const abbr = PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2);
        map[si].push({ abbr, deg: 0, planet: p.planet, retro: false });
      }
      map[ascSignIdx] = [{ abbr: "As", deg: 0, planet: "ascendant", retro: false }, ...(map[ascSignIdx] ?? [])];
    } else {
      map[ascSignIdx] = [{ abbr: "As", deg: kundli!.ascendant.degree, planet: "ascendant", retro: false }];
      for (const p of planets) {
        const si = p.signIndex;
        if (!map[si]) map[si] = [];
        map[si].push({ abbr: p.abbr, deg: p.degree, planet: p.planet, retro: p.isRetrograde });
      }
    }
    return map;
  }, [kundli]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    background: t.bgInput, border: `1.5px solid ${t.border}`,
    borderRadius: 10, padding: "10px 14px", color: t.textPrimary,
    fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const label: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: t.textSecond,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px 80px" }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🪐</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: t.textPrimary }}>
          Vedic Kundli
        </h1>
        <p style={{ margin: "8px 0 0", color: t.textSecond, fontSize: 15 }}>
          North Indian birth chart — Lahiri ayanamsa · Whole Sign houses · Vimshottari Dasha
        </p>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: t.bgCard, border: `1px solid ${t.border}`,
        borderRadius: 18, padding: "28px 24px", marginBottom: 32,
        boxShadow: `0 4px 24px ${t.shadow}`,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>

          {/* Name */}
          <div>
            <span style={label}>Full Name</span>
            <input style={inp} placeholder="e.g. Rahul Sharma" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => (e.target.style.borderColor = t.accent)}
              onBlur={e => (e.target.style.borderColor = t.border)} />
          </div>

          {/* Gender */}
          <div>
            <span style={label}>Gender</span>
            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              {(["male","female","other"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.15s",
                    background: gender === g ? t.accent : t.bgInput,
                    color: gender === g ? "#fff" : t.textSecond,
                    border: `1.5px solid ${gender === g ? t.accent : t.border}`,
                  }}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Date of birth */}
          <div>
            <span style={label}>Date of Birth</span>
            <input type="date" style={inp} value={dob} onChange={e => setDob(e.target.value)}
              onFocus={e => (e.target.style.borderColor = t.accent)}
              onBlur={e => (e.target.style.borderColor = t.border)} />
          </div>

          {/* Time of birth */}
          <div>
            <span style={label}>Time of Birth</span>
            <input type="time" style={inp} step="60" value={time} onChange={e => setTime(e.target.value)}
              onFocus={e => (e.target.style.borderColor = t.accent)}
              onBlur={e => (e.target.style.borderColor = t.border)} />
          </div>

          {/* Place — full width */}
          <div style={{ gridColumn: "1 / -1" }} ref={placeRef}>
            <span style={label}>Place of Birth</span>
            <div style={{ position: "relative" }}>
              <input style={{ ...inp, paddingRight: selectedPlace ? 36 : 14 }}
                placeholder="Type city name…"
                value={placeQuery}
                onChange={e => { setPlaceQuery(e.target.value); if (selectedPlace) clearPlace(); }}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              />
              {selectedPlace && (
                <button onClick={clearPlace} style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 16, lineHeight: 1,
                }}>×</button>
              )}

              {showDropdown && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: t.bgCard, border: `1.5px solid ${t.borderLight}`,
                  borderRadius: 12, boxShadow: `0 12px 36px ${t.shadow}`,
                  zIndex: 200, overflow: "hidden", maxHeight: 240, overflowY: "auto",
                }}>
                  {suggestions.map(s => (
                    <div key={s.osmId} onClick={() => pickPlace(s)}
                      style={{
                        padding: "10px 14px", cursor: "pointer", fontSize: 14,
                        color: t.textPrimary, borderBottom: `1px solid ${t.border}`,
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.06)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontWeight: 600 }}>{s.displayName}</div>
                      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{s.timezone} · {s.utcOffset}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPlace && (
              <div style={{ marginTop: 6, fontSize: 12, color: t.textMuted }}>
                Timezone: <strong style={{ color: t.textSecond }}>{selectedPlace.timezone}</strong>&nbsp;
                ({selectedPlace.utcOffset}) · {selectedPlace.latitude.toFixed(4)}°, {selectedPlace.longitude.toFixed(4)}°
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: "#ef444420", border: "1px solid #ef444440", borderRadius: 10, color: "#ef4444", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={calculate}
          disabled={loading}
          style={{
            marginTop: 22, width: "100%", padding: "14px 0",
            background: loading ? t.bgTertiary : `linear-gradient(135deg, ${t.accent}, #6d28d9)`,
            color: loading ? t.textMuted : "#fff",
            border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.15s",
          }}
        >
          {loading ? "Calculating…" : "Generate Kundli"}
        </button>
      </div>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {kundli && (
        <div id="kundli-result">

          {/* Person header */}
          <div style={{
            background: `linear-gradient(135deg, ${isDark ? "#1e1b4b" : "#ede9fe"}, ${isDark ? "#13122a" : "#f5f3ff"})`,
            border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 24px",
            marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center",
          }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary }}>{kundli.person.name}</div>
              <div style={{ fontSize: 13, color: t.textSecond, marginTop: 4 }}>
                {kundli.person.dob} at {kundli.person.time.slice(0,5)} · {kundli.location.placeResolved}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: t.textMuted }}>Lagna (Ascendant)</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: t.accent }}>
                {SIGN_SYMBOLS[kundli.ascendant.signIndex]} {kundli.ascendant.signName}
              </div>
              <div style={{ fontSize: 12, color: t.textMuted }}>
                {kundli.ascendant.degree}°{kundli.ascendant.minute}′ · {kundli.ascendant.nakshatraName}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
            {TAB_LIST.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                  background: activeTab === tab.id ? t.accent : t.bgCard,
                  color: activeTab === tab.id ? "#fff" : t.textSecond,
                  border: `1.5px solid ${activeTab === tab.id ? t.accent : t.border}`,
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── D1 Chart ──────────────────────────────────────────────────── */}
          {activeTab === "chart" && (() => {
            const asc = kundli.ascendant.signIndex;
            const sp = buildSignPlanets(kundli.planets, asc);
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
                <div style={{
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  borderRadius: 16, padding: 20, boxShadow: `0 4px 20px ${t.shadow}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                    D1 — Rasi Chart (North Indian)
                  </div>
                  <NiChart
                    ascSignIdx={asc}
                    signPlanets={sp}
                    centerLabel={kundli.person.name.split(" ")[0]}
                    centerSub={kundli.person.dob}
                    isDark={isDark}
                  />
                </div>

                {/* House-sign table */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                      House → Sign
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {NI_GRID.map(([,,h]) => {
                        const si = (asc + h - 1) % 12;
                        return (
                          <div key={h} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: h === 1 ? `${t.accent}22` : t.bgSecondary,
                            border: `1px solid ${h === 1 ? t.accent : t.border}`,
                            borderRadius: 8, padding: "3px 8px",
                          }}>
                            <span style={{ fontSize: 10, color: t.textMuted }}>H{h}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: h === 1 ? t.accent : t.textPrimary }}>
                              {SIGN_SYMBOLS[si]} {SIGN_NAMES[si]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Planet-sign quick ref */}
                  <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                      Planet Placement
                    </div>
                    {kundli.planets.map(p => (
                      <div key={p.planet} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "5px 0", borderBottom: `1px solid ${t.border}`,
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: PLANET_COLOR[p.planet] ?? t.textPrimary }}>
                          {p.displayName}{p.isRetrograde ? " ᴿ" : ""}
                        </span>
                        <span style={{ fontSize: 12, color: t.textSecond }}>
                          H{p.house} · {SIGN_SYMBOLS[p.signIndex]} {p.signName} {p.degree}°{p.minute}′
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── D9 Chart ──────────────────────────────────────────────────── */}
          {activeTab === "d9" && (() => {
            const d9Pos = kundli.charts.d9.positions;
            const d9Asc = d9Pos.find(p => p.planet === "ascendant");
            if (!d9Asc) return <div style={{ color: t.textMuted }}>D9 data unavailable.</div>;
            const sp = buildSignPlanets(kundli.planets, d9Asc.signIndex, d9Pos);
            return (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
                <div style={{
                  background: t.bgCard, border: `1px solid ${t.border}`,
                  borderRadius: 16, padding: 20, boxShadow: `0 4px 20px ${t.shadow}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                    D9 — Navamsa Chart (North Indian)
                  </div>
                  <NiChart
                    ascSignIdx={d9Asc.signIndex}
                    signPlanets={sp}
                    centerLabel="Navamsa"
                    centerSub={`D9 · ${d9Asc.signName} Asc`}
                    isDark={isDark}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 240, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                    D9 Positions
                  </div>
                  {d9Pos.filter(p => p.planet !== "ascendant").map(p => (
                    <div key={p.planet} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "5px 0", borderBottom: `1px solid ${t.border}`,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: PLANET_COLOR[p.planet] ?? t.textPrimary }}>
                        {PLANET_ABBR[p.planet] ?? p.planet}
                      </span>
                      <span style={{ fontSize: 12, color: t.textSecond }}>
                        {SIGN_SYMBOLS[p.signIndex]} {p.signName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Planets table ─────────────────────────────────────────────── */}
          {activeTab === "planets" && (
            <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 4px 20px ${t.shadow}` }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: isDark ? "rgba(124,58,237,0.12)" : "rgba(124,58,237,0.06)" }}>
                      {["Planet","Sign","Degree","House","Nakshatra","Pada","Status"].map(h => (
                        <th key={h} style={{
                          padding: "12px 14px", textAlign: "left", fontSize: 11,
                          fontWeight: 700, color: t.textMuted, textTransform: "uppercase",
                          letterSpacing: 0.5, borderBottom: `1px solid ${t.border}`,
                          whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kundli.planets.map((p, i) => (
                      <tr key={p.planet} style={{ background: i % 2 === 0 ? "transparent" : (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") }}>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}` }}>
                          <span style={{ fontWeight: 700, color: PLANET_COLOR[p.planet] ?? t.textPrimary }}>
                            {p.displayName}
                          </span>
                          {p.isRetrograde && <span style={{ marginLeft: 4, fontSize: 10, color: "#f97316" }}>ᴿ</span>}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}`, color: t.textPrimary }}>
                          {SIGN_SYMBOLS[p.signIndex]} {p.signName}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}`, color: t.textSecond, fontVariantNumeric: "tabular-nums" }}>
                          {p.degree}°{String(p.minute).padStart(2,"0")}′
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}`, color: t.textPrimary, fontWeight: 600 }}>
                          H{p.house}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}`, color: t.textSecond, whiteSpace: "nowrap" }}>
                          {p.nakshatraName}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}`, color: t.textMuted }}>
                          {p.pada}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${t.border}` }}>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {p.isExalted     && <StatusBadge label="Exalted"    color="#22c55e" />}
                            {p.isDebilitated && <StatusBadge label="Debil."     color="#ef4444" />}
                            {p.isOwnSign     && <StatusBadge label="Own"        color="#3b82f6" />}
                            {p.isVargottama  && <StatusBadge label="Vargottama" color="#f59e0b" />}
                            {p.isRetrograde  && <StatusBadge label="Retro"      color="#f97316" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Dasha ─────────────────────────────────────────────────────── */}
          {activeTab === "dasha" && (() => {
            const dashas = kundli.dashas.vimshottari;
            const currentMaha = dashas.find(d => d.isCurrent);
            const currentAntar = currentMaha?.antardashas?.find(a => a.isCurrent);

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {currentMaha && (
                  <div style={{
                    background: `linear-gradient(135deg, ${isDark ? "#1e1b4b" : "#ede9fe"}, ${isDark ? "#13122a" : "#f5f3ff"})`,
                    border: `1.5px solid ${t.accent}`, borderRadius: 16, padding: "20px 24px",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: t.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                      Current Dasha Period
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 12, color: t.textMuted }}>Mahadasha</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: PLANET_COLOR[currentMaha.lord] ?? t.textPrimary }}>
                          {currentMaha.displayName}
                        </div>
                        <div style={{ fontSize: 12, color: t.textSecond }}>
                          {currentMaha.startDate.slice(0,10)} → {currentMaha.endDate.slice(0,10)}
                        </div>
                      </div>
                      {currentAntar && (
                        <div>
                          <div style={{ fontSize: 12, color: t.textMuted }}>Antardasha</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: PLANET_COLOR[currentAntar.lord] ?? t.textPrimary }}>
                            {currentAntar.displayName}
                          </div>
                          <div style={{ fontSize: 12, color: t.textSecond }}>
                            {currentAntar.startDate.slice(0,10)} → {currentAntar.endDate.slice(0,10)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${t.border}`, fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Vimshottari Dasha Sequence
                  </div>
                  {dashas.map(d => (
                    <div key={d.lord} style={{
                      padding: "14px 18px", borderBottom: `1px solid ${t.border}`,
                      background: d.isCurrent ? (isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.04)") : "transparent",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: PLANET_COLOR[d.lord] ?? t.textMuted,
                          }} />
                          <span style={{ fontWeight: 700, fontSize: 15, color: PLANET_COLOR[d.lord] ?? t.textPrimary }}>
                            {d.displayName}
                          </span>
                          {d.isCurrent && (
                            <span style={{ background: t.accent, color: "#fff", borderRadius: 6, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: t.textSecond, fontVariantNumeric: "tabular-nums" }}>
                          {d.startDate.slice(0,10)} → {d.endDate.slice(0,10)}
                          {d.durationYears && <span style={{ marginLeft: 8, color: t.textMuted }}>({d.durationYears}y)</span>}
                        </div>
                      </div>

                      {d.isCurrent && d.antardashas && d.antardashas.length > 0 && (
                        <div style={{ marginTop: 10, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                          {d.antardashas.map(a => (
                            <div key={a.lord} style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "5px 10px", borderRadius: 8, flexWrap: "wrap", gap: 6,
                              background: a.isCurrent ? (isDark ? "rgba(124,58,237,0.14)" : "rgba(124,58,237,0.08)") : "transparent",
                              border: a.isCurrent ? `1px solid ${t.accent}44` : "1px solid transparent",
                            }}>
                              <span style={{ fontSize: 13, fontWeight: a.isCurrent ? 700 : 500, color: PLANET_COLOR[a.lord] ?? t.textSecond }}>
                                {a.displayName}{a.isCurrent ? " ←" : ""}
                              </span>
                              <span style={{ fontSize: 11, color: t.textMuted, fontVariantNumeric: "tabular-nums" }}>
                                {a.startDate.slice(0,10)} → {a.endDate.slice(0,10)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Yogas & Doshas ────────────────────────────────────────────── */}
          {activeTab === "yogas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

              {/* Present Yogas */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, marginBottom: 14 }}>
                  Present Yogas
                </div>
                {kundli.yogas.filter(y => y.isPresent).length === 0 ? (
                  <div style={{ color: t.textMuted, fontSize: 14 }}>No major yogas detected.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                    {kundli.yogas.filter(y => y.isPresent).map(y => (
                      <div key={y.name} style={{
                        background: t.bgCard, border: `1.5px solid ${t.accent}44`,
                        borderRadius: 14, padding: "16px 18px",
                        boxShadow: `0 2px 12px ${t.shadow}`,
                      }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: t.accent, marginBottom: 6 }}>{y.name}</div>
                        <div style={{ fontSize: 13, color: t.textSecond, lineHeight: 1.5, marginBottom: 8 }}>{y.description}</div>
                        <div style={{ fontSize: 12, color: "#22c55e", fontStyle: "italic" }}>{y.significance}</div>
                        {y.planets.length > 0 && (
                          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {y.planets.map(p => (
                              <span key={p} style={{
                                padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                background: (PLANET_COLOR[p] ?? "#94a3b8") + "22",
                                color: PLANET_COLOR[p] ?? t.textMuted,
                              }}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doshas */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.textPrimary, marginBottom: 14 }}>
                  Doshas
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {kundli.doshas.map(d => {
                    const severityColor = d.severity === "strong" ? "#ef4444" : d.severity === "moderate" ? "#f97316" : d.severity === "mild" ? "#f59e0b" : "#22c55e";
                    return (
                      <div key={d.name} style={{
                        background: t.bgCard, border: `1px solid ${d.isPresent ? severityColor + "44" : t.border}`,
                        borderRadius: 14, padding: "16px 18px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary }}>{d.name}</span>
                          <StatusBadge
                            label={d.isPresent ? (d.severity === "none" ? "None" : d.severity.charAt(0).toUpperCase() + d.severity.slice(1)) : "Not Present"}
                            color={d.isPresent && d.severity !== "none" ? severityColor : "#22c55e"}
                          />
                        </div>
                        <div style={{ fontSize: 13, color: t.textSecond, lineHeight: 1.5 }}>{d.description}</div>
                        {d.isPresent && d.remedies && d.remedies.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                              Remedies
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
                              {d.remedies.map((r, i) => (
                                <li key={i} style={{ fontSize: 13, color: t.textSecond }}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
