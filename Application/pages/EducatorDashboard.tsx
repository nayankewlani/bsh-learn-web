import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { Course } from "../stores/courseStore";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import client from "../api/client";

interface Analytics {
  totalCourses: number;
  totalStudents: number;
  totalRevenuePaise: number;
  totalLiveClasses: number;
  topCourses: Course[];
}

const EducatorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get("/educator/analytics"),
      client.get("/educator/courses"),
    ]).then(([a, c]) => {
      setAnalytics(a.data);
      setCourses(c.data.courses);
    }).finally(() => setLoading(false));
  }, []);

  const stats = analytics ? [
    { label: "Total Courses", value: analytics.totalCourses, icon: "📚", color: "#7c3aed" },
    { label: "Total Students", value: analytics.totalStudents.toLocaleString(), icon: "👥", color: "#a78bfa" },
    { label: "Revenue", value: `₹${(analytics.totalRevenuePaise / 100).toLocaleString()}`, icon: "💰", color: "#4ade80" },
    { label: "Live Classes", value: analytics.totalLiveClasses, icon: "🎥", color: "#f59e0b" },
  ] : [];

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh", padding: "32px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f3f4f6" }}>Educator Dashboard</h1>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 14 }}>Hello, {user?.name}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={() => navigate("/live/schedule")}>Schedule Live Class</Button>
            <Button onClick={() => navigate("/educator/create")}>+ New Course</Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#7c3aed" }}>Loading analytics...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 36 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f3f4f6" }}>Your Courses</h2>
              </div>
              <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, overflow: "hidden" }}>
                {courses.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
                    <p>You haven't created any courses yet</p>
                    <Button onClick={() => navigate("/educator/create")} style={{ marginTop: 8 }}>Create Your First Course</Button>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #1e1b4b" }}>
                        {["Course", "Status", "Students", "Rating", "Actions"].map((h) => (
                          <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#9ca3af", fontSize: 13, fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course._id} style={{ borderBottom: "1px solid #1e1b4b" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ color: "#f3f4f6", fontSize: 14, fontWeight: 600, maxWidth: 280 }}>{course.title}</div>
                            <div style={{ color: "#6b7280", fontSize: 12 }}>{course.category}</div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <Badge color={course.isPublished ? "green" : "orange"}>{course.isPublished ? "Published" : "Draft"}</Badge>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#c4b5fd", fontSize: 14 }}>{course.enrollmentCount}</td>
                          <td style={{ padding: "14px 16px", color: "#c4b5fd", fontSize: 14 }}>⭐ {course.rating.toFixed(1)}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <Button variant="secondary" size="sm" onClick={() => navigate(`/educator/courses/${course._id}`)}>Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/course/${course._id}`)}>View</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EducatorDashboard;
