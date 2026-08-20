import React, { useEffect, useState } from "react";
import HealingHub from "../components/HealingHub";
import PrivateSession from "../components/PrivateSession";
import BenefitsStrip from "../components/BenefitsStrip";
import FAQAccordion from "../components/FAQAccordion";
import { useNavigate } from "react-router-dom";
import { useCourseStore } from "../stores/courseStore";
import { useThemeStore } from "../stores/themeStore";
import CourseCard from "../components/course/CourseCard";
import { HiOutlineSearch, HiOutlineArrowRight, HiOutlinePlay, HiOutlineCheckCircle, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { FaInstagram, FaYoutube, FaFacebook, FaLinkedin, FaGlobe } from "react-icons/fa";
import client from "../api/client";

import heroImg from "../assets/hero.png";
import advHypnosisImg from "../assets/advanced-hypnosis.png";
import hypnosisImg from "../assets/hypnosis.png";
import hypnosis2Img from "../assets/hypnosis-2.png";
import reikiImg from "../assets/reiki.png";
import shadowWorkImg from "../assets/shadow-work.png";
import geetaMakhijaniImg from "../assets/geeta-makhijani.png";
import deepTranceImg from "../assets/deep-trance.png";
import hypnosisLangImg from "../assets/hypnosis-language-patterns.png";
import akashicImg from "../assets/akashic.png";
import mesmerismImg from "../assets/mesmerism.png";
import psychicImg from "../assets/psychic-powers.png";
import slide1 from "../assets/slide-1.png";
import slide2 from "../assets/slide-2.png";
import slide3 from "../assets/slide-3.png";
import slide4 from "../assets/slide-4.png";
import vedic from "../assets/vedic-astro.jpeg";
import pradeepKumarImg from "../assets/IMG_8265.JPG.jpeg";
import naliniYadavImg from "../assets/Nalini-J-Yadav.jpg.jpeg";
import vikasBhardwajImg from "../assets/Vikas-Bhardwaj.jpg.jpeg";
import sumanBatraImg from "../assets/suamn batra.jpeg";
import deepikaHandaImg from "../assets/deepika handa.jpeg";
import ankitVigImg from "../assets/Ankit Vig.jpeg";
import vandanaKhuranaImg from "../assets/Vandana khurana.jpeg";
import rajeshKumarImg from "../assets/Rajesh kumar.jpeg";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface HomeClassAPI {
  _id: string;
  title: string;
  educator: string;
  subject: string;
  subjectColor: string;
  lang: string;
  thumbnailUrl: string;
  recordingUrl: string;
  views: string;
  bgColor: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
}

// ─── Static fallback data (shown until API loads) ──────────────────────────────

const GOALS = [
  { img: advHypnosisImg, name: "Advance Hypnosis",   count: "12 Batches", link: "/courses/advance-hypnosis", price: "₹29,999", originalPrice: "₹59,999", tag: "BESTSELLER", color: "#7c3aed", comingSoon: false },
  { img: hypnosis2Img,   name: "Hypnosis 2.0",       count: "8 Batches",  link: "/courses/hypnosis-2",       price: "₹999",    originalPrice: "₹1,999",  tag: "HOT",        color: "#7c3aed", comingSoon: false },
  { img: shadowWorkImg,  name: "Art of Shadow Work",  count: "6 Batches",  price: "₹2,999", originalPrice: "₹5,999", tag: "", color: "#0d9488", comingSoon: true },
  { img: reikiImg,       name: "Reiki",               count: "10 Batches", price: "₹2,499", originalPrice: "₹4,999", tag: "", color: "#16a34a", comingSoon: true },
  { img: akashicImg,     name: "Akashik Records",     count: "5 Batches",  price: "₹3,499", originalPrice: "₹6,999", tag: "", color: "#0ea5e9", comingSoon: true },
  { img: vedic,          name: "Vedic Astrology",     count: "6 Batches",  price: "₹2,999", originalPrice: "₹5,999", tag: "", color: "#d97706", comingSoon: true },
];

interface ClassItem {
  id: string; subject: string; subjectColor: string; lang: string;
  title: string; educator: string; views: string; img: string; bg: string;
  imgPosition?: string; recordingUrl?: string;
}

const FALLBACK_CLASSES: ClassItem[] = [
  { id: "h1", subject: "Advance Hypnosis", subjectColor: "#7c3aed", lang: "Hindi", title: "Deep Trance Induction — Level 1 Mastery", educator: "Master Pradeep", views: "1.2K", img: deepTranceImg, bg: "#1e1b4b" },
  { id: "h2", subject: "Advance Hypnosis", subjectColor: "#7c3aed", lang: "Hindi", title: "NLP & Hypnosis Integration Session", educator: "Master Pradeep", views: "987", img: slide1, bg: "#1a1640", imgPosition: "top center" },
  { id: "h3", subject: "Advance Hypnosis", subjectColor: "#7c3aed", lang: "Hindi/English", title: "Hypnotic Language Patterns & Scripts", educator: "BSH Faculty", views: "1.5K", img: hypnosisLangImg, bg: "#1e1b4b" },
  { id: "h4", subject: "Advance Hypnosis", subjectColor: "#7c3aed", lang: "Hindi", title: "Self-Hypnosis for Daily Transformation", educator: "Master Pradeep", views: "836", img: slide2, bg: "#160f30" },
  { id: "s1", subject: "Shadow Work", subjectColor: "#0d9488", lang: "Hindi", title: "Healing Suppressed Emotions Through Shadow Integration", educator: "Dr Pradeep Kumar", views: "1.8K", img: slide3, bg: "#0d1f1c" },
  { id: "s2", subject: "Shadow Work", subjectColor: "#0d9488", lang: "Hindi", title: "Inner Child Healing — Session 2", educator: "Dr Pradeep Kumar", views: "2.1K", img: slide3, bg: "#091a18" },
  { id: "s3", subject: "Shadow Work", subjectColor: "#0d9488", lang: "Hindi/English", title: "Trauma Release & Emotional Freedom", educator: "BSH Faculty", views: "976", img: slide3, bg: "#0d1f1c" },
  { id: "s4", subject: "Shadow Work", subjectColor: "#0d9488", lang: "Hindi", title: "Mirror Work — Confronting the Hidden Self", educator: "Geeta Makhijani", views: "1.3K", img: geetaMakhijaniImg, bg: "#091a18" },
  { id: "r1", subject: "Reiki", subjectColor: "#16a34a", lang: "Hindi/English", title: "Level 1 Attunement — Energy Healing Basics", educator: "BSH Faculty", views: "1.5K", img: slide4, bg: "#0a2318" },
  { id: "r2", subject: "Reiki", subjectColor: "#16a34a", lang: "Hindi", title: "Chakra Balancing Through Reiki Practice", educator: "BSH Faculty", views: "893", img: slide4, bg: "#0a2318" },
  { id: "r3", subject: "Reiki", subjectColor: "#16a34a", lang: "Hindi/English", title: "Distance Healing Techniques — Level 2", educator: "Reiki Master Ji", views: "1.1K", img: slide4, bg: "#0c2a1e" },
  { id: "r4", subject: "Reiki", subjectColor: "#16a34a", lang: "Hindi", title: "Reiki for Physical Pain Relief", educator: "BSH Faculty", views: "756", img: slide4, bg: "#0a2318" },
  { id: "a1", subject: "Autism Healing", subjectColor: "#d97706", lang: "Hindi", title: "Energy Healing for Autism Spectrum Disorders", educator: "Dr Pradeep Kumar", views: "836", img: mesmerismImg, bg: "#1c0f02" },
  { id: "a2", subject: "Autism Healing", subjectColor: "#d97706", lang: "Hindi", title: "Sensory Integration Through Pranic Healing", educator: "BSH Faculty", views: "643", img: mesmerismImg, bg: "#1c0f02" },
  { id: "a3", subject: "Autism Healing", subjectColor: "#d97706", lang: "Hindi/English", title: "Emotional Regulation Techniques for Special Needs", educator: "Dr Pradeep Kumar", views: "521", img: psychicImg, bg: "#1a0d01" },
  { id: "a4", subject: "Autism Healing", subjectColor: "#d97706", lang: "Hindi", title: "Holistic Therapy & Spiritual Support for Autism", educator: "BSH Faculty", views: "478", img: mesmerismImg, bg: "#1c0f02" },
  { id: "c1", subject: "Corporate Build-up", subjectColor: "#2563eb", lang: "Hindi/English", title: "Subconscious Reprogramming for Peak Performance", educator: "Master Pradeep", views: "2.1K", img: slide1, bg: "#0a0f2e" },
  { id: "c2", subject: "Corporate Build-up", subjectColor: "#2563eb", lang: "English", title: "Leadership Mindset Through Hypnosis & NLP", educator: "Master Pradeep", views: "1.7K", img: slide2, bg: "#070c28" },
  { id: "c3", subject: "Corporate Build-up", subjectColor: "#2563eb", lang: "Hindi/English", title: "Stress Management Using Spiritual Techniques", educator: "BSH Faculty", views: "1.4K", img: slide1, bg: "#0a0f2e" },
  { id: "c4", subject: "Corporate Build-up", subjectColor: "#2563eb", lang: "English", title: "Emotional Intelligence & Spiritual Awareness at Work", educator: "Dr Pradeep Kumar", views: "983", img: slide2, bg: "#070c28" },
  { id: "ak1", subject: "Akashik Records", subjectColor: "#0ea5e9", lang: "Hindi/English", title: "Accessing the Universal Knowledge Field — Session 1", educator: "BSH Faculty", views: "756", img: akashicImg, bg: "#050d1c" },
  { id: "ak2", subject: "Akashik Records", subjectColor: "#0ea5e9", lang: "Hindi", title: "Past Life Reading Through Akashik Access", educator: "BSH Faculty", views: "621", img: akashicImg, bg: "#050d1c" },
  { id: "ak3", subject: "Akashik Records", subjectColor: "#0ea5e9", lang: "Hindi/English", title: "Soul Contract & Life Purpose Revelations", educator: "BSH Faculty", views: "534", img: akashicImg, bg: "#06101f" },
  { id: "ak4", subject: "Akashik Records", subjectColor: "#0ea5e9", lang: "Hindi", title: "Clearing Karmic Patterns Using Akashik Wisdom", educator: "BSH Faculty", views: "489", img: akashicImg, bg: "#050d1c" },
];

const FALLBACK_SUBJECT_TABS = ["Advance Hypnosis", "Shadow Work", "Reiki", "Autism Healing", "Corporate Build-up", "Akashik Records"];

const TOP_EDUCATORS = [
  { name: "BSH Faculty", role: "Akashik & Energy Expert", bio: "Certified Akashik Records practitioner with expertise in guiding students to access universal knowledge, past life insights and energy healing modalities.", watchMins: "98M", followers: "45K", img: akashicImg, badge: "STAR", yearsExp: "10+ yrs", isVerified: true },
];

const FEATURES = [
  { bg: "linear-gradient(135deg,#1e1b4b,#3b0764)", emoji: "📺", title: "Daily live classes", desc: "Chat with educators, ask questions, answer live polls, and get your doubts cleared — all while the class is going on." },
  { bg: "linear-gradient(135deg,#064e3b,#065f46)", emoji: "📚", title: "Practice and revise", desc: "Learning isn't just limited to classes. Access recorded lectures, notes and practice sessions for your revision." },
  { bg: "linear-gradient(135deg,#7c2d12,#9a3412)", emoji: "📱", title: "Learn anytime, anywhere", desc: "One subscription gets you access to all our live and recorded classes to watch from the comfort of any of your devices." },
];

const STATS = [
  { value: "20+", label: "Subjects", emoji: "📖" },
  { value: "50K+", label: "Students", emoji: "👥" },
  { value: "500+", label: "Live Classes", emoji: "🎥" },
  { value: "1M+", label: "Mins. Watched", emoji: "⏱" },
];

const HERO_HEALERS = [
  { name: "Dr. Pradeep Kumar", subject: "Hypnosis & NLP", exp: "20+ yrs", rating: "4.9", img: pradeepKumarImg, color: "#7c3aed", isLive: true },
  { name: "Geeta Makhijani", subject: "Shadow Work", exp: "15+ yrs", rating: "4.8", img: geetaMakhijaniImg, color: "#0d9488", isLive: false },
  { name: "Nalini J. Yadav", subject: "Emotional Healing", exp: "14+ yrs", rating: "4.8", img: naliniYadavImg, color: "#0d9488", isLive: false },
  { name: "Vikas Bhardwaj", subject: "NLP Coaching", exp: "12+ yrs", rating: "4.9", img: vikasBhardwajImg, color: "#2563eb", isLive: true },
  { name: "Vandana Khurana", subject: "Spiritual Healing", exp: "11+ yrs", rating: "4.8", img: vandanaKhuranaImg, color: "#9333ea", isLive: false },
  { name: "Dr. Suman Batra", subject: "Pranic Healing", exp: "13+ yrs", rating: "4.9", img: sumanBatraImg, color: "#0891b2", isLive: false },
  { name: "Deepika Handa", subject: "Mind Wellness", exp: "9+ yrs", rating: "4.8", img: deepikaHandaImg, color: "#d97706", isLive: true },
  { name: "Ankit Vig", subject: "NLP Coaching", exp: "10+ yrs", rating: "4.9", img: ankitVigImg, color: "#2563eb", isLive: false },
  { name: "Rajesh Kumar", subject: "Energy Healing", exp: "12+ yrs", rating: "4.8", img: rajeshKumarImg, color: "#16a34a", isLive: true },
];

const TESTIMONIALS = [
  { name: "Priya Sharma", title: "Software Engineer, Bengaluru", text: "BSH Healers transformed my understanding of energy healing. The Reiki course is exceptional!", init: "P" },
  { name: "Rahul Mehta", title: "Business Owner, Mumbai", text: "The Advance Hypnosis course opened doors I never knew existed. World-class content.", init: "R" },
  { name: "Anjali Singh", title: "School Principal, Delhi", text: "Shadow work sessions with live classes helped me heal past traumas. Highly recommend.", init: "A" },
  { name: "Vikram Patel", title: "Homemaker, Ahmedabad", text: "Akashik course is life-changing. The educator's knowledge is unparalleled.", init: "V" },
];

// ─── Video Modal ─────────────────────────────────────────────────────────────

const VideoModal: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => {
  // Detect YouTube and embed properly
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  const embedUrl = ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` : null;

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 900, background: "#0f172a", borderRadius: 16, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", border: "1px solid #1e1b4b" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #1e1b4b" }}>
          <span style={{ color: "#c4b5fd", fontSize: 14, fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: 22, lineHeight: 1, marginLeft: 16 }}>✕</button>
        </div>
        {/* Player */}
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          {embedUrl ? (
            <iframe src={embedUrl} title={title} allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media; picture-in-picture" />
          ) : (
            <video src={url} controls autoPlay
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#000" }} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─── GoalCard ──────────────────────────────────────────────────────────────────

interface GoalDef {
  img: string; name: string; count: string; link?: string;
  price: string; originalPrice: string; tag: string; color: string; comingSoon: boolean;
}

const GoalCard: React.FC<{ goal: GoalDef; discountPct: number; onNavigate: () => void }> = ({ goal, discountPct, onNavigate }) => {
  const { t } = useThemeStore();
  const [hovered, setHovered] = useState(false);
  const cs = goal.comingSoon;

  return (
    <div
      onClick={cs ? undefined : onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: t.bgCard,
        border: `1.5px solid ${hovered && !cs ? goal.color : t.border}`,
        borderRadius: 18,
        overflow: "hidden",
        cursor: cs ? "default" : "pointer",
        transition: "transform 0.22s, box-shadow 0.22s, border-color 0.22s",
        transform: hovered && !cs ? "translateY(-5px)" : "none",
        boxShadow: hovered && !cs ? `0 16px 40px ${goal.color}22` : `0 2px 8px ${t.shadow}`,
        opacity: cs ? 0.58 : 1,
        filter: cs ? "grayscale(35%)" : "none",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img
          src={goal.img} alt={goal.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", transition: "transform 0.4s", transform: hovered && !cs ? "scale(1.06)" : "scale(1)" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)" }} />

        {/* Discount badge — only for active courses */}
        {!cs && (
          <div style={{ position: "absolute", top: 10, left: 10, background: "#16a34a", borderRadius: 6, padding: "3px 9px" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{discountPct}% OFF</span>
          </div>
        )}

        {/* Tag badge */}
        {goal.tag && !cs && (
          <div style={{ position: "absolute", top: 10, right: 10, background: goal.tag === "BESTSELLER" ? "#f59e0b" : goal.tag === "HOT" ? "#ef4444" : "#7c3aed", borderRadius: 6, padding: "3px 9px" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{goal.tag === "HOT" ? "🔥 " : goal.tag === "BESTSELLER" ? "⭐ " : ""}{goal.tag}</span>
          </div>
        )}

        {/* Batch count */}
        <div style={{ position: "absolute", bottom: 10, left: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>{goal.count}</span>
        </div>
      </div>

      {/* Info area */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3 style={{ color: t.textPrimary, fontSize: 15, fontWeight: 800, margin: "0 0 10px", lineHeight: 1.3 }}>{goal.name}</h3>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ color: cs ? t.textMuted : goal.color, fontSize: 17, fontWeight: 900 }}>{goal.price}</span>
          <span style={{ color: t.textMuted, fontSize: 13, textDecoration: "line-through" }}>{goal.originalPrice}</span>
        </div>

        {/* Perks */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {["Lifetime Access", "Certificate"].map((perk) => (
            <span key={perk} style={{ fontSize: 10, color: t.textSecond, background: t.bgSecondary, border: `1px solid ${t.borderLight}`, borderRadius: 20, padding: "3px 8px", fontWeight: 600 }}>
              ✓ {perk}
            </span>
          ))}
        </div>

        {/* CTA */}
        {cs ? (
          <div style={{ background: t.bgSecondary, border: `1.5px solid ${t.borderLight}`, color: t.textMuted, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 13, fontWeight: 700 }}>
            🕐 New Batches Coming Soon
          </div>
        ) : (
          <div style={{ background: hovered ? goal.color : "none", border: `1.5px solid ${hovered ? goal.color : t.borderLight}`, color: hovered ? "#fff" : t.textSecond, borderRadius: 8, padding: "8px 0", textAlign: "center", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>
            Enroll Now →
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ClassCard ─────────────────────────────────────────────────────────────────

const ClassCard: React.FC<ClassItem & { onClick?: () => void }> = ({ subject, subjectColor, lang, title, educator, views, img, bg, imgPosition, recordingUrl, onClick }) => {
  const { t } = useThemeStore();
  return (
    <div
      onClick={onClick}
      style={{ minWidth: 200, maxWidth: 200, background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", flexShrink: 0, transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${t.shadow}`; e.currentTarget.style.borderColor = "#3730a3"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = t.border; }}
    >
      <div style={{ position: "relative", height: 140, background: bg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <img src={img} alt={subject} style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", objectPosition: imgPosition ?? "center", border: "3px solid rgba(255,255,255,0.15)", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, ${subjectColor}33 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.65)", borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: 4, backdropFilter: "blur(4px)" }}>
          <span style={{ color: "#d1d5db", fontSize: 11 }}>👁 {views}</span>
        </div>
        {recordingUrl && (
          <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.72)", borderRadius: 20, padding: "3px 8px", display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(4px)", zIndex: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />
            <span style={{ color: "#4ade80", fontSize: 10, fontWeight: 700 }}>Recording</span>
          </div>
        )}
        <div style={{ position: "absolute", bottom: 10, right: 10, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <span style={{ color: subjectColor, fontSize: 10, marginLeft: 2 }}>▶</span>
        </div>
      </div>
      <div style={{ padding: "10px 12px 14px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: t.textSecond, fontWeight: 500 }}>{lang}</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: t.textMuted, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: subjectColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subject}</span>
        </div>
        <p style={{ color: t.textPrimary, fontSize: 13, fontWeight: 600, lineHeight: 1.4, margin: "0 0 6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{title}</p>
        <p style={{ color: t.textSecond, fontSize: 12, margin: 0 }}>{educator}</p>
      </div>
    </div>
  );
};

// Helper: convert API class to ClassItem format for rendering
const apiToClassItem = (cls: HomeClassAPI): ClassItem => ({
  id: cls._id,
  subject: cls.subject,
  subjectColor: cls.subjectColor || "#7c3aed",
  lang: cls.lang || "Hindi",
  title: cls.title,
  educator: cls.educator,
  views: cls.views || "0",
  img: cls.thumbnailUrl || slide1,
  bg: cls.bgColor || "#1e1b4b",
  recordingUrl: cls.recordingUrl || "",
});

// ─── Component ─────────────────────────────────────────────────────────────────

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { featuredCourses, fetchFeatured, isLoading } = useCourseStore();
  const { t } = useThemeStore();
  const [searchQ, setSearchQ] = useState("");
  const [email, setEmail] = useState("");
  const [activeSubject, setActiveSubject] = useState("");

  // API-driven home classes
  const [homeClasses, setHomeClasses]     = useState<HomeClassAPI[]>([]);
  const [classesReady, setClassesReady]   = useState(false);
  const [videoModal, setVideoModal]       = useState<{ url: string; title: string } | null>(null);
  const [activeHealerNames, setActiveHealerNames] = useState<Set<string> | null>(null);

  // null = still loading (render nothing to avoid flash of paused healers)
  // Set  = API responded (show only active ones; fallback shows all on error)
  const visibleHealers = activeHealerNames === null
    ? []
    : HERO_HEALERS.filter(h => activeHealerNames.has(h.name.toLowerCase()));

  useEffect(() => {
    fetchFeatured();
    client.get("/chat/online-educators")
      .then(r => {
        const names: string[] = ((r.data as any).educators || []).map((e: any) => (e.name as string).toLowerCase());
        setActiveHealerNames(new Set(names));
      })
      .catch(() => {
        // API failed — show all hardcoded healers as fallback
        setActiveHealerNames(new Set(HERO_HEALERS.map(h => h.name.toLowerCase())));
      });
    client.get("/home-classes")
      .then(r => {
        const cls: HomeClassAPI[] = (r.data as any).classes || [];
        setHomeClasses(cls);
        if (cls.length > 0 && !activeSubject) {
          const firstSubject = cls[0].subject;
          setActiveSubject(firstSubject);
        }
      })
      .catch(() => {})
      .finally(() => setClassesReady(true));
  }, []);

  // Derived class lists — prefer API data, fall back to hardcoded
  const useApiData = classesReady && homeClasses.length > 0;

  const subjectTabs: string[] = useApiData
    ? [...new Set(homeClasses.map(c => c.subject))]
    : FALLBACK_SUBJECT_TABS;

  const currentSubject = activeSubject || subjectTabs[0] || "";

  const engagingClasses: ClassItem[] = useApiData
    ? homeClasses.filter(c => c.isFeatured).slice(0, 8).map(apiToClassItem)
    : FALLBACK_CLASSES.filter((_, i) => i % 4 === 0 || i % 7 === 0).slice(0, 8);

  const filteredClasses: ClassItem[] = useApiData
    ? homeClasses.filter(c => c.subject === currentSubject).map(apiToClassItem)
    : FALLBACK_CLASSES.filter(c => c.subject === currentSubject);

  const handleClassClick = (cls: ClassItem) => {
    if (cls.recordingUrl) {
      // Check if it's a YouTube or direct video — open in modal
      const isYT  = cls.recordingUrl.includes("youtu");
      const isVid = /\.(mp4|mov|avi|mkv|webm|m4v)/i.test(cls.recordingUrl);
      if (isYT || isVid) {
        setVideoModal({ url: cls.recordingUrl, title: cls.title });
      } else {
        window.open(cls.recordingUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      navigate("/live");
    }
  };

  const handleGoalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(searchQ)}`);
  };

  return (
    <div style={{ background: t.bgPrimary, minHeight: "100vh" }}>

      {/* Video Modal */}
      {videoModal && <VideoModal url={videoModal.url} title={videoModal.title} onClose={() => setVideoModal(null)} />}

      {/* ══ §1 HERO ══ */}
      <section style={{ background: t.isDark ? "linear-gradient(160deg,#0c0b18 0%,#15123a 60%,#0d1f1c 100%)" : "linear-gradient(160deg,#f7f5f1 0%,#f0ece3 50%,#ede9fe 100%)", borderBottom: `1px solid ${t.border}`, overflow: "hidden", position: "relative" }}>
        {/* Ambient background glows */}
        <div style={{ position: "absolute", top: -120, right: -120, width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,148,136,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "72px 24px 64px", display: "flex", alignItems: "center", gap: 52, flexWrap: "wrap", position: "relative" }}>

          {/* ── Left: copy ── */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.28)", borderRadius: 40, padding: "6px 16px", marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", display: "inline-block", animation: "pulse 1.8s infinite" }} />
              <span style={{ color: t.isDark ? "#a78bfa" : "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: 0.8 }}>India's #1 Spiritual Healing Platform</span>
            </div>

            <h1 style={{ fontSize: "clamp(36px,4.8vw,60px)", fontWeight: 900, color: t.textPrimary, lineHeight: 1.08, marginBottom: 6, letterSpacing: -1.5 }}>
              Heal deeper.
            </h1>
            <h1 style={{ fontSize: "clamp(36px,4.8vw,60px)", fontWeight: 900, color: "#7c3aed", lineHeight: 1.08, marginBottom: 22, letterSpacing: -1.5 }}>
              Live freer.
            </h1>

            <p style={{ color: t.textSecond, fontSize: 17, lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
              Join <span style={{ color: t.isDark ? "#a78bfa" : "#7c3aed", fontWeight: 700 }}>50,000+</span> students learning from India's best healers. Daily live classes, on-demand recordings & personal 1:1 sessions — all in one place.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
              <button
                onClick={() => navigate("/register")}
                style={{ background: "#7c3aed", border: "none", color: "#fff", padding: "14px 28px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 8px 24px rgba(124,58,237,0.38)", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(124,58,237,0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.38)"; }}
              >
                ✨ Start Learning Free <HiOutlineArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate("/consultation")}
                style={{ background: "none", border: `2px solid ${t.isDark ? "#4c1d95" : "#c4b5fd"}`, color: t.isDark ? "#a78bfa" : "#7c3aed", padding: "14px 22px", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.isDark ? "#4c1d95" : "#c4b5fd"; e.currentTarget.style.background = "none"; }}
              >
                Book a 1:1 Session →
              </button>
            </div>

            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["🧘 Reduce stress & anxiety", "#4ade80"], ["🎓 Certificate on completion", t.isDark ? "#a78bfa" : "#7c3aed"], ["📱 Learn on any device", "#60a5fa"]].map(([text, c]) => (
                <span key={text as string} style={{ color: c as string, fontSize: 13, fontWeight: 600 }}>{text as string}</span>
              ))}
            </div>
          </div>

          {/* ── Right: Scrolling Healers ── */}
          <div style={{ flex: "0 1 380px", minWidth: 0, width: "100%" }}>
            <style>{`
              @keyframes healerScroll {
                0% { transform: translateY(0); }
                100% { transform: translateY(-50%); }
              }
              .healer-scroller-inner { animation: healerScroll 28s linear infinite; }
              .healer-scroller-wrap:hover .healer-scroller-inner { animation-play-state: paused; }
            `}</style>

            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: t.isDark ? "#a78bfa" : "#7c3aed", fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>Meet Our Healers</span>
              <span style={{ color: t.textMuted, fontSize: 10, fontStyle: "italic" }}>Hover to pause</span>
            </div>

            <div className="healer-scroller-wrap" style={{ height: 400, overflow: "hidden", position: "relative", borderRadius: 18 }}>
              {/* Fade top */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 64, zIndex: 2, pointerEvents: "none", background: `linear-gradient(to bottom, ${t.isDark ? "#0c0b18" : "#f7f5f1"}, transparent)` }} />
              {/* Fade bottom */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, zIndex: 2, pointerEvents: "none", background: `linear-gradient(to top, ${t.isDark ? "#0c0b18" : "#f7f5f1"}, transparent)` }} />

              <div className="healer-scroller-inner" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...visibleHealers, ...visibleHealers].map((h, i) => (
                  <div key={i}
                    style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.2s, box-shadow 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = h.color; e.currentTarget.style.boxShadow = `0 4px 16px ${h.color}22`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: `2.5px solid ${h.color}`, boxShadow: `0 0 12px ${h.color}55` }}>
                      <img src={h.img} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: t.textPrimary, fontSize: 13, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: h.color, fontWeight: 600, marginTop: 2 }}>{h.subject}</div>
                      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 3 }}>🏅 {h.exp} · ⭐ {h.rating}</div>
                    </div>
                    {h.isLive ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: "3px 9px", flexShrink: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block", animation: "navLivePulse 1.5s ease-in-out infinite" }} />
                        <span style={{ color: "#ef4444", fontSize: 9, fontWeight: 800 }}>LIVE</span>
                      </div>
                    ) : (
                      <div style={{ background: "rgba(74,140,124,0.1)", border: "1px solid rgba(74,140,124,0.25)", borderRadius: 20, padding: "3px 9px", flexShrink: 0 }}>
                        <span style={{ color: "#4a8c7c", fontSize: 9, fontWeight: 800 }}>✓ VERIFIED</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-around", marginTop: 14, padding: "12px 16px", background: t.isDark ? "rgba(255,255,255,0.04)" : "rgba(124,58,237,0.06)", border: `1px solid ${t.isDark ? "rgba(255,255,255,0.07)" : "rgba(124,58,237,0.12)"}`, borderRadius: 14 }}>
              {([["50K+", "Students", "#7c3aed"], ["4.9★", "Rating", "#f59e0b"], ["500+", "Classes", "#0d9488"]] as [string,string,string][]).map(([val, lbl, c]) => (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: c }}>{val}</div>
                  <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ §1b BENEFITS STRIP ══ */}
      <BenefitsStrip />


      {/* ══ §3 PRIVATE SESSION ══ */}
      <PrivateSession />

      {/* ══ §3b HEALING HUB ══ */}
      <HealingHub />


      {/* ══ §4 SUBJECTS / GOALS GRID ══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: t.textPrimary, margin: 0, letterSpacing: -0.5 }}>Explore BSH subjects</h2>
            <p style={{ color: t.textSecond, margin: "6px 0 0", fontSize: 14 }}>{GOALS.length} subjects · Lifetime access · Certificate included</p>
          </div>
          <button onClick={() => navigate("/explore")}
            style={{ border: "1.5px solid #3730a3", background: "none", color: "#a78bfa", padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7c3aed")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#3730a3")}>
            View all <HiOutlineArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {GOALS.map((g) => {
            const discountPct = Math.round((1 - parseInt(g.price.replace(/[^\d]/g, "")) / parseInt(g.originalPrice.replace(/[^\d]/g, ""))) * 100);
            return (
              <GoalCard
                key={g.name}
                goal={g}
                discountPct={discountPct}
                onNavigate={() => navigate(g.link ?? `/explore?q=${encodeURIComponent(g.name)}`)}
              />
            );
          })}
        </div>
      </section>



      {/* ══ §8 TOP EDUCATORS ══ */}
      <section style={{ background: t.bgSecondary, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, margin: 0, letterSpacing: -0.5 }}>Meet our expert faculty</h2>
          </div>
          <div style={{ display: "flex", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
            {["Proven history of delivering results", "Mentored thousands of practitioners", "Unique style of teaching"].map((feat) => (
              <span key={feat} style={{ color: t.textSecond, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <HiOutlineCheckCircle size={14} style={{ color: "#4ade80" }} />{feat}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 560px)", gap: 20 }}>
            {TOP_EDUCATORS.map((edu) => (
              <div key={edu.name + edu.role}
                style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 20px 20px 0", display: "flex", gap: 0, overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,58,237,0.10)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 140, flexShrink: 0, position: "relative" }}>
                  <img src={edu.img} alt={edu.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                  {/* Badge */}
                  <div style={{ position: "absolute", top: 10, left: 10, background: edu.badge === "MASTER" ? "#7c3aed" : "#0d9488", borderRadius: 6, padding: "3px 8px" }}>
                    <span style={{ color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>⭐ {edu.badge}</span>
                  </div>
                  {/* Verified */}
                  {edu.isVerified && (
                    <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "#4a8c7c", borderRadius: 6, padding: "3px 10px", whiteSpace: "nowrap" }}>
                      <span style={{ color: "#fff", fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>✓ VERIFIED</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, padding: "6px 18px 6px 20px" }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: t.textPrimary, marginBottom: 2 }}>{edu.name}</div>
                  <div style={{ fontSize: 12, color: t.isDark ? "#a78bfa" : "#7c3aed", fontWeight: 600, marginBottom: 4 }}>{edu.role}</div>
                  <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 10 }}>🏅 {edu.yearsExp} experience</div>
                  <p style={{ color: t.textSecond, fontSize: 13, lineHeight: 1.6, marginBottom: 14, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{edu.bio}</p>
                  <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                    {[["Watch Mins", edu.watchMins], ["Followers", edu.followers]].map(([label, val]) => (
                      <div key={label as string}>
                        <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 14 }}>{val}</div>
                        <div style={{ color: t.textMuted, fontSize: 11 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => navigate("/explore")}
                      style={{ background: "none", border: `1.5px solid ${t.isDark ? "#4c1d95" : "#c4b5fd"}`, color: t.isDark ? "#a78bfa" : "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "7px 14px", borderRadius: 8, transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.08)"; e.currentTarget.style.borderColor = "#7c3aed"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = t.isDark ? "#4c1d95" : "#c4b5fd"; }}>
                      View Courses
                    </button>
                    <button onClick={() => navigate("/consultation")}
                      style={{ background: "#4a8c7c", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "7px 14px", borderRadius: 8, transition: "background 0.15s", display: "flex", alignItems: "center", gap: 5 }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#3d7a6a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#4a8c7c")}>
                      Book 1:1 <HiOutlineArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ §10 TESTIMONIALS ══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: t.textPrimary, textAlign: "center", marginBottom: 6, letterSpacing: -0.5 }}>What our students say</h2>
        <p style={{ color: t.textSecond, textAlign: "center", marginBottom: 40, fontSize: 14 }}>Real experiences from our learners</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map((testimonial) => (
            <div key={testimonial.name} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, transition: "border-color 0.2s, box-shadow 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>)}</div>
              <p style={{ color: t.textAccent, fontSize: 14, lineHeight: 1.75, marginBottom: 18, fontStyle: "italic" }}>"{testimonial.text}"</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 16, flexShrink: 0 }}>{testimonial.init}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: t.textPrimary, fontWeight: 700, fontSize: 14 }}>{testimonial.name}</span>
                    <span style={{ fontSize: 10, color: "#4a8c7c", fontWeight: 700, background: "rgba(74,140,124,0.12)", padding: "2px 6px", borderRadius: 20 }}>✓ Enrolled</span>
                  </div>
                  <div style={{ color: t.isDark ? "#a78bfa" : "#7c3aed", fontSize: 12, fontWeight: 500, marginTop: 2 }}>{testimonial.title}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ §11 BECOME AN EDUCATOR ══ */}
      <section style={{ background: t.bgSecondary, borderTop: `1px solid ${t.border}`, padding: "64px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)", padding: "clamp(36px,5vw,64px) clamp(24px,5vw,56px)", textAlign: "center", borderRadius: 24, border: "1px solid #4c1d95", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 900, color: "#f3f4f6", marginBottom: 10, letterSpacing: -0.5 }}>Become an Educator</h2>
            <p style={{ color: "#c4b5fd", fontSize: 16, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.6 }}>Share your knowledge, earn money. Join 5000+ educators teaching on BSH Healers.</p>
            <button onClick={() => navigate("/register")}
              style={{ background: "#7c3aed", border: "none", color: "#fff", padding: "13px 32px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8, transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")} onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}>
              Start Teaching Today <HiOutlineArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ══ §11b APP DOWNLOAD ══ */}
      <section style={{ background: t.bgSecondary, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}`, padding: "64px 24px", opacity: 0.55, filter: "grayscale(30%)", pointerEvents: "none", userSelect: "none" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", gap: 56, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 360px", minWidth: 0 }}>
            {/* Coming Soon badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.28)", borderRadius: 30, padding: "5px 14px", marginBottom: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#9ca3af", display: "inline-block" }} />
              <span style={{ color: t.textMuted, fontSize: 12, fontWeight: 700 }}>App Coming Soon</span>
            </div>
            <h2 style={{ fontSize: "clamp(24px,3vw,32px)", fontWeight: 900, color: t.textPrimary, marginBottom: 12, letterSpacing: -0.5, lineHeight: 1.2 }}>
              Learn anywhere with<br />the BSH App
            </h2>
            <p style={{ color: t.textSecond, fontSize: 15, lineHeight: 1.7, marginBottom: 28, maxWidth: 420 }}>
              Attend live classes, access recordings, book 1:1 healing sessions, and track your progress — all from your phone.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              {/* App Store button */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 12, padding: "11px 20px" }}>
                <svg width="22" height="26" viewBox="0 0 814 1000" fill={t.isDark ? "#e5e7eb" : "#1c1c1e"}>
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 268.5-317.5 99.8 0 182.6 65.8 245.7 65.8 60.4 0 155.1-70 269.1-70 43.4 0 160.3 4 248.4 168.4zm-234-181.5c48.3-60.4 82.7-143.7 82.7-227 0-11.9-1-23.8-3.2-33.4-78.4 3.2-171.6 52.5-228 118.3C368.5 74.1 328 162.5 328 250.5c0 10.3 1.6 20.6 2.6 24.5 5.2.3 13.6 1.6 22.6 1.6 71 0 154.8-47.7 200.9-107.2z"/>
                </svg>
                <div>
                  <div style={{ color: t.textMuted, fontSize: 10, lineHeight: 1 }}>Download on the</div>
                  <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>App Store</div>
                </div>
              </div>

              {/* Google Play button */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: t.bgCard, border: `1.5px solid ${t.border}`, borderRadius: 12, padding: "11px 20px" }}>
                <svg width="22" height="24" viewBox="0 0 512 512">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#EA4335"/>
                  <path d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l232.6-232.6L47 0z" fill="#4285F4"/>
                  <path d="M399.8 256l-74.5-21.7-60.1 21.7 60.1 21.7L399.8 256z" fill="#FBBC04" opacity="0"/>
                  <path d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" fill="#34A853"/>
                  <path d="M485.3 219.8L399.8 170l-74.5 86 74.5 86 85.7-50.2c24.2-13.4 24.2-46.6-.2-72z" fill="#FBBC04"/>
                </svg>
                <div>
                  <div style={{ color: t.textMuted, fontSize: 10, lineHeight: 1 }}>Get it on</div>
                  <div style={{ color: t.textPrimary, fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>Google Play</div>
                </div>
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: t.textMuted, fontSize: 13, fontWeight: 600 }}>
              <span style={{ fontSize: 16 }}>💬</span> WhatsApp community — coming soon
            </div>
          </div>

          <div style={{ flex: "0 1 280px", display: "flex", justifyContent: "center", position: "relative" }}>
            <div style={{ background: "linear-gradient(135deg,#1e1b4b 0%,#3b0764 50%,#064e3b 100%)", borderRadius: 28, padding: "36px 28px", textAlign: "center", boxShadow: "0 24px 60px rgba(26,32,53,0.16)", position: "relative", overflow: "hidden", width: "100%" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
              {/* Coming Soon overlay */}
              <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(107,114,128,0.85)", borderRadius: 8, padding: "4px 10px", backdropFilter: "blur(4px)" }}>
                <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>COMING SOON</span>
              </div>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🌿</div>
              <div style={{ color: "#e9d5ff", fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>BSH Healers App</div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Healing in your pocket</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.5 }}>Live classes · Recordings · 1:1 sessions</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ §12 WATCH FREE CLASSES ══ */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: t.textPrimary, marginBottom: 8 }}>Watch free live classes</h2>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {["Chat live with educators", "Interactive Q&A sessions", "Get your doubts cleared"].map((feat) => (
                <span key={feat} style={{ color: t.textSecond, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  <HiOutlineCheckCircle size={14} style={{ color: "#4ade80" }} />{feat}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex" }}>
              {["P","R","A"].map((a, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${260 + i * 20},60%,55%)`, border: `2px solid ${t.bgPrimary}`, marginLeft: i ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>{a}</div>
              ))}
            </div>
            <span style={{ color: t.textSecond, fontSize: 14 }}><strong style={{ color: t.textPrimary }}>20.7K learners</strong> watched a class today</span>
          </div>
        </div>
        <button onClick={() => navigate("/live")}
          style={{ background: t.bgCard, border: `1.5px solid ${t.borderLight}`, color: t.textPrimary, padding: "13px 28px", borderRadius: 8, cursor: "pointer", fontSize: 15, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 10, transition: "all 0.2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = t.bgCard; e.currentTarget.style.borderColor = t.borderLight; e.currentTarget.style.color = t.textPrimary; }}>
          <HiOutlinePlay size={18} /> Watch free classes now
        </button>
      </section>

      {/* ══ §12b FAQ ══ */}
      <FAQAccordion />

      {/* ══ §13 SOCIAL ══ */}
      {/* Same accounts + real URLs as the mobile app's "Follow Dr. Pradeep Kumar" section
          (mobile/(tabs)/index.tsx) — web previously linked all icons to href="#". */}
      <section style={{ borderTop: `1px solid ${t.border}`, padding: "28px 24px", textAlign: "center" }}>
        <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 16 }}>Follow us for updates</p>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
          {[
            { icon: <FaYoutube size={18} />, label: "YouTube", url: "https://www.youtube.com/@drpradeepkumar3912" },
            { icon: <FaInstagram size={18} />, label: "Instagram", url: "https://www.instagram.com/drpradeepkumarofficial/" },
            { icon: <FaFacebook size={18} />, label: "Facebook", url: "https://www.facebook.com/drpradeepkumar" },
            { icon: <FaGlobe size={18} />, label: "Website", url: "https://blessingsschoolofhypnosis.com" },
            { icon: <FaLinkedin size={18} />, label: "LinkedIn", url: "https://www.linkedin.com/in/drpradeepkumar3912" },
          ].map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
              style={{ width: 44, height: 44, borderRadius: 10, background: t.bgCard, border: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: t.textSecond, textDecoration: "none", transition: "all 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = t.accentLight; e.currentTarget.style.borderColor = "#7c3aed"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = t.textSecond; e.currentTarget.style.borderColor = t.border; }}>
              {s.icon}
            </a>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
