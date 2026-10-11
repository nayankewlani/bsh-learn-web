import React, { useState, useEffect, useRef } from "react";
import client from "../../api/client";
import { useThemeStore } from "../../stores/themeStore";

const PROGRAMS = [
  { id: "advance-hypnosis", label: "Advanced Hypnosis Diploma" },
  { id: "hypnosis-2",       label: "Hypnosis 2.0 — Live Subscription" },
  { id: "reiki",            label: "Reiki" },
  { id: "akashic-records",  label: "Akashic Records" },
  { id: "shadow-work",      label: "Art of Shadow Work" },
  { id: "vedic-astrology",  label: "Vedic Astrology" },
];

interface Batch { _id: string; name: string; }
interface Course { _id: string; title: string; }
interface MediaItem {
  _id: string; target: string; programId?: string; courseId?: string;
  title: string; description?: string; type: "video" | "pdf" | "image";
  muxPlaybackId?: string; muxStatus: string;
  gcsKey?: string; fileName?: string;
  batchIds: string[]; tags: string[]; isFree: boolean; order: number;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = { video: "🎬", pdf: "📄", image: "🖼️" };
const STATUS_COLOR: Record<string, string> = { ready: "#22c55e", waiting: "#f59e0b", errored: "#ef4444" };

export default function AdminMediaLibrary() {
  const { t } = useThemeStore();

  // ── Target / sub-selector ─────────────────────────────────────────────────
  const [target, setTarget]       = useState<"program" | "course" | "free">("program");
  const [programId, setProgramId] = useState(PROGRAMS[0].id);
  const [courseId, setCourseId]   = useState("");
  const [courses, setCourses]     = useState<Course[]>([]);
  const [batches, setBatches]     = useState<Batch[]>([]);

  // ── Upload form ────────────────────────────────────────────────────────────
  const [fileType, setFileType] = useState<"video" | "pdf" | "image">("video");
  const [title, setTitle]       = useState("");
  const [desc, setDesc]         = useState("");
  const [selBatches, setSelBatches] = useState<string[]>([]);
  const [tags, setTags]         = useState("");
  const [isFree, setIsFree]     = useState(false);

  // Video upload (Mux)
  const [muxUploading, setMuxUploading] = useState(false);
  const [muxProgress, setMuxProgress]   = useState(0);
  const [muxReady, setMuxReady]         = useState(false);
  const [muxContentId, setMuxContentId] = useState("");
  const [muxUploadId, setMuxUploadId]   = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);

