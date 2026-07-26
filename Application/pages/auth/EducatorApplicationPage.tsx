import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeStore } from "../../stores/themeStore";
import { FiArrowLeft, FiCheckCircle, FiUser, FiMail, FiPhone, FiLinkedin } from "react-icons/fi";
import { HiOutlineAcademicCap } from "react-icons/hi";
import bshLogo from "../../assets/logo-1.png";
import client from "../../api/client";

const EducatorApplicationPage: React.FC = () => {
  const { isDark } = useThemeStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", expertise: "", experience: "", bio: "", linkedIn: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.post("/auth/apply-educator", form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 14px", border: "1.5px solid #eee", borderRadius: 12,
    fontSize: 15, background: "#fdfdfd", color: "#111", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6, display: "block" };

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark
        ? "linear-gradient(135deg,#050412,#0f0e1a,#1a0a2e)"
        : "linear-gradient(135deg,#f4f3ff,#ede9fe,#ddd6fe)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px",
    }}>
      <button onClick={() => navigate(-1)} style={{ position: "fixed", top: 24, left: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#c4b5fd", padding: "8px 16px", borderRadius: 50, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
        <FiArrowLeft size={14} /> Back
      </button>

      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={bshLogo} alt="BSH Healers" style={{ height: 56, objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(124,58,237,0.4))" }} />
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: "36px 32px", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <FiCheckCircle size={56} color="#16a34a" style={{ marginBottom: 16 }} />
              <h2 style={{ margin: "0 0 10px", color: "#111", fontSize: 22, fontWeight: 800 }}>Application Submitted!</h2>
              <p style={{ color: "#555", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                Thank you for applying to join BSH Healers as an educator. Our team will review your application and reach out to you at <strong>{form.email}</strong>.
              </p>
              <button onClick={() => navigate("/login")} style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <HiOutlineAcademicCap size={26} color="#7c3aed" />
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Join as Educator</h1>
              </div>
              <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14 }}>Fill in your details and we'll review your application.</p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input value={form.name} onChange={set("name")} required placeholder="Your full name" style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input type="email" value={form.email} onChange={set("email")} required placeholder="your@email.com" style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                  </div>
                  <div>
                    <label style={labelStyle}>LinkedIn Profile</label>
                    <input value={form.linkedIn} onChange={set("linkedIn")} placeholder="linkedin.com/in/..." style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Area of Expertise *</label>
                  <input value={form.expertise} onChange={set("expertise")} required placeholder="e.g. Clinical Hypnotherapy, NLP, Past Life Regression" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                </div>

                <div>
                  <label style={labelStyle}>Years of Experience *</label>
                  <input value={form.experience} onChange={set("experience")} required placeholder="e.g. 5 years of clinical practice" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                </div>

                <div>
                  <label style={labelStyle}>Bio / Why do you want to teach here? *</label>
                  <textarea value={form.bio} onChange={set("bio")} required rows={4} placeholder="Tell us about yourself, your teaching philosophy, and what you'd like to offer students..."
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#eee"; e.target.style.boxShadow = "none"; }} />
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  style={{ width: "100%", padding: 15, background: loading ? "#9ca3af" : "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {loading
                    ? <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    : "Submit Application"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default EducatorApplicationPage;
