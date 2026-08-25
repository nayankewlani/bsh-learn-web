import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import { FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle, FiMail } from "react-icons/fi";
import { HiOutlineAcademicCap } from "react-icons/hi";
import bshLogo from "../../assets/logo-1.png";
import client from "../../api/client";

const COUNTRY_CODES = [
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+1",   flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44",  flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+64",  flag: "🇳🇿", name: "New Zealand" },
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+31",  flag: "🇳🇱", name: "Netherlands" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+66",  flag: "🇹🇭", name: "Thailand" },
  { code: "+62",  flag: "🇮🇩", name: "Indonesia" },
  { code: "+63",  flag: "🇵🇭", name: "Philippines" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
];

type OtpState = "idle" | "sending" | "sent" | "verifying" | "verified";

const RegisterPage: React.FC = () => {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [successAnim, setSuccessAnim] = useState(false);

  const [otpState, setOtpState]             = useState<OtpState>("idle");
  const [otpCode, setOtpCode]               = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otpError, setOtpError]             = useState("");
  const [cooldown, setCooldown]             = useState(0);
  const [otpEmail, setOtpEmail]             = useState(""); // email used when OTP was sent

  const { register, isLoading, error, clearError } = useAuthStore();
  const { isDark } = useThemeStore();
  const navigate    = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // Reset OTP state if user changes email after OTP was sent
  useEffect(() => {
    if (otpEmail && email.toLowerCase().trim() !== otpEmail && otpState !== "idle") {
      setOtpState("idle");
      setOtpCode("");
      setVerificationId("");
      setOtpError("");
      setOtpEmail("");
    }
  }, [email, otpEmail, otpState]);

  const startCooldown = useCallback(() => {
    setCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSendOTP = async () => {
    setOtpError("");
    const norm = email.toLowerCase().trim();
    if (!norm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
      setOtpError("Enter a valid email address above first");
      return;
    }
    setOtpState("sending");
    try {
      await client.post("/auth/send-otp", { email: norm });
      setOtpEmail(norm);
      setOtpState("sent");
      setOtpCode("");
      startCooldown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to send OTP";
      setOtpError(msg);
      setOtpState("idle");
    }
  };

  const handleVerifyOTP = async () => {
    setOtpError("");
    if (otpCode.length !== 6) { setOtpError("Enter the 6-digit code"); return; }
    setOtpState("verifying");
    try {
      const { data } = await client.post("/auth/verify-otp", { email: otpEmail, code: otpCode });
      setVerificationId(data.verificationId);
      setOtpState("verified");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Verification failed";
      setOtpError(msg);
      setOtpState("sent");
    }
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setOtpState("idle");
    setOtpCode("");
    setOtpError("");
    setOtpEmail("");
    handleSendOTP();
  };

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
    if (otpState !== "verified") {
      setOtpError("Please verify your email before registering");
      return;
    }
    try {
      const fullPhone = phone ? `${countryCode.code}${phone}` : "";
      await register(name, email, password, fullPhone, verificationId, "student");
      setSuccessAnim(true);
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch {}
  };

  const strengthColors = ["", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 14px", border: "1.5px solid #eee",
    borderRadius: 12, fontSize: 15, background: "#fdfdfd", color: "#111",
    outline: "none", boxSizing: "border-box", transition: "0.2s",
  };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#FF1E56";
    e.target.style.boxShadow   = "0 0 0 4px rgba(255,30,86,0.1)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "#eee";
    e.target.style.boxShadow   = "none";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: isDark
        ? "linear-gradient(135deg, #0A0000 0%, #1A0008 40%, #200010 100%)"
        : "linear-gradient(135deg, #f4f3ff 0%, #ede9fe 40%, #ddd6fe 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", position: "relative",
    }}>
      <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(255,30,86,0.12), transparent 70%)", pointerEvents: "none" }} />

      <button onClick={() => navigate(-1)} style={{ position: "absolute", top: 24, left: 24, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#FF6B8A", padding: "8px 16px", borderRadius: 50, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, backdropFilter: "blur(10px)", transition: "0.2s" }}>
        <FiArrowLeft size={14} /> Back
      </button>

      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={bshLogo} alt="BSH Healers" style={{ height: 58, width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 20px rgba(255,30,86,0.4))", animation: "float 4s ease-in-out infinite" }} />
        </div>

        <div style={{ background: "#fff", borderRadius: 24, padding: "36px 32px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#111", textAlign: "center" }}>
            {successAnim ? "Welcome to BSH Healers! 🎉" : "Create Account"}
          </h1>
          <p style={{ margin: "0 0 22px", color: "#666", textAlign: "center", fontSize: 14 }}>Begin your journey today</p>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(255,30,86,0.06)", border: "1.5px solid rgba(255,30,86,0.2)", borderRadius: 12, marginBottom: 18 }}>
            <HiOutlineAcademicCap size={22} color="#FF1E56" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#FF1E56" }}>Signing up as Student</div>
              <div style={{ fontSize: 11, color: "#888" }}>Access courses, live sessions & more</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Name */}
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />

            {/* Email */}
            <input
              type="email" placeholder="Email Address" value={email}
              onChange={e => setEmail(e.target.value)} required
              disabled={otpState === "verified"}
              style={{ ...inputStyle, borderColor: otpState === "verified" ? "#16a34a" : "#eee", background: otpState === "verified" ? "#f0fdf4" : "#fdfdfd" }}
              onFocus={focusStyle} onBlur={blurStyle}
            />

            {/* Email OTP Verification Box */}
            <div style={{
              border: `2px solid ${otpState === "verified" ? "#16a34a" : "#FF1E56"}`,
              borderRadius: 14,
              padding: "14px 16px",
              background: otpState === "verified" ? "#f0fdf4" : "rgba(255,30,86,0.03)",
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: otpState === "verified" ? 8 : 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: otpState === "verified" ? "#16a34a" : "#FF1E56" }}>
                  {otpState === "verified" ? <FiCheckCircle size={15} /> : <FiMail size={14} />}
                  {otpState === "verified" ? "Email Verified" : "Verify Email Address"}
                  {otpState !== "verified" && <span style={{ fontWeight: 400, fontSize: 11, color: "#ef4444" }}>(required)</span>}
                </div>
                {(otpState === "idle" || otpState === "sending") && (
                  <span style={{ fontSize: 11, color: "#888" }}>Step 1 of 2</span>
                )}
                {(otpState === "sent" || otpState === "verifying") && (
                  <span style={{ fontSize: 11, color: "#888" }}>Step 2 of 2</span>
                )}
              </div>

              {/* Verified state */}
              {otpState === "verified" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a", fontSize: 13, fontWeight: 700 }}>
                  <FiCheckCircle size={16} /> {otpEmail} verified successfully!
                </div>
              )}

              {/* Idle — Send OTP button */}
              {otpState === "idle" && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  style={{
                    width: "100%", padding: "13px 14px",
                    background: "linear-gradient(135deg,#FF1E56,#D4003F)",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  {email.trim() ? `Send OTP to ${email.trim()}` : "Send verification code to email"}
                </button>
              )}

              {/* Sending spinner */}
              {otpState === "sending" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#FF1E56", fontSize: 13, padding: "10px 0" }}>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,30,86,0.3)", borderTopColor: "#FF1E56", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  Sending OTP to {email.trim()}…
                </div>
              )}

              {/* OTP input */}
              {(otpState === "sent" || otpState === "verifying") && (
                <div>
                  <div style={{ fontSize: 12, color: "#555", marginBottom: 8, fontWeight: 500 }}>
                    Check your inbox — code sent to <strong style={{ color: "#FF1E56" }}>{otpEmail}</strong>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      autoFocus
                      type="text" placeholder="• • • • • •" value={otpCode} maxLength={6}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      style={{ ...inputStyle, flex: 1, letterSpacing: 6, textAlign: "center", fontSize: 22, fontWeight: 800, borderColor: "#ddd6fe" }}
                      onFocus={e => { e.target.style.borderColor = "#FF1E56"; e.target.style.boxShadow = "0 0 0 3px rgba(255,30,86,0.12)"; }}
                      onBlur={e => { e.target.style.borderColor = "#ddd6fe"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button" onClick={handleVerifyOTP}
                      disabled={otpCode.length !== 6 || otpState === "verifying"}
                      style={{ padding: "12px 20px", background: otpCode.length === 6 ? "linear-gradient(135deg,#FF1E56,#D4003F)" : "transparent", color: otpCode.length === 6 ? "#fff" : "#FF1E56", border: `2px solid ${otpCode.length === 6 ? "transparent" : "#FF6B8A"}`, borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: otpCode.length === 6 ? "pointer" : "default", whiteSpace: "nowrap", opacity: otpCode.length === 6 ? 1 : 0.6 }}>
                      {otpState === "verifying" ? "…" : "Verify"}
                    </button>
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#888" }}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't receive it?"}
                    </span>
                    <button type="button" onClick={handleResend} disabled={cooldown > 0}
                      style={{ background: "none", border: "none", color: cooldown > 0 ? "#ccc" : "#FF1E56", fontSize: 12, fontWeight: 700, cursor: cooldown > 0 ? "default" : "pointer", padding: 0, textDecoration: cooldown > 0 ? "none" : "underline" }}>
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              {otpError && (
                <div style={{ marginTop: 8, color: "#dc2626", fontSize: 12, padding: "8px 12px", background: "rgba(239,68,68,0.06)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.15)" }}>
                  ⚠️ {otpError}
                </div>
              )}
            </div>

            {/* Phone (collected, no OTP required) */}
            <div ref={dropdownRef} style={{ display: "flex", gap: 8, position: "relative" }}>
              <button type="button" onClick={() => setShowDropdown(!showDropdown)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 12px", border: "1.5px solid #eee", borderRadius: 12, background: "#fdfdfd", color: "#111", cursor: "pointer", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", minWidth: 90 }}>
                {countryCode.flag} {countryCode.code}
              </button>
              {showDropdown && (
                <div style={{ position: "absolute", top: 52, left: 0, background: "#fff", border: "1px solid #eee", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, minWidth: 220, maxHeight: 280, overflowY: "auto" }}>
                  {COUNTRY_CODES.map(c => (
                    <div key={c.code} onClick={() => { setCountryCode(c); setShowDropdown(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", fontSize: 14 }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f5f0ff")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span>{c.flag}</span>
                      <span style={{ flex: 1, color: "#333" }}>{c.name}</span>
                      <span style={{ color: "#999" }}>{c.code}</span>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="tel" placeholder="Phone number (required)"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                required
                style={{ ...inputStyle, flex: 1 }}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} placeholder="Password (min. 6 chars)" value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordStrength(calcStrength(e.target.value)); }}
                  required minLength={6}
                  style={{ ...inputStyle, padding: "13px 44px 13px 14px" }}
                  onFocus={focusStyle} onBlur={blurStyle}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#999", cursor: "pointer" }}>
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
              type="submit"
              disabled={isLoading || successAnim || otpState !== "verified"}
              style={{
                width: "100%", padding: 15,
                background: successAnim ? "#16a34a" : isLoading ? "#FF1E56" : otpState !== "verified" ? "#6b21a8" : "linear-gradient(135deg,#FF1E56,#D4003F)",
                color: "#fff",
                border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16,
                cursor: (isLoading || successAnim || otpState !== "verified") ? "not-allowed" : "pointer",
                opacity: otpState !== "verified" && !successAnim && !isLoading ? 0.55 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "0.3s",
              }}
            >
              {successAnim ? (
                <><FiCheckCircle size={18} /> Registered!</>
              ) : isLoading ? (
                <div style={{ width: 20, height: 20, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : otpState !== "verified" ? (
                <><FiMail size={16} /> Verify Email First to Register</>
              ) : "Register Now"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 18, color: "#666", fontSize: 14 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#FF1E56", fontWeight: 700, textDecoration: "none" }}>Log In</Link>
          </p>

          <div style={{ marginTop: 14, padding: "14px", background: "#f9f7ff", borderRadius: 12, border: "1px dashed rgba(255,30,86,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>Want to teach on BSH Healers?</div>
            <button type="button" onClick={() => navigate("/apply-educator")}
              style={{ background: "linear-gradient(135deg,#FF1E56,#D4003F)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <HiOutlineAcademicCap size={16} /> Request to Join as Educator
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RegisterPage;
