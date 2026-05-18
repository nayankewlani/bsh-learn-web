import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaYoutube, FaTelegram, FaTwitter } from "react-icons/fa";
import bshLogo from "../../assets/logo-1.png";

const Footer: React.FC = () => (
  <footer style={{ background: "#0a0914", borderTop: "1px solid #1e1b4b", padding: "48px 24px 28px" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 36, marginBottom: 40 }}>
        {/* Brand */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <img src={bshLogo} alt="BSHLearn" style={{ height: 42, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </div>
          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
            India's best learning platform for Hypnosis, Reiki, Shadow Work & Akashik practices.
          </p>
          {/* Social icons */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { icon: <FaInstagram size={18} />, href: "#", label: "Instagram" },
              { icon: <FaYoutube size={18} />, href: "#", label: "YouTube" },
              { icon: <FaTelegram size={18} />, href: "#", label: "Telegram" },
              { icon: <FaTwitter size={18} />, href: "#", label: "Twitter" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
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
              { label: "Privacy Policy", to: "/" },
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

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid #1e1b4b", paddingTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ color: "#4b5563", fontSize: 13 }}>© 2026 BSHLearn. All rights reserved.</span>
        <span style={{ color: "#4b5563", fontSize: 13 }}>Made with ❤️ for Indian learners</span>
      </div>
    </div>
  </footer>
);

export default Footer;
