import React, { useState, useEffect, useRef } from "react";
import client from "../../api/client";
import { useThemeStore } from "../../stores/themeStore";

interface Item { _id: string; title: string; type: "course" | "program"; enrollmentCount?: number; }

interface RowResult {
  name: string;
  email: string;
  status: "enrolled" | "already_enrolled" | "created+enrolled" | "error";
  message?: string;
}

interface BulkResult {
  item: { _id: string; title: string; type: string };
  summary: { total: number; enrolled: number; skipped: number; created: number; failed: number };
  results: RowResult[];
}

const STATUS_COLOR: Record<string, string> = {
  enrolled:           "#4ade80",
  "created+enrolled": "#a78bfa",
  already_enrolled:   "#9ca3af",
  error:              "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  enrolled:           "✓ Enrolled",
  "created+enrolled": "★ New account + Enrolled",
  already_enrolled:   "↩ Already enrolled",
  error:              "✕ Error",
};

export default function AdminBulkEnroll() {
  const { t } = useThemeStore();
  const [items, setItems] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedType, setSelectedType] = useState<"course" | "program">("program");
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "enrolled" | "already_enrolled" | "created+enrolled" | "error">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load both programs and courses from admin-courses (same endpoint as Course Manager)
    client.get("/admin-courses")
      .then(r => {
        const data = r.data as any;
        const programs: Item[] = (data.programs || []).map((p: any) => ({
          _id: p._id, title: p.title, type: "program" as const,
        }));
        const courses: Item[] = (data.courses || []).map((c: any) => ({
          _id: c._id, title: c.title, type: "course" as const, enrollmentCount: c.enrollmentCount,
        }));
        setItems([...programs, ...courses]);
      })
      .catch(() => {});
  }, []);

  // Space-tolerant search: "Hypnosis2.0" matches "Hypnosis 2.0"
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
  const filtered = items.filter(c =>
    normalize(c.title).includes(normalize(search)) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const downloadTemplate = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const csv = `name,email,phone,joining_date,expiry_date\nPriya Sharma,priya@example.com,9876543210,${today},${nextMonth}\nRahul Mehta,rahul@example.com,,${today},\n`;
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "bulk_enroll_template.csv";
    a.click();
  };

  const handleSubmit = async () => {
    if (!selectedId) { setError("Please select a course or program"); return; }
    if (!file)       { setError("Please upload an Excel or CSV file"); return; }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("itemId",   selectedId);
      fd.append("itemType", selectedType);
      fd.append("file",     file);
      const r = await client.post("/admin/bulk-enroll", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(r.data as BulkResult);
      setFilter("all");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const visibleRows = result?.results.filter(row =>
    filter === "all" || row.status === filter
  ) ?? [];

  const selItem = items.find(c => c._id === selectedId);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: t.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 }}>
          Bulk Enroll Students
        </h1>
        <p style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>
          Upload an Excel (.xlsx) or CSV file to enroll multiple students into any program or course. New accounts are auto-created for unregistered emails.
        </p>
      </div>

      {/* ── Step 1: Select Program / Course ── */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
          Step 1 — Select Program or Course
        </div>
        <input
          type="text"
          placeholder="Search by name — e.g. Hypnosis 2.0, Advance Hypnosis, Reiki…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", background: t.bgPrimary, border: `1px solid ${t.border}`, borderRadius: 8, padding: "9px 12px", color: t.textPrimary, fontSize: 13, marginBottom: 10, boxSizing: "border-box" }}
        />

        {items.length === 0 ? (
          <div style={{ padding: 14, color: t.textMuted, fontSize: 13, textAlign: "center", borderRadius: 8, border: `1px solid ${t.border}` }}>
            Loading programs &amp; courses…
          </div>
        ) : (
          <div style={{ maxHeight: 240, overflowY: "auto", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgPrimary }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, color: t.textMuted, fontSize: 13, textAlign: "center" }}>No results for "{search}"</div>
            ) : filtered.map(c => (
              <div
                key={c._id}
                onClick={() => { setSelectedId(c._id); setSelectedType(c.type); setSearch(""); }}
                style={{
                  padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${t.border}`,
                  background: selectedId === c._id ? "rgba(124,58,237,0.15)" : "transparent",
                  transition: "background 0.15s",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
                onMouseEnter={e => { if (selectedId !== c._id) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selectedId === c._id ? "rgba(124,58,237,0.15)" : "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                    background: c.type === "program" ? "rgba(124,58,237,0.2)" : "rgba(13,148,136,0.2)",
                    color: c.type === "program" ? "#a78bfa" : "#0d9488",
                  }}>
                    {c.type === "program" ? "PROGRAM" : "COURSE"}
                  </span>
                  <span style={{ color: t.textPrimary, fontSize: 13, fontWeight: selectedId === c._id ? 700 : 400 }}>{c.title}</span>
                </div>
                {c.enrollmentCount !== undefined && (
                  <span style={{ color: t.textMuted, fontSize: 11 }}>{c.enrollmentCount} enrolled</span>
                )}
              </div>
            ))}
          </div>
        )}

        {selItem && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(124,58,237,0.12)", borderRadius: 8, border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa", fontSize: 13, fontWeight: 600 }}>
            ✓ Selected: {selItem.title} <span style={{ opacity: 0.7, fontWeight: 400 }}>({selItem.type})</span>
          </div>
        )}
      </div>

      {/* ── Step 2: Upload File ── */}
      <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
          Step 2 — Upload File
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <button
            onClick={downloadTemplate}
            style={{ padding: "8px 14px", background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.3)", borderRadius: 8, color: "#0d9488", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            ↓ Download Template CSV
          </button>
          <span style={{ color: t.textMuted, fontSize: 12, alignSelf: "center" }}>
            Columns: <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 5px", borderRadius: 4 }}>name</code>,{" "}
            <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 5px", borderRadius: 4 }}>email</code>,{" "}
            <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 5px", borderRadius: 4 }}>phone</code>,{" "}
            <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 5px", borderRadius: 4 }}>joining_date</code>,{" "}
            <code style={{ background: "rgba(255,255,255,0.07)", padding: "2px 5px", borderRadius: 4 }}>expiry_date</code>{" "}
            <span style={{ color: t.textMuted, fontSize: 11 }}>(dates optional — default: today + 1 month)</span>
          </span>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
          style={{
            border: `2px dashed ${file ? "#7c3aed" : t.border}`,
            borderRadius: 12, padding: "32px 20px", textAlign: "center",
            cursor: "pointer", background: file ? "rgba(124,58,237,0.08)" : "transparent",
            transition: "all 0.2s",
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
              <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 14 }}>{file.name}</div>
              <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              <div style={{ color: t.textPrimary, fontWeight: 600, fontSize: 14 }}>Drop .xlsx or .csv here</div>
              <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>or click to browse</div>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#ef4444", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%", padding: "14px 24px",
          background: loading ? "#4c1d95" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
          border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          marginBottom: 28, transition: "opacity 0.2s",
        }}
      >
        {loading ? "Processing…" : "⬆ Enroll Students"}
      </button>

      {/* ── Results ── */}
      {result && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Rows",      value: result.summary.total,    color: t.textPrimary },
              { label: "Enrolled",         value: result.summary.enrolled, color: "#4ade80" },
              { label: "New Accounts",     value: result.summary.created,  color: "#a78bfa" },
              { label: "Already Enrolled", value: result.summary.skipped,  color: "#9ca3af" },
              { label: "Failed",           value: result.summary.failed,   color: "#ef4444" },
            ].map(stat => (
              <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {(["all", "enrolled", "created+enrolled", "already_enrolled", "error"] as const).map(f => {
              const count = f === "all" ? result.results.length : result.results.filter(r => r.status === f).length;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${filter === f ? "#7c3aed" : t.border}`,
                  background: filter === f ? "rgba(124,58,237,0.2)" : "transparent",
                  color: filter === f ? "#a78bfa" : t.textMuted, cursor: "pointer",
                }}>
                  {f === "all" ? "All" : STATUS_LABEL[f]} ({count})
                </button>
              );
            })}
          </div>

          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.6fr", padding: "10px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>
              <div>Name</div><div>Email</div><div>Status</div>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {visibleRows.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: t.textMuted, fontSize: 13 }}>No rows</div>
              ) : visibleRows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.6fr", padding: "10px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 13, alignItems: "center" }}>
                  <div style={{ color: t.textPrimary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name || "—"}</div>
                  <div style={{ color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.email}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: STATUS_COLOR[row.status], fontWeight: 700, fontSize: 12 }}>{STATUS_LABEL[row.status]}</span>
                    {row.message && <span style={{ color: "#ef4444", fontSize: 11 }}>— {row.message}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "10px 14px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, color: "#4ade80", fontSize: 13 }}>
            ✓ Done enrolling into <strong>{result.item.title}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
