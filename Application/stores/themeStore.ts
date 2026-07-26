import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DARK = {
  bgPrimary:   "#0a0914",
  bgSecondary: "#13122a",
  bgTertiary:  "#1e1b4b",
  bgCard:      "#13122a",
  bgInput:     "#13122a",
  bgNav:       "#0f0e1a",
  border:      "#1e1b4b",
  borderLight: "#3730a3",
  textPrimary: "#f3f4f6",
  textSecond:  "#9ca3af",
  textMuted:   "#6b7280",
  textAccent:  "#c4b5fd",
  accent:      "#7c3aed",
  accentLight: "#a78bfa",
  shadow:      "rgba(0,0,0,0.6)",
  isDark: true,
} as const;

export const LIGHT = {
  bgPrimary:   "#f7f5f1",
  bgSecondary: "#ffffff",
  bgTertiary:  "#edeae3",
  bgCard:      "#ffffff",
  bgInput:     "#f9f7f4",
  bgNav:       "#ffffff",
  border:      "#e0dbd2",
  borderLight: "#c9c4bc",
  textPrimary: "#1a2035",
  textSecond:  "#4b5268",
  textMuted:   "#7a808f",
  textAccent:  "#7c3aed",
  accent:      "#7c3aed",
  accentLight: "#6d28d9",
  shadow:      "rgba(26,32,53,0.10)",
  isDark: false,
} as const;

export type Theme = {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgInput: string;
  bgNav: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecond: string;
  textMuted: string;
  textAccent: string;
  accent: string;
  accentLight: string;
  shadow: string;
  isDark: boolean;
};

interface ThemeState {
  isDark: boolean;
  t: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      t: LIGHT,
      toggle: () => {
        const next = !get().isDark;
        document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
        set({ isDark: next, t: next ? DARK : LIGHT });
      },
    }),
    {
      name: "bsh-theme",
      onRehydrateStorage: () => (state) => {
        document.documentElement.setAttribute("data-theme", state?.isDark ? "dark" : "light");
      },
    }
  )
);
