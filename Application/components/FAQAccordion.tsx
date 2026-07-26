import React, { useState } from "react";
import { useThemeStore } from "../stores/themeStore";

const FAQS = [
  {
    q: "Are classes available in English?",
    a: "Most of our classes are conducted in Hindi. Select courses and 1:1 sessions are available in Hindi/English. We are actively adding more English-medium content based on student demand.",
  },
  {
    q: "Can I watch recordings if I miss a live class?",
    a: "Yes! All live classes that have recordings are accessible in your dashboard under 'My Learning'. Educators upload recordings within 24 hours of the live session ending.",
  },
  {
    q: "How do 1:1 consultation sessions work?",
    a: "Fill out the booking form with your concern and details. Our healer personally reviews your request and calls within 24 hours to schedule a session at a time that suits you — online or in-person.",
  },
  {
    q: "Is there a certificate on completing a course?",
    a: "Yes. BSH Healers issues a completion certificate for every structured course. Certificates are recognized within the BSH practitioner community and can be shared on LinkedIn.",
  },
  {
    q: "Is there a mobile app?",
    a: "Yes! The BSH Healers app is available on Android and iOS. Download it to attend live classes, access recordings, book 1:1 sessions, and stay updated on your progress — all from your phone.",
  },
  {
    q: "What is the refund policy?",
    a: "We offer a 7-day satisfaction guarantee on all paid courses. If you're not satisfied for any reason, contact our support team within 7 days of purchase and we'll issue a full refund — no questions asked.",
  },
];

const FAQAccordion: React.FC = () => {
  const { t } = useThemeStore();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: t.textPrimary, marginBottom: 6, letterSpacing: -0.5 }}>
          Frequently asked questions
        </h2>
        <p style={{ color: t.textSecond, fontSize: 14, margin: 0 }}>
          Quick answers to questions we hear most often
        </p>
      </div>
      <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 10 }}>
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              style={{ background: t.bgCard, border: `1px solid ${isOpen ? "#7c3aed" : t.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{ width: "100%", padding: "18px 20px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 16, textAlign: "left" }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: t.textPrimary, lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ color: "#7c3aed", fontSize: 22, flexShrink: 0, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.22s", lineHeight: 1 }}>+</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 20px 20px" }}>
                  <p style={{ color: t.textSecond, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQAccordion;
