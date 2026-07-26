import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { FiEye, FiEyeOff, FiArrowLeft, FiMail, FiLock } from "react-icons/fi";
import { HiOutlineAcademicCap, HiOutlineUserCircle } from "react-icons/hi";
import bshLogo from "../../assets/logo-1.png";

const LoginPage: React.FC = () => {
  const [loginAs, setLoginAs] = useState<"student" | "educator">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState("");
  const { login, isLoading, error, clearError } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (role === "admin") navigate("/admin");
      else if (role === "educator") navigate("/educator");
      else navigate("/dashboard");
    } catch {}
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark
        ? "linear-gradient(135deg, #050412 0%, #0f0e1a 40%, #1a0a2e 100%)"
        : "linear-gradient(135deg, #f4f3ff 0%, #ede9fe 40%, #ddd6fe 100%)",
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
          <img src={bshLogo} alt="BSH Healers" style={{ height: 64, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(124,58,237,0.4))", animation: "float 4s ease-in-out infinite" }} />
        </div>

        {/* Glass card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center" }}>Welcome Back</h1>
          <p style={{ margin: "0 0 20px", color: "#666", textAlign: "center", fontSize: 14 }}>Please enter your details to continue</p>

          {/* Role selector */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            {([
              { key: "student" as const, label: "Student / Client", icon: <HiOutlineAcademicCap size={18} /> },
              { key: "educator" as const, label: "Educator",         icon: <HiOutlineUserCircle size={18} /> },
            ]).map((r) => (
              <button key={r.key} type="button" onClick={() => setLoginAs(r.key)}
                style={{ padding: "11px 10px", borderRadius: 12, border: `2px solid ${loginAs === r.key ? "#7c3aed" : "#eee"}`, cursor: "pointer", background: loginAs === r.key ? "rgba(124,58,237,0.08)" : "#fafafa", color: loginAs === r.key ? "#7c3aed" : "#666", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 600, fontSize: 13, transition: "0.2s" }}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>

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
                style={{ width: "100%", padding: "14px 14px 14px 44px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", color: "#111", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
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
                style={{ width: "100%", padding: "14px 44px 14px 44px", border: "1.5px solid #eee", borderRadius: 12, fontSize: 15, background: "#fdfdfd", color: "#111", outline: "none", boxSizing: "border-box", transition: "0.2s" }}
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
              <span onClick={() => navigate("/forgot-password")} style={{ color: "#7c3aed", fontWeight: 600, cursor: "pointer" }}>Forgot Password?</span>
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
            <button
              type="button"
              onClick={() => showToast("Google sign-in coming soon!")}
              style={{ flex: 1, padding: "11px", border: "1.5px solid #eee", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#333", transition: "0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#eee")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => showToast("Apple sign-in coming soon!")}
              style={{ flex: 1, padding: "11px", border: "1.5px solid #eee", borderRadius: 12, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#333", transition: "0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#eee")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 22, color: "#666", fontSize: 14 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Sign up free</Link>
          </p>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#1e1b4b", color: "#a78bfa", padding: "12px 22px", borderRadius: 50, fontSize: 13, fontWeight: 600, border: "1px solid rgba(124,58,237,0.4)", backdropFilter: "blur(12px)", zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", animation: "fadeIn 0.3s ease" }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } @keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity:0; transform: translate(-50%,10px); } to { opacity:1; transform: translate(-50%,0); } }`}</style>
    </div>
  );
};

export default LoginPage;
