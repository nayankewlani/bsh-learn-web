import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import { HiOutlineAcademicCap, HiOutlineUserCircle } from "react-icons/hi";
import bshLogo from "../../assets/logo-1.png";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
];

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState<"student" | "educator">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [successAnim, setSuccessAnim] = useState(false);
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const calcStrength = (val: string) => {
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    return s;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(name, email, password, role);
      setSuccessAnim(true);
      setTimeout(() => navigate(role === "educator" ? "/educator" : "/dashboard"), 1000);
    } catch {}
  };

  const strengthColors = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050412 0%, #0f0e1a 40%, #1a0a2e 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px",
      position: "relative",
    }}>
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)", pointerEvents: "none" }} />

      <button onClick={() => navigate(-1)} style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#c4b5fd", padding: "8px 16px", borderRadius: 50, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, backdropFilter: "blur(10px)", transition: "0.2s" }}>
        <FiArrowLeft size={14} /> Back
      </button>

      <div style={{ width: "100%", maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={bshLogo} alt="BSHLearn" style={{ height: 58, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(124,58,237,0.4))", animation: "float 4s ease-in-out infinite" }} />
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "36px 32px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center" }}>
            {successAnim ? "Welcome to BSHLearn! 🎉" : "Create Account"}
          </h1>
          <p style={{ margin: "0 0 22px", color: "#666", textAlign: "center", fontSize: 14 }}>Begin your journey today</p>

          {/* Role selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {([
              { key: "student" as const, label: "Student", icon: <HiOutlineAcademicCap size={20} />, desc: "I want to learn" },
              { key: "educator" as const, label: "Educator", icon: <HiOutlineUserCircle size={20} />, desc: "I want to teach" },
            ]).map((r) => (
              <button key={r.key} type="button" onClick={() => setRole(r.key)}
                style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${role === r.key ? "#7c3aed" : "#eee"}`, cursor: "pointer", background: role === r.key ? "rgba(124,58,237,0.08)" : "#fff", color: role === r.key ? "#7c3aed" : "#666", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "0.2s" }}
              >
                {r.icon}
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Name */}
            <input
              type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required
              style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
              onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
            />

            {/* Email */}
            <input
              type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "13px 14px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
              onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.1)"; }}
              onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
            />

            {/* Phone with country code */}
            <div ref={dropdownRef} style={{ display: "flex", gap: 8, position: "relative" }}>
              <button type="button" onClick={() => setShowDropdown(!showDropdown)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 12px", border: "1.5px solid #eee", borderRadius: 12, background: "#fdfdfd", cursor: "pointer", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", minWidth: 90 }}>
                {countryCode.flag} {countryCode.code}
              </button>
              {showDropdown && (
                <div style={{ position: "absolute", top: 52, left: 0, background: "#fff", border: "1px solid #eee", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: 180, overflow: "hidden" }}>
                  {COUNTRY_CODES.map((c) => (
                    <div key={c.code} onClick={() => { setCountryCode(c); setShowDropdown(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", fontSize: 14, transition: "0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f0ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>{c.flag}</span><span style={{ flex: 1, color: "#333" }}>{c.name}</span><span style={{ color: "#999" }}>{c.code}</span>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="tel" placeholder="Phone number" value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                style={{ flex: 1, padding: "13px 14px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
                onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.1)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} placeholder="Password (min. 6 chars)" value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordStrength(calcStrength(e.target.value)); }} required minLength={6}
                  style={{ width: "100%", padding: "13px 44px 13px 14px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer" }}>
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: "#eee", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${passwordStrength * 25}%`, background: strengthColors[passwordStrength], borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: 11, color: strengthColors[passwordStrength], fontWeight: 600, minWidth: 36 }}>{strengthLabels[passwordStrength]}</span>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit" disabled={isLoading || successAnim}
              style={{ width: "100%", padding: 15, background: successAnim ? "#16a34a" : (isLoading ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#5b21b6)"), color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: (isLoading || successAnim) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "0.3s" }}
            >
              {successAnim ? (
                <><FiCheckCircle size={18} /> Registered!</>
              ) : isLoading ? (
                <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "Register Now"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 18, color: "#666", fontSize: 14 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Log In</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RegisterPage;
