import React from "react";

type BadgeColor = "purple" | "green" | "blue" | "orange" | "red" | "gray";

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
}

const colors: Record<BadgeColor, React.CSSProperties> = {
  purple: { background: "#3b0764", color: "#d8b4fe" },
  green: { background: "#052e16", color: "#4ade80" },
  blue: { background: "#0c1a6b", color: "#93c5fd" },
  orange: { background: "#431407", color: "#fb923c" },
  red: { background: "#450a0a", color: "#f87171" },
  gray: { background: "#1f2937", color: "#9ca3af" },
};

const Badge: React.FC<BadgeProps> = ({ children, color = "purple" }) => (
  <span style={{ ...colors[color], padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, display: "inline-block" }}>
    {children}
  </span>
);

export default Badge;
