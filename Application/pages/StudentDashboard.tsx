import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCourseStore } from "../stores/courseStore";
import { useAuthStore } from "../stores/authStore";
import CourseCard from "../components/course/CourseCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

const StudentDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { enrolledCourses, fetchMyCourses } = useCourseStore();
  const navigate = useNavigate();

  useEffect(() => { fetchMyCourses(); }, []);

  const inProgress = enrolledCourses.filter(e => e.progress < 100);
  const completed = enrolledCourses.filter(e => e.progress === 100);

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <Avatar src={user?.avatar} name={user?.name || "User"} size={56} />
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f3f4f6" }}>Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>Continue your learning journey</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 40 }}>
          {[
            { label: "Enrolled", value: enrolledCourses.length, icon: "📚", color: "#7c3aed" },
            { label: "In Progress", value: inProgress.length, icon: "⏳", color: "#f59e0b" },
            { label: "Completed", value: completed.length, icon: "✅", color: "#4ade80" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: "20px 20px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color }}>{stat.value}</div>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {inProgress.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 20 }}>Continue Learning</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {inProgress.map(({ course, progress }) => (
                <CourseCard key={course._id} course={course} showProgress={progress} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f3f4f6", marginBottom: 20 }}>Completed Courses</h2>
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
            <h2 style={{ color: "#f3f4f6", marginBottom: 8 }}>No courses yet</h2>
            <p style={{ color: "#9ca3af", marginBottom: 24 }}>Start learning by exploring our course catalog</p>
            <Button onClick={() => navigate("/explore")}>Explore Courses</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
