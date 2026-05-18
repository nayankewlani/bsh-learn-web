import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { useCourseStore } from "../stores/courseStore";
import CourseCard from "../components/course/CourseCard";
import Button from "../components/ui/Button";
import { HiArrowRight, HiOutlineUserGroup, HiOutlineStar, HiOutlineAcademicCap, HiOutlineLightningBolt } from "react-icons/hi";
import { FaInstagram, FaYoutube, FaTelegramPlane } from "react-icons/fa";

import slide1 from "../assets/slide-1.png";
import slide2 from "../assets/slide-2.png";
import slide3 from "../assets/slide-3.png";
import slide4 from "../assets/slide-4.png";
import slide5 from "../assets/slide-5.png";
import akashicImg from "../assets/akashic.png";
import hypnosisImg from "../assets/hypnosis.png";

const SLIDES = [
  { img: slide1, title: "Art of Hypnosis", badge: "4 Days Workshop", text: "Only 10 in-person seats left. Register now to reserve your seat.", category: "Advance Hypnosis" },
  { img: slide2, title: "Hypnosis 2.0", badge: "Transform Your Mind", text: "Master modern hypnosis methods for deep healing and change.", category: "Hypnosis 2.0" },
  { img: slide3, title: "Shadow Work", badge: "Heal Your Past", text: "Heal your past emotions and understand your hidden self.", category: "Art of shadow work" },
  { img: slide4, title: "Reiki", badge: "Inner Transformation", text: "Unlock your true potential through energy healing mastery.", category: "Reiki" },
  { img: slide5, title: "Akashik", badge: "Upgrade Your Life", text: "Live a higher conscious life. Access the Akashic records.", category: "Akashik" },
];

const CATEGORIES = [
  { img: hypnosisImg, name: "Advance Hypnosis", desc: "Deep trance techniques" },
  { img: hypnosisImg, name: "Hypnosis 2.0", desc: "Modern hypnosis methods" },
  { img: slide3, name: "Art of shadow work", desc: "Inner transformation" },
  { img: slide4, name: "Reiki", desc: "Energy healing" },
  { img: akashicImg, name: "Akashik", desc: "Akashic records access" },
];

