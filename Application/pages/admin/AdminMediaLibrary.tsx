import React, { useState, useEffect, useRef, useCallback } from "react";
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

interface Batch   { _id: string; name: string; }
interface Course  { _id: string; title: string; }
interface MediaItem {
  _id: string; target: string; programId?: string; courseId?: string;
  title: string; description?: string; type: "video" | "pdf" | "image";
  muxPlaybackId?: string; muxStatus: string;
  gcsKey?: string; fileName?: string;
  folder?: string; batchIds: string[]; tags: string[]; isFree: boolean; order: number;
  createdAt: string;
}

type QueueStatus = "pending" | "uploading" | "processing" | "ready" | "error";
interface QueueItem {
  localId: string;
  file: File;
  title: string;
  status: QueueStatus;
  progress: number;
  error?: string;
  contentId?: string;
  muxUploadId?: string;
}

const TYPE_ICON: Record<string, string>   = { video: "🎬", pdf: "📄", image: "🖼️" };
const STATUS_COLOR: Record<string, string> = { ready: "#22c55e", waiting: "#f59e0b", errored: "#ef4444", processing: "#60a5fa" };
const STATUS_LABEL: Record<QueueStatus, string> = { pending: "Pending", uploading: "Uploading", processing: "Processing", ready: "Ready ✓", error: "Error ✗" };
const STATUS_CLR: Record<QueueStatus, string>   = { pending: "#64748b", uploading: "#60a5fa", processing: "#f59e0b", ready: "#22c55e", error: "#ef4444" };

