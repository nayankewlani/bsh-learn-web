import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 520 }) => {
  if (!isOpen) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#0f0e1a", border: "1px solid #3730a3", borderRadius: "16px", width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto" }}>
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1e1b4b" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#f3f4f6", fontWeight: 700 }}>{title}</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "22px", lineHeight: 1 }}>×</button>
          </div>
        )}
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
