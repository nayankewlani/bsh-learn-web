import React, { useState } from "react";
import { Chapter, Lesson } from "../../stores/courseStore";
import Badge from "../ui/Badge";

interface Props {
  chapters: Chapter[];
  lessons: Lesson[];
  isEnrolled: boolean;
  currentLessonId?: string;
  onLessonClick?: (lesson: Lesson) => void;
}

const CourseSyllabus: React.FC<Props> = ({ chapters, lessons, isEnrolled, currentLessonId, onLessonClick }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(chapters[0]?._id ? [chapters[0]._id] : []));

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const getLessons = (chapterId: string) => lessons.filter((l) => l.chapter === chapterId).sort((a, b) => a.order - b.order);

  const fmtDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {chapters.sort((a, b) => a.order - b.order).map((ch) => {
        const chLessons = getLessons(ch._id);
        const isOpen = expanded.has(ch._id);
        return (
          <div key={ch._id} style={{ border: "1px solid #1e1b4b", borderRadius: 12, overflow: "hidden" }}>
            <button
              onClick={() => toggle(ch._id)}
              style={{ width: "100%", background: "#13122a", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#f3f4f6" }}
            >
              <span style={{ fontWeight: 600, fontSize: 14 }}>{ch.title}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>{chLessons.length} lessons</span>
                <span style={{ color: "#7c3aed", fontSize: 18 }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>
            {isOpen && (
              <div>
                {chLessons.map((lesson) => {
                  const isCurrent = lesson._id === currentLessonId;
                  const canAccess = isEnrolled || lesson.isFree;
                  return (
                    <div
                      key={lesson._id}
                      onClick={() => canAccess && onLessonClick?.(lesson)}
                      style={{ padding: "12px 20px", borderTop: "1px solid #1e1b4b", display: "flex", alignItems: "center", gap: 12, cursor: canAccess ? "pointer" : "default", background: isCurrent ? "#1e1b4b" : "transparent" }}
                    >
                      <span style={{ fontSize: 16 }}>
                        {lesson.type === "video" ? "▶" : lesson.type === "quiz" ? "📝" : "📄"}
                      </span>
                      <span style={{ flex: 1, color: canAccess ? "#e5e7eb" : "#6b7280", fontSize: 13 }}>{lesson.title}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {lesson.isFree && <Badge color="green">Free</Badge>}
                        {!canAccess && <span style={{ fontSize: 14 }}>🔒</span>}
                        {lesson.duration > 0 && <span style={{ color: "#9ca3af", fontSize: 12 }}>{fmtDuration(lesson.duration)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseSyllabus;
