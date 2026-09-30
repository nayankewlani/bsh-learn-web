import React, { useState, useEffect, useRef, useMemo } from "react";
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
  tropicalLongitude: number;
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
  ascendant: { signIndex: number; signName: string; degree: number; minute: number; second?: number; nakshatraName: string; pada?: number };
  planets: PlanetPos[];
  charts: { d1: { positions: DivisionalPos[] }; d9: { positions: DivisionalPos[] } };
  dashas: { vimshottari: DashaPeriod[] };
  yogas: Yoga[];
  doshas: Dosha[];
}

type HousePlanetMap = Record<
  number,
  Array<{
    abbr: string;
    deg: number;
    planet: string;
    retro: boolean;
  }>
>;
// ── Constants ─────────────────────────────────────────────────────────────────

const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",
];

// NI grid: [row, col, house] — H1 top-center, corners H11/H2/H5/H8
// Traditional North Indian Kundli house positions
// [row, col, house]
// Used only for mapping planets to the correct visual region.

const NI_GRID: Array<[number, number, number]> = [
  [0, 1, 1],   // H1  - Top center
  [0, 2, 2],   // H2  - Upper right
  [1, 3, 3],   // H3  - Right upper
  [2, 3, 4],   // H4  - Right center
  [3, 3, 5],   // H5  - Right lower
  [3, 2, 6],   // H6  - Bottom right
  [3, 1, 7],   // H7  - Bottom center
  [3, 0, 8],   // H8  - Bottom left
  [2, 0, 9],   // H9  - Left lower
  [1, 0, 10],  // H10 - Left center
  [0, 0, 11],  // H11 - Left upper
  [0, 1, 12],  // H12 - Upper left
];
// White-background SVG chart colors (AstroSage-matched)
const CHART_COLOR: Record<string, string> = {
  sun:     "#be185d", moon:    "#3730a3", mars:    "#15803d",
  mercury: "#1d4ed8", jupiter: "#14532d", venus:   "#166534",
  saturn:  "#991b1b", rahu:    "#b45309", ketu:    "#7c2d12",
  uranus:  "#0e7490", neptune: "#6d28d9", pluto:   "#475569",
};

// Dark-UI colors (for table, badges, dasha)
const PLANET_COLOR: Record<string, string> = {
  sun:"#f59e0b", moon:"#94a3b8", mars:"#ef4444", mercury:"#22c55e",
  jupiter:"#f97316", venus:"#ec4899", saturn:"#818cf8",
  rahu:"#a78bfa", ketu:"#84cc16",
  uranus:"#22d3ee", neptune:"#c4b5fd", pluto:"#9ca3af",
};

const PLANET_ABBR: Record<string, string> = {
  sun: "Su",
  moon: "Mo",
  mars: "Ma",
  mercury: "Me",
  jupiter: "Ju",
  venus: "Ve",
  saturn: "Sa",
  rahu: "Ra",
  ketu: "Ke",

  uranus: "Ur",
  neptune: "Ne",
  pluto: "Pl",

  ascendant: "As",
};

const SIGN_LORD: string[] = [
  "mars","venus","mercury","moon","sun","mercury",
  "venus","mars","jupiter","saturn","saturn","jupiter",
];

