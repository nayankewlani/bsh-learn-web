import React from "react";
import { Course } from "../../stores/courseStore";
import CourseCard from "./CourseCard";

interface Props {
  courses: Course[];
  loading?: boolean;
  emptyMessage?: string;
}

const CourseGrid: React.FC<Props> = ({ courses, loading, emptyMessage = "No courses found" }) => {
  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, overflow: "hidden", animation: "pulse 1.5s ease-in-out infinite" }}>
            <div style={{ aspectRatio: "16/9", background: "#1e1b4b" }} />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ height: 14, background: "#1e1b4b", borderRadius: 6, width: "40%" }} />
              <div style={{ height: 16, background: "#1e1b4b", borderRadius: 6 }} />
              <div style={{ height: 16, background: "#1e1b4b", borderRadius: 6, width: "70%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <p style={{ fontSize: 16 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
      {courses.map((course) => <CourseCard key={course._id} course={course} />)}
    </div>
  );
};

export default CourseGrid;
