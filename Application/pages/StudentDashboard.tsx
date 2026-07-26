import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCourseStore } from "../stores/courseStore";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import CourseCard from "../components/course/CourseCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { enrolledCourses, fetchMyCourses } = useCourseStore();
  const { t } = useThemeStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchMyCourses()
      .catch(() => setError("Failed to load your courses. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const valid = enrolledCourses.filter((e) => e.course != null);
  const inProgress = valid.filter(e => e.progress < 100);
  const completed = valid.filter(e => e.progress === 100);

  if (loading) {
    return (
      <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: t.accent, fontSize: 18 }}>Loading your courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: t.bgPrimary, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ color: "#f87171", fontSize: 16 }}>{error}</div>
        <Button onClick={() => { setError(""); setLoading(true); fetchMyCourses().catch(() => setError("Failed to load your courses. Please refresh.")).finally(() => setLoading(false)); }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <Avatar src={user?.avatar} name={user?.name || "User"} size={56} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.textPrimary }}>Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p style={{ margin: 0, color: t.textSecond, fontSize: 14 }}>Continue your learning journey</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Enrolled", value: enrolledCourses.length, icon: "📚", color: t.accent },
            { label: "In Progress", value: inProgress.length, icon: "⏳", color: "#f59e0b" },
            { label: "Completed", value: completed.length, icon: "✅", color: "#4ade80" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ color: t.textSecond, fontSize: 13 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {inProgress.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, marginBottom: 20 }}>Continue Learning</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {inProgress.map(({ course, progress }) => (
                <CourseCard key={course._id} course={course} showProgress={progress} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: t.textPrimary, marginBottom: 20 }}>Completed Courses</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {completed.map(({ course }) => (
                <CourseCard key={course._id} course={course} showProgress={100} />
              ))}
            </div>
          </section>
        )}

        {enrolledCourses.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
            <h2 style={{ color: t.textPrimary, marginBottom: 8 }}>No courses yet</h2>
            <p style={{ color: t.textSecond, marginBottom: 24 }}>Start learning by exploring our course catalog</p>
            <Button onClick={() => navigate("/explore")}>Explore Courses</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
