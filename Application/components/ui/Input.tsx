import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, leftIcon, style, ...rest }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    {label && <label style={{ fontSize: "14px", fontWeight: 500, color: "#c4b5fd" }}>{label}</label>}
    <div style={{ position: "relative" }}>
      {leftIcon && (
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#7c3aed" }}>
          {leftIcon}
        </span>
      )}
      <input
        style={{
          width: "100%",
          padding: leftIcon ? "10px 12px 10px 40px" : "10px 14px",
          background: "#1e1b4b",
          border: error ? "1.5px solid #ef4444" : "1.5px solid #3730a3",
          borderRadius: "10px",
          color: "#f3f4f6",
          fontSize: "15px",
          outline: "none",
          boxSizing: "border-box",
          ...style,
        }}
        {...rest}
      />
    </div>
    {error && <span style={{ fontSize: "12px", color: "#ef4444" }}>{error}</span>}
  </div>
);

export default Input;
