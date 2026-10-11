import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft, FiLock, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import bshLogo from "../../assets/logo-1.png";
import client from "../../api/client";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");
  const [touched, setTouched]   = useState({ pw: false, cf: false });

  const pwErr = !password ? "Password is required" : password.length < 6 ? "At least 6 characters" : "";
  const cfErr = !confirm  ? "Please confirm password" : confirm !== password ? "Passwords do not match" : "";

  const handleSubmit = async () => {
    setTouched({ pw: true, cf: true });
    if (pwErr || cfErr) return;
    if (!token) { setError("Invalid or missing reset token. Please request a new reset link."); return; }
    setLoading(true);
    setError("");
    try {
      await client.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0A0000 0%, #1A0008 40%, #200010 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, position: "relative", overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ position: "absolute", top: -100, left: -50, width: 300, height: 300, background: "radial-gradient(circle, rgba(255,30,86,0.25), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, right: -50, width: 250, height: 250, background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)", pointerEvents: "none" }} />

      <button
        onClick={() => navigate("/login")}
        style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FF6B8A", padding: "8px 16px", borderRadius: 50, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, backdropFilter: "blur(10px)" }}
      >
        <FiArrowLeft size={14} /> Back to Login
      </button>

      <div style={{ width: "100%", maxWidth: 420, zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={bshLogo} alt="BSH Healers" style={{ height: 64, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(255,30,86,0.4))" }} />
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: "40px 36px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>

          {!success ? (
            <>
              <button onClick={() => navigate("/login")} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <FiArrowLeft size={16} color="#555" />
              </button>

              <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center" }}>Set New Password</h2>
              <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14, textAlign: "center", lineHeight: 1.5 }}>
                Choose a strong password for your BSH Healers account.
              </p>

              {!token && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <FiAlertCircle size={16} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ margin: 0, color: "#ef4444", fontSize: 13 }}>Invalid reset link. Please request a new password reset.</p>
                </div>
              )}

              {error && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <FiAlertCircle size={16} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ margin: 0, color: "#ef4444", fontSize: 13 }}>{error}</p>
                </div>
              )}

              {[
                { label: "New Password", value: password, onChange: (v: string) => setPassword(v), err: touched.pw && pwErr, onBlur: () => setTouched(t => ({ ...t, pw: true })) },
                { label: "Confirm Password", value: confirm, onChange: (v: string) => setConfirm(v), err: touched.cf && cfErr, onBlur: () => setTouched(t => ({ ...t, cf: true })) },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#555" }}>{f.label}</label>
                  <div style={{ display: "flex", alignItems: "center", background: "#f9fafb", border: `1.5px solid ${f.err ? "#ef4444" : "#e5e7eb"}`, borderRadius: 12, padding: "12px 15px" }}>
                    <FiLock size={16} color="#9ca3af" style={{ marginRight: 10 }} />
                    <input
                      type="password"
                      value={f.value}
                      onChange={e => { f.onChange(e.target.value); }}
                      onBlur={f.onBlur}
                      placeholder="••••••••"
                      style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: 15, color: "#111" }}
                    />
                  </div>
                  {f.err && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 5, marginLeft: 4 }}>{f.err}</p>}
                </div>
              ))}

              <button
                onClick={handleSubmit}
                disabled={loading || !token}
                style={{ width: "100%", padding: 14, background: (loading || !token) ? "#9ca3af" : "linear-gradient(135deg,#FF1E56,#D4003F)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 16, cursor: (loading || !token) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 8 }}
              >
                {loading
                  ? <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  : "Reset Password"
                }
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 60, color: "#22c55e", marginBottom: 16, display: "flex", justifyContent: "center" }}>
                <FiCheckCircle />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 10 }}>Password Reset!</h3>
              <p style={{ color: "#666", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Your password has been successfully updated. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={{ background: "linear-gradient(135deg,#FF1E56,#D4003F)", border: "none", borderRadius: 12, color: "#fff", padding: "13px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
              >
                Go to Login
              </button>
            </div>
          )}

          {!success && (
            <p style={{ textAlign: "center", marginTop: 20, color: "#666", fontSize: 14 }}>
              Don't have a link?{" "}
              <span onClick={() => navigate("/forgot-password")} style={{ color: "#FF1E56", fontWeight: 700, cursor: "pointer" }}>
                Request one here
              </span>
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResetPasswordPage;