const NAT_FRIENDS: Record<string, string[]> = {
  sun:["moon","mars","jupiter"], moon:["sun","mercury"],
  mars:["sun","moon","jupiter"], mercury:["sun","venus"],
  jupiter:["sun","moon","mars"], venus:["mercury","saturn"],
  saturn:["mercury","venus"],    rahu:["venus","saturn","mercury"],
  ketu:["mars","venus","saturn"],
};
const NAT_ENEMIES: Record<string, string[]> = {
  sun:["venus","saturn"], moon:[], mars:["mercury"], mercury:["moon"],
  jupiter:["mercury","venus"], venus:["sun","moon"],
  saturn:["sun","moon","mars"], rahu:["sun","moon","mars"], ketu:["sun","moon"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlanetRelation(planet: string, signIndex: number): string {
  const lord = SIGN_LORD[signIndex];
  if (!lord || lord === planet) return "Own";
  if (NAT_FRIENDS[planet]?.includes(lord)) return "Friend";
  if (NAT_ENEMIES[planet]?.includes(lord)) return "Enemy";
  return "Neutral";
}

function getDignity(p: PlanetPos): string {
  if (p.isExalted)    return "Exalted";
  if (p.isDebilitated) return "Debilitated";
  if (p.isOwnSign)    return "Own";
  if (p.isVargottama) return "Vargottama";
  return getPlanetRelation(p.planet, p.signIndex);
}

function dignityColor(d: string): string {
  if (d === "Exalted")     return "#15803d";
  if (d === "Debilitated") return "#dc2626";
  if (d === "Own")         return "#2563eb";
  if (d === "Friend")      return "#0891b2";
  if (d === "Enemy")       return "#ea580c";
  if (d === "Vargottama")  return "#7c3aed";
  return "#64748b";
}

function fmtLon(deg: number, min: number, sec?: number): string {
  const s = sec != null ? `${String(Math.round(sec)).padStart(2,"0")}″` : "";
  return `${String(deg).padStart(2,"0")}°${String(min).padStart(2,"0")}′${s}`;
}

function calcBalance(dob: string, endDate: string): { years: number; months: number; days: number } | null {
  try {
    const ms = new Date(endDate).getTime() - new Date(dob).getTime();
    if (ms <= 0) return null;
    const d = Math.floor(ms / 86_400_000);
    const y = Math.floor(d / 365.25);
    const rem = d - Math.floor(y * 365.25);
    const m = Math.floor(rem / 30.44);
    const dd = Math.floor(rem - m * 30.44);
    return { years: y, months: m, days: dd };
  } catch { return null; }
}

function buildD1Map(
  planets: PlanetPos[],
  ascSignIdx: number,
  ascDeg: number
): HousePlanetMap {
  const map: HousePlanetMap = {};

  // Ascendant always belongs to House 1
  map[1] = [
    {
      abbr: "As",
      deg: ascDeg,
      planet: "ascendant",
      retro: false,
    },
  ];

  for (const p of planets) {
    const house = ((p.signIndex - ascSignIdx + 12) % 12) + 1;

    if (!map[house]) {
      map[house] = [];
    }

    map[house].push({
      abbr: p.abbr,
      deg: p.degree,
      planet: p.planet,
      retro: p.isRetrograde,
    });
  }

  return map;
}


function buildD9Map(
  d9pos: DivisionalPos[],
  d9AscIdx: number,
  d1Planets: PlanetPos[],
): HousePlanetMap {
  const retroMap: Record<string, boolean> = {};
  for (const p of d1Planets) retroMap[p.planet] = p.isRetrograde;

  const map: HousePlanetMap = {};
  map[1] = [{ abbr: "As", deg: 0, planet: "ascendant", retro: false }];

  for (const p of d9pos) {
    if (p.planet === "ascendant") continue;
    const house = ((p.signIndex - d9AscIdx + 12) % 12) + 1;
    if (!map[house]) map[house] = [];
    map[house].push({
      abbr: PLANET_ABBR[p.planet] ?? p.planet.slice(0, 2),
      deg: 0,
      planet: p.planet,
      retro: retroMap[p.planet] ?? false,
    });
  }

  return map;
}
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return dv;
}

// ── NiChart ───────────────────────────────────────────────────────────────────

// ── NiChart ───────────────────────────────────────────────────────────────────

const LC = "#e87522";
const ASC_COL = "#6d28d9";

function NiChart({
  ascSignIdx,
  housePlanets,
  selectedPlanet,
  onPlanetClick,
  mirrorHorizontally = false,
}: {
  ascSignIdx: number;
  housePlanets: HousePlanetMap;
  selectedPlanet?: string | null;
  onPlanetClick?: (planet: string) => void;
  mirrorHorizontally?: boolean;
}) {
  const SIZE = 480;
  /*
   * ================================================================
   * TRADITIONAL NORTH INDIAN KUNDLI
   * ================================================================
   *
   *              TOP MIDPOINT
   *                   ▲
   *                  / \
   *                 /   \
   *                /     \
   *               /       \
   *              /         \
   *             /           \
   * LEFT MIDPOINT ◄───────────► RIGHT MIDPOINT
   *             \             /
   *              \           /
   *               \         /
   *                \       /
   *                 \     /
   *                  \   /
   *                   \ /
   *                 BOTTOM
   *
   * Outer square:
   *
   * (0,0)                         (480,0)
   *    ┌───────────────────────────┐
   *    │\                         /│
   *    │ \                       / │
   *    │  \                     /  │
   *    │   \                   /   │
   *    │    \                 /    │
   *    │     \               /     │
   *    │      \             /      │
   *    │       \           /       │
   *    │        \         /        │
   *    │         \       /         │
   *    │          \     /          │
   *    │           \   /           │
   *    │            \ /            │
   *    │             ◆             │
   *    │            / \            │
   *    │           /   \           │
   *    │          /     \          │
   *    │         /       \         │
   *    │        /         \        │
   *    │       /           \       │
   *    │      /             \      │
   *    │     /               \     │
   *    │    /                 \    │
   *    │   /                   \   │
   *    │  /                     \  │
   *    │ /                       \ │
   *    │/                         \│
   *    └───────────────────────────┘
   *
   * IMPORTANT:
   * There is NO 4×4 grid.
   * There is NO full center horizontal line.
   * There is NO full center vertical line.
   *
   * The chart is constructed from exactly 12 structural lines:
   *
   * 4 outer-to-midpoint diagonal pairs = 8 lines
   * 4 central diamond sides             = 4 lines
   */

  const MID = SIZE / 2; // 240

  // ---------------------------------------------------------------
  // House -> sign mapping (sign number shown inside each cell)
  // ---------------------------------------------------------------

  const hSign = (house: number) =>
    (ascSignIdx + house - 1) % 12;

  // ---------------------------------------------------------------
  // Planet anchors
  // ---------------------------------------------------------------
  //
  // These coordinates correspond to the 12 actual triangular/
  // quadrilateral regions of the North Indian chart.
  //
  // They are intentionally fixed rather than generated from a
  // rectangular 4x4 grid.
  //

  // ---------------------------------------------------------------
// Planet anchors
// ---------------------------------------------------------------

const HOUSE_ANCHORS: Record<number, { x: number; y: number }> = {
  1:  { x: 240, y: 120 }, // top kite centroid
  2:  { x: 120, y: 52  }, // upper-left triangle centroid
  3:  { x: 52,  y: 120 }, // left-upper triangle centroid
  4:  { x: 120, y: 240 }, // left kite centroid
  5:  { x: 52,  y: 360 }, // left-lower triangle centroid
  6:  { x: 120, y: 428 }, // bottom-left triangle centroid
  7:  { x: 240, y: 360 }, // bottom kite centroid
  8:  { x: 360, y: 428 }, // bottom-right triangle centroid
  9:  { x: 428, y: 360 }, // right-lower triangle centroid
  10: { x: 360, y: 240 }, // right kite centroid
  11: { x: 428, y: 120 }, // right-upper triangle centroid
  12: { x: 360, y: 52  }, // upper-right triangle centroid
};// Multiple-planet positioning
// ---------------------------------------------------------------

function getPlanetPositions(
  house: number,
  count: number
): Array<{ x: number; y: number }> {
  const anchor = HOUSE_ANCHORS[house] ?? {
    x: MID,
    y: MID,
  };

  const actualCount = Math.min(count, 5);

  if (actualCount <= 0) return [];

  /*
   * North Indian chart:
   *
   * Keep planets away from the diagonal boundaries.
   * Each house gets a compact cluster around its
   * existing anchor point.
   */

  // Top / bottom houses
  if (house === 1 || house === 7) {
    if (actualCount === 1) {
      return [
        {
          x: anchor.x,
          y: anchor.y,
        },
      ];
    }

    if (actualCount === 2) {
      return [
        {
          x: anchor.x,
          y: anchor.y - 14,
        },
        {
          x: anchor.x,
          y: anchor.y + 14,
        },
      ];
    }

    if (actualCount === 3) {
      return [
        {
          x: anchor.x,
          y: anchor.y - 22,
        },
        {
          x: anchor.x,
          y: anchor.y,
        },
        {
          x: anchor.x,
          y: anchor.y + 22,
        },
      ];
    }

    if (actualCount === 4) {
      return [
        {
          x: anchor.x - 16,
          y: anchor.y - 14,
        },
        {
          x: anchor.x + 16,
          y: anchor.y - 14,
        },
        {
          x: anchor.x - 16,
          y: anchor.y + 14,
        },
        {
          x: anchor.x + 16,
          y: anchor.y + 14,
        },
      ];
    }

    return [
      {
        x: anchor.x - 18,
        y: anchor.y - 22,
      },
      {
        x: anchor.x + 18,
        y: anchor.y - 22,
      },
      {
        x: anchor.x,
        y: anchor.y,
      },
      {
        x: anchor.x - 18,
        y: anchor.y + 22,
      },
      {
        x: anchor.x + 18,
        y: anchor.y + 22,
      },
    ];
  }

  // Left / right middle houses
  if (house === 4 || house === 10) {
    if (actualCount === 1) {
      return [
        {
          x: anchor.x,
          y: anchor.y,
        },
      ];
    }

    if (actualCount === 2) {
      return [
        {
          x: anchor.x - 16,
          y: anchor.y,
        },
        {
          x: anchor.x + 16,
          y: anchor.y,
        },
      ];
    }

    if (actualCount === 3) {
      return [
        {
          x: anchor.x - 22,
          y: anchor.y,
        },
        {
          x: anchor.x,
          y: anchor.y,
        },
        {
          x: anchor.x + 22,
          y: anchor.y,
        },
      ];
    }

    if (actualCount === 4) {
      return [
        {
          x: anchor.x - 16,
          y: anchor.y - 14,
        },
        {
          x: anchor.x + 16,
          y: anchor.y - 14,
        },
        {
          x: anchor.x - 16,
          y: anchor.y + 14,
        },
        {
          x: anchor.x + 16,
          y: anchor.y + 14,
        },
      ];
    }

    return [
      {
        x: anchor.x - 20,
        y: anchor.y - 18,
      },
      {
        x: anchor.x,
        y: anchor.y - 18,
      },
      {
        x: anchor.x + 20,
        y: anchor.y - 18,
      },
      {
        x: anchor.x - 10,
        y: anchor.y + 18,
      },
      {
        x: anchor.x + 10,
        y: anchor.y + 18,
      },
    ];
  }

  /*
   * Diagonal houses.
   *
   * Keep planets toward the inner/central part
   * of the house rather than on the diagonal line.
   */

  if (
    house === 2 ||
    house === 3 ||
    house === 5 ||
    house === 6 ||
    house === 8 ||
    house === 9 ||
    house === 11 ||
    house === 12
  ) {
    if (actualCount === 1) {
      return [
        {
          x: anchor.x,
          y: anchor.y,
        },
      ];
    }

    if (actualCount === 2) {
      return [
        {
          x: anchor.x,
          y: anchor.y - 13,
        },
        {
          x: anchor.x,
          y: anchor.y + 13,
        },
      ];
    }

    if (actualCount === 3) {
      return [
        {
          x: anchor.x,
          y: anchor.y - 19,
        },
        {
          x: anchor.x,
          y: anchor.y,
        },
        {
          x: anchor.x,
          y: anchor.y + 19,
        },
      ];
    }

    if (actualCount === 4) {
      return [
        {
          x: anchor.x - 12,
          y: anchor.y - 15,
        },
        {
          x: anchor.x + 12,
          y: anchor.y - 15,
        },
        {
          x: anchor.x - 12,
          y: anchor.y + 15,
        },
        {
          x: anchor.x + 12,
          y: anchor.y + 15,
        },
      ];
    }

    return [
      {
        x: anchor.x - 14,
        y: anchor.y - 20,
      },
      {
        x: anchor.x + 14,
        y: anchor.y - 20,
      },
      {
        x: anchor.x,
        y: anchor.y,
      },
      {
        x: anchor.x - 14,
        y: anchor.y + 20,
      },
      {
        x: anchor.x + 14,
        y: anchor.y + 20,
      },
    ];
  }

  return [
    {
      x: anchor.x,
      y: anchor.y,
    },
  ];
}  // Rashi-number positions
  // ---------------------------------------------------------------
  //
  // Numbers are placed near the outer boundaries of each house.
  // They are independent of planet positions.
  //

  const RASHI_POSITIONS: Record<number, { x: number; y: number; anchor: "start"|"middle"|"end" }> = {
    1:  { x: 240, y: 22,  anchor: "middle" }, // top kite — near top vertex
    2:  { x: 98,  y: 42,  anchor: "middle" }, // upper-left small triangle — inner corner
    3:  { x: 28,  y: 100, anchor: "start"  }, // left-upper small triangle — inner corner
    4:  { x: 20,  y: 240, anchor: "start"  }, // left kite — near left vertex
    5:  { x: 28,  y: 375, anchor: "start"  }, // left-lower small triangle — inner corner
    6:  { x: 98,  y: 454, anchor: "middle" }, // bottom-left small triangle — inner corner
    7:  { x: 240, y: 458, anchor: "middle" }, // bottom kite — near bottom vertex
    8:  { x: 375, y: 454, anchor: "middle" }, // bottom-right small triangle — inner corner
    9:  { x: 454, y: 375, anchor: "end"    }, // right-lower small triangle — inner corner
    10: { x: 458, y: 240, anchor: "end"    }, // right kite — near right vertex
    11: { x: 454, y: 100, anchor: "end"    }, // right-upper small triangle — inner corner
    12: { x: 375, y: 42,  anchor: "middle" }, // upper-right small triangle — inner corner
  };

  function getRashiPosition(house: number) {
    return (
      RASHI_POSITIONS[house] ?? {
        x: MID,
        y: MID,
        anchor: "middle" as const,
      }
    );
  }

  // ---------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------

  return (
    <svg
      viewBox={`-48 0 576 ${SIZE}`}
      style={{
        width: "100%",
        display: "block",
      }}
    >
      {/* ==========================================================
          WHITE CHART SURFACE
          ========================================================== */}

      <rect
        x="-48"
        y="0"
        width={576}
        height={SIZE}
        fill="#ffffff"
      />

      {/* ==========================================================
          OUTER BORDER
          ========================================================== */}

      <rect
        x="0.75"
        y="0.75"
        width={SIZE - 1.5}
        height={SIZE - 1.5}
        fill="none"
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* ==========================================================
          NORTH INDIAN KUNDLI GEOMETRY
          ========================================================== */}

      {/* ----------------------------------------------------------
          TOP-LEFT CORNER
          ---------------------------------------------------------- */}

      <line
        x1="0"
        y1="0"
        x2={MID}
        y2="240"
        stroke={LC}
        strokeWidth={1.5}
      />

      <line
        x1="0"
        y1="0"
        x2={MID}
        y2="0"
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* ----------------------------------------------------------
          TOP-RIGHT CORNER
          ---------------------------------------------------------- */}

      <line
        x1={SIZE}
        y1="0"
        x2={MID}
        y2="240"
        stroke={LC}
        strokeWidth={1.5}
      />

      <line
        x1={SIZE}
        y1="0"
        x2={MID}
        y2="0"
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* ----------------------------------------------------------
          BOTTOM-LEFT CORNER
          ---------------------------------------------------------- */}

      <line
        x1="0"
        y1={SIZE}
        x2={MID}
        y2="240"
        stroke={LC}
        strokeWidth={1.5}
      />

      <line
        x1="0"
        y1={SIZE}
        x2={MID}
        y2={SIZE}
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* ----------------------------------------------------------
          BOTTOM-RIGHT CORNER
          ---------------------------------------------------------- */}

      <line
        x1={SIZE}
        y1={SIZE}
        x2={MID}
        y2="240"
        stroke={LC}
        strokeWidth={1.5}
      />

      <line
        x1={SIZE}
        y1={SIZE}
        x2={MID}
        y2={SIZE}
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* ==========================================================
          CENTRAL DIAMOND
          ========================================================== */}

      {/* Top midpoint → Right midpoint */}
      <line
        x1={MID}
        y1="0"
        x2={SIZE}
        y2={MID}
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* Right midpoint → Bottom midpoint */}
      <line
        x1={SIZE}
        y1={MID}
        x2={MID}
        y2={SIZE}
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* Bottom midpoint → Left midpoint */}
      <line
        x1={MID}
        y1={SIZE}
        x2="0"
        y2={MID}
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* Left midpoint → Top midpoint */}
      <line
        x1="0"
        y1={MID}
        x2={MID}
        y2="0"
        stroke={LC}
        strokeWidth={1.5}
      />

      {/* ==========================================================
          HOUSES
          ========================================================== */}

      {Array.from(
        { length: 12 },
        (_, index) => index + 1
).map((house) => {
  // The house is now the primary key.
  // This prevents planets from being shifted
  // because of a second sign → house conversion.
  const signIndex = hSign(house);
  const planets =
    housePlanets[house] ?? [];

  const positions =
    getPlanetPositions(
      house,
      planets.length
    );
        const rashi =
          getRashiPosition(house);

        return (
          <g key={house}>
            {/* ----------------------------------------------------
                RASHI NUMBER
                ---------------------------------------------------- */}

            <text
              x={rashi.x}
              y={rashi.y}
              fill="#f97316"
              fontSize={9}
              fontWeight="400"
              textAnchor={rashi.anchor}
              fontFamily="system-ui, sans-serif"
            >
              {signIndex + 1}
            </text>

            {/* ----------------------------------------------------
                PLANETS
                ---------------------------------------------------- */}

            {planets.map(
              (
                {
                  abbr,
                  deg,
                  planet,
                  retro,
                },
                index
              ) => {
                const pos =
                  positions[index] ??
                  HOUSE_ANCHORS[
                    house
                  ] ?? {
                    x: MID,
                    y: MID,
                  };

                const px = pos.x;
                const py = pos.y;

                const isAsc =
                  planet ===
                  "ascendant";

                const fill = isAsc
                  ? ASC_COL
                  : CHART_COLOR[
                      planet
                    ] ??
                    "#1e293b";

                const isSelected =
                  selectedPlanet ===
                  planet;

                const baseSize = 14;

                /*
                 * Width estimate for degree positioning.
                 */
                const hw =
                  abbr.length === 2
                    ? 11
                    : 15;

                const degreeX =
                  px + hw + 1;

                return (
                  <g
                    key={`${abbr}-${index}`}
                    style={{
                      cursor:
                        onPlanetClick
                          ? "pointer"
                          : "default",
                    }}
                    onClick={() =>
                      onPlanetClick?.(
                        planet
                      )
                    }
                  >
                    {/* Selection */}
                    {isSelected && (
                      <rect
                        x={
                          px -
                          hw -
                          3
                        }
                        y={
                          py -
                          12
                        }
                        width={
                          hw * 2 +
                          22
                        }
                        height={15}
                        rx={2}
                        fill={fill}
                        opacity={0.12}
                      />
                    )}

                    {/* Planet */}
                    <text
                      x={px}
                      y={py}
                      fill={fill}
                      fontSize={
                        isSelected
                          ? baseSize +
                            1
                          : baseSize
                      }
                      fontWeight={
                        isSelected
                          ? "800"
                          : "700"
                      }
                      textAnchor="middle"
                      fontFamily="system-ui, sans-serif"
                    >
                      {abbr}
                    </text>

                    {/* Degree */}
                    {deg > 0 && (
                      <text
                        x={degreeX}
                        y={py - 5}
                        fill={fill}
                        fontSize={8}
                        fontWeight="500"
                        textAnchor="start"
                        opacity={0.82}
                        fontFamily="system-ui, sans-serif"
                      >
                        {deg}
                      </text>
                    )}

                    {/* Retrograde */}
                    {retro && (
                      <text
                        x={degreeX}
                        y={py + 4}
                        fill={fill}
                        fontSize={8}
                        fontWeight="700"
                        textAnchor="start"
                        fontFamily="system-ui, sans-serif"
                      >
                        R
                      </text>
                    )}
                  </g>
                );
              }
            )}
          </g>
        );
      })}
    </svg>
  );
}
// ── Main Page ─────────────────────────────────────────────────────────────────

