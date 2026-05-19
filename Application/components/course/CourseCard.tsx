import React from "react";
import { useNavigate } from "react-router-dom";
import { Course } from "../../stores/courseStore";
import Avatar from "../ui/Avatar";
import { HiOutlineStar, HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineClock } from "react-icons/hi";

interface Props {
  course: Course;
  showProgress?: number;
  style?: React.CSSProperties;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#2bbbad",
  intermediate: "#f59e0b",
  advanced: "#ef4444",
  spiritual: "#8b5cf6",
  expert: "#06b6d4",
};

const CourseCard: React.FC<Props> = ({ course, showProgress, style }) => {
  const navigate = useNavigate();
  const price = course.discountPrice ?? course.price;
  const hasDiscount = course.discountPrice && course.discountPrice < course.price;
  const levelColor = LEVEL_COLORS[course.level?.toLowerCase() || ""] || "#7c3aed";

  return (
    <div
      onClick={() => navigate(`/course/${course._id}`)}
      style={{
        background: "#13122a",
        borderRadius: 18,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #1e1b4b",
        fontFamily: "'Poppins', sans-serif",
        ...style,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-5px)";
        el.style.boxShadow = "0 20px 48px rgba(124,58,237,0.25)";
        el.style.borderColor = "#4c1d95";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "none";
        el.style.boxShadow = "none";
        el.style.borderColor = "#1e1b4b";
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", width: "100%", height: 180, background: "#1e1b4b", overflow: "hidden", flexShrink: 0 }}>
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.35s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1e1b4b,#3b0764)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 44 }}>📚</span>
          </div>
        )}

        {/* Level badge — top left (from reference) */}
        {course.level && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            background: levelColor, color: "#fff",
            fontSize: 10, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20,
            textTransform: "capitalize", letterSpacing: 0.5,
          }}>
            {course.level}
          </span>
        )}

        {/* Discount badge — top right */}
        {course.price === 0 ? (
          <span style={{ position: "absolute", top: 10, right: 10, background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>FREE</span>
        ) : hasDiscount ? (
          <span style={{ position: "absolute", top: 10, right: 10, background: "#7c3aed", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
            {Math.round((1 - (course.discountPrice! / course.price)) * 100)}% OFF
          </span>
        ) : null}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Category chip */}
        <span style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", background: "rgba(124,58,237,0.14)", padding: "2px 8px", borderRadius: 20, alignSelf: "flex-start", letterSpacing: 0.3 }}>
          {course.category}
        </span>

        {/* Title */}
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: "#f3f4f6", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {course.title}
        </h3>

        {/* Educator */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Avatar src={course.educator?.avatar} name={course.educator?.name || "Educator"} size={20} />
          <span style={{ color: "#9ca3af", fontSize: 12 }}>{course.educator?.name}</span>
        </div>

        {/* Meta stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#6b7280", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineStar size={12} style={{ color: "#f59e0b" }} />
            {course.rating.toFixed(1)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineUserGroup size={12} />
            {course.enrollmentCount.toLocaleString()}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineBookOpen size={12} />
            {course.totalLessons} lessons
          </span>
          {course.totalDuration > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <HiOutlineClock size={12} />
              {Math.round(course.totalDuration / 60)}h
            </span>
          )}
        </div>

        {/* Progress bar */}
        {showProgress !== undefined && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
              <span>Progress</span><span style={{ color: "#a78bfa", fontWeight: 600 }}>{showProgress}%</span>
            </div>
            <div style={{ background: "#1e1b4b", borderRadius: 4, height: 4 }}>
              <div style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)", height: "100%", borderRadius: 4, width: `${showProgress}%`, transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Price + button row (from reference style) */}
        <div style={{ marginTop: "auto", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e1b4b" }}>
          <div>
            {price === 0 ? (
              <span style={{ fontWeight: 800, color: "#4ade80", fontSize: 16 }}>Free</span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 800, color: "#f3f4f6", fontSize: 16 }}>₹{(price / 100).toLocaleString()}</span>
                {hasDiscount && (
                  <span style={{ color: "#6b7280", fontSize: 12, textDecoration: "line-through" }}>₹{(course.price / 100).toLocaleString()}</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/course/${course._id}`); }}
            style={{ background: "#7c3aed", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 14px", borderRadius: 10, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
