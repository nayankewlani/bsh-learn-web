import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaYoutube, FaTelegram, FaTwitter, FaLinkedin } from "react-icons/fa";
import bshIcon from "../../assets/BSH-logo-02.png";
import appleLogoSvg from "../../assets/apple-logo.svg";
import googlePlayLogo from "../../assets/google-play-logo.webp";

const Footer: React.FC = () => (
  <footer style={{ background: "#0a0914", borderTop: "1px solid #1e1b4b", padding: "48px 24px 28px" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 36, marginBottom: 40 }}>
        {/* Brand */}
        <div>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
            <img src={bshIcon} alt="BSH" style={{ height: 40, width: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            <span style={{ color: "#f3f4f6", fontWeight: 800, fontSize: 20, letterSpacing: -0.3 }}>BSH</span>
          </div>
          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
            Spiritual guidance for every chapter of life — live workshops, 1-on-1 sessions, and healing courses from India's most trusted practitioners.
          </p>
          {/* Social icons */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { icon: <FaInstagram size={18} />, href: "https://www.instagram.com/drpradeepkumarofficial/", label: "Instagram" },
              { icon: <FaYoutube size={18} />, href: "https://www.youtube.com/@drpradeepkumar3912", label: "YouTube" },
              { icon: <FaTelegram size={18} />, href: "#", label: "Telegram" },
              { icon: <FaTwitter size={18} />, href: "#", label: "Twitter" },
              { icon: <FaLinkedin size={18} />, href: "https://www.linkedin.com/in/drpradeepkumar3912", label: "LinkedIn" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target={social.href !== "#" ? "_blank" : undefined}
                rel={social.href !== "#" ? "noopener noreferrer" : undefined}
                aria-label={social.label}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#13122a", border: "1px solid #1e1b4b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#9ca3af", textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1e1b4b";
                  e.currentTarget.style.color = "#a78bfa";
                  e.currentTarget.style.borderColor = "#7c3aed";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#13122a";
                  e.currentTarget.style.color = "#9ca3af";
                  e.currentTarget.style.borderColor = "#1e1b4b";
                }}
              >
                {social.icon}
              </a>
            ))}
          </div>
          <p style={{ color:"#4b5563", fontSize:11, marginTop:10 }}>
            Follow <a href="https://www.instagram.com/drpradeepkumarofficial/" target="_blank" rel="noopener noreferrer" style={{ color:"#a78bfa", textDecoration:"none" }}>@drpradeepkumarofficial</a> on Instagram
          </p>
        </div>

        {/* Link columns */}
        {[
          {
            title: "Learn",
            links: [
              { label: "Explore Courses", to: "/explore" },
              { label: "Live Classes", to: "/live" },
              { label: "My Dashboard", to: "/dashboard" },
              { label: "Categories", to: "/explore" },
            ],
          },
          {
            title: "Teach",
            links: [
              { label: "Become Educator", to: "/register" },
              { label: "Educator Dashboard", to: "/educator" },
              { label: "Create Course", to: "/educator/create" },
              { label: "Schedule Live Class", to: "/educator/schedule" },
            ],
          },
          {
            title: "Company",
            links: [
              { label: "About Us", to: "/" },
              { label: "Careers", to: "/" },
              { label: "Contact Us", to: "/" },
            ],
          },
          {
            title: "Legal",
            links: [
              { label: "Privacy Policy",      to: "/" },
              { label: "Terms of Service",    to: "/" },
              { label: "Cancellation Policy", to: "/" },
              { label: "Refund Policy",       to: "/" },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <div style={{ fontWeight: 700, color: "#c4b5fd", marginBottom: 14, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>{col.title}</div>
            {col.links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                style={{ display: "block", color: "#6b7280", textDecoration: "none", fontSize: 13, marginBottom: 10, transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      {/* ── Download App Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e1040 0%, #0f0a2e 50%, #1a0a2e 100%)",
        border: "1px solid #2d1f6e",
        borderRadius: 24, padding: "36px 40px", marginBottom: 36,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 28, position: "relative", overflow: "hidden",
      }}>
        {/* Background glow blobs */}
        <div style={{ position: "absolute", top: -40, right: 80, width: 180, height: 180, borderRadius: "50%", background: "rgba(124,58,237,0.15)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, right: 20, width: 120, height: 120, borderRadius: "50%", background: "rgba(236,72,153,0.1)", filter: "blur(50px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>📱</span>
            <span style={{ background: "linear-gradient(90deg,#a78bfa,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Now Available on Mobile</span>
          </div>
          <h3 style={{ color: "#f3f4f6", fontWeight: 900, fontSize: 24, margin: "0 0 10px", letterSpacing: -0.5, lineHeight: 1.2 }}>
            Take BSH Healers Everywhere
          </h3>
          <p style={{ color: "#9ca3af", fontSize: 14, margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
            Live workshops · 1-on-1 sessions · 100+ healing courses — all in your pocket, anytime.
          </p>
          <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
            {["⭐ 4.8 App Store rating", "👥 50,000+ downloads", "🔒 Secure & private"].map((tag) => (
              <span key={tag} style={{ color: "#6b7280", fontSize: 12 }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {[
            { href: "https://apps.apple.com/in/app/bsh-healers/id6811677552", sub: "Download on the", name: "App Store", logo: appleLogoSvg, logoStyle: { width: 28, height: 34, filter: "brightness(0) invert(1)", flexShrink: 0 } },
            { href: "https://play.google.com/store/apps/details?id=com.bshlearn.app", sub: "Get it on", name: "Google Play", logo: googlePlayLogo, logoStyle: { width: 32, height: 32, flexShrink: 0 } },
          ].map((store) => (
            <a key={store.name} href={store.href} target="_blank" rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 22px", borderRadius: 14,
                background: "#000", border: "1px solid rgba(255,255,255,0.12)",
                textDecoration: "none", transition: "all 0.25s", minWidth: 180,
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.6)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              <img src={store.logo} alt={store.name} style={store.logoStyle} />
              <div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: 0.4, lineHeight: 1, marginBottom: 3 }}>{store.sub}</div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, letterSpacing: -0.3, lineHeight: 1 }}>{store.name}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1e1b4b", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: "#4b5563", fontSize: 13 }}>© 2026 BSH. All rights reserved.</span>
        <span style={{ color: "#4b5563", fontSize: 13 }}>Made with ❤️ for Indian learners</span>
      </div>
    </div>
  </footer>
);

export default Footer;
