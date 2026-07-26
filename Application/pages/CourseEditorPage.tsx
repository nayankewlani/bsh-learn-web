import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import client from "../api/client";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuthStore } from "../stores/authStore";

interface Lesson {
  _id: string;
  title: string;
  type: "video" | "article" | "quiz";
  description?: string;
  isFree: boolean;
  duration: number;
  videoUrl?: string;
  muxPlaybackId?: string;
}

interface Chapter {
  _id: string;
  title: string;
  description?: string;
  order: number;
}

interface Course {
  _id: string;
  title: string;
  isPublished: boolean;
  submittedForReview?: boolean;
  thumbnail?: string;
  totalLessons: number;
  totalDuration: number;
}

const inputStyle: React.CSSProperties = {
  background: "#1e1b4b", border: "1.5px solid #3730a3", borderRadius: 8,
  color: "#f3f4f6", padding: "9px 12px", fontSize: 14, width: "100%", boxSizing: "border-box",
};

const CourseEditorPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessonsByChapter, setLessonsByChapter] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // expanded state per chapter
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // "add chapter" form
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingChapter, setAddingChapter] = useState(false);

  // "add lesson" form — tracked per chapter
  const [addLessonFor, setAddLessonFor] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState<{ title: string; type: "video" | "article" | "quiz"; isFree: boolean; duration: number }>({ title: "", type: "video", isFree: false, duration: 0 });
  const [addingLesson, setAddingLesson] = useState(false);

  // "upload video" panel — per lesson
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");

  // edit lesson inline
  const [editLesson, setEditLesson] = useState<string | null>(null);
  const [editLessonData, setEditLessonData] = useState<Partial<Lesson>>({});
  const [savingLesson, setSavingLesson] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    client.get(`/courses/${courseId}`).then(({ data }) => {
      setCourse(data.course);
      setChapters(data.chapters);
      const byChapter: Record<string, Lesson[]> = {};
      for (const l of data.lessons) {
        if (!byChapter[l.chapter]) byChapter[l.chapter] = [];
        byChapter[l.chapter].push(l);
      }
      setLessonsByChapter(byChapter);
      // expand first chapter by default
      if (data.chapters.length > 0) setExpanded({ [data.chapters[0]._id]: true });
    }).finally(() => setLoading(false));
  }, [courseId]);

  const addChapter = async () => {
    if (!newChapterTitle.trim() || !courseId) return;
    setAddingChapter(true);
    try {
      const { data } = await client.post(`/courses/${courseId}/chapters`, { title: newChapterTitle.trim() });
      setChapters((prev) => [...prev, data.chapter]);
      setNewChapterTitle("");
      setShowAddChapter(false);
      setExpanded((prev) => ({ ...prev, [data.chapter._id]: true }));
    } finally {
      setAddingChapter(false);
    }
  };

  const deleteChapter = async (chapterId: string) => {
    if (!window.confirm("Delete this chapter and all its lessons?")) return;
    await client.delete(`/chapters/${chapterId}`);
    setChapters((prev) => prev.filter((c) => c._id !== chapterId));
    setLessonsByChapter((prev) => { const n = { ...prev }; delete n[chapterId]; return n; });
  };

  const addLesson = async (chapterId: string) => {
    if (!newLesson.title.trim()) return;
    setAddingLesson(true);
    try {
      const { data } = await client.post(`/chapters/${chapterId}/lessons`, {
        title: newLesson.title.trim(),
        type: newLesson.type,
        isFree: newLesson.isFree,
        duration: Number(newLesson.duration) || 0,
      });
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: [...(prev[chapterId] || []), data.lesson],
      }));
      setNewLesson({ title: "", type: "video", isFree: false, duration: 0 });
      setAddLessonFor(null);
      setCourse((c) => c ? { ...c, totalLessons: c.totalLessons + 1 } : c);
    } finally {
      setAddingLesson(false);
    }
  };

  const deleteLesson = async (lessonId: string, chapterId: string) => {
    if (!window.confirm("Delete this lesson?")) return;
    await client.delete(`/lessons/${lessonId}`);
    setLessonsByChapter((prev) => ({
      ...prev,
      [chapterId]: prev[chapterId].filter((l) => l._id !== lessonId),
    }));
    setCourse((c) => c ? { ...c, totalLessons: c.totalLessons - 1 } : c);
  };

  const uploadVideoFile = async (lessonId: string, chapterId: string) => {
    if (!videoFile) return;
    setUploading(true);
    setUploadError("");
    setUploadProgress(0);
    try {
      // Step 1: get a pre-signed Mux upload URL
      const { data: urlData } = await client.post(`/lessons/${lessonId}/create-upload-url`);
      // Step 2: PUT the file directly to Mux (no auth header — it's pre-signed)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", urlData.uploadUrl);
        xhr.setRequestHeader("Content-Type", videoFile.type || "video/mp4");
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round(e.loaded / e.total * 90)); };
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(videoFile);
      });
      setUploadProgress(92);
      // Step 3: poll until Mux assigns an asset (usually 5–30 sec after upload)
      let playbackId = "";
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const { data: fin } = await client.post(`/lessons/${lessonId}/finalize-upload`, {
          uploadId: urlData.uploadId,
          duration: Number(videoDuration) || 0,
        });
        if (fin.playbackId) { playbackId = fin.playbackId; break; }
      }
      setUploadProgress(100);
      if (playbackId) {
        setLessonsByChapter((prev) => ({
          ...prev,
          [chapterId]: prev[chapterId].map((l) => l._id === lessonId ? { ...l, muxPlaybackId: playbackId } : l),
        }));
      }
      setUploadFor(null);
      setVideoFile(null);
      setVideoDuration(0);
      setUploadProgress(0);
    } catch (err: unknown) {
      setUploadError((err as { message?: string }).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadVideoUrl = async (lessonId: string, chapterId: string) => {
    if (!videoUrl.trim()) return;
    setUploading(true);
    setUploadError("");
    try {
      const { data } = await client.post(`/lessons/${lessonId}/upload-video`, {
        videoUrl: videoUrl.trim(),
        duration: Number(videoDuration) || 0,
      });
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: prev[chapterId].map((l) => l._id === lessonId ? { ...l, muxPlaybackId: data.playbackId, videoUrl: videoUrl.trim() } : l),
      }));
      setUploadFor(null);
      setVideoUrl("");
      setVideoDuration(0);
    } catch (err: unknown) {
      setUploadError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveLesson = async (lessonId: string, chapterId: string) => {
    setSavingLesson(true);
    try {
      const { data } = await client.put(`/lessons/${lessonId}`, editLessonData);
      setLessonsByChapter((prev) => ({
        ...prev,
        [chapterId]: prev[chapterId].map((l) => l._id === lessonId ? { ...l, ...data.lesson } : l),
      }));
      setEditLesson(null);
    } finally {
      setSavingLesson(false);
    }
  };

  const publishCourse = async () => {
    setPublishing(true);
    try {
      await client.post(`/courses/${courseId}/publish`);
      setCourse((c) => c ? { ...c, isPublished: true } : c);
    } finally {
      setPublishing(false);
    }
  };

  const submitForReview = async () => {
    setSubmitting(true);
    try {
      await client.post(`/courses/${courseId}/submit-review`);
      setCourse((c) => c ? { ...c, submittedForReview: true } : c);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit for review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ background: "#0a0914", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
      Loading course...
    </div>
  );

  if (!course) return (
    <div style={{ background: "#0a0914", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171" }}>
      Course not found
    </div>
  );

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <button onClick={() => navigate("/educator")} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 8 }}>
              ← Back to Dashboard
            </button>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f3f4f6" }}>{course.title}</h1>
            <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
              {course.isPublished
                ? <Badge color="green">Published</Badge>
                : course.submittedForReview
                ? <Badge color="orange">⏳ Pending Admin Review</Badge>
                : <Badge color="orange">Draft</Badge>}
              <span style={{ color: "#9ca3af", fontSize: 13 }}>{course.totalLessons} lessons</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!course.isPublished && isAdmin && (
              <Button onClick={publishCourse} loading={publishing} disabled={chapters.length === 0}>
                Publish Course
              </Button>
            )}
            {!course.isPublished && !isAdmin && !course.submittedForReview && (
              <Button onClick={submitForReview} loading={submitting} disabled={chapters.length === 0}
                variant="secondary">
                {chapters.length === 0 ? 'Add content first' : '📤 Submit for Review'}
              </Button>
            )}
            {!course.isPublished && !isAdmin && course.submittedForReview && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#fbbf24" }}>
                ✅ Submitted — admin will review and publish
              </div>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {chapters.map((chapter, ci) => {
            const lessons = lessonsByChapter[chapter._id] || [];
            const isOpen = !!expanded[chapter._id];
            return (
              <div key={chapter._id} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 14, overflow: "hidden" }}>
                {/* Chapter header */}
                <div
                  onClick={() => setExpanded((prev) => ({ ...prev, [chapter._id]: !prev[chapter._id] }))}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 13 }}>Chapter {ci + 1}</span>
                    <span style={{ color: "#f3f4f6", fontWeight: 600, fontSize: 15 }}>{chapter.title}</span>
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteChapter(chapter._id); }}
                      style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}
                    >
                      Delete
                    </button>
                    <span style={{ color: "#7c3aed", fontSize: 16 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Lessons */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #1e1b4b", padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {lessons.length === 0 && (
                      <p style={{ color: "#6b7280", fontSize: 13, margin: "4px 0 8px" }}>No lessons yet. Add your first lesson below.</p>
                    )}

                    {lessons.map((lesson, li) => (
                      <div key={lesson._id} style={{ background: "#0f0e1a", borderRadius: 10, padding: "12px 14px", border: "1px solid #1e1b4b" }}>
                        {editLesson === lesson._id ? (
                          // Edit mode
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                              value={editLessonData.title ?? lesson.title}
                              onChange={(e) => setEditLessonData((p) => ({ ...p, title: e.target.value }))}
                              style={inputStyle}
                              placeholder="Lesson title"
                            />
                            <div style={{ display: "flex", gap: 10 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#c4b5fd", fontSize: 13, cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={editLessonData.isFree ?? lesson.isFree}
                                  onChange={(e) => setEditLessonData((p) => ({ ...p, isFree: e.target.checked }))}
                                />
                                Free preview
                              </label>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <label style={{ color: "#c4b5fd", fontSize: 13 }}>Duration (min):</label>
                                <input
                                  type="number"
                                  value={editLessonData.duration ?? lesson.duration}
                                  onChange={(e) => setEditLessonData((p) => ({ ...p, duration: Number(e.target.value) }))}
                                  style={{ ...inputStyle, width: 80 }}
                                />
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Button size="sm" onClick={() => saveLesson(lesson._id, chapter._id)} loading={savingLesson}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditLesson(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ color: "#6b7280", fontSize: 12, minWidth: 20 }}>{li + 1}.</span>
                              <div>
                                <div style={{ color: "#f3f4f6", fontSize: 14, fontWeight: 600 }}>{lesson.title}</div>
                                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                                  <Badge color="purple">{lesson.type}</Badge>
                                  {lesson.isFree && <Badge color="green">Free Preview</Badge>}
                                  {lesson.duration > 0 && <span style={{ color: "#9ca3af", fontSize: 12 }}>{lesson.duration} min</span>}
                                  {lesson.muxPlaybackId ? (
                                    <Badge color="green">Video Ready ✓</Badge>
                                  ) : lesson.type === "video" ? (
                                    <Badge color="orange">No video yet</Badge>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                              {lesson.type === "video" && (
                                <Button size="sm" variant="secondary" onClick={() => { setUploadFor(lesson._id); setVideoUrl(lesson.videoUrl || ""); setVideoUrl(""); setUploadError(""); }}>
                                  {lesson.muxPlaybackId ? "Replace Video" : "Upload Video"}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => { setEditLesson(lesson._id); setEditLessonData({}); }}>Edit</Button>
                              <button
                                onClick={() => deleteLesson(lesson._id, chapter._id)}
                                style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13 }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Video upload panel */}
                        {uploadFor === lesson._id && (
                          <div style={{ marginTop: 12, padding: 16, background: "#13122a", borderRadius: 10, border: "1px solid #3730a3" }}>
                            {/* Mode tabs */}
                            <div style={{ display: "flex", gap: 0, marginBottom: 14, background: "#0f0e1a", borderRadius: 8, padding: 3 }}>
                              {(["file", "url"] as const).map((m) => (
                                <button key={m} onClick={() => setUploadMode(m)}
                                  style={{ flex: 1, padding: "7px", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", background: uploadMode === m ? "#7c3aed" : "transparent", color: uploadMode === m ? "#fff" : "#9ca3af" }}>
                                  {m === "file" ? "📁 Upload File" : "🔗 Paste URL"}
                                </button>
                              ))}
                            </div>

                            {uploadMode === "file" ? (
                              <>
                                <p style={{ color: "#9ca3af", fontSize: 12, margin: "0 0 10px" }}>
                                  Select a video file from your computer. It uploads directly to Mux — no external hosting needed.
                                </p>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                  style={{ color: "#c4b5fd", fontSize: 13, marginBottom: 10, width: "100%" }}
                                />
                                {videoFile && <p style={{ color: "#a78bfa", fontSize: 12, margin: "0 0 10px" }}>Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
                                {uploading && (
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", color: "#c4b5fd", fontSize: 12, marginBottom: 4 }}>
                                      <span>{uploadProgress < 92 ? "Uploading..." : uploadProgress < 100 ? "Processing..." : "Done!"}</span>
                                      <span>{uploadProgress}%</span>
                                    </div>
                                    <div style={{ background: "#1e1b4b", borderRadius: 4, height: 6 }}>
                                      <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#7c3aed,#a78bfa)", width: `${uploadProgress}%`, transition: "width 0.4s" }} />
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <p style={{ color: "#9ca3af", fontSize: 12, margin: "0 0 10px" }}>
                                  Paste a <strong style={{ color: "#c4b5fd" }}>direct</strong> MP4 URL (S3, Firebase Storage, Cloudinary, Dropbox dl.dropbox.com link). Google Drive links do not work reliably.
                                </p>
                                <input
                                  value={videoUrl}
                                  onChange={(e) => setVideoUrl(e.target.value)}
                                  placeholder="https://example.com/video.mp4"
                                  style={{ ...inputStyle, marginBottom: 10 }}
                                />
                              </>
                            )}

                            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                              <label style={{ color: "#c4b5fd", fontSize: 13, whiteSpace: "nowrap" }}>Duration (minutes):</label>
                              <input
                                type="number"
                                value={videoDuration || ""}
                                onChange={(e) => setVideoDuration(Number(e.target.value))}
                                placeholder="0"
                                style={{ ...inputStyle, width: 80 }}
                              />
                            </div>
                            {uploadError && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 10px" }}>⚠️ {uploadError}</p>}
                            <div style={{ display: "flex", gap: 8 }}>
                              {uploadMode === "file" ? (
                                <Button size="sm" onClick={() => uploadVideoFile(lesson._id, chapter._id)} loading={uploading} disabled={!videoFile}>
                                  Upload to Mux
                                </Button>
                              ) : (
                                <Button size="sm" onClick={() => uploadVideoUrl(lesson._id, chapter._id)} loading={uploading} disabled={!videoUrl.trim()}>
                                  Submit to Mux
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => { setUploadFor(null); setVideoFile(null); setVideoUrl(""); setUploadError(""); }}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add lesson row */}
                    {addLessonFor === chapter._id ? (
                      <div style={{ background: "#0f0e1a", borderRadius: 10, padding: "12px 14px", border: "1px dashed #3730a3", display: "flex", flexDirection: "column", gap: 10 }}>
                        <input
                          value={newLesson.title}
                          onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))}
                          placeholder="Lesson title *"
                          style={inputStyle}
                          autoFocus
                        />
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                          <div>
                            <label style={{ color: "#c4b5fd", fontSize: 12, display: "block", marginBottom: 4 }}>Type</label>
                            <select
                              value={newLesson.type}
                              onChange={(e) => setNewLesson((p) => ({ ...p, type: e.target.value as "video" | "article" | "quiz" }))}
                              style={{ ...inputStyle, width: 120 }}
                            >
                              <option value="video">Video</option>
                              <option value="article">Article</option>
                              <option value="quiz">Quiz</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ color: "#c4b5fd", fontSize: 12, display: "block", marginBottom: 4 }}>Duration (min)</label>
                            <input
                              type="number"
                              value={newLesson.duration}
                              onChange={(e) => setNewLesson((p) => ({ ...p, duration: Number(e.target.value) }))}
                              style={{ ...inputStyle, width: 80 }}
                              placeholder="0"
                            />
                          </div>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#c4b5fd", fontSize: 13, cursor: "pointer", marginTop: 16 }}>
                            <input
                              type="checkbox"
                              checked={newLesson.isFree}
                              onChange={(e) => setNewLesson((p) => ({ ...p, isFree: e.target.checked }))}
                            />
                            Free preview
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button size="sm" onClick={() => addLesson(chapter._id)} loading={addingLesson} disabled={!newLesson.title.trim()}>
                            Add Lesson
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setAddLessonFor(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddLessonFor(chapter._id); setNewLesson({ title: "", type: "video", isFree: false, duration: 0 }); }}
                        style={{ background: "none", border: "1px dashed #3730a3", borderRadius: 8, color: "#7c3aed", cursor: "pointer", padding: "8px 14px", fontSize: 13, textAlign: "left" }}
                      >
                        + Add Lesson
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add chapter */}
          {showAddChapter ? (
            <div style={{ background: "#13122a", border: "1px dashed #3730a3", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Chapter title *"
                style={{ ...inputStyle, flex: 1 }}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && addChapter()}
              />
              <Button size="sm" onClick={addChapter} loading={addingChapter} disabled={!newChapterTitle.trim()}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddChapter(false); setNewChapterTitle(""); }}>Cancel</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddChapter(true)}
              style={{ background: "#13122a", border: "1px dashed #3730a3", borderRadius: 14, padding: "16px 18px", color: "#7c3aed", cursor: "pointer", fontSize: 14, fontWeight: 600, textAlign: "left", width: "100%" }}
            >
              + Add Chapter
            </button>
          )}
        </div>

        {/* Publish / Submit nudge */}
        {!course.isPublished && chapters.length > 0 && isAdmin && (
          <div style={{ marginTop: 24, background: "#0f172a", border: "1px solid #1e40af", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#93c5fd", fontSize: 14 }}>Course is ready? Publish it so students can find and enroll.</span>
            <Button size="sm" onClick={publishCourse} loading={publishing}>Publish Now</Button>
          </div>
        )}
        {!course.isPublished && chapters.length > 0 && !isAdmin && !course.submittedForReview && (
          <div style={{ marginTop: 24, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#fbbf24", fontSize: 14 }}>Content looks good! Submit to admin for review and publishing.</span>
            <Button size="sm" onClick={submitForReview} loading={submitting}>📤 Submit for Review</Button>
          </div>
        )}
        {!course.isPublished && !isAdmin && course.submittedForReview && (
          <div style={{ marginTop: 24, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, padding: "14px 18px" }}>
            <span style={{ color: "#4ade80", fontSize: 14 }}>✅ Course submitted for review. Admin will publish it once approved.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseEditorPage;
