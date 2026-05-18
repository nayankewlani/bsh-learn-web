import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCourseStore, Course, Chapter, Lesson } from "../stores/courseStore";
import { useAuthStore } from "../stores/authStore";
import CourseSyllabus from "../components/course/CourseSyllabus";
import CheckoutModal from "../components/payment/CheckoutModal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Avatar from "../components/ui/Avatar";
import client from "../api/client";

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchCourseDetail, isLoading } = useCourseStore();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchCourseDetail(id).then((data) => {
      setCourse(data.course);
      setChapters(data.chapters);
      setLessons(data.lessons);
      setIsEnrolled(data.isEnrolled);
    });
  }, [id]);

  const handleEnrollFree = async () => {
    if (!user) { navigate("/login"); return; }
    setEnrolling(true);
    try {
      await client.post(`/enroll/${id}`);
      setIsEnrolled(true);
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonClick = (lesson: Lesson) => navigate(`/watch/${lesson._id}`);

  if (isLoading || !course) return (
    <div style={{ minHeight: "100vh", background: "#0a0914", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#7c3aed", fontSize: 16 }}>Loading course...</div>
    </div>
  );

  const price = course.discountPrice ?? course.price;

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(135deg,#0f0e1a,#1e1b4b)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 360px", gap: 40, alignItems: "start" }}>
          <div>
            <Badge color="purple">{course.category}</Badge>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#f3f4f6", margin: "12px 0 16px", lineHeight: 1.3 }}>{course.title}</h1>
            <p style={{ color: "#c4b5fd", fontSize: 16, lineHeight: 1.6, marginBottom: 20 }}>{course.description}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar src={course.educator?.avatar} name={course.educator?.name || "Educator"} size={32} />
                <span style={{ color: "#c4b5fd", fontSize: 14 }}>{course.educator?.name}</span>
              </div>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>⭐ {course.rating.toFixed(1)} ({course.ratingCount} reviews)</span>
              <span style={{ color: "#9ca3af", fontSize: 13 }}>👥 {course.enrollmentCount.toLocaleString()} students</span>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Badge color="blue">📚 {course.totalLessons} lessons</Badge>
              <Badge color="gray">🌐 {course.language}</Badge>
              <Badge color="orange">{course.level}</Badge>
            </div>
          </div>

          <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 20, padding: 24, position: "sticky", top: 80 }}>
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} style={{ width: "100%", borderRadius: 12, aspectRatio: "16/9", objectFit: "cover", marginBottom: 20 }} />
            ) : (
              <div style={{ width: "100%", aspectRatio: "16/9", background: "linear-gradient(135deg,#1e1b4b,#3b0764)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 48 }}>📚</span>
              </div>
            )}
            {isEnrolled ? (
              <Button fullWidth size="lg" onClick={() => navigate(`/watch/${lessons.find(l => l.isFree)?._id || lessons[0]?._id}`)}>
                Continue Learning →
              </Button>
            ) : price === 0 ? (
              <Button fullWidth size="lg" onClick={handleEnrollFree} loading={enrolling}>Enroll for Free</Button>
            ) : (
              <>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#a78bfa", marginBottom: 4 }}>₹{(price / 100).toLocaleString()}</div>
                {course.discountPrice && <div style={{ color: "#6b7280", textDecoration: "line-through", marginBottom: 12 }}>₹{(course.price / 100).toLocaleString()}</div>}
                <Button fullWidth size="lg" onClick={() => user ? setShowCheckout(true) : navigate("/login")}>Buy Now</Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
        {course.objectives?.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", marginBottom: 16 }}>What you'll learn</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
              {course.objectives.map((obj, i) => (
                <div key={i} style={{ display: "flex", gap: 10, color: "#c4b5fd", fontSize: 14 }}>
                  <span style={{ color: "#4ade80", flexShrink: 0 }}>✓</span>{obj}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f3f4f6", marginBottom: 16 }}>Course Content</h2>
          <CourseSyllabus chapters={chapters} lessons={lessons} isEnrolled={isEnrolled} onLessonClick={handleLessonClick} />
        </div>
      </div>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        courseId={id}
        courseTitle={course.title}
        coursePricePaise={price}
        onSuccess={() => setIsEnrolled(true)}
      />
    </div>
  );
};

export default CourseDetailPage;
