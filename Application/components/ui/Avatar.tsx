import React from "react";

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ src, name, size = 40 }) => {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.36,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
};

export default Avatar;
