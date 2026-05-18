import React from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "#fff", border: "none" },
  secondary: { background: "#1e1b4b", color: "#a78bfa", border: "1px solid #3730a3" },
  outline: { background: "transparent", color: "#7c3aed", border: "2px solid #7c3aed" },
  ghost: { background: "transparent", color: "#a78bfa", border: "none" },
  danger: { background: "#dc2626", color: "#fff", border: "none" },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "13px", borderRadius: "8px" },
  md: { padding: "10px 20px", fontSize: "15px", borderRadius: "10px" },
  lg: { padding: "14px 28px", fontSize: "17px", borderRadius: "12px" },
};

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  children,
  style,
  disabled,
  ...rest
}) => (
  <button
    disabled={disabled || loading}
    style={{
      ...variantStyles[variant],
      ...sizeStyles[size],
      fontWeight: 600,
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.6 : 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      width: fullWidth ? "100%" : undefined,
      transition: "all 0.2s",
      ...style,
    }}
    {...rest}
  >
    {loading ? <span style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> : leftIcon}
    {children}
  </button>
);

export default Button;