  // File upload (PDF/image)
  const [fileUploading, setFileUploading] = useState(false);
  const [fileProgress, setFileProgress]   = useState(0);
  const [fileReady, setFileReady]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  // ── Content list ───────────────────────────────────────────────────────────
  const [items, setItems]         = useState<MediaItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc]   = useState("");
  const [editBatches, setEditBatches] = useState<string[]>([]);
  const [editTags, setEditTags]   = useState("");
  const [editFree, setEditFree]   = useState(false);
  const [editOrder, setEditOrder] = useState(0);
  const [editSaving, setEditSaving] = useState(false);

  // ── Load courses + batches ─────────────────────────────────────────────────
  useEffect(() => {
    client.get("/courses").then(({ data }) => {
      setCourses(data.courses || []);
      if (data.courses?.length) setCourseId(data.courses[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (target !== "program") { setBatches([]); return; }
    client.get(`/media/batches/${programId}`).then(({ data }) => setBatches(data.batches || [])).catch(() => setBatches([]));
  }, [target, programId]);

  // ── Load content list ──────────────────────────────────────────────────────
  const loadItems = () => {
    setLoadingList(true);
    const q = target === "program" ? `target=program&programId=${programId}`
            : target === "course"  ? `target=course&courseId=${courseId}`
            : "target=free";
    client.get(`/media?${q}`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  };

  useEffect(() => { loadItems(); }, [target, programId, courseId]);

  const resetForm = () => {
    setTitle(""); setDesc(""); setSelBatches([]); setTags(""); setIsFree(false);
    setMuxReady(false); setMuxProgress(0); setMuxContentId(""); setMuxUploadId("");
    setFileReady(false); setFileProgress(0);
    setError(""); setSuccess("");
  };

  // ── Mux video upload ───────────────────────────────────────────────────────
  const handleVideoFile = async (file: File) => {
    if (!title.trim()) { setError("Enter a title before uploading."); return; }
    setError(""); setMuxUploading(true); setMuxProgress(0); setMuxReady(false);
    try {
      const payload = {
        target, programId: target === "program" ? programId : undefined,
        courseId: target === "course" ? courseId : undefined,
        title, description: desc,
        batchIds: selBatches, tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        isFree,
      };
      const { data } = await client.post("/media/create-video", payload);
      setMuxContentId(data.content._id);
      setMuxUploadId(data.uploadId);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => { if (e.lengthComputable) setMuxProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => { if (xhr.status < 300) resolve(); else reject(new Error("Upload failed")); };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", data.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Poll Mux to finalize
      let tries = 0;
      const poll = async (): Promise<void> => {
        const res = await client.post(`/media/${data.content._id}/finalize-video`, { uploadId: data.uploadId });
        if (res.status === 202 && tries < 30) { tries++; await new Promise(r => setTimeout(r, 4000)); return poll(); }
        setMuxReady(true); setSuccess("Video uploaded and ready!"); loadItems();
      };
      await poll();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setMuxUploading(false);
    }
  };

  // ── PDF / Image upload ─────────────────────────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!title.trim()) { setError("Enter a title before uploading."); return; }
    setError(""); setFileUploading(true); setFileProgress(0); setFileReady(false);
    try {
      const payload = {
        target, programId: target === "program" ? programId : undefined,
        courseId: target === "course" ? courseId : undefined,
        title, description: desc, type: fileType,
        fileName: file.name, fileMimeType: file.type,
        batchIds: selBatches, tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        isFree,
      };
      const { data } = await client.post("/media/create-file-url", payload);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = e => { if (e.lengthComputable) setFileProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => { if (xhr.status < 300) resolve(); else reject(new Error("Upload failed")); };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", data.uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setFileReady(true); setSuccess("File uploaded!"); loadItems();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setFileUploading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try {
      await client.delete(`/media/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch { alert("Delete failed"); }
  };

  const openEdit = (item: MediaItem) => {
    setEditId(item._id); setEditTitle(item.title); setEditDesc(item.description || "");
    setEditBatches(item.batchIds); setEditTags(item.tags.join(", ")); setEditFree(item.isFree); setEditOrder(item.order);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setEditSaving(true);
    try {
      await client.patch(`/media/${editId}`, {
        title: editTitle, description: editDesc,
        batchIds: editBatches,
        tags: editTags.split(",").map(s => s.trim()).filter(Boolean),
        isFree: editFree, order: editOrder,
      });
      setEditId(null); loadItems();
    } catch { alert("Save failed"); }
    finally { setEditSaving(false); }
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const s: Record<string, React.CSSProperties> = {
    page:    { padding: "24px", maxWidth: 900, margin: "0 auto" },
    section: { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 24 },
    label:   { fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" },
    input:   { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgInput, color: t.textPrimary, fontSize: 14, boxSizing: "border-box" as const },
    tabRow:  { display: "flex", gap: 8, marginBottom: 20 },
    btn:     { padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: t.accent, color: "#fff" },
    row:     { display: "flex", gap: 16, flexWrap: "wrap" as const },
    col:     { flex: 1, minWidth: 200 },
  };
  const tabStyle  = (active: boolean): React.CSSProperties => ({ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: active ? t.accent : t.bgTertiary, color: active ? "#fff" : t.textSecond });
  const chipStyle = (active: boolean): React.CSSProperties => ({ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? t.accent : t.border}`, background: active ? t.accent + "30" : "transparent", color: active ? t.accentLight : t.textSecond });

  const batchToggle = (bid: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(bid) ? list.filter(x => x !== bid) : [...list, bid]);

  return (
    <div style={s.page}>
      <h2 style={{ color: t.textPrimary, marginBottom: 8 }}>Media Library</h2>
      <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 28 }}>Upload videos, PDFs and images for programs, courses, or free access.</p>

      {/* ── Target selector ── */}
      <div style={s.section}>
        <span style={s.label}>Target</span>
        <div style={s.tabRow}>
          {(["program", "course", "free"] as const).map(tgt => (
            <button key={tgt} style={tabStyle(target === tgt)} onClick={() => { setTarget(tgt); resetForm(); }}>
              {tgt === "program" ? "📚 Program" : tgt === "course" ? "🎓 Course" : "🌐 Free Content"}
            </button>
          ))}
        </div>

        {target === "program" && (
          <div>
            <label style={s.label}>Select Program</label>
            <select style={s.input} value={programId} onChange={e => setProgramId(e.target.value)}>
              {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        )}

        {target === "course" && (
          <div>
            <label style={s.label}>Select Course</label>
            <select style={s.input} value={courseId} onChange={e => setCourseId(e.target.value)}>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── Upload form ── */}
      <div style={s.section}>
        <h3 style={{ color: t.textPrimary, marginTop: 0, marginBottom: 20 }}>Upload New Content</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Content Type</label>
          <div style={s.tabRow}>
            {(["video", "pdf", "image"] as const).map(ft => (
              <button key={ft} style={tabStyle(fileType === ft)} onClick={() => setFileType(ft)}>
                {TYPE_ICON[ft]} {ft.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...s.row, marginBottom: 16 }}>
          <div style={s.col}>
            <label style={s.label}>Title *</label>
            <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Week 1 — Introduction" />
          </div>
          <div style={s.col}>
            <label style={s.label}>Tags (comma-separated)</label>
            <input style={s.input} value={tags} onChange={e => setTags(e.target.value)} placeholder="week-1, beginner, bonus" />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={s.label}>Description (optional)</label>
          <textarea style={{ ...s.input, minHeight: 70, resize: "vertical" }} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..." />
        </div>

        {target === "program" && batches.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>Visible to Batches (leave empty = all enrolled)</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {batches.map(b => (
                <button key={b._id} style={chipStyle(selBatches.includes(b._id))} onClick={() => batchToggle(b._id, selBatches, setSelBatches)}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" id="isFree" checked={isFree} onChange={e => setIsFree(e.target.checked)} />
          <label htmlFor="isFree" style={{ color: t.textSecond, fontSize: 14, cursor: "pointer" }}>
            Free — visible without enrollment
          </label>
        </div>

        {/* ── Video uploader ── */}
        {fileType === "video" && (
          <div>
            <input ref={videoInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); }} />
            {!muxReady ? (
              <button style={s.btn} onClick={() => videoInputRef.current?.click()} disabled={muxUploading}>
                {muxUploading ? `Uploading… ${muxProgress}%` : "📤 Choose Video File"}
              </button>
            ) : (
              <span style={{ color: "#22c55e", fontWeight: 700 }}>✓ Video Ready</span>
            )}
            {muxUploading && (
              <div style={{ marginTop: 10, height: 6, background: t.bgTertiary, borderRadius: 4 }}>
                <div style={{ height: 6, borderRadius: 4, background: t.accent, width: `${muxProgress}%`, transition: "width 0.3s" }} />
              </div>
            )}
          </div>
        )}

        {/* ── PDF / Image uploader ── */}
        {(fileType === "pdf" || fileType === "image") && (
          <div>
            <input ref={fileInputRef} type="file" accept={fileType === "pdf" ? "application/pdf" : "image/*"} style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
            {!fileReady ? (
              <button style={s.btn} onClick={() => fileInputRef.current?.click()} disabled={fileUploading}>
                {fileUploading ? `Uploading… ${fileProgress}%` : `📤 Choose ${fileType.toUpperCase()} File`}
              </button>
            ) : (
              <span style={{ color: "#22c55e", fontWeight: 700 }}>✓ File Uploaded</span>
            )}
            {fileUploading && (
              <div style={{ marginTop: 10, height: 6, background: t.bgTertiary, borderRadius: 4 }}>
                <div style={{ height: 6, borderRadius: 4, background: t.accent, width: `${fileProgress}%`, transition: "width 0.3s" }} />
              </div>
            )}
          </div>
        )}

        {error   && <p style={{ color: "#ef4444", marginTop: 12, fontSize: 13 }}>{error}</p>}
        {success && <p style={{ color: "#22c55e", marginTop: 12, fontSize: 13 }}>{success}</p>}

        {(muxReady || fileReady) && (
          <button style={{ ...s.btn, marginTop: 16 }} onClick={resetForm}>+ Add Another</button>
        )}
      </div>

      {/* ── Content list ── */}
      <div style={s.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ color: t.textPrimary, margin: 0 }}>Existing Content ({items.length})</h3>
          <button style={{ ...s.btn, padding: "7px 16px", fontSize: 12 }} onClick={loadItems}>↻ Refresh</button>
        </div>

        {loadingList ? (
          <p style={{ color: t.textMuted }}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: t.textMuted, fontSize: 14 }}>No content uploaded yet for this selection.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(item => (
              <div key={item._id} style={{ background: t.bgTertiary, borderRadius: 10, padding: 16, border: `1px solid ${t.border}` }}>
                {editId === item._id ? (
                  <div>
                    <div style={s.row}>
                      <div style={s.col}>
                        <label style={s.label}>Title</label>
                        <input style={s.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      </div>
                      <div style={{ width: 80 }}>
                        <label style={s.label}>Order</label>
                        <input style={s.input} type="number" value={editOrder} onChange={e => setEditOrder(Number(e.target.value))} />
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={s.label}>Description</label>
                      <textarea style={{ ...s.input, minHeight: 60 }} value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={s.label}>Tags (comma-separated)</label>
                      <input style={s.input} value={editTags} onChange={e => setEditTags(e.target.value)} />
                    </div>
                    {target === "program" && batches.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <label style={s.label}>Batches</label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {batches.map(b => (
                            <button key={b._id} style={chipStyle(editBatches.includes(b._id))} onClick={() => batchToggle(b._id, editBatches, setEditBatches)}>
                              {b.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={editFree} onChange={e => setEditFree(e.target.checked)} id={`free-${item._id}`} />
                      <label htmlFor={`free-${item._id}`} style={{ color: t.textSecond, fontSize: 13, cursor: "pointer" }}>Free</label>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button style={s.btn} onClick={saveEdit} disabled={editSaving}>{editSaving ? "Saving…" : "Save"}</button>
                      <button style={{ ...s.btn, background: t.bgInput, color: t.textSecond }} onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 28 }}>{TYPE_ICON[item.type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: t.textPrimary, fontWeight: 700, fontSize: 14 }}>{item.title}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: STATUS_COLOR[item.muxStatus] + "22", color: STATUS_COLOR[item.muxStatus], fontWeight: 600 }}>
                          {item.type === "video" ? item.muxStatus : "ready"}
                        </span>
                        {item.isFree && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#22c55e22", color: "#22c55e", fontWeight: 600 }}>Free</span>}
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {item.batchIds.length > 0 && <span style={{ color: t.textMuted, fontSize: 11 }}>Batches: {item.batchIds.join(", ")}</span>}
                        {item.tags.length > 0 && <span style={{ color: t.textMuted, fontSize: 11 }}>Tags: {item.tags.join(", ")}</span>}
                        <span style={{ color: t.textMuted, fontSize: 11 }}>Order: {item.order}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...s.btn, padding: "6px 14px", fontSize: 12, background: t.bgInput, color: t.textSecond }} onClick={() => openEdit(item)}>Edit</button>
                      <button style={{ ...s.btn, padding: "6px 14px", fontSize: 12, background: "#ef444422", color: "#ef4444" }} onClick={() => deleteItem(item._id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
