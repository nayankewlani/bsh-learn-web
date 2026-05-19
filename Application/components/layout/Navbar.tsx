import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import bshLogo from "../../assets/logo-1.png";
import profileImg from "../../assets/profile.jpg";
import {
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineVideoCamera,
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineChevronDown,
} from "react-icons/hi";
import { BsGrid3X3GapFill } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Courses" },
  { to: "/live", label: "Live" },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQ, setSearchQ] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQ)}`);
      setSearchOpen(false);
      setDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setProfileOpen(false);
    setDrawerOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); setSearchOpen(false); }, [location.pathname]);

  const userMenuItems = user ? [
    { label: "Dashboard", to: user.role === "educator" ? "/educator" : "/dashboard", icon: <HiOutlineAcademicCap size={15} /> },
    { label: "My Courses", to: "/dashboard", icon: <HiOutlineBookOpen size={15} /> },
    { label: "Profile", to: "/profile", icon: <HiOutlineUser size={15} /> },
    ...(user.role === "educator" ? [{ label: "Create Course", to: "/educator/create", icon: <HiOutlinePlusCircle size={15} /> }] : []),
  ] : [];

  return (
    <>
      {/* ── Main nav wrapper ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 200, padding: "10px 16px", background: "transparent", pointerEvents: "none" }}>
        {/* Floating pill */}
        <nav style={{
          maxWidth: 1240, margin: "0 auto",
          background: "#13122a",
          border: "1.5px solid #3730a3",
          borderRadius: 22,
          padding: "8px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          backdropFilter: "blur(20px)",
          pointerEvents: "auto",
          gap: 12,
        }}>

          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center" }}>
            <img src={bshLogo} alt="BSHLearn" style={{ height: 38, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
          </Link>

          {/* Center nav links — desktop only */}
          <div className="nav-pill-links" style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" }}>
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to}
                style={{
                  color: isActive(link.to) ? "#a78bfa" : "#c4b5fd",
                  textDecoration: "none", fontSize: 14, fontWeight: 600,
                  padding: "6px 14px", borderRadius: 12,
                  background: isActive(link.to) ? "rgba(124,58,237,0.18)" : "transparent",
                  transition: "all 0.2s", letterSpacing: 0.2,
                }}
                onMouseEnter={(e) => { if (!isActive(link.to)) e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
                onMouseLeave={(e) => { if (!isActive(link.to)) e.currentTarget.style.background = "transparent"; }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right section */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>

            {/* Search icon — desktop */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="nav-pill-links"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid #3730a3", borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#c4b5fd", display: "flex", alignItems: "center" }}
            >
              <HiOutlineSearch size={17} />
            </button>

            {/* Grid menu icon */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid #3730a3", borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#c4b5fd", display: "flex", alignItems: "center" }}
            >
              <BsGrid3X3GapFill size={17} />
            </button>

            {/* Profile circle */}
            {user ? (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #7c3aed", overflow: "hidden", flexShrink: 0 }}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Avatar src={user.avatar} name={user.name} size={36} />
                    )}
                  </div>
                  <HiOutlineChevronDown size={12} style={{ color: "#9ca3af", transform: profileOpen ? "rotate(180deg)" : "none", transition: "0.2s" }} className="nav-pill-links" />
                </button>

                {profileOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: 48,
                    background: "#13122a", border: "1px solid #3730a3",
                    borderRadius: 16, minWidth: 210,
                    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
                    overflow: "hidden", zIndex: 300,
                    animation: "fadeIn 0.15s ease",
                  }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #1e1b4b", display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={user.avatar} name={user.name} size={38} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f4f6" }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: "#a78bfa", textTransform: "capitalize" }}>{user.role}</div>
                      </div>
                    </div>
                    {userMenuItems.map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setProfileOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", color: "#c4b5fd", textDecoration: "none", fontSize: 13, borderBottom: "1px solid #1e1b4b", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1b4b")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {item.icon} {item.label}
                      </Link>
                    ))}
                    <button onClick={handleLogout}
                      style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", color: "#f87171", textAlign: "left", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1b4b")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <HiOutlineLogout size={15} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6 }} className="nav-pill-links">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
                <Button size="sm" onClick={() => navigate("/register")}>Sign up</Button>
              </div>
            )}

            {/* Login icon for mobile (when not logged in) */}
            {!user && (
              <button
                className="nav-mobile-login"
                onClick={() => navigate("/login")}
                style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "7px 14px", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 600 }}
              >
                Login
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* ── Search Bar (expands below pill) ── */}
      {searchOpen && (
        <div style={{ position: "fixed", top: 78, left: 0, right: 0, zIndex: 199, padding: "0 16px", animation: "fadeIn 0.15s ease" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <form onSubmit={handleSearch}>
              <div style={{ position: "relative" }}>
                <HiOutlineSearch size={17} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search courses, topics, educators..."
                  style={{ width: "100%", padding: "13px 46px 13px 44px", background: "#13122a", border: "1.5px solid #7c3aed", borderRadius: 14, color: "#f3f4f6", fontSize: 15, outline: "none", boxSizing: "border-box", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                />
                <button type="button" onClick={() => setSearchOpen(false)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>
                  <HiOutlineX size={17} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Side Drawer ── */}
      {drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div
            style={{ position: "absolute", top: 0, right: 0, width: 280, height: "100%", background: "#0f0e1a", borderLeft: "1px solid #3730a3", padding: "24px 20px", overflowY: "auto", animation: "slideIn 0.25s ease" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <img src={bshLogo} alt="BSHLearn" style={{ height: 34, filter: "brightness(0) invert(1)" }} />
              <button onClick={() => setDrawerOpen(false)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid #3730a3", borderRadius: 8, padding: "6px", cursor: "pointer", color: "#c4b5fd", display: "flex" }}>
                <FaTimes size={15} />
              </button>
            </div>

            {/* Search in drawer */}
            <form onSubmit={handleSearch} style={{ marginBottom: 20 }}>
              <div style={{ position: "relative" }}>
                <HiOutlineSearch size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search..."
                  style={{ width: "100%", padding: "10px 12px 10px 34px", background: "#13122a", border: "1.5px solid #3730a3", borderRadius: 10, color: "#f3f4f6", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </form>

            {/* Nav grid like reference */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {[
                { to: "/", label: "Home", icon: <HiOutlineHome size={20} /> },
                { to: "/explore", label: "Courses", icon: <HiOutlineBookOpen size={20} /> },
                { to: "/live", label: "Live", icon: <HiOutlineVideoCamera size={20} /> },
                { to: user ? (user.role === "educator" ? "/educator" : "/dashboard") : "/register", label: "My Learning", icon: <HiOutlineAcademicCap size={20} /> },
              ].map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setDrawerOpen(false)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 12px", background: "#13122a", border: "1px solid #1e1b4b", borderRadius: 14, color: "#c4b5fd", textDecoration: "none", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1b4b"; e.currentTarget.style.background = "#13122a"; }}
                >
                  <span style={{ color: "#a78bfa" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User section */}
            {user ? (
              <div style={{ borderTop: "1px solid #1e1b4b", paddingTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Avatar src={user.avatar} name={user.name} size={40} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#f3f4f6", fontSize: 14 }}>{user.name}</div>
                    <div style={{ color: "#a78bfa", fontSize: 11, textTransform: "capitalize" }}>{user.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout}
                  style={{ width: "100%", padding: "11px 16px", background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 10, color: "#f87171", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <HiOutlineLogout size={15} /> Log Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #1e1b4b", paddingTop: 20 }}>
                <Button onClick={() => { navigate("/login"); setDrawerOpen(false); }}>Sign In</Button>
                <Button variant="secondary" onClick={() => { navigate("/register"); setDrawerOpen(false); }}>Create Account</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .nav-pill-links { display: none !important; }
          .nav-mobile-login { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-pill-links { display: flex !important; }
          .nav-mobile-login { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
