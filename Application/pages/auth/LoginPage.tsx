import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { FiEye, FiEyeOff, FiArrowLeft, FiMail, FiLock } from "react-icons/fi";
import bshLogo from "../../assets/logo-1.png";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {}
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050412 0%, #0f0e1a 40%, #1a0a2e 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20,
      position: "relative",
    }}>
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 250, height: 250, background: "radial-gradient(circle, rgba(167,139,250,0.1), transparent 70%)", pointerEvents: "none" }} />

      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#c4b5fd", padding: "8px 16px", borderRadius: 50, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, backdropFilter: "blur(10px)", transition: "0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        <FiArrowLeft size={14} /> Back
      </button>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Floating logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={bshLogo} alt="BSHLearn" style={{ height: 64, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(124,58,237,0.4))", animation: "float 4s ease-in-out infinite" }} />
        </div>

        {/* Glass card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center" }}>Welcome Back</h1>
          <p style={{ margin: "0 0 28px", color: "#666", textAlign: "center", fontSize: 14 }}>Please enter your details to continue</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Email */}
            <div style={{ position: "relative" }}>
              <FiMail size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#999", zIndex: 1 }} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "14px 14px 14px 44px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
                onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <FiLock size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#999", zIndex: 1 }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "14px 44px 14px 44px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
                onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 4px rgba(124,58,237,0.12)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer", padding: 0 }}>
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>

            {/* Actions row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#555", cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "#7c3aed" }} /> Remember me
              </label>
              <span style={{ color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}>Forgot Password?</span>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: 15, background: isLoading ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s" }}
              onMouseEnter={(e) => { if (!isLoading) (e.currentTarget.style.transform = "translateY(-2px)"); }}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              {isLoading ? (
                <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : "Sign In"}
            </button>
          </form>

          <div style={{ margin: "20px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#eee" }} />
            <span style={{ color: "#aaa", fontSize: 13 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: "#eee" }} />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button style={{ flex: 1, padding: "11px", border: "1.5px solid #eee", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#333", transition: "0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#eee")}
            >
              <img src="/assets/google.png" alt="Google" style={{ height: 18, width: 18 }} onError={(e) => (e.currentTarget.style.display = "none")} />
              Google
            </button>
            <button style={{ flex: 1, padding: "11px", border: "1.5px solid #eee", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#333", transition: "0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#eee")}
            >
              <img src="/assets/apple.webp" alt="Apple" style={{ height: 18, width: 18 }} onError={(e) => (e.currentTarget.style.display = "none")} />
              Apple
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 22, color: "#666", fontSize: 14 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Sign up free</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoginPage;
