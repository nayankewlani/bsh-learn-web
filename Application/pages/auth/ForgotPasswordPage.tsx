import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMail, FiCheckCircle } from "react-icons/fi";
import bshLogo from "../../assets/logo-1.png";
import client from "../../api/client";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (val: string) => {
    if (!val) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email";
    return "";
  };

  const handleSubmit = async () => {
    setTouched(true);
    const err = validate(email);
    setError(err);
    if (err) return;
    setIsLoading(true);
    try {
      await client.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch {
      setSuccess(true); // show success regardless — don't leak user existence
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #050412 0%, #0f0e1a 40%, #1a0a2e 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, position: "relative", overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -100, left: -50, width: 300, height: 300, background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, right: -50, width: 250, height: 250, background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)", pointerEvents: "none" }} />

      {/* Back button */}
      <button
        onClick={() => navigate("/login")}
        style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#c4b5fd", padding: "8px 16px", borderRadius: 50, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, backdropFilter: "blur(10px)", transition: "0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        <FiArrowLeft size={14} /> Back to Login
      </button>

      <div style={{ width: "100%", maxWidth: 420, zIndex: 1 }}>
        {/* Floating logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img
            src={bshLogo}
            alt="BSHLearn"
            style={{ height: 64, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(124,58,237,0.4))", animation: "float 4s ease-in-out infinite" }}
          />
        </div>

        {/* Glass card */}
        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>

          {!success ? (
            <>
              {/* Back circle inside card */}
              <button
                onClick={() => navigate("/login")}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, transition: "0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#e5e7eb"; (e.currentTarget.style as CSSStyleDeclaration).transform = "translateX(-3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#f3f4f6"; (e.currentTarget.style as CSSStyleDeclaration).transform = "none"; }}
              >
                <FiArrowLeft size={16} color="#555" />
              </button>

              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center" }}>Forgot Password</h2>
              <p style={{ margin: "0 0 28px", color: "#666", fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
                Enter your registered email to receive a secure reset link.
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex", alignItems: "center", background: "#f9fafb",
                  border: `1.5px solid ${touched && error ? "#ef4444" : "#e5e7eb"}`,
                  borderRadius: 12, padding: "12px 15px", transition: "0.3s",
                }}
                  onFocus={() => {}}
                >
                  <FiMail size={18} color="#9ca3af" style={{ marginRight: 12, flexShrink: 0 }} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (touched) setError(validate(e.target.value)); }}
                    onBlur={() => { setTouched(true); setError(validate(email)); }}
                    style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: 15, color: "#111" }}
                  />
                </div>
                {touched && error && (
                  <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6, marginLeft: 4 }}>{error}</p>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                style={{ width: "100%", padding: 14, background: isLoading ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 16, cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.3s" }}
                onMouseEnter={(e) => { if (!isLoading) (e.currentTarget.style.transform = "translateY(-2px)"); }}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
              >
                {isLoading ? (
                  <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : "Send Reset Link"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0", animation: "fadeIn 0.5s ease" }}>
              <div style={{ fontSize: 60, color: "#22c55e", marginBottom: 16, display: "flex", justifyContent: "center" }}>
                <FiCheckCircle />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 10 }}>Email Sent!</h3>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                We've sent a recovery link to <strong>{email}</strong>. Check your inbox or spam folder.
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{ background: "transparent", border: "1.5px solid #7c3aed", color: "#7c3aed", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                Try another email
              </button>
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: 24, color: "#666", fontSize: 14 }}>
            Remembered your password?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "#7c3aed", fontWeight: 700, cursor: "pointer" }}
            >
              Login here
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;
