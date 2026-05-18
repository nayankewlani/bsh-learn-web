import React from "react";
import { useNavigate } from "react-router-dom";
import { Course } from "../../stores/courseStore";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import { HiOutlineStar, HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineClock } from "react-icons/hi";

interface Props {
  course: Course;
  showProgress?: number;
}

const CourseCard: React.FC<Props> = ({ course, showProgress }) => {
  const navigate = useNavigate();
  const price = course.discountPrice ?? course.price;
  const hasDiscount = course.discountPrice && course.discountPrice < course.price;

  return (
    <div
      onClick={() => navigate(`/course/${course._id}`)}
      style={{
        background: "#13122a", border: "1px solid #1e1b4b",
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-5px)";
        el.style.boxShadow = "0 20px 48px rgba(124,58,237,0.22)";
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
      <div style={{ position: "relative", aspectRatio: "16/9", background: "#1e1b4b", overflow: "hidden", flexShrink: 0 }}>
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1e1b4b,#3b0764)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 44 }}>📚</span>
          </div>
        )}
        {course.price === 0 && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>FREE</div>
        )}
        {hasDiscount && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "#7c3aed", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20 }}>
            {Math.round((1 - (course.discountPrice! / course.price)) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge color="purple">{course.category}</Badge>

        <h3 style={{
          margin: 0, fontSize: 15, fontWeight: 700, color: "#f3f4f6", lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {course.title}
        </h3>

        {/* Educator */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Avatar src={course.educator?.avatar} name={course.educator?.name || "Educator"} size={22} />
          <span style={{ color: "#9ca3af", fontSize: 12 }}>{course.educator?.name}</span>
        </div>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#9ca3af", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineStar size={13} style={{ color: "#f59e0b" }} />
            {course.rating.toFixed(1)}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineUserGroup size={13} />
            {course.enrollmentCount.toLocaleString()}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <HiOutlineBookOpen size={13} />
            {course.totalLessons} lessons
          </span>
          {course.totalDuration > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <HiOutlineClock size={13} />
              {Math.round(course.totalDuration / 60)}h
            </span>
          )}
        </div>

        {/* Progress bar */}
        {showProgress !== undefined && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af", marginBottom: 5 }}>
              <span>Progress</span><span style={{ color: "#a78bfa", fontWeight: 600 }}>{showProgress}%</span>
            </div>
            <div style={{ background: "#1e1b4b", borderRadius: 4, height: 5 }}>
              <div style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)", height: "100%", borderRadius: 4, width: `${showProgress}%`, transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Price */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
          {price === 0 ? (
            <span style={{ fontWeight: 800, color: "#4ade80", fontSize: 17 }}>Free</span>
          ) : (
            <>
              <span style={{ fontWeight: 800, color: "#f3f4f6", fontSize: 18 }}>₹{(price / 100).toLocaleString()}</span>
              {hasDiscount && (
                <span style={{ color: "#6b7280", fontSize: 13, textDecoration: "line-through" }}>₹{(course.price / 100).toLocaleString()}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
