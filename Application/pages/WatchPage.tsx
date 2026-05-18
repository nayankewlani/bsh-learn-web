import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCourseStore, Lesson } from "../stores/courseStore";
import VideoPlayer from "../components/video/VideoPlayer";
import CourseSyllabus from "../components/course/CourseSyllabus";
import Button from "../components/ui/Button";
import client from "../api/client";

const WatchPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { currentCourse, chapters, lessons } = useCourseStore();
  const [lesson, setLesson] = useState<Lesson & { streamUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    client.get(`/lessons/${lessonId}/watch`)
      .then(({ data }) => { setLesson(data.lesson); })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (!lessonId || !currentCourse) return;
    client.get(`/progress/${currentCourse._id}`)
      .then(({ data }) => setProgress(data.progress))
      .catch(() => {});
  }, [lessonId, currentCourse]);

  const markComplete = async () => {
    if (!lessonId) return;
    try {
      const { data } = await client.post(`/progress/${lessonId}`);
      setProgress(data.enrollment.progress);
      const idx = lessons.findIndex((l) => l._id === lessonId);
      if (idx !== -1 && idx < lessons.length - 1) navigate(`/watch/${lessons[idx + 1]._id}`);
    } catch {}
  };

  const handleLessonClick = (l: Lesson) => navigate(`/watch/${l._id}`);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0914", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#7c3aed" }}>Loading video...</span>
    </div>
  );

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 320px" }}>
      <div style={{ padding: 24, borderRight: "1px solid #1e1b4b" }}>
        {lesson && <VideoPlayer muxPlaybackId={lesson.muxPlaybackId} title={lesson.title} onEnded={markComplete} />}
        {lesson && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ color: "#f3f4f6", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{lesson.title}</h2>
            {currentCourse && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#9ca3af", fontSize: 13, marginBottom: 6 }}>
                  <span>Course Progress</span><span>{progress}%</span>
                </div>
                <div style={{ background: "#1e1b4b", borderRadius: 6, height: 8 }}>
                  <div style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)", height: "100%", borderRadius: 6, width: `${progress}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            )}
            <Button onClick={markComplete} size="sm">Mark Complete & Next →</Button>
          </div>
        )}
      </div>

      <div style={{ height: "100vh", overflowY: "auto", background: "#0f0e1a" }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #1e1b4b" }}>
          <button onClick={() => navigate(`/course/${currentCourse?._id}`)} style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>← Back to Course</button>
          <h3 style={{ color: "#f3f4f6", fontSize: 15, fontWeight: 700, margin: "10px 0 0" }}>{currentCourse?.title}</h3>
        </div>
        {chapters.length > 0 && lessons.length > 0 && (
          <div style={{ padding: 12 }}>
            <CourseSyllabus chapters={chapters} lessons={lessons} isEnrolled={true} currentLessonId={lessonId} onLessonClick={handleLessonClick} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchPage;