export default function KundliPage() {
  const { t, isDark } = useThemeStore();

  // Form
  const [name, setName]           = useState("");
  const [gender, setGender]       = useState<"male"|"female"|"other">("male");
  const [dob, setDob]             = useState("");
  const [time, setTime]           = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion|null>(null);
  const [showDrop, setShowDrop]   = useState(false);
  const placeRef = useRef<HTMLDivElement>(null);
  const dqry = useDebounce(placeQuery, 380);

  // Results
  const [kundli, setKundli]       = useState<KundliResult|null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState<"planets"|"dasha"|"yogas">("planets");
  const [selectedPlanet, setSelectedPlanet] = useState<string|null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (placeRef.current && !placeRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (dqry.length < 2 || selectedPlace) { setSuggestions([]); return; }
    client.get(`/kundli/places?q=${encodeURIComponent(dqry)}`)
      .then(r => { setSuggestions(r.data.data ?? []); setShowDrop(true); })
      .catch(() => setSuggestions([]));
  }, [dqry, selectedPlace]);

  const pickPlace = (p: PlaceSuggestion) => {
    setSelectedPlace(p); setPlaceQuery(p.displayName);
    setSuggestions([]); setShowDrop(false);
  };
  const clearPlace = () => { setSelectedPlace(null); setPlaceQuery(""); setSuggestions([]); };

  const calculate = async () => {
    if (!name.trim())   { setError("Enter name."); return; }
    if (!dob)           { setError("Enter date of birth."); return; }
    if (!time)          { setError("Enter birth time."); return; }
    if (!selectedPlace) { setError("Select a birth place from the list."); return; }
    setError(""); setLoading(true);
    try {
      const res = await client.post("/kundli/calculate", {
        name: name.trim(), gender, dob, time,
        latitude: selectedPlace.latitude, longitude: selectedPlace.longitude,
        timezone: selectedPlace.timezone, placeLabel: selectedPlace.displayName,
      });
      setKundli(res.data.data);
      setActiveTab("planets");
      setSelectedPlanet(null);
      setTimeout(() => document.getElementById("kundli-result")?.scrollIntoView({ behavior:"smooth" }), 100);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message;
      setError(msg || "Calculation failed. Please try again.");
    } finally { setLoading(false); }
  };

