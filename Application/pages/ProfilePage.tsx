import React, { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import client from "../api/client";

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { t } = useThemeStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:   user?.name   || "",
    bio:    user?.bio    || "",
    phone:  user?.phone  || "",
    avatar: user?.avatar || "",
    dob:    (user as any)?.dob || "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  // Email change state
  const [emailSection,  setEmailSection]  = useState<"idle" | "enter" | "otp">("idle");
  const [newEmail,      setNewEmail]      = useState("");
  const [emailOtp,      setEmailOtp]      = useState("");
  const [emailLoading,  setEmailLoading]  = useState(false);
  const [emailMsg,      setEmailMsg]      = useState("");
  const [emailErr,      setEmailErr]      = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile(form);
      setEditing(false);
      setSuccess("Profile updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const sendEmailOtp = async () => {
    setEmailLoading(true);
    setEmailErr("");
    try {
      await client.post("/auth/request-email-change", { newEmail });
      setEmailSection("otp");
      setEmailMsg("OTP sent to your new email. Enter it below.");
    } catch (e: any) {
      setEmailErr(e.response?.data?.message || "Failed to send OTP");
    } finally {
      setEmailLoading(false);
    }
  };

  const confirmEmailChange = async () => {
    setEmailLoading(true);
    setEmailErr("");
    try {
      const { data } = await client.post("/auth/confirm-email-change", { newEmail, code: emailOtp });
      updateProfile(data.user);
      setEmailSection("idle");
      setNewEmail("");
      setEmailOtp("");
      setSuccess("Email updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setEmailErr(e.response?.data?.message || "Verification failed");
    } finally {
      setEmailLoading(false);
    }
  };

  if (!user) return null;

  const row = (label: string, value: string) => (
    <div key={label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
      <span style={{ color: t.textMuted, fontSize: 13, minWidth: 100 }}>{label}</span>
      <span style={{ color: t.textAccent, fontSize: 14 }}>{value || "—"}</span>
    </div>
  );

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 28 }}>My Profile</h1>

        {/* Profile card */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <Avatar src={user.avatar} name={user.name} size={72} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: t.textPrimary }}>{user.name}</div>
              <div style={{ color: t.accentLight, fontSize: 14, marginTop: 2 }}>{user.role === "educator" ? "👨‍🏫 Educator" : "🎓 Student"}</div>
              <div style={{ color: t.textMuted, fontSize: 13 }}>{user.email}</div>
            </div>
          </div>

          {success && <div style={{ background: "#052e16", color: "#4ade80", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{success}</div>}
          {error && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Full Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label style={{ color: t.textAccent, fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell students about yourself..." rows={3}
                  style={{ width: "100%", background: t.bgInput, border: `1.5px solid ${t.borderLight}`, borderRadius: 10, color: t.textPrimary, padding: "10px 14px", fontSize: 15, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <Input label="Phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
              <Input label="Avatar URL" value={form.avatar} onChange={(e) => setForm(f => ({ ...f, avatar: e.target.value }))} placeholder="https://..." />
              <div>
                <label style={{ color: t.textAccent, fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Date of Birth</label>
                <input type="date" value={form.dob} onChange={(e) => setForm(f => ({ ...f, dob: e.target.value }))}
                  style={{ width: "100%", background: t.bgInput, border: `1.5px solid ${t.borderLight}`, borderRadius: 10, color: t.textPrimary, padding: "10px 14px", fontSize: 15, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={handleSave} loading={saving}>Save Changes</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {row("Email",    user.email)}
              {row("Phone",   user.phone || "")}
              {row("DOB",     (user as any).dob ? new Date((user as any).dob).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "")}
              {row("Bio",     user.bio || "")}
              {row("Role",    user.role === "educator" ? "Educator" : "Student")}
              <Button variant="secondary" onClick={() => setEditing(true)} style={{ marginTop: 16 }}>Edit Profile</Button>
            </div>
          )}
        </div>

        {/* Email change card */}
        <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 20, padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: t.textPrimary, marginBottom: 6 }}>Change Email Address</div>
          <div style={{ color: t.textMuted, fontSize: 13, marginBottom: 16 }}>
            Your current email: <span style={{ color: t.textAccent, fontWeight: 600 }}>{user.email}</span>
          </div>

          {emailErr && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{emailErr}</div>}
          {emailMsg && <div style={{ background: "rgba(34,197,94,0.08)", color: "#4ade80", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{emailMsg}</div>}

          {emailSection === "idle" && (
            <Button variant="secondary" onClick={() => setEmailSection("enter")}>Change Email</Button>
          )}

          {emailSection === "enter" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input
                label="New Email Address"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="newemail@example.com"
                type="email"
              />
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={sendEmailOtp} loading={emailLoading}>Send Verification OTP</Button>
                <Button variant="secondary" onClick={() => { setEmailSection("idle"); setEmailErr(""); setNewEmail(""); }}>Cancel</Button>
              </div>
            </div>
          )}

          {emailSection === "otp" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ color: t.textMuted, fontSize: 13 }}>Enter the 6-digit OTP sent to <strong style={{ color: t.textAccent }}>{newEmail}</strong></div>
              <Input label="OTP Code" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} placeholder="123456" maxLength={6} />
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={confirmEmailChange} loading={emailLoading}>Verify & Update Email</Button>
                <Button variant="secondary" onClick={() => { setEmailSection("enter"); setEmailErr(""); setEmailOtp(""); }}>Resend OTP</Button>
                <Button variant="secondary" onClick={() => { setEmailSection("idle"); setEmailErr(""); setEmailOtp(""); setNewEmail(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
