import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const ScheduleLiveClassPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", scheduledAt: "", duration: "60" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await client.post("/live-classes", {
        ...form,
        duration: Number(form.duration),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      navigate("/live");
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to schedule class");
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "48px 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <button
          onClick={() => navigate("/live")}
          style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontSize: 14, marginBottom: 24, padding: 0 }}
        >
          ← Back to Live Classes
        </button>
        <h1 style={{ color: "#f3f4f6", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>Schedule Live Class</h1>
        <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 32 }}>Set up a live session for your students</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Input label="Class Title" value={form.title} onChange={set("title")} placeholder="e.g. JEE Physics — Mechanics" required />

          <div>
            <label style={{ display: "block", color: "#c4b5fd", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="What will you cover in this class?"
              rows={3}
              style={{
                width: "100%", background: "#13122a", border: "1.5px solid #1e1b4b", borderRadius: 10,
                color: "#f3f4f6", padding: "10px 14px", fontSize: 14, resize: "vertical", boxSizing: "border-box",
                outline: "none", fontFamily: "inherit",
              }}
            />
          </div>

          <Input
            label="Scheduled Date & Time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={set("scheduledAt")}
            required
          />

          <Input
            label="Duration (minutes)"
            type="number"
            value={form.duration}
            onChange={set("duration")}
            placeholder="60"
            required
          />

          {error && <div style={{ color: "#f87171", fontSize: 14 }}>{error}</div>}

          <Button type="submit" fullWidth size="lg" loading={loading}>Schedule Class</Button>
        </form>
      </div>
    </div>
  );
};

export default ScheduleLiveClassPage;