// Memoised chart data
const d1Map = useMemo(() => {
  if (!kundli) return {};

  return buildD1Map(
    kundli.planets,
    kundli.ascendant.signIndex,
    kundli.ascendant.degree
  );
}, [kundli]);

const d9Map = useMemo(() => {
  if (!kundli) return {};

  const d9Asc = kundli.charts.d9.positions.find(
    p => p.planet === "ascendant"
  );

  if (!d9Asc) return {};

  return buildD9Map(
    kundli.charts.d9.positions,
    d9Asc.signIndex,
    kundli.planets,
  );
}, [kundli]);

const d9AscIdx = useMemo(() => {
  if (!kundli) return 0;

  return (
    kundli.charts.d9.positions.find(
      p => p.planet === "ascendant"
    )?.signIndex ?? 0
  );
}, [kundli]);
  // Shared input style
  const inp: React.CSSProperties = {
    background: t.bgInput, border: `1.5px solid ${t.border}`,
    borderRadius: 10, padding: "10px 14px", color: t.textPrimary,
    fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: t.textSecond,
    textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5, display: "block",
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 16px 80px" }}>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <h1 style={{ margin:0, fontSize:26, fontWeight:800, color:t.textPrimary }}>
          Vedic Kundli
        </h1>
        <p style={{ margin:"6px 0 0", color:t.textSecond, fontSize:13 }}>
          North Indian · Lahiri Ayanamsa · Whole Sign · Vimshottari Dasha
        </p>
      </div>

      {/* Form */}
      <div style={{
        background:t.bgCard, border:`1px solid ${t.border}`,
        borderRadius:16, padding:"24px 20px", marginBottom:28,
        boxShadow:`0 2px 16px ${t.shadow}`,
      }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
          <div>
            <span style={lbl}>Full Name</span>
            <input style={inp} placeholder="e.g. Rahul Sharma" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={e => (e.target.style.borderColor=t.accent)}
              onBlur={e => (e.target.style.borderColor=t.border)}/>
          </div>
          <div>
            <span style={lbl}>Gender</span>
            <div style={{ display:"flex", gap:6, paddingTop:3 }}>
              {(["male","female","other"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)} style={{
                  flex:1, padding:"10px 0", borderRadius:8, fontSize:12, fontWeight:600,
                  cursor:"pointer", background:gender===g ? t.accent : t.bgInput,
                  color:gender===g ? "#fff" : t.textSecond,
                  border:`1.5px solid ${gender===g ? t.accent : t.border}`,
                }}>
                  {g[0].toUpperCase()+g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span style={lbl}>Date of Birth</span>
            <input type="date" style={inp} value={dob} onChange={e => setDob(e.target.value)}
              onFocus={e => (e.target.style.borderColor=t.accent)}
              onBlur={e => (e.target.style.borderColor=t.border)}/>
          </div>
          <div>
            <span style={lbl}>Time of Birth</span>
            <input type="time" style={inp} step="60" value={time} onChange={e => setTime(e.target.value)}
              onFocus={e => (e.target.style.borderColor=t.accent)}
              onBlur={e => (e.target.style.borderColor=t.border)}/>
          </div>
          <div style={{ gridColumn:"1 / -1" }} ref={placeRef}>
            <span style={lbl}>Place of Birth</span>
            <div style={{ position:"relative" }}>
              <input style={{ ...inp, paddingRight: selectedPlace ? 34 : 14 }}
                placeholder="Type city name…" value={placeQuery}
                onChange={e => { setPlaceQuery(e.target.value); if (selectedPlace) clearPlace(); }}
                onFocus={() => suggestions.length > 0 && setShowDrop(true)}/>
              {selectedPlace && (
                <button onClick={clearPlace} style={{
                  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", color:t.textMuted, cursor:"pointer", fontSize:16,
                }}>×</button>
              )}
              {showDrop && suggestions.length > 0 && (
                <div style={{
                  position:"absolute", top:"calc(100% + 4px)", left:0, right:0,
                  background:t.bgCard, border:`1.5px solid ${t.border}`,
                  borderRadius:10, boxShadow:`0 10px 32px ${t.shadow}`,
                  zIndex:200, overflow:"hidden", maxHeight:220, overflowY:"auto",
                }}>
                  {suggestions.map(s => (
                    <div key={s.osmId} onClick={() => pickPlace(s)} style={{
                      padding:"9px 13px", cursor:"pointer", fontSize:13,
                      color:t.textPrimary, borderBottom:`1px solid ${t.border}`,
                    }}
                    onMouseEnter={e=>(e.currentTarget.style.background=isDark?"rgba(124,58,237,0.1)":"rgba(124,58,237,0.06)")}
                    onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <div style={{ fontWeight:600 }}>{s.displayName}</div>
                      <div style={{ fontSize:11, color:t.textMuted, marginTop:2 }}>{s.timezone} · {s.utcOffset}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedPlace && (
              <div style={{ marginTop:5, fontSize:11, color:t.textMuted }}>
                {selectedPlace.timezone} ({selectedPlace.utcOffset}) · {selectedPlace.latitude.toFixed(4)}°, {selectedPlace.longitude.toFixed(4)}°
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop:14, padding:"9px 13px", background:"#ef444420",
            border:"1px solid #ef444440", borderRadius:8, color:"#ef4444", fontSize:13 }}>
            {error}
          </div>
        )}

        <button onClick={calculate} disabled={loading} style={{
          marginTop:18, width:"100%", padding:"13px 0",
          background: loading ? t.bgTertiary : `linear-gradient(135deg,${t.accent},#6d28d9)`,
          color: loading ? t.textMuted : "#fff",
          border:"none", borderRadius:10, fontSize:15, fontWeight:700,
          cursor: loading ? "not-allowed" : "pointer",
        }}>
          {loading ? "Calculating…" : "Generate Kundli"}
        </button>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {kundli && (() => {
        const asc  = kundli.ascendant;
        const moon = kundli.planets.find(p => p.planet === "moon");
        const sun  = kundli.planets.find(p => p.planet === "sun");
        const westernSunSign = sun ? SIGN_NAMES[Math.floor(sun.tropicalLongitude / 30) % 12] : null;
        const dashas = kundli.dashas.vimshottari;
        const firstDasha = dashas[0];
        const bal = firstDasha ? calcBalance(kundli.person.dob, firstDasha.endDate) : null;
        const currentMaha  = dashas.find(d => d.isCurrent);
        const currentAntar = currentMaha?.antardashas?.find(a => a.isCurrent);
        const selPlanetData = selectedPlanet
          ? (selectedPlanet === "ascendant"
              ? null
              : kundli.planets.find(p => p.planet === selectedPlanet))
          : null;

        const cardStyle: React.CSSProperties = {
          background: isDark ? "#18182a" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"}`,
          borderRadius: 10,
          boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.38)" : "0 2px 12px rgba(0,0,0,0.06)",
        };

        const secLabel: React.CSSProperties = {
          fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: 0.8, color: t.textMuted, marginBottom: 6,
        };

        return (
          <div id="kundli-result">
            {/* ── Birth Summary — compact full-width header ───────────────── */}
            <div style={{ ...cardStyle, padding:"12px 16px", marginBottom:16 }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"12px 28px", alignItems:"flex-start" }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:t.textPrimary }}>
                    {kundli.person.name}
                  </div>
                  <div style={{ fontSize:11, color:t.textSecond, marginTop:2 }}>
                    {kundli.person.dob} · {kundli.person.time.slice(0,5)} · {kundli.location.placeResolved}
                  </div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"12px 24px" }}>
                  <div>
                    <div style={secLabel}>Ascendant (Lagna)</div>
                    <div style={{ fontSize:12, fontWeight:700, color:t.accent }}>
                      {asc.signName}
                    </div>
                    <div style={{ fontSize:11, color:t.textSecond }}>
                      {fmtLon(asc.degree, asc.minute, asc.second)} · {asc.nakshatraName}
                    </div>
                  </div>
                  {moon && (
                    <div>
                      <div style={secLabel}>Moon Sign (Rashi)</div>
                      <div style={{ fontSize:12, fontWeight:700, color:t.textPrimary }}>
                        {moon.signName}
                      </div>
                      <div style={{ fontSize:11, color:t.textSecond }}>
                        {fmtLon(moon.degree, moon.minute)} · {moon.nakshatraName} Pada {moon.pada}
                      </div>
                    </div>
                  )}
                  {westernSunSign && (
                    <div>
                      <div style={secLabel}>Sun Sign (Western)</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#d97706" }}>
                        {westernSunSign}
                      </div>
                      <div style={{ fontSize:11, color:t.textSecond }}>
                        Tropical zodiac
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Charts (left) + Yogas & Doshas (right) ──────────────────── */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "max-content 1fr", gap:16, marginBottom:24, alignItems:"start" }}>

              {/* LEFT: Lagna + Navamsa side by side (stacked on mobile) */}
              <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap:20 }}>

                {/* D1 — Lagna  (Saffron / mandala-fan frame) */}
                <div style={{
                  background:"#ffffff",
                  borderRadius:10,
                  boxShadow:"0 6px 28px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                  padding:"14px 10px 16px",
                  width: isMobile ? "100%" : 320,
                  boxSizing: "border-box",
                }}>
                  <div style={{ textAlign:"center", marginBottom:18 }}>
                    <span style={{
                      display:"inline-block",
                      fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:1.2,
                      color:"#92400e",
                      background:"linear-gradient(135deg,#fffbeb,#fef3c7)",
                      border:"1px solid #d97706",
                      padding:"5px 18px", borderRadius:20,
                      boxShadow:"0 2px 10px rgba(217,119,6,0.18)",
                    }}>✦ Lagna Chart ✦</span>
                  </div>
                  <div style={{ position:"relative" }}>
                    {/* Saffron mandala-fan frame — hidden on mobile to allow fluid width */}
                    <svg style={{ position:"absolute", top:-6, left:-6, pointerEvents:"none", zIndex:2, overflow:"visible", display: isMobile ? "none" : "block" }}
                         width="312" height="262" viewBox="0 0 312 262">
                      {/* Border */}
                      <rect x="1" y="1" width="310" height="260" fill="none" stroke="#d97706" strokeWidth="0.8"/>
                      {/* — TL fan — */}
                      <path d="M10,1 A9,9 0 0 0 1,10"   fill="none" stroke="#d97706" strokeWidth="2.5"/>
                      <path d="M18,1 A17,17 0 0 0 1,18"  fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                      <path d="M26,1 A25,25 0 0 0 1,26"  fill="none" stroke="#d97706" strokeWidth="0.7" strokeDasharray="2,2"/>
                      <circle cx="1"   cy="1"   r="3.5" fill="#d97706"/><circle cx="1"   cy="1"   r="1.5" fill="#fffbeb"/>
                      <circle cx="13"  cy="3"   r="1.3" fill="#f59e0b"/><circle cx="3"   cy="13"  r="1.3" fill="#f59e0b"/>
                      {/* — TR fan — */}
                      <path d="M302,1 A9,9 0 0 1 311,10"   fill="none" stroke="#d97706" strokeWidth="2.5"/>
                      <path d="M294,1 A17,17 0 0 1 311,18"  fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                      <path d="M286,1 A25,25 0 0 1 311,26"  fill="none" stroke="#d97706" strokeWidth="0.7" strokeDasharray="2,2"/>
                      <circle cx="311" cy="1"   r="3.5" fill="#d97706"/><circle cx="311" cy="1"   r="1.5" fill="#fffbeb"/>
                      <circle cx="299" cy="3"   r="1.3" fill="#f59e0b"/><circle cx="309" cy="13"  r="1.3" fill="#f59e0b"/>
                      {/* — BR fan — */}
                      <path d="M302,261 A9,9 0 0 0 311,252"   fill="none" stroke="#d97706" strokeWidth="2.5"/>
                      <path d="M294,261 A17,17 0 0 0 311,244"  fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                      <path d="M286,261 A25,25 0 0 0 311,236"  fill="none" stroke="#d97706" strokeWidth="0.7" strokeDasharray="2,2"/>
                      <circle cx="311" cy="261" r="3.5" fill="#d97706"/><circle cx="311" cy="261" r="1.5" fill="#fffbeb"/>
                      <circle cx="299" cy="259" r="1.3" fill="#f59e0b"/><circle cx="309" cy="249" r="1.3" fill="#f59e0b"/>
                      {/* — BL fan — */}
                      <path d="M10,261 A9,9 0 0 1 1,252"   fill="none" stroke="#d97706" strokeWidth="2.5"/>
                      <path d="M18,261 A17,17 0 0 1 1,244"  fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                      <path d="M26,261 A25,25 0 0 1 1,236"  fill="none" stroke="#d97706" strokeWidth="0.7" strokeDasharray="2,2"/>
                      <circle cx="1"   cy="261" r="3.5" fill="#d97706"/><circle cx="1"   cy="261" r="1.5" fill="#fffbeb"/>
                      <circle cx="13"  cy="259" r="1.3" fill="#f59e0b"/><circle cx="3"   cy="249" r="1.3" fill="#f59e0b"/>
                      {/* Top & bottom diamond midpoints */}
                      {[58,100,140,156,172,212,254].map(x => (
                        <rect key={x} x={x-2.5} y={-1.5} width="5" height="5" fill="#d97706" opacity="0.8" transform={`rotate(45,${x},1)`}/>
                      ))}
                      {[58,100,140,156,172,212,254].map(x => (
                        <rect key={x} x={x-2.5} y={257.5} width="5" height="5" fill="#d97706" opacity="0.8" transform={`rotate(45,${x},261)`}/>
                      ))}
                      {/* Left & right diamond midpoints */}
                      {[50,100,131,162,212].map(y => (
                        <rect key={y} x={-1.5} y={y-2.5} width="5" height="5" fill="#d97706" opacity="0.8" transform={`rotate(45,1,${y})`}/>
                      ))}
                      {[50,100,131,162,212].map(y => (
                        <rect key={y} x={307.5} y={y-2.5} width="5" height="5" fill="#d97706" opacity="0.8" transform={`rotate(45,311,${y})`}/>
                      ))}
                    </svg>
                    <NiChart
                      ascSignIdx={asc.signIndex}
                      housePlanets={d1Map}
                      selectedPlanet={selectedPlanet}
                      onPlanetClick={p => setSelectedPlanet(prev => prev === p ? null : p)}
                    />
                  </div>
                </div>

                {/* D9 — Navamsa  (Violet / chakra-spoke frame) */}
                {kundli.charts.d9.positions.find(p => p.planet === "ascendant") && (
                  <div style={{
                    background:"#ffffff",
                    borderRadius:10,
                    boxShadow:"0 6px 28px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
                    padding:"14px 10px 16px",
                    width: isMobile ? "100%" : 320,
                    boxSizing: "border-box",
                  }}>
                    <div style={{ textAlign:"center", marginBottom:18 }}>
                      <span style={{
                        display:"inline-block",
                        fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:1.2,
                        color:"#92400e",
                        background:"linear-gradient(135deg,#fffbeb,#fef3c7)",
                        border:"1px solid #d97706",
                        padding:"5px 18px", borderRadius:20,
                        boxShadow:"0 2px 10px rgba(217,119,6,0.18)",
                      }}>✦ Navamsa Chart ✦</span>
                    </div>
                    <div style={{ position:"relative" }}>
                      {/* Violet chakra-spoke frame — hidden on mobile to allow fluid width */}
                      <svg style={{ position:"absolute", top:-6, left:-6, pointerEvents:"none", zIndex:2, overflow:"visible", display: isMobile ? "none" : "block" }}
                           width="312" height="262" viewBox="0 0 312 262">
                        {/* Border */}
                        <rect x="1" y="1" width="310" height="260" fill="none" stroke="#d97706" strokeWidth="0.8"/>
                        {/* — TL chakra — arcs + spokes */}
                        <path d="M10,1 A9,9 0 0 0 1,10"  fill="none" stroke="#d97706" strokeWidth="2.5"/>
                        <path d="M18,1 A17,17 0 0 0 1,18" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                        <path d="M26,1 A25,25 0 0 0 1,26" fill="none" stroke="#d97706" strokeWidth="0.7"/>
                        <line x1="1" y1="1" x2="23" y2="4"  stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="1" y1="1" x2="4"  y2="23" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="1" y1="1" x2="15" y2="15" stroke="#f59e0b" strokeWidth="0.6" opacity="0.5"/>
                        <circle cx="1"  cy="1"  r="3.5" fill="#d97706"/><circle cx="1"  cy="1"  r="1.5" fill="#fffbeb"/>
                        <circle cx="23" cy="4"  r="1.5" fill="#f59e0b"/><circle cx="4"  cy="23" r="1.5" fill="#f59e0b"/>
                        {/* — TR chakra — */}
                        <path d="M302,1 A9,9 0 0 1 311,10"  fill="none" stroke="#d97706" strokeWidth="2.5"/>
                        <path d="M294,1 A17,17 0 0 1 311,18" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                        <path d="M286,1 A25,25 0 0 1 311,26" fill="none" stroke="#d97706" strokeWidth="0.7"/>
                        <line x1="311" y1="1" x2="289" y2="4"  stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="311" y1="1" x2="308" y2="23" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="311" y1="1" x2="297" y2="15" stroke="#f59e0b" strokeWidth="0.6" opacity="0.5"/>
                        <circle cx="311" cy="1"  r="3.5" fill="#d97706"/><circle cx="311" cy="1"  r="1.5" fill="#fffbeb"/>
                        <circle cx="289" cy="4"  r="1.5" fill="#f59e0b"/><circle cx="308" cy="23" r="1.5" fill="#f59e0b"/>
                        {/* — BR chakra — */}
                        <path d="M302,261 A9,9 0 0 0 311,252"  fill="none" stroke="#d97706" strokeWidth="2.5"/>
                        <path d="M294,261 A17,17 0 0 0 311,244" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                        <path d="M286,261 A25,25 0 0 0 311,236" fill="none" stroke="#d97706" strokeWidth="0.7"/>
                        <line x1="311" y1="261" x2="289" y2="258" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="311" y1="261" x2="308" y2="239" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="311" y1="261" x2="297" y2="247" stroke="#f59e0b" strokeWidth="0.6" opacity="0.5"/>
                        <circle cx="311" cy="261" r="3.5" fill="#d97706"/><circle cx="311" cy="261" r="1.5" fill="#fffbeb"/>
                        <circle cx="289" cy="258" r="1.5" fill="#f59e0b"/><circle cx="308" cy="239" r="1.5" fill="#f59e0b"/>
                        {/* — BL chakra — */}
                        <path d="M10,261 A9,9 0 0 1 1,252"  fill="none" stroke="#d97706" strokeWidth="2.5"/>
                        <path d="M18,261 A17,17 0 0 1 1,244" fill="none" stroke="#f59e0b" strokeWidth="1.5"/>
                        <path d="M26,261 A25,25 0 0 1 1,236" fill="none" stroke="#d97706" strokeWidth="0.7"/>
                        <line x1="1" y1="261" x2="23" y2="258" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="1" y1="261" x2="4"  y2="239" stroke="#f59e0b" strokeWidth="0.8" opacity="0.7"/>
                        <line x1="1" y1="261" x2="15" y2="247" stroke="#f59e0b" strokeWidth="0.6" opacity="0.5"/>
                        <circle cx="1"  cy="261" r="3.5" fill="#d97706"/><circle cx="1"  cy="261" r="1.5" fill="#fffbeb"/>
                        <circle cx="23" cy="258" r="1.5" fill="#f59e0b"/><circle cx="4"  cy="239" r="1.5" fill="#f59e0b"/>
                        {/* Top & bottom dot midpoints */}
                        {[58,100,140,156,172,212,254].map(x => (
                          <circle key={x} cx={x} cy="1" r="2" fill="#f59e0b" opacity="0.85"/>
                        ))}
                        {[58,100,140,156,172,212,254].map(x => (
                          <circle key={x} cx={x} cy="261" r="2" fill="#f59e0b" opacity="0.85"/>
                        ))}
                        {/* Left & right dot midpoints */}
                        {[50,100,131,162,212].map(y => (
                          <circle key={y} cx="1" cy={y} r="2" fill="#f59e0b" opacity="0.85"/>
                        ))}
                        {[50,100,131,162,212].map(y => (
                          <circle key={y} cx="311" cy={y} r="2" fill="#f59e0b" opacity="0.85"/>
                        ))}
                      </svg>
                      <NiChart
                        ascSignIdx={d9AscIdx}
                        housePlanets={d9Map}
                        selectedPlanet={selectedPlanet}
                      />
                    </div>
                    <div style={{ marginTop:6, fontSize:10, color:"#92400e", textAlign:"center", fontWeight:600 }}>
                      D9 Lagna: {SIGN_NAMES[d9AscIdx]}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Yogas & Doshas panel */}
              <div style={{ minWidth:0, display:"flex", flexDirection:"column", gap:12 }}>

                {/* Present Yogas */}
                <div style={{ ...cardStyle, padding:0, overflow:"hidden" }}>
                  <div style={{
                    padding:"10px 14px", borderBottom:`1px solid ${t.border}`,
                    background: isDark ? "rgba(180,83,9,0.10)" : "rgba(180,83,9,0.06)",
                    display:"flex", alignItems:"center", gap:8,
                  }}>
                    <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase",
                      letterSpacing:1, color:t.accent }}>✦ Present Yogas</span>
                    <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700,
                      background:t.accent+"22", color:t.accent, padding:"1px 7px", borderRadius:10 }}>
                      {kundli.yogas.filter(y => y.isPresent).length}
                    </span>
                  </div>
                  <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:0 }}>
                    {kundli.yogas.filter(y => y.isPresent).length === 0 ? (
                      <div style={{ fontSize:12, color:t.textMuted, padding:"8px 0" }}>No major yogas detected.</div>
                    ) : kundli.yogas.filter(y => y.isPresent).map((y, i, arr) => (
                      <div key={y.name} style={{
                        padding:"10px 0",
                        borderBottom: i < arr.length-1 ? `1px solid ${t.border}` : "none",
                      }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3, gap:8 }}>
                          <span style={{ fontSize:13, fontWeight:800, color:t.accent }}>{y.name}</span>
                          {y.planets.length > 0 && (
                            <div style={{ display:"flex", gap:3, flexWrap:"wrap", justifyContent:"flex-end" }}>
                              {y.planets.map(p => (
                                <span key={p} style={{
                                  padding:"1px 6px", borderRadius:3, fontSize:10, fontWeight:700,
                                  background:(PLANET_COLOR[p]??"#94a3b8")+"22",
                                  color:PLANET_COLOR[p]??t.textMuted,
                                }}>{p.charAt(0).toUpperCase()+p.slice(1)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:"#16a34a", fontWeight:600, marginBottom:2 }}>{y.significance}</div>
                        <div style={{ fontSize:11, color:t.textSecond, lineHeight:1.5 }}>{y.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doshas */}
                <div style={{ ...cardStyle, padding:0, overflow:"hidden" }}>
                  <div style={{
                    padding:"10px 14px", borderBottom:`1px solid ${t.border}`,
                    background: isDark ? "rgba(180,83,9,0.10)" : "rgba(180,83,9,0.06)",
                  }}>
                    <span style={{ fontSize:10, fontWeight:800, textTransform:"uppercase",
                      letterSpacing:1, color:t.accent }}>⚑ Doshas</span>
                  </div>
                  <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                    {kundli.doshas.map(d => {
                      const sc = d.severity==="strong"?"#dc2626":d.severity==="moderate"?"#f97316":d.severity==="mild"?"#d97706":"#16a34a";
                      const present = d.isPresent && d.severity !== "none";
                      return (
                        <div key={d.name} style={{
                          display:"flex", alignItems:"flex-start", gap:10,
                          padding:"10px 12px", borderRadius:7,
                          background: present ? (isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.025)") : "transparent",
                          border:`1px solid ${present ? sc+"55" : t.border}`,
                        }}>
                          <div style={{ width:3, flexShrink:0, alignSelf:"stretch",
                            borderRadius:2, background: present ? sc : t.border, marginTop:2 }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", justifyContent:"space-between",
                              alignItems:"center", gap:8, marginBottom:3 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:t.textPrimary }}>{d.name}</span>
                              <span style={{ flexShrink:0, fontSize:10, fontWeight:700,
                                color: present ? sc : "#16a34a",
                                background:(present ? sc : "#16a34a")+"18",
                                padding:"2px 8px", borderRadius:4 }}>
                                {present
                                  ? (d.severity==="none" ? "Negligible" : d.severity.charAt(0).toUpperCase()+d.severity.slice(1))
                                  : "Not Present"}
                              </span>
                            </div>
                            <div style={{ fontSize:11, color:t.textSecond, lineHeight:1.5 }}>{d.description}</div>
                            {present && d.remedies && d.remedies.length > 0 && (
                              <div style={{ marginTop:6 }}>
                                <div style={{ fontSize:10, fontWeight:700, color:t.textMuted,
                                  textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Remedies</div>
                                <ul style={{ margin:0, paddingLeft:14, display:"flex", flexDirection:"column", gap:2 }}>
                                  {d.remedies.map((r, ri) => (
                                    <li key={ri} style={{ fontSize:11, color:t.textSecond }}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Planet detail panel ────────────────────────────────────── */}
            {selPlanetData && (
              <div style={{ ...cardStyle, padding:16, marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"#b45309",
                      textTransform:"uppercase", letterSpacing:0.6, marginBottom:6 }}>
                      Planet Detail
                    </div>
                    <div style={{ fontSize:18, fontWeight:800,
                      color:PLANET_COLOR[selPlanetData.planet] ?? t.textPrimary }}>
                      {selPlanetData.displayName}
                      {selPlanetData.isRetrograde && (
                        <span style={{ fontSize:12, marginLeft:6, color:"#ea580c" }}>Retrograde</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedPlanet(null)} style={{
                    background:"none", border:`1px solid ${t.border}`, borderRadius:6,
                    padding:"4px 10px", fontSize:12, color:t.textSecond, cursor:"pointer",
                  }}>
                    × Close
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginTop:14 }}>
                  {[
                    { label:"Rashi",      value:`${selPlanetData.signName}` },
                    { label:"Longitude",  value:fmtLon(selPlanetData.degree, selPlanetData.minute) },
                    { label:"House",      value:`H${selPlanetData.house}` },
                    { label:"Nakshatra",  value:selPlanetData.nakshatraName },
                    { label:"Pada",       value:`${selPlanetData.pada}` },
                    { label:"Dignity",    value:getDignity(selPlanetData) },
                    { label:"Nak. Lord",  value:selPlanetData.nakshatraLord.charAt(0).toUpperCase()+selPlanetData.nakshatraLord.slice(1) },
                    { label:"Relation",   value:getPlanetRelation(selPlanetData.planet, selPlanetData.signIndex) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      borderRadius:8, padding:"8px 10px",
                    }}>
                      <div style={{ fontSize:10, fontWeight:700, color:t.textMuted,
                        textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:t.textPrimary }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section tabs ───────────────────────────────────────────── */}
            <div style={{ display:"flex", gap:0, marginBottom:20, borderBottom:`2px solid ${t.border}`, overflowX:"auto" }}>
              {(["planets","dasha","yogas"] as const).map(tab => {
                const labels = { planets: isMobile ? "Planets" : "Planetary Positions", dasha: isMobile ? "Dasha" : "Vimshottari Dasha", yogas:"Yogas & Doshas" };
                const active = activeTab === tab;
                const tabAccent = "#b45309";
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{
                    padding: isMobile ? "10px 14px" : "10px 20px",
                    fontSize: isMobile ? 12 : 13,
                    fontWeight:active ? 700 : 500,
                    cursor:"pointer", background:"none", border:"none",
                    borderBottom: active ? `2px solid ${tabAccent}` : "2px solid transparent",
                    color: active ? tabAccent : t.textSecond,
                    marginBottom:"-2px", transition:"all 0.12s",
                    whiteSpace:"nowrap", flexShrink:0,
                  }}>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* ── Planetary Positions Table ───────────────────────────────── */}
            {activeTab === "planets" && (
              <div style={{ ...cardStyle, overflow:"hidden", marginBottom:0 }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr style={{
                        background: isDark ? "rgba(178,65,5,0.10)" : "rgba(178,65,5,0.055)",
                        borderBottom:`2px solid ${isDark?"rgba(178,65,5,0.22)":"rgba(178,65,5,0.16)"}`,
                      }}>
                        {["Planet","D/R","Rashi","Longitude","Nakshatra","Pada","Relation"].map(h => (
                          <th key={h} style={{
                            padding:"10px 12px", textAlign:"left", fontSize:10, fontWeight:700,
                            color: isDark?"#d97706":"#7c3700", textTransform:"uppercase",
                            letterSpacing:0.7, whiteSpace:"nowrap",
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Ascendant row */}
                      <tr style={{
                        borderBottom:`1px solid ${t.border}`,
                        background: selectedPlanet==="ascendant"
                          ? (isDark?"rgba(109,40,217,0.12)":"rgba(109,40,217,0.06)") : "transparent",
                        cursor:"pointer",
                      }}
                      onClick={() => setSelectedPlanet(p => p==="ascendant" ? null : "ascendant")}>
                        <td style={{ padding:"9px 13px", fontWeight:700, color:ASC_COL }}>
                          Ascendant (Lagna)
                        </td>
                        <td style={{ padding:"9px 13px", color:t.textMuted }}>—</td>
                        <td style={{ padding:"9px 13px", color:t.textPrimary }}>{asc.signName}</td>
                        <td style={{ padding:"9px 13px", color:t.textSecond, fontVariantNumeric:"tabular-nums" }}>
                          {fmtLon(asc.degree, asc.minute, asc.second)}
                        </td>
                        <td style={{ padding:"9px 13px", color:t.textSecond }}>{asc.nakshatraName}</td>
                        <td style={{ padding:"9px 13px", color:t.textMuted }}>{asc.pada ?? "—"}</td>
                        <td style={{ padding:"9px 13px", color:t.textMuted }}>—</td>
                      </tr>
                      {/* Planet rows */}
                      {kundli.planets.map((p, i) => {
                        const dignity = getDignity(p);
                        const dCol = dignityColor(dignity);
                        const isSel = selectedPlanet === p.planet;
                        return (
                          <tr key={p.planet} onClick={() => setSelectedPlanet(prev => prev===p.planet ? null : p.planet)}
                            style={{
                              borderBottom:`1px solid ${t.border}`,
                              background: isSel
                                ? (isDark?"rgba(124,58,237,0.10)":"rgba(124,58,237,0.05)")
                                : i%2===0 ? "transparent" : (isDark?"rgba(255,255,255,0.015)":"rgba(0,0,0,0.015)"),
                              cursor:"pointer",
                            }}>
                            <td style={{ padding:"9px 13px" }}>
                              <span style={{ fontWeight:700, color:PLANET_COLOR[p.planet]??t.textPrimary }}>
                                {p.displayName}
                              </span>
                            </td>
                            <td style={{ padding:"9px 13px", fontWeight:700,
                              color: p.isRetrograde ? "#ea580c" : t.textSecond }}>
                              {p.isRetrograde ? "R" : "D"}
                            </td>
                            <td style={{ padding:"9px 13px", color:t.textPrimary }}>{p.signName}</td>
                            <td style={{ padding:"9px 13px", color:t.textSecond, fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap" }}>
                              {fmtLon(p.degree, p.minute)}
                            </td>
                            <td style={{ padding:"9px 13px", color:t.textSecond, whiteSpace:"nowrap" }}>
                              {p.nakshatraName}
                            </td>
                            <td style={{ padding:"9px 13px", color:t.textMuted }}>{p.pada}</td>
                            <td style={{ padding:"9px 13px" }}>
                              <span style={{
                                fontSize:11, fontWeight:700, color:dCol,
                                background:dCol+"18", padding:"2px 7px", borderRadius:4,
                              }}>{dignity}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Dasha ──────────────────────────────────────────────────── */}
            {activeTab === "dasha" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                {/* Balance at birth */}
                {bal && firstDasha && (
                  <div style={{ ...cardStyle, padding:16 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"#b45309",
                      textTransform:"uppercase", letterSpacing:0.6, marginBottom:8 }}>
                      Balance of Dasha at Birth
                    </div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:16, fontWeight:800,
                        color:PLANET_COLOR[firstDasha.lord]??t.textPrimary }}>
                        {firstDasha.displayName}
                      </span>
                      <span style={{ fontSize:13, color:t.textSecond }}>
                        — {bal.years}y {bal.months}m {bal.days}d
                      </span>
                    </div>
                  </div>
                )}

                {/* Current period highlight */}
                {currentMaha && (
                  <div style={{ ...cardStyle, padding:16, borderLeft:"3px solid #b45309" }}>
                    <div style={{ fontSize:10, fontWeight:700, color:t.accent,
                      textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>
                      Current Dasha Period
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:20 }}>
                      <div>
                        <div style={{ fontSize:10, color:t.textMuted, marginBottom:2 }}>Mahadasha</div>
                        <div style={{ fontSize:18, fontWeight:800,
                          color:PLANET_COLOR[currentMaha.lord]??t.textPrimary }}>
                          {currentMaha.displayName}
                        </div>
                        <div style={{ fontSize:11, color:t.textSecond }}>
                          {currentMaha.startDate.slice(0,10)} → {currentMaha.endDate.slice(0,10)}
                        </div>
                      </div>
                      {currentAntar && (
                        <div>
                          <div style={{ fontSize:10, color:t.textMuted, marginBottom:2 }}>Antardasha</div>
                          <div style={{ fontSize:18, fontWeight:800,
                            color:PLANET_COLOR[currentAntar.lord]??t.textPrimary }}>
                            {currentAntar.displayName}
                          </div>
                          <div style={{ fontSize:11, color:t.textSecond }}>
                            {currentAntar.startDate.slice(0,10)} → {currentAntar.endDate.slice(0,10)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mahadasha sequence */}
                <div style={{ ...cardStyle, overflow:"hidden" }}>
                  <div style={{ padding:"12px 16px", borderBottom:`1px solid ${t.border}`,
                    fontSize:10, fontWeight:700, color:t.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>
                    Vimshottari Dasha Sequence (120 Years)
                  </div>
                  {dashas.map(d => (
                    <div key={d.lord} style={{
                      padding:"12px 16px", borderBottom:`1px solid ${t.border}`,
                      background: d.isCurrent
                        ? (isDark?"rgba(124,58,237,0.07)":"rgba(124,58,237,0.035)") : "transparent",
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%",
                            background:PLANET_COLOR[d.lord]??t.textMuted }}/>
                          <span style={{ fontWeight:700, fontSize:14,
                            color:PLANET_COLOR[d.lord]??t.textPrimary }}>
                            {d.displayName}
                          </span>
                          {d.isCurrent && (
                            <span style={{ background:"#b45309", color:"#fff",
                              borderRadius:4, padding:"1px 6px", fontSize:9, fontWeight:800 }}>
                              CURRENT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:t.textSecond, fontVariantNumeric:"tabular-nums" }}>
                          {d.startDate.slice(0,10)} → {d.endDate.slice(0,10)}
                          {d.durationYears != null && (
                            <span style={{ marginLeft:6, color:t.textMuted }}>({d.durationYears}y)</span>
                          )}
                        </div>
                      </div>

                      {d.isCurrent && d.antardashas && d.antardashas.length > 0 && (
                        <div style={{ marginTop:8, paddingLeft:16, display:"flex", flexDirection:"column", gap:3 }}>
                          {d.antardashas.map(a => (
                            <div key={a.lord} style={{
                              display:"flex", justifyContent:"space-between", alignItems:"center",
                              padding:"4px 8px", borderRadius:6, flexWrap:"wrap", gap:4,
                              background: a.isCurrent
                                ? (isDark?"rgba(124,58,237,0.13)":"rgba(124,58,237,0.07)") : "transparent",
                              border: a.isCurrent ? "1px solid rgba(180,83,9,0.35)" : "1px solid transparent",
                            }}>
                              <span style={{ fontSize:12, fontWeight:a.isCurrent?700:400,
                                color:PLANET_COLOR[a.lord]??t.textSecond }}>
                                {a.displayName}{a.isCurrent?" ◀":""}
                              </span>
                              <span style={{ fontSize:10, color:t.textMuted, fontVariantNumeric:"tabular-nums" }}>
                                {a.startDate.slice(0,10)} → {a.endDate.slice(0,10)}
                                {a.durationDays != null && ` (${a.durationDays}d)`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Yogas & Doshas ─────────────────────────────────────────── */}
            {activeTab === "yogas" && (
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {/* Yogas */}
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:t.textPrimary, marginBottom:12 }}>
                    Present Yogas
                  </div>
                  {kundli.yogas.filter(y => y.isPresent).length === 0 ? (
                    <div style={{ color:t.textMuted, fontSize:13 }}>No major yogas detected.</div>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:12 }}>
                      {kundli.yogas.filter(y => y.isPresent).map(y => (
                        <div key={y.name} style={{ ...cardStyle, padding:"14px 16px" }}>
                          <div style={{ fontSize:14, fontWeight:800, color:t.accent, marginBottom:5 }}>{y.name}</div>
                          <div style={{ fontSize:12, color:t.textSecond, lineHeight:1.5, marginBottom:6 }}>{y.description}</div>
                          <div style={{ fontSize:11, color:"#16a34a", fontStyle:"italic" }}>{y.significance}</div>
                          {y.planets.length > 0 && (
                            <div style={{ marginTop:8, display:"flex", gap:4, flexWrap:"wrap" }}>
                              {y.planets.map(p => (
                                <span key={p} style={{
                                  padding:"2px 7px", borderRadius:4, fontSize:10, fontWeight:700,
                                  background:(PLANET_COLOR[p]??"#94a3b8")+"22",
                                  color:PLANET_COLOR[p]??t.textMuted,
                                }}>{p.charAt(0).toUpperCase()+p.slice(1)}</span>
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
                  <div style={{ fontSize:14, fontWeight:700, color:t.textPrimary, marginBottom:12 }}>
                    Doshas
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {kundli.doshas.map(d => {
                      const sc = d.severity==="strong"?"#dc2626":d.severity==="moderate"?"#f97316":d.severity==="mild"?"#d97706":"#16a34a";
                      return (
                        <div key={d.name} style={{
                          ...cardStyle, padding:"14px 16px",
                          borderLeft: d.isPresent && d.severity !== "none" ? `3px solid ${sc}` : `3px solid transparent`,
                        }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap", gap:6 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:t.textPrimary }}>{d.name}</span>
                            <span style={{ fontSize:10, fontWeight:700,
                              color: d.isPresent && d.severity!=="none" ? sc : "#16a34a",
                              background:(d.isPresent && d.severity!=="none" ? sc : "#16a34a")+"18",
                              padding:"2px 8px", borderRadius:4,
                            }}>
                              {d.isPresent ? (d.severity==="none"?"Negligible":d.severity.charAt(0).toUpperCase()+d.severity.slice(1)) : "Not Present"}
                            </span>
                          </div>
                          <div style={{ fontSize:12, color:t.textSecond, lineHeight:1.5 }}>{d.description}</div>
                          {d.isPresent && d.remedies && d.remedies.length > 0 && (
                            <div style={{ marginTop:8 }}>
                              <div style={{ fontSize:10, fontWeight:700, color:t.textMuted,
                                textTransform:"uppercase", letterSpacing:0.5, marginBottom:5 }}>
                                Remedies
                              </div>
                              <ul style={{ margin:0, paddingLeft:16, display:"flex", flexDirection:"column", gap:2 }}>
                                {d.remedies.map((r, i) => (
                                  <li key={i} style={{ fontSize:12, color:t.textSecond }}>{r}</li>
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
        );
      })()}
    </div>
  );
}