const STATS = [
  { value: "10M+", label: "Students", icon: <HiOutlineUserGroup size={20} /> },
  { value: "50K+", label: "Courses", icon: <HiOutlineAcademicCap size={20} /> },
  { value: "5K+", label: "Educators", icon: <HiOutlineStar size={20} /> },
  { value: "100+", label: "Subjects", icon: <HiOutlineLightningBolt size={20} /> },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", text: "BSHLearn transformed my understanding of energy healing. The Reiki course is exceptional!", avatar: "P" },
  { name: "Rahul Mehta", text: "The Advance Hypnosis course opened doors I never knew existed. World-class content.", avatar: "R" },
  { name: "Anjali Singh", text: "Shadow work sessions with live classes helped me heal past traumas. Highly recommend.", avatar: "A" },
  { name: "Vikram Patel", text: "Akashik course is life-changing. The educator's knowledge is unparalleled.", avatar: "V" },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { featuredCourses, fetchFeatured, isLoading } = useCourseStore();

  useEffect(() => { fetchFeatured(); }, []);

  return (
    <div style={{ background: "#0a0914", minHeight: "100vh" }}>

      {/* ─── Hero Slider ─── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 0" }}>
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
          style={{ borderRadius: 28, overflow: "hidden" }}
        >
          {SLIDES.map((slide, i) => (
            <SwiperSlide key={i}>
              <div style={{ position: "relative", width: "100%", height: "clamp(320px, 50vw, 500px)", overflow: "hidden" }}>
                <img
                  src={slide.img}
                  alt={slide.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {/* Dark overlay */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.82), rgba(0,0,0,0.2))" }} />
                {/* Content */}
                <div style={{ position: "absolute", top: "50%", left: "clamp(20px, 5vw, 60px)", transform: "translateY(-50%)", zIndex: 2, maxWidth: 520 }}>
                  <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", padding: "8px 18px", borderRadius: 40, fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 16, border: "1px solid rgba(255,255,255,0.15)" }}>
                    {slide.badge}
                  </div>
                  <h1 style={{ fontSize: "clamp(28px, 5vw, 58px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 16, letterSpacing: -1 }}>
                    {slide.title}
                  </h1>
                  <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.88)", lineHeight: 1.8, marginBottom: 28 }}>
                    {slide.text}
                  </p>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigate(`/explore?category=${encodeURIComponent(slide.category)}`)}
                      style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", color: "#fff", border: "none", padding: "14px 28px", borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "0.3s", display: "flex", alignItems: "center", gap: 8 }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                    >
                      Enroll Now <HiArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => navigate("/explore")}
                      style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "14px 28px", borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer", backdropFilter: "blur(8px)", transition: "0.3s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                    >
                      Browse All
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ─── Stats ─── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ color: "#7c3aed", display: "flex", justifyContent: "center", marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px 56px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", margin: 0, letterSpacing: -0.5 }}>Browse by Category</h2>
          <p style={{ color: "#9ca3af", margin: "6px 0 0", fontSize: 14 }}>Curated spiritual learning paths</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/explore?category=${encodeURIComponent(cat.name)}`)}
              style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, overflow: "hidden", cursor: "pointer", textAlign: "left", transition: "all 0.25s", padding: 0 }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "#7c3aed";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 32px rgba(124,58,237,0.22)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = "#1e1b4b";
                el.style.transform = "none";
                el.style.boxShadow = "none";
              }}
            >
              <div style={{ height: 110, overflow: "hidden", background: "#1e1b4b" }}>
                <img src={cat.img} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s" }} />
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ color: "#e9d5ff", fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{cat.name}</div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>{cat.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── Featured Courses ─── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px 56px" }}>
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

      {/* ─── Testimonials ─── */}
      <section style={{ background: "#0d0c1d", padding: "56px 20px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f3f4f6", textAlign: "center", marginBottom: 6, letterSpacing: -0.5 }}>What Our Students Say</h2>
          <p style={{ color: "#9ca3af", textAlign: "center", marginBottom: 36, fontSize: 14 }}>Real experiences from our learners</p>
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={20}
            slidesPerView={1}
            breakpoints={{ 640: { slidesPerView: 2 } }}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            style={{ paddingBottom: 44 }}
          >
            {TESTIMONIALS.map((t, i) => (
              <SwiperSlide key={i}>
                <div style={{ background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 16, padding: 24 }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                    {[1,2,3,4,5].map(s => <HiOutlineStar key={s} size={14} style={{ color: "#f59e0b" }} />)}
                  </div>
                  <p style={{ color: "#c4b5fd", fontSize: 14, lineHeight: 1.7, marginBottom: 18 }}>"{t.text}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 16 }}>{t.avatar}</div>
                    <div>
                      <div style={{ color: "#f3f4f6", fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>Student</div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 20px" }}>
        <div style={{
          background: "linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)",
          padding: "clamp(36px, 5vw, 64px) clamp(24px, 5vw, 56px)",
          textAlign: "center", borderRadius: 24,
          border: "1px solid #4c1d95", position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, color: "#f3f4f6", marginBottom: 10, letterSpacing: -0.5 }}>Become an Educator</h2>
          <p style={{ color: "#c4b5fd", fontSize: 16, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Share your knowledge, earn money. Join 5000+ educators teaching on BSHLearn.
          </p>
          <Button size="lg" onClick={() => navigate("/register")} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            Start Teaching Today <HiArrowRight size={18} />
          </Button>
        </div>
      </section>

      {/* ─── Social Bar ─── */}
      <section style={{ borderTop: "1px solid #1e1b4b", padding: "28px 20px", textAlign: "center" }}>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Follow us for updates</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          {[
            { icon: <FaInstagram size={20} />, label: "Instagram" },
            { icon: <FaYoutube size={20} />, label: "YouTube" },
            { icon: <FaTelegramPlane size={20} />, label: "Telegram" },
          ].map((s) => (
            <a key={s.label} href="#" aria-label={s.label}
              style={{ width: 44, height: 44, borderRadius: 12, background: "#13122a", border: "1px solid #1e1b4b", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#a78bfa"; e.currentTarget.style.borderColor = "#7c3aed"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#1e1b4b"; }}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
