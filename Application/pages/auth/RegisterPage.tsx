import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { HiOutlineAcademicCap, HiOutlineUserCircle } from "react-icons/hi";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "educator">("student");
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(name, email, password, role);
      navigate(role === "educator" ? "/educator" : "/dashboard");
    } catch {}
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0914 0%, #0f0e1a 50%, #0a0914 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
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

          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "#f3f4f6", textAlign: "center", letterSpacing: -0.5 }}>Create account</h1>
          <p style={{ margin: "0 0 24px", color: "#9ca3af", textAlign: "center", fontSize: 14 }}>Join millions of learners today</p>

          {/* Role selector */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            {([
              { key: "student", label: "Student", icon: <HiOutlineAcademicCap size={18} />, desc: "I want to learn" },
              { key: "educator", label: "Educator", icon: <HiOutlineUserCircle size={18} />, desc: "I want to teach" },
            ] as const).map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                style={{
                  flex: 1, padding: "14px 12px", borderRadius: 12,
                  border: `2px solid ${role === r.key ? "#7c3aed" : "#1e1b4b"}`,
                  cursor: "pointer",
                  background: role === r.key ? "rgba(124,58,237,0.1)" : "transparent",
                  color: role === r.key ? "#a78bfa" : "#9ca3af",
                  transition: "all 0.2s",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}
              >
                {r.icon}
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{r.desc}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" minLength={6} required />
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "11px 14px", borderRadius: 10, fontSize: 13 }}>
                <span>⚠️</span> {error}
              </div>
            )}
            <Button type="submit" fullWidth loading={isLoading} size="lg" style={{ marginTop: 4 }}>Create Account</Button>
          </form>

          <p style={{ textAlign: "center", marginTop: 22, color: "#9ca3af", fontSize: 14 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
