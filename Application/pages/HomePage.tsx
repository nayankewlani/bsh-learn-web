import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useCourseStore } from "../stores/courseStore";
import CourseCard from "../components/course/CourseCard";
import Button from "../components/ui/Button";
import {
  HiOutlineAcademicCap,
  HiOutlineLightningBolt,
  HiOutlineStar,
  HiOutlineUserGroup,
  HiArrowRight,
  HiOutlinePlay,
} from "react-icons/hi";

const CATEGORIES = [
  { icon: "🧠", name: "Advance Hypnosis", desc: "Deep trance techniques" },
  { icon: "✨", name: "Hypnosis 2.0", desc: "Modern hypnosis methods" },
  { icon: "🌑", name: "Art of shadow work", desc: "Inner transformation" },
  { icon: "🌿", name: "Reiki", desc: "Energy healing" },
  { icon: "📖", name: "Akashik", desc: "Akashic records access" },
];

const STATS = [
  { value: "10M+", label: "Students", icon: <HiOutlineUserGroup size={22} /> },
  { value: "50K+", label: "Courses", icon: <HiOutlineAcademicCap size={22} /> },
  { value: "5K+", label: "Educators", icon: <HiOutlineStar size={22} /> },
  { value: "100+", label: "Subjects", icon: <HiOutlineLightningBolt size={22} /> },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Student", text: "BSHLearn transformed my understanding of energy healing. The Reiki course is exceptional!", avatar: "P" },
  { name: "Rahul Mehta", role: "Student", text: "The Advance Hypnosis course opened doors I never knew existed. World-class content.", avatar: "R" },
  { name: "Anjali Singh", role: "Student", text: "Shadow work sessions with the live classes helped me heal past traumas. Highly recommend.", avatar: "A" },
  { name: "Vikram Patel", role: "Student", text: "Akashik course is life-changing. The educator's knowledge is unparalleled.", avatar: "V" },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { featuredCourses, fetchFeatured, isLoading } = useCourseStore();

  useEffect(() => { fetchFeatured(); }, []);

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh" }}>

      {/* ─── Hero ─── */}
      <section style={{
        background: "linear-gradient(135deg, #0f0e1a 0%, #1a1040 40%, #0f0e1a 100%)",
        padding: "90px 24px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, right: -60, width: 250, height: 250, background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 820, margin: "0 auto", position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: 20, padding: "6px 16px", marginBottom: 24, fontSize: 13, color: "#a78bfa"
          }}>
            <HiOutlineLightningBolt size={14} />
            India's #1 Spiritual Learning Platform
          </div>

          <h1 style={{
            fontSize: "clamp(34px, 6vw, 64px)", fontWeight: 900, color: "#f3f4f6",
            lineHeight: 1.12, margin: "0 0 22px", letterSpacing: -1,
          }}>
            Learn from India's{" "}
            <span style={{ background: "linear-gradient(135deg,#7c3aed,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Best Educators
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "#9ca3af", marginBottom: 40, lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px" }}>
            Access live classes, recorded courses in Hypnosis, Reiki, Shadow Work & Akashik.
            Transform your life with authentic spiritual education.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Button size="lg" onClick={() => navigate("/explore")} style={{ gap: 8, display: "flex", alignItems: "center" }}>
              Explore Courses <HiArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/live")} style={{ gap: 8, display: "flex", alignItems: "center" }}>
              <HiOutlinePlay size={18} /> Watch Live Classes
            </Button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 60, flexWrap: "wrap" }}>
            {STATS.map((s) => (
              <div key={s.label} style={{
                textAlign: "center", background: "rgba(30,27,75,0.6)",
                border: "1px solid #2d2a6e", borderRadius: 14, padding: "16px 24px",
                backdropFilter: "blur(8px)",
              }}>
                <div style={{ color: "#7c3aed", marginBottom: 6, display: "flex", justifyContent: "center" }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section style={{ padding: "64px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", margin: 0, letterSpacing: -0.5 }}>Browse by Category</h2>
            <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: 14 }}>Explore our curated spiritual learning paths</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/explore?category=${encodeURIComponent(cat.name)}`)}
              style={{
                background: "#13122a", border: "1px solid #1e1b4b",
                borderRadius: 14, padding: "18px 20px",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.background = "#1e1b4b";
                el.style.borderColor = "#7c3aed";
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = "0 8px 24px rgba(124,58,237,0.2)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.background = "#13122a";
                el.style.borderColor = "#1e1b4b";
                el.style.transform = "none";
                el.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{cat.icon}</div>
              <div style={{ color: "#e9d5ff", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{cat.name}</div>
              <div style={{ color: "#6b7280", fontSize: 12 }}>{cat.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Featured Courses ─── */}
      <section style={{ padding: "0 24px 64px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", margin: 0, letterSpacing: -0.5 }}>Featured Courses</h2>
            <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: 14 }}>Hand-picked by our educators</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/explore")} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            View All <HiArrowRight size={14} />
          </Button>
        </div>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{ background: "#13122a", borderRadius: 16, height: 320, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {featuredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>No featured courses yet</div>
        )}
      </section>

      {/* ─── Testimonials (Swiper) ─── */}
      <section style={{ background: "#0d0c1d", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>What Our Students Say</h2>
          <p style={{ color: "#9ca3af", textAlign: "center", marginBottom: 40, fontSize: 14 }}>Real experiences from our learners</p>
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{ 640: { slidesPerView: 2 } }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            style={{ paddingBottom: 40 }}
          >
            {TESTIMONIALS.map((t, i) => (
              <SwiperSlide key={i}>
                <div style={{
                  background: "#13122a", border: "1px solid #1e1b4b",
                  borderRadius: 16, padding: "24px", height: "100%",
                }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                    {[1,2,3,4,5].map(s => <HiOutlineStar key={s} size={14} style={{ color: "#f59e0b" }} />)}
                  </div>
                  <p style={{ color: "#c4b5fd", fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 16 }}>{t.avatar}</div>
                    <div>
                      <div style={{ color: "#f3f4f6", fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ─── CTA: Become Educator ─── */}
      <section style={{ padding: "64px 24px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)",
          padding: "60px 40px", textAlign: "center", borderRadius: 24,
          border: "1px solid #4c1d95", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: 34, fontWeight: 900, color: "#f3f4f6", marginBottom: 12, letterSpacing: -0.5 }}>Become an Educator</h2>
          <p style={{ color: "#c4b5fd", fontSize: 16, marginBottom: 32, maxWidth: 480, margin: "0 auto 32px" }}>
            Share your knowledge, earn money. Join 5000+ educators teaching on BSHLearn.
          </p>
          <Button size="lg" onClick={() => navigate("/register")} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            Start Teaching Today <HiArrowRight size={18} />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
