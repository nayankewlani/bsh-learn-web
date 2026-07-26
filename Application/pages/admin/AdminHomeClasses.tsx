import React, { useEffect, useRef, useState } from "react";
import client from "../../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HomeClass {
  _id: string;
  title: string;
  educator: string;
  subject: string;
  subjectColor: string;
  lang: string;
  thumbnailUrl: string;
  recordingUrl: string;
  views: string;
  bgColor: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
}

const BLANK: Omit<HomeClass, "_id" | "createdAt"> = {
  title: "", educator: "", subject: "", subjectColor: "#7c3aed",
  lang: "Hindi", thumbnailUrl: "", recordingUrl: "",
  views: "0", bgColor: "#1e1b4b", isFeatured: false, isActive: true, order: 0,
};

const SUBJECTS = [
  "Advance Hypnosis", "Shadow Work", "Reiki", "Autism Healing",
  "Corporate Build-up", "Akashik Records", "Vedic Astrology", "Numerology", "Other",
];

const LANGS = ["Hindi", "English", "Hindi/English"];

// ── Main Component ─────────────────────────────────────────────────────────────

const AdminHomeClasses: React.FC = () => {
  const [classes, setClasses]         = useState<HomeClass[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"all" | "featured">("all");
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<HomeClass | null>(null);
  const [form, setForm]               = useState(BLANK);
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [error, setError]             = useState("");
  const [thumbUploading, setThumbUploading]   = useState(false);
  const [recUploading, setRecUploading]       = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);
  const recRef   = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    client.get("/home-classes/admin")
      .then(r => setClasses((r.data as any).classes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(BLANK); setError(""); setShowModal(true); };
  const openEdit = (cls: HomeClass) => {
    setEditing(cls);
    setForm({ title: cls.title, educator: cls.educator, subject: cls.subject, subjectColor: cls.subjectColor, lang: cls.lang, thumbnailUrl: cls.thumbnailUrl, recordingUrl: cls.recordingUrl, views: cls.views, bgColor: cls.bgColor, isFeatured: cls.isFeatured, isActive: cls.isActive, order: cls.order });
    setError("");
    setShowModal(true);
  };

  const uploadFile = async (file: File, type: "thumbnail" | "recording") => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await client.post("/home-classes/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return (r.data as any).url as string;
  };

  const handleThumbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const url = await uploadFile(file, "thumbnail");
      setForm(f => ({ ...f, thumbnailUrl: url }));
    } catch { setError("Thumbnail upload failed"); }
    finally { setThumbUploading(false); }
  };

  const handleRecFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRecUploading(true);
    try {
      const url = await uploadFile(file, "recording");
      setForm(f => ({ ...f, recordingUrl: url }));
    } catch { setError("Recording upload failed"); }
    finally { setRecUploading(false); }
  };

  const save = async () => {
    if (!form.title.trim() || !form.educator.trim() || !form.subject.trim()) {
      setError("Title, Educator and Subject are required"); return;
    }
    setSaving(true); setError("");
    try {
      if (editing) {
        await client.patch(`/home-classes/admin/${editing._id}`, form);
      } else {
        await client.post("/home-classes/admin", form);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || "Save failed");
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    setDeleting(id);
    try { await client.delete(`/home-classes/admin/${id}`); load(); }
    catch { alert("Delete failed"); }
    finally { setDeleting(null); }
  };

  const toggleField = async (cls: HomeClass, field: "isFeatured" | "isActive") => {
    setToggling(cls._id + field);
    try {
      await client.patch(`/home-classes/admin/${cls._id}`, { [field]: !cls[field] });
      load();
    } catch { alert("Update failed"); }
    finally { setToggling(null); }
  };

  const displayed = tab === "featured" ? classes.filter(c => c.isFeatured) : classes;

  // ── Pill toggle ───────────────────────────────────────────────────────────────
  const Pill = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: "4px 12px", borderRadius: 50, border: on ? "1.5px solid #7c3aed" : "1.5px solid #374151", background: on ? "rgba(124,58,237,0.18)" : "transparent", color: on ? "#a78bfa" : "#9ca3af", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
      {label}
    </button>
  );

  // ── Toggle switch ─────────────────────────────────────────────────────────────
  const Toggle = ({ on, loading: tog, onClick, greenLabel, offLabel }: { on: boolean; loading: boolean; onClick: () => void; greenLabel: string; offLabel: string }) => (
    <button onClick={onClick} disabled={tog} style={{ padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, border: "none", cursor: tog ? "wait" : "pointer", background: on ? "rgba(22,163,74,0.18)" : "rgba(100,100,100,0.18)", color: on ? "#4ade80" : "#9ca3af", transition: "all 0.15s" }}>
      {tog ? "..." : on ? greenLabel : offLabel}
    </button>
  );

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", margin: 0 }}>Home Free Classes</h1>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: "4px 0 0" }}>
            Manage class cards shown on the Home page — Most Engaging ({classes.filter(c => c.isFeatured && c.isActive).length} featured) &amp; By Subject sections
          </p>
        </div>
        <button onClick={openAdd}
          style={{ background: "#7c3aed", border: "none", color: "#fff", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          + Add New Class
        </button>
      </div>

      {/* Tab pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Pill on={tab === "all"} label={`All (${classes.length})`} onClick={() => setTab("all")} />
        <Pill on={tab === "featured"} label={`⭐ Most Engaging — Featured (${classes.filter(c => c.isFeatured).length})`} onClick={() => setTab("featured")} />
      </div>

      {/* Info banner */}
      <div style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#c4b5fd", lineHeight: 1.6 }}>
        <strong>⭐ Featured classes</strong> appear in the <em>"Most Engaging Spiritual Classes"</em> row (top 8 shown). All active classes appear in the <em>"Classes by BSH Subjects"</em> filtered section. Recording URLs can be YouTube, Google Drive, or any direct video link — users click to watch.
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ color: "#9ca3af", textAlign: "center", padding: 48 }}>Loading...</div>
      ) : displayed.length === 0 ? (
        <div style={{ color: "#9ca3af", textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#d1d5db" }}>No classes yet</p>
          <p style={{ fontSize: 13 }}>Click "Add New Class" to create your first class card.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1f2937" }}>
                {["", "Title & Educator", "Subject", "Lang", "Recording", "Views", "Featured", "Active", "Order", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(cls => (
                <tr key={cls._id} style={{ borderBottom: "1px solid #111827", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#0f172a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                  {/* Thumbnail */}
                  <td style={{ padding: "12px 12px", width: 56 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: cls.bgColor || "#1e1b4b", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {cls.thumbnailUrl ? (
                        <img src={cls.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>🎬</span>
                      )}
                    </div>
                  </td>

                  {/* Title */}
                  <td style={{ padding: "12px 12px", maxWidth: 260 }}>
                    <div style={{ color: "#f3f4f6", fontWeight: 600, fontSize: 13, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cls.title}</div>
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>{cls.educator}</div>
                  </td>

                  {/* Subject */}
                  <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ background: `${cls.subjectColor}22`, color: cls.subjectColor, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{cls.subject}</span>
                  </td>

                  {/* Lang */}
                  <td style={{ padding: "12px 12px", color: "#9ca3af", fontSize: 12, whiteSpace: "nowrap" }}>{cls.lang}</td>

                  {/* Recording */}
                  <td style={{ padding: "12px 12px", maxWidth: 180 }}>
                    {cls.recordingUrl ? (
                      <a href={cls.recordingUrl} target="_blank" rel="noopener noreferrer"
                        style={{ color: "#7c3aed", fontSize: 12, textDecoration: "underline", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                        ▶ {cls.recordingUrl.includes("youtu") ? "YouTube" : cls.recordingUrl.includes("drive") ? "Drive" : "Video link"}
                      </a>
                    ) : (
                      <span style={{ color: "#4b5563", fontSize: 12 }}>— no recording</span>
                    )}
                  </td>

                  {/* Views */}
                  <td style={{ padding: "12px 12px", color: "#d1d5db", fontSize: 13 }}>👁 {cls.views}</td>

                  {/* Featured */}
                  <td style={{ padding: "12px 12px" }}>
                    <Toggle on={cls.isFeatured} loading={toggling === cls._id + "isFeatured"} onClick={() => toggleField(cls, "isFeatured")} greenLabel="⭐ Featured" offLabel="Not featured" />
                  </td>

                  {/* Active */}
                  <td style={{ padding: "12px 12px" }}>
                    <Toggle on={cls.isActive} loading={toggling === cls._id + "isActive"} onClick={() => toggleField(cls, "isActive")} greenLabel="✓ Active" offLabel="Hidden" />
                  </td>

                  {/* Order */}
                  <td style={{ padding: "12px 12px", color: "#9ca3af", fontSize: 13 }}>{cls.order}</td>

                  {/* Actions */}
                  <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(cls)}
                      style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6 }}>
                      Edit
                    </button>
                    <button onClick={() => del(cls._id)} disabled={deleting === cls._id}
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "5px 12px", borderRadius: 6, cursor: deleting === cls._id ? "wait" : "pointer", fontSize: 12, fontWeight: 600 }}>
                      {deleting === cls._id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add/Edit Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ color: "#f3f4f6", fontSize: 18, fontWeight: 800, margin: 0 }}>{editing ? "Edit Class" : "Add New Class"}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 18 }}>{error}</div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Title */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelSt}>Class Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Deep Trance Induction — Level 1 Mastery"
                  style={inputSt} />
              </div>

              {/* Educator */}
              <div>
                <label style={labelSt}>Educator Name *</label>
                <input value={form.educator} onChange={e => setForm(f => ({ ...f, educator: e.target.value }))}
                  placeholder="e.g. Master Pradeep"
                  style={inputSt} />
              </div>

              {/* Subject */}
              <div>
                <label style={labelSt}>Subject *</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inputSt}>
                  <option value="">— Select Subject —</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Subject Color */}
              <div>
                <label style={labelSt}>Subject Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="color" value={form.subjectColor} onChange={e => setForm(f => ({ ...f, subjectColor: e.target.value }))}
                    style={{ width: 44, height: 38, borderRadius: 6, border: "1px solid #374151", background: "none", cursor: "pointer", padding: 3 }} />
                  <input value={form.subjectColor} onChange={e => setForm(f => ({ ...f, subjectColor: e.target.value }))}
                    style={{ ...inputSt, flex: 1 }} placeholder="#7c3aed" />
                </div>
              </div>

              {/* Language */}
              <div>
                <label style={labelSt}>Language</label>
                <select value={form.lang} onChange={e => setForm(f => ({ ...f, lang: e.target.value }))} style={inputSt}>
                  {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Views */}
              <div>
                <label style={labelSt}>View Count</label>
                <input value={form.views} onChange={e => setForm(f => ({ ...f, views: e.target.value }))}
                  placeholder="e.g. 1.2K" style={inputSt} />
              </div>

              {/* BG Color */}
              <div>
                <label style={labelSt}>Card Background Color</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="color" value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                    style={{ width: 44, height: 38, borderRadius: 6, border: "1px solid #374151", background: "none", cursor: "pointer", padding: 3 }} />
                  <input value={form.bgColor} onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                    style={{ ...inputSt, flex: 1 }} placeholder="#1e1b4b" />
                </div>
              </div>

              {/* Order */}
              <div>
                <label style={labelSt}>Display Order</label>
                <input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  placeholder="0 = first" style={inputSt} />
              </div>

              {/* Thumbnail */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelSt}>Thumbnail Image</label>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                    placeholder="Paste image URL (or upload below)"
                    style={{ ...inputSt, flex: "1 1 220px" }} />
                  <button type="button" onClick={() => thumbRef.current?.click()} disabled={thumbUploading}
                    style={{ padding: "9px 16px", borderRadius: 7, border: "1.5px solid #374151", background: "#1f2937", color: "#d1d5db", cursor: thumbUploading ? "wait" : "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {thumbUploading ? "Uploading..." : "📷 Upload Image"}
                  </button>
                  <input type="file" ref={thumbRef} accept="image/*" style={{ display: "none" }} onChange={handleThumbFile} />
                </div>
                {form.thumbnailUrl && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={form.thumbnailUrl} alt="" style={{ width: 64, height: 48, borderRadius: 6, objectFit: "cover", border: "1px solid #374151" }} />
                    <span style={{ color: "#9ca3af", fontSize: 12, wordBreak: "break-all" }}>{form.thumbnailUrl}</span>
                  </div>
                )}
              </div>

              {/* Recording URL */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelSt}>Recording URL / Upload</label>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <input value={form.recordingUrl} onChange={e => setForm(f => ({ ...f, recordingUrl: e.target.value }))}
                    placeholder="YouTube, Google Drive, or direct video URL"
                    style={{ ...inputSt, flex: "1 1 220px" }} />
                  <button type="button" onClick={() => recRef.current?.click()} disabled={recUploading}
                    style={{ padding: "9px 16px", borderRadius: 7, border: "1.5px solid #374151", background: "#1f2937", color: "#d1d5db", cursor: recUploading ? "wait" : "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {recUploading ? "Uploading..." : "🎬 Upload Recording"}
                  </button>
                  <input type="file" ref={recRef} accept="video/*" style={{ display: "none" }} onChange={handleRecFile} />
                </div>
                {form.recordingUrl && (
                  <div style={{ marginTop: 6 }}>
                    <a href={form.recordingUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#7c3aed", fontSize: 12 }}>▶ Preview link</a>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div style={{ gridColumn: "1 / -1", display: "flex", gap: 24, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: "#7c3aed", cursor: "pointer" }} />
                  <span style={{ color: "#d1d5db", fontSize: 14 }}>⭐ <strong>Featured</strong> — show in "Most Engaging" section (max 8)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: "#7c3aed", cursor: "pointer" }} />
                  <span style={{ color: "#d1d5db", fontSize: 14 }}><strong>Active</strong> — visible on Home page</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, borderTop: "1px solid #1f2937", paddingTop: 20 }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #374151", background: "none", color: "#9ca3af", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: saving ? "#4c1d95" : "#7c3aed", color: "#fff", cursor: saving ? "wait" : "pointer", fontSize: 14, fontWeight: 700 }}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Style helpers ──────────────────────────────────────────────────────────────

const labelSt: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#9ca3af",
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
};

const inputSt: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "#0f172a", border: "1.5px solid #1f2937",
  borderRadius: 8, padding: "9px 13px",
  color: "#f3f4f6", fontSize: 14, outline: "none",
};

export default AdminHomeClasses;
