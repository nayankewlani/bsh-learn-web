import React, { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", phone: user?.phone || "", avatar: user?.avatar || "" });
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setSaving(true);
    await updateProfile(form);
    setSaving(false);
    setEditing(false);
    setSuccess("Profile updated!");
    setTimeout(() => setSuccess(""), 3000);
  };

  if (!user) return null;

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f3f4f6", marginBottom: 28 }}>My Profile</h1>
        <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 20, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <Avatar src={user.avatar} name={user.name} size={72} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, color: "#f3f4f6" }}>{user.name}</div>
              <div style={{ color: "#a78bfa", fontSize: 14, marginTop: 2 }}>{user.role === "educator" ? "👨‍🏫 Educator" : "🎓 Student"}</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>{user.email}</div>
            </div>
          </div>

          {success && <div style={{ background: "#052e16", color: "#4ade80", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{success}</div>}

          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input label="Full Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
              <div>
                <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell students about yourself..." rows={3} style={{ width: "100%", background: "#1e1b4b", border: "1.5px solid #3730a3", borderRadius: 10, color: "#f3f4f6", padding: "10px 14px", fontSize: 15, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
              <Input label="Phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 ..." />
              <Input label="Avatar URL" value={form.avatar} onChange={(e) => setForm(f => ({ ...f, avatar: e.target.value }))} placeholder="https://..." />
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={handleSave} loading={saving}>Save Changes</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[["Email", user.email], ["Role", user.role], ["Phone", user.phone || "Not set"], ["Bio", user.bio || "No bio yet"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e1b4b" }}>
                  <span style={{ color: "#6b7280", fontSize: 13, minWidth: 80 }}>{k}</span>
                  <span style={{ color: "#c4b5fd", fontSize: 14 }}>{v}</span>
                </div>
              ))}
              <Button variant="secondary" onClick={() => setEditing(true)} style={{ marginTop: 8 }}>Edit Profile</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
