import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import client from "../api/client";

const CATEGORIES = ["Advance Hypnosis", "Hypnosis 2.0", "Art of shadow work", "Reiki", "Akashik"];
const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Bengali", "Marathi"];

const STEPS = ["Basic Info", "Details", "Pricing", "Review"];

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", category: "Mathematics", subcategory: "", language: "Hindi",
    level: "beginner", price: "0", discountPrice: "", thumbnail: "",
    requirements: [""], objectives: [""], tags: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setList = (k: "requirements" | "objectives", i: number, v: string) => {
    const arr = [...form[k]]; arr[i] = v; setForm((f) => ({ ...f, [k]: arr }));
  };
  const addItem = (k: "requirements" | "objectives") => setForm((f) => ({ ...f, [k]: [...f[k], ""] }));
  const removeItem = (k: "requirements" | "objectives", i: number) => setForm((f) => ({ ...f, [k]: f[k].filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price) * 100,
        discountPrice: form.discountPrice ? Number(form.discountPrice) * 100 : undefined,
        requirements: form.requirements.filter(Boolean),
        objectives: form.objectives.filter(Boolean),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const { data } = await client.post("/courses", payload);
      navigate(`/educator/courses/${data.course._id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to create course");
    } finally { setLoading(false); }
  };

  const inputStyle = { background: "#1e1b4b", border: "1.5px solid #3730a3", borderRadius: 10, color: "#f3f4f6", padding: "10px 14px", fontSize: 15, width: "100%", boxSizing: "border-box" as const };
  const textareaStyle = { ...inputStyle, resize: "vertical" as const, minHeight: 100, fontFamily: "inherit" };

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f3f4f6", marginBottom: 8 }}>Create New Course</h1>
        <div style={{ display: "flex", gap: 0, marginBottom: 32, borderRadius: 12, overflow: "hidden", border: "1px solid #1e1b4b" }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i <= step && setStep(i)} style={{ flex: 1, padding: "12px", border: "none", cursor: i <= step ? "pointer" : "default", fontWeight: 600, fontSize: 13, background: i === step ? "linear-gradient(135deg,#7c3aed,#5b21b6)" : i < step ? "#1e1b4b" : "#13122a", color: i === step ? "#fff" : i < step ? "#a78bfa" : "#4b5563" }}>
              {i < step ? "✓ " : ""}{s}
            </button>
          ))}
        </div>

        <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 28 }}>
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Input label="Course Title *" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g., Complete JEE Mathematics" />
              <div>
                <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Description *</label>
                <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe what students will learn..." style={textareaStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Category</label>
                  <select value={form.category} onChange={(e) => set("category", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Language</label>
                  <select value={form.language} onChange={(e) => set("language", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 6 }}>Level</label>
                <select value={form.level} onChange={(e) => set("level", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  {["beginner", "intermediate", "advanced"].map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
              <Input label="Thumbnail URL" value={form.thumbnail} onChange={(e) => set("thumbnail", e.target.value)} placeholder="https://..." />
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 10 }}>What students will learn</label>
                {form.objectives.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input value={o} onChange={(e) => setList("objectives", i, e.target.value)} placeholder={`Objective ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
                    {form.objectives.length > 1 && <button onClick={() => removeItem("objectives", i)} style={{ background: "#450a0a", border: "none", color: "#f87171", borderRadius: 8, padding: "0 12px", cursor: "pointer" }}>✕</button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addItem("objectives")}>+ Add Objective</Button>
              </div>
              <div>
                <label style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 500, display: "block", marginBottom: 10 }}>Requirements</label>
                {form.requirements.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input value={r} onChange={(e) => setList("requirements", i, e.target.value)} placeholder={`Requirement ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
                    {form.requirements.length > 1 && <button onClick={() => removeItem("requirements", i)} style={{ background: "#450a0a", border: "none", color: "#f87171", borderRadius: 8, padding: "0 12px", cursor: "pointer" }}>✕</button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addItem("requirements")}>+ Add Requirement</Button>
              </div>
              <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="JEE, Maths, Algebra, Calculus" />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ background: "#0f0e1a", borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <h3 style={{ color: "#c4b5fd", margin: "0 0 12px", fontSize: 14 }}>Pricing Guide</h3>
                {[["Free", "0", "Great for growing your audience"], ["Basic", "499", "Single course access"], ["Pro", "999", "Popular pricing point"], ["Premium", "1999", "Advanced content"]].map(([label, price, desc]) => (
                  <div key={label} onClick={() => set("price", price)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", cursor: "pointer", borderBottom: "1px solid #1e1b4b" }}>
                    <span style={{ color: "#c4b5fd", fontSize: 13 }}>{label}</span>
                    <span style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13 }}>₹{price}</span>
                  </div>
                ))}
              </div>
              <Input label="Course Price (₹)" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0 for free" />
              <Input label="Discount Price (₹, optional)" type="number" value={form.discountPrice} onChange={(e) => set("discountPrice", e.target.value)} placeholder="Leave empty for no discount" />
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ color: "#f3f4f6", margin: 0 }}>Review Your Course</h3>
              {[["Title", form.title], ["Category", form.category], ["Language", form.language], ["Level", form.level], ["Price", form.price === "0" ? "Free" : `₹${form.price}`]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #1e1b4b" }}>
                  <span style={{ color: "#9ca3af", fontSize: 14, minWidth: 100 }}>{k}</span>
                  <span style={{ color: "#f3f4f6", fontSize: 14, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              {error && <div style={{ background: "#450a0a", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
            {step > 0 ? <Button variant="secondary" onClick={() => setStep(s => s - 1)}>← Back</Button> : <div />}
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && (!form.title || !form.description)}>Next →</Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading}>Create Course</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;
