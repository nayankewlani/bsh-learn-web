import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      background: "linear-gradient(135deg, #0a0914 0%, #0f0e1a 50%, #0a0914 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Card */}
        <div style={{
          background: "#13122a", border: "1px solid #1e1b4b",
          borderRadius: 22, padding: "44px 40px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#fff", fontSize: 14, boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}>BSH</div>
            <span style={{ fontWeight: 800, fontSize: 22, color: "#f3f4f6" }}>Learn</span>
          </Link>

          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#f3f4f6", textAlign: "center", letterSpacing: -0.5 }}>Welcome back</h1>
          <p style={{ margin: "0 0 30px", color: "#9ca3af", textAlign: "center", fontSize: 14 }}>Log in to continue learning</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <HiOutlineMail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", zIndex: 1, pointerEvents: "none", marginTop: 12 }} />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div style={{ position: "relative" }}>
              <HiOutlineLockClosed size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", zIndex: 1, pointerEvents: "none", marginTop: 12 }} />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "11px 14px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠️</span> {error}
              </div>
            )}
            <Button type="submit" fullWidth loading={isLoading} size="lg" style={{ marginTop: 6 }}>Log In</Button>
          </form>

          <p style={{ textAlign: "center", marginTop: 22, color: "#9ca3af", fontSize: 14 }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