function stripExt(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export default function AdminMediaLibrary() {
  const { t } = useThemeStore();

  // ── Target selector ─────────────────────────────────────────────────────────
  const [target, setTarget]       = useState<"program" | "course" | "free">("program");
  const [programId, setProgramId] = useState(PROGRAMS[0].id);
  const [courseId, setCourseId]   = useState("");
  const [courses, setCourses]     = useState<Course[]>([]);
  const [batches, setBatches]     = useState<Batch[]>([]);

  // ── Folder ──────────────────────────────────────────────────────────────────
  const [folder, setFolder]           = useState("");
  const [folderOptions, setFolderOptions] = useState<string[]>([]);
  const [folderFilter, setFolderFilter]   = useState(""); // for content list

  // ── Shared upload settings ───────────────────────────────────────────────────
  const [fileType, setFileType]     = useState<"video" | "pdf" | "image">("video");
  const [desc, setDesc]             = useState("");
  const [selBatches, setSelBatches] = useState<string[]>([]);
  const [tags, setTags]             = useState("");
  const [isFree, setIsFree]         = useState(false);

  // ── Bulk upload queue ────────────────────────────────────────────────────────
  const [queue, setQueue]         = useState<QueueItem[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [activeUploadTitle, setActiveUploadTitle] = useState<string | null>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);
  const runningRef  = useRef(false);

  // ── Content list ─────────────────────────────────────────────────────────────
  const [items, setItems]           = useState<MediaItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [editTitle, setEditTitle]   = useState("");
  const [editDesc, setEditDesc]     = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [editBatches, setEditBatches] = useState<string[]>([]);
  const [editTags, setEditTags]     = useState("");
  const [editFree, setEditFree]     = useState(false);
  const [editOrder, setEditOrder]   = useState(0);
  const [editSaving, setEditSaving] = useState(false);

  // ── Init ────────────────────────────────────────────────────────────────────
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

  const loadFolderOptions = useCallback(() => {
    const q = target === "program" ? `target=program&programId=${programId}`
            : target === "course"  ? `target=course&courseId=${courseId}`
            : "target=free";
    client.get(`/media/folders?${q}`).then(({ data }) => setFolderOptions(data.folders || [])).catch(() => {});
  }, [target, programId, courseId]);

  const loadItems = useCallback(() => {
    setLoadingList(true);
    let q = target === "program" ? `target=program&programId=${programId}`
           : target === "course" ? `target=course&courseId=${courseId}`
           : "target=free";
    if (folderFilter) q += `&folder=${encodeURIComponent(folderFilter)}`;
    client.get(`/media?${q}`)
      .then(({ data }) => setItems(data.items || []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [target, programId, courseId, folderFilter]);

  useEffect(() => { loadItems(); loadFolderOptions(); }, [target, programId, courseId]);
  useEffect(() => { loadItems(); }, [folderFilter]);

  // ── File picker → build queue ─────────────────────────────────────────────
  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 100);
    if (!files.length) return;
    const items: QueueItem[] = files.map(f => ({
      localId: `${Date.now()}-${Math.random()}`,
      file: f,
      title: stripExt(f.name),
      status: "pending",
      progress: 0,
    }));
    setQueue(prev => [...prev, ...items]);
    e.target.value = "";
  };

  const updateQueue = useCallback((localId: string, patch: Partial<QueueItem>) => {
    setQueue(prev => prev.map(q => q.localId === localId ? { ...q, ...patch } : q));
  }, []);

  // Async Mux poll — updates queue item when Mux finishes processing
  const pollMux = useCallback(async (localId: string, contentId: string, muxUploadId: string) => {
    let tries = 0;
    const attempt = async (): Promise<void> => {
      try {
        const res = await client.post(`/media/${contentId}/finalize-video`, { uploadId: muxUploadId });
        if (res.status === 202 && tries < 60) {
          tries++;
          await new Promise(r => setTimeout(r, 5000));
          return attempt();
        }
        updateQueue(localId, { status: "ready" });
      } catch { /* silent — item stays "processing" */ }
    };
    await attempt();
  }, [updateQueue]);

  // Upload a single item — returns true on success
  const uploadOne = useCallback(async (item: QueueItem): Promise<boolean> => {
    updateQueue(item.localId, { status: "uploading", progress: 0 });
    setActiveUploadTitle(item.title);
    const basePayload = {
      target,
      programId: target === "program" ? programId : undefined,
      courseId:  target === "course"  ? courseId  : undefined,
      folder: folder.trim() || undefined,
      batchIds: selBatches,
      tags: tags.split(",").map(s => s.trim()).filter(Boolean),
      isFree,
    };

    try {
      if (fileType === "video") {
        // Use a longer timeout for this API call since Mux may be slow
        const { data } = await client.post("/media/create-video", { ...basePayload, title: item.title, description: desc }, { timeout: 60000 });
        const mimeType = item.file.type || "video/mp4";
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = e => {
            if (e.lengthComputable) updateQueue(item.localId, { progress: Math.round(e.loaded / e.total * 100) });
          };
          xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error(`Mux HTTP ${xhr.status}`));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", data.uploadUrl);
          if (mimeType) xhr.setRequestHeader("Content-Type", mimeType);
          xhr.send(item.file);
        });
        updateQueue(item.localId, { status: "processing", progress: 100, contentId: data.content._id, muxUploadId: data.uploadId });
        // Poll Mux async — doesn't block the upload loop
        pollMux(item.localId, data.content._id, data.uploadId);
      } else {
        const mimeType = item.file.type || "application/octet-stream";
        const { data } = await client.post("/media/create-file-url", {
          ...basePayload,
          title: item.title, description: desc, type: fileType,
          fileName: item.file.name, fileMimeType: mimeType,
        }, { timeout: 60000 });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = e => {
            if (e.lengthComputable) updateQueue(item.localId, { progress: Math.round(e.loaded / e.total * 100) });
          };
          xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error(`GCS HTTP ${xhr.status}`));
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.open("PUT", data.uploadUrl);
          if (mimeType) xhr.setRequestHeader("Content-Type", mimeType);
          xhr.send(item.file);
        });
        updateQueue(item.localId, { status: "ready", progress: 100 });
      }
      return true;
    } catch (err: any) {
      updateQueue(item.localId, { status: "error", error: err.message || "Failed" });
      return false;
    }
  }, [target, programId, courseId, folder, selBatches, tags, isFree, fileType, desc, pollMux, updateQueue]);

  const startBulkUpload = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setBulkRunning(true);
    const pending = queue.filter(q => q.status === "pending");
    for (const item of pending) {
      if (!runningRef.current) break;
      await uploadOne(item);
    }
    runningRef.current = false;
    setBulkRunning(false);
    setActiveUploadTitle(null);
    loadItems();
    loadFolderOptions();
  };

  const stopBulkUpload = () => {
    runningRef.current = false;
    setBulkRunning(false);
    setActiveUploadTitle(null);
  };

  const removeFromQueue = (localId: string) => setQueue(prev => prev.filter(q => q.localId !== localId));
  const clearDone = () => setQueue(prev => prev.filter(q => q.status === "pending" || q.status === "uploading" || q.status === "processing"));
  const retryFailed = () => setQueue(prev => prev.map(q => q.status === "error" ? { ...q, status: "pending", progress: 0, error: undefined } : q));

  // ── Edit / delete ────────────────────────────────────────────────────────────
  const deleteItem = async (id: string) => {
    if (!confirm("Delete this content?")) return;
    try { await client.delete(`/media/${id}`); setItems(prev => prev.filter(i => i._id !== id)); }
    catch { alert("Delete failed"); }
  };

  const openEdit = (item: MediaItem) => {
    setEditId(item._id); setEditTitle(item.title); setEditDesc(item.description || "");
    setEditFolder(item.folder || ""); setEditBatches(item.batchIds);
    setEditTags(item.tags.join(", ")); setEditFree(item.isFree); setEditOrder(item.order);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setEditSaving(true);
    try {
      await client.patch(`/media/${editId}`, {
        title: editTitle, description: editDesc, folder: editFolder || undefined,
        batchIds: editBatches, tags: editTags.split(",").map(s => s.trim()).filter(Boolean),
        isFree: editFree, order: editOrder,
      });
      setEditId(null); loadItems(); loadFolderOptions();
    } catch { alert("Save failed"); }
    finally { setEditSaving(false); }
  };

  const batchToggle = (bid: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(bid) ? list.filter(x => x !== bid) : [...list, bid]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const queueReady     = queue.filter(q => q.status === "ready").length;
  const queuePending   = queue.filter(q => q.status === "pending").length;
  const queueError     = queue.filter(q => q.status === "error").length;
  const queueProcessing = queue.filter(q => q.status === "processing").length;

  // Group content list by folder
  const grouped = items.reduce<Record<string, MediaItem[]>>((acc, item) => {
    const key = item.folder || "— No Folder —";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort((a, b) => a === "— No Folder —" ? 1 : b === "— No Folder —" ? -1 : a.localeCompare(b));

  // ── Styles ────────────────────────────────────────────────────────────────────
  const s: Record<string, React.CSSProperties> = {
    page:      { padding: "24px", maxWidth: 960, margin: "0 auto" },
    section:   { background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, marginBottom: 24 },
    label:     { fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6, display: "block" },
    input:     { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgInput, color: t.textPrimary, fontSize: 14, boxSizing: "border-box" as const },
    tabRow:    { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" as const },
    btn:       { padding: "10px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: t.accent, color: "#fff" },
    row:       { display: "flex", gap: 16, flexWrap: "wrap" as const },
    col:       { flex: 1, minWidth: 200 },
    datalist:  { display: "none" },
  };
  const tabStyle  = (active: boolean): React.CSSProperties => ({ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: active ? t.accent : t.bgTertiary, color: active ? "#fff" : t.textSecond });
  const chipStyle = (active: boolean): React.CSSProperties => ({ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? t.accent : t.border}`, background: active ? t.accent + "30" : "transparent", color: active ? t.accentLight : t.textSecond });

  return (
    <div style={s.page}>
      <h2 style={{ color: t.textPrimary, marginBottom: 4 }}>Media Library</h2>
      <p style={{ color: t.textMuted, fontSize: 14, marginBottom: 28 }}>Bulk-upload videos, PDFs and images organised by folder for any program or course.</p>

      {/* ── Target ── */}
      <div style={s.section}>
        <span style={s.label}>Target</span>
        <div style={s.tabRow}>
          {(["program", "course", "free"] as const).map(tgt => (
            <button key={tgt} style={tabStyle(target === tgt)} onClick={() => { setTarget(tgt); setQueue([]); setFolder(""); setFolderFilter(""); }}>
              {tgt === "program" ? "📚 Program" : tgt === "course" ? "🎓 Course" : "🌐 Free Content"}
            </button>
          ))}
        </div>
        {target === "program" && (
          <div>
            <label style={s.label}>Select Program</label>
            <select style={s.input} value={programId} onChange={e => { setProgramId(e.target.value); setFolder(""); setFolderFilter(""); }}>
              {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        )}
        {target === "course" && (
          <div>
            <label style={s.label}>Select Course</label>
            <select style={s.input} value={courseId} onChange={e => { setCourseId(e.target.value); setFolder(""); setFolderFilter(""); }}>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* ── Bulk Upload ── */}
      <div style={s.section}>
        <h3 style={{ color: t.textPrimary, marginTop: 0, marginBottom: 20 }}>📤 Bulk Upload</h3>

        {/* Settings row */}
        <div style={{ ...s.row, marginBottom: 16 }}>
          {/* Folder */}
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={s.label}>Folder (organise your content)</label>
            <datalist id="folder-list">
              {folderOptions.map(f => <option key={f} value={f} />)}
            </datalist>
            <input
              style={s.input}
              list="folder-list"
              value={folder}
              onChange={e => setFolder(e.target.value)}
              placeholder='e.g. "October Week 1", "Module 3 — Advanced"'
            />
            {folderOptions.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {folderOptions.map(f => (
                  <button key={f} style={{ ...chipStyle(folder === f), fontSize: 11 }} onClick={() => setFolder(f)}>
                    📁 {f}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Content type */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={s.label}>Content Type</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["video", "pdf", "image"] as const).map(ft => (
                <button key={ft} style={tabStyle(fileType === ft)} onClick={() => setFileType(ft)}>
                  {TYPE_ICON[ft]} {ft.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...s.row, marginBottom: 16 }}>
          <div style={s.col}>
            <label style={s.label}>Tags (applied to all files)</label>
            <input style={s.input} value={tags} onChange={e => setTags(e.target.value)} placeholder="week-1, beginner, bonus" />
          </div>
          <div style={s.col}>
            <label style={s.label}>Description (optional, applied to all)</label>
            <input style={s.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description…" />
          </div>
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
          <label htmlFor="isFree" style={{ color: t.textSecond, fontSize: 14, cursor: "pointer" }}>Free — visible without enrollment</label>
        </div>

        {/* File picker */}
        <input
          ref={bulkFileRef}
          type="file"
          multiple
          accept={fileType === "video" ? "video/*" : fileType === "pdf" ? "application/pdf" : "image/*"}
          style={{ display: "none" }}
          onChange={onFilesSelected}
        />
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <button style={s.btn} onClick={() => bulkFileRef.current?.click()} disabled={bulkRunning}>
            📂 Select Files (up to 100)
          </button>
          {queue.length > 0 && (
            <>
              {!bulkRunning ? (
                <button
                  style={{ ...s.btn, background: "#16a34a" }}
                  onClick={startBulkUpload}
                  disabled={queuePending === 0}
                >
                  ▶ Upload {queuePending} {queuePending === 1 ? "File" : "Files"}
                </button>
              ) : (
                <button style={{ ...s.btn, background: "#ef4444" }} onClick={stopBulkUpload}>
                  ⏹ Stop
                </button>
              )}
              {queueError > 0 && (
                <button style={{ ...s.btn, background: "#f59e0b" }} onClick={retryFailed}>
                  ↻ Retry {queueError} Failed
                </button>
              )}
              {(queueReady > 0 || queueError > 0) && !bulkRunning && (
                <button style={{ ...s.btn, background: t.bgTertiary, color: t.textSecond }} onClick={clearDone}>
                  Clear Done
                </button>
              )}
            </>
          )}
        </div>

        {/* Active upload banner */}
        {bulkRunning && activeUploadTitle && (
          <div style={{ background: "#1e40af22", border: "1px solid #3b82f6", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14 }}>⬆️</span>
            <div>
              <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>Uploading to Mux: </span>
              <span style={{ color: t.textPrimary, fontSize: 13 }}>{activeUploadTitle}</span>
            </div>
          </div>
        )}
        {bulkRunning && !activeUploadTitle && (
          <div style={{ background: "#1e40af22", border: "1px solid #3b82f6", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
            <span style={{ color: "#60a5fa", fontWeight: 700, fontSize: 13 }}>⬆️ Starting upload…</span>
          </div>
        )}

        {/* Summary bar */}
        {queue.length > 0 && (
          <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, fontWeight: 700, flexWrap: "wrap" }}>
            <span style={{ color: "#64748b" }}>Total: {queue.length}</span>
            {queuePending   > 0 && <span style={{ color: "#64748b" }}>⏳ Pending: {queuePending}</span>}
            {queueProcessing > 0 && <span style={{ color: "#f59e0b" }}>⚙ Processing: {queueProcessing}</span>}
            {queueReady     > 0 && <span style={{ color: "#22c55e" }}>✓ Ready: {queueReady}</span>}
            {queueError     > 0 && <span style={{ color: "#ef4444" }}>✗ Failed: {queueError}</span>}
          </div>
        )}

        {/* Queue list */}
        {queue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 480, overflowY: "auto" }}>
            {queue.map(item => (
              <div key={item.localId} style={{
                background: t.bgTertiary, borderRadius: 10, padding: "12px 14px",
                border: `1px solid ${item.status === "error" ? "#ef444440" : item.status === "ready" ? "#22c55e40" : t.border}`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[fileType]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    style={{ ...s.input, padding: "5px 10px", fontSize: 13, marginBottom: 4 }}
                    value={item.title}
                    onChange={e => setQueue(prev => prev.map(q => q.localId === item.localId ? { ...q, title: e.target.value } : q))}
                    disabled={item.status !== "pending"}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: STATUS_CLR[item.status], fontWeight: 700 }}>
                      {STATUS_LABEL[item.status]}
                    </span>
                    {item.error && <span style={{ fontSize: 11, color: "#ef4444" }}>{item.error}</span>}
                    {(item.status === "uploading") && (
                      <span style={{ fontSize: 11, color: t.textMuted }}>{item.progress}%</span>
                    )}
                  </div>
                  {(item.status === "uploading") && (
                    <div style={{ height: 4, background: t.bgCard, borderRadius: 2, marginTop: 4 }}>
                      <div style={{ height: 4, borderRadius: 2, background: "#60a5fa", width: `${item.progress}%`, transition: "width 0.3s" }} />
                    </div>
                  )}
                </div>
                {(item.status === "pending" || item.status === "error") && (
                  <button
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 18, padding: 0, flexShrink: 0 }}
                    onClick={() => removeFromQueue(item.localId)}
                  >×</button>
                )}
              </div>
            ))}
          </div>
        )}

        {queue.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: t.textMuted, fontSize: 14, border: `2px dashed ${t.border}`, borderRadius: 10 }}>
            Click "Select Files" to add up to 100 files at once. All files will be uploaded under the folder you choose above.
          </div>
        )}
      </div>

      {/* ── Content List ── */}
      <div style={s.section}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ color: t.textPrimary, margin: 0 }}>Existing Content ({items.length})</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* Folder filter */}
            <select
              style={{ ...s.input, width: "auto", minWidth: 180, padding: "7px 12px", fontSize: 12 }}
              value={folderFilter}
              onChange={e => setFolderFilter(e.target.value)}
            >
              <option value="">All Folders</option>
              {folderOptions.map(f => <option key={f} value={f}>📁 {f}</option>)}
            </select>
            <button style={{ ...s.btn, padding: "7px 16px", fontSize: 12 }} onClick={() => { loadItems(); loadFolderOptions(); }}>↻ Refresh</button>
          </div>
        </div>

        {loadingList ? (
          <p style={{ color: t.textMuted }}>Loading…</p>
        ) : items.length === 0 ? (
          <p style={{ color: t.textMuted, fontSize: 14 }}>No content uploaded yet for this selection.</p>
        ) : (
          <div>
            {groupKeys.map(groupKey => (
              <div key={groupKey} style={{ marginBottom: 24 }}>
                {/* Folder header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
                  paddingBottom: 8, borderBottom: `1px solid ${t.border}`,
                }}>
                  <span style={{ fontSize: 14 }}>📁</span>
                  <span style={{ color: t.textPrimary, fontWeight: 800, fontSize: 14 }}>{groupKey}</span>
                  <span style={{ color: t.textMuted, fontSize: 12, marginLeft: 4 }}>({grouped[groupKey].length} items)</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {grouped[groupKey].map(item => (
                    <div key={item._id} style={{ background: t.bgTertiary, borderRadius: 10, padding: 14, border: `1px solid ${t.border}` }}>
                      {editId === item._id ? (
                        <div>
                          <div style={s.row}>
                            <div style={s.col}>
                              <label style={s.label}>Title</label>
                              <input style={s.input} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                            </div>
                            <div style={{ width: 140 }}>
                              <label style={s.label}>Folder</label>
                              <input style={s.input} list="folder-list" value={editFolder} onChange={e => setEditFolder(e.target.value)} placeholder="folder name" />
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
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 24, flexShrink: 0 }}>{TYPE_ICON[item.type]}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                              <span style={{ color: t.textPrimary, fontWeight: 700, fontSize: 14 }}>{item.title}</span>
                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: (STATUS_COLOR[item.muxStatus] ?? "#64748b") + "22", color: STATUS_COLOR[item.muxStatus] ?? "#64748b", fontWeight: 600 }}>
                                {item.type === "video" ? item.muxStatus : "ready"}
                              </span>
                              {item.isFree && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#22c55e22", color: "#22c55e", fontWeight: 600 }}>Free</span>}
                            </div>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              {item.tags.length > 0 && <span style={{ color: t.textMuted, fontSize: 11 }}>Tags: {item.tags.join(", ")}</span>}
                              {item.batchIds.length > 0 && <span style={{ color: t.textMuted, fontSize: 11 }}>Batches: {item.batchIds.length}</span>}
                              <span style={{ color: t.textMuted, fontSize: 11 }}>Order: {item.order}</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                            <button style={{ ...s.btn, padding: "6px 14px", fontSize: 12, background: t.bgInput, color: t.textSecond }} onClick={() => openEdit(item)}>Edit</button>
                            <button style={{ ...s.btn, padding: "6px 14px", fontSize: 12, background: "#ef444422", color: "#ef4444" }} onClick={() => deleteItem(item._id)}>Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
