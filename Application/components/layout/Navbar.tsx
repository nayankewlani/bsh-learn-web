import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import {
  HiOutlineSearch,
  HiOutlineMenu,
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

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQ)}`);
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMenuOpen(false);
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navLinks = [
    { to: "/explore", label: "Explore", icon: <HiOutlineBookOpen size={16} /> },
    { to: "/live", label: "Live", icon: <HiOutlineVideoCamera size={16} /> },
  ];

  const userMenuItems = user ? [
    { label: "Dashboard", to: user.role === "educator" ? "/educator" : "/dashboard", icon: <HiOutlineAcademicCap size={16} /> },
    { label: "My Courses", to: "/dashboard", icon: <HiOutlineBookOpen size={16} /> },
    { label: "Profile", to: "/profile", icon: <HiOutlineUser size={16} /> },
    ...(user.role === "educator" ? [{ label: "Create Course", to: "/educator/create", icon: <HiOutlinePlusCircle size={16} /> }] : []),
  ] : [];

  return (
    <>
      <nav style={{ background: "#0f0e1a", borderBottom: "1px solid #1e1b4b", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", height: 64, display: "flex", alignItems: "center", gap: 16, padding: "0 20px" }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "linear-gradient(135deg,#7c3aed,#4c1d95)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, color: "#fff", fontSize: 14, letterSpacing: -0.5,
              boxShadow: "0 4px 12px rgba(124,58,237,0.4)"
            }}>BSH</div>
            <span style={{ fontWeight: 800, fontSize: 20, color: "#f3f4f6", letterSpacing: -0.5 }}>
              Learn
            </span>
          </Link>

          {/* Search — hidden on mobile */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 460, display: "flex" }} className="hide-mobile">
            <div style={{ position: "relative", width: "100%" }}>
              <HiOutlineSearch size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b7280", pointerEvents: "none" }} />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search courses, topics, educators..."
                style={{
                  width: "100%", padding: "9px 16px 9px 40px",
                  background: "#1e1b4b",
                  border: `1.5px solid ${searchFocused ? "#7c3aed" : "#3730a3"}`,
                  borderRadius: 24, color: "#f3f4f6", fontSize: 14, outline: "none",
                  boxSizing: "border-box",
                  boxShadow: searchFocused ? "0 0 0 3px rgba(124,58,237,0.2)" : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
            </div>
          </form>

          {/* Nav links — hidden on mobile */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hide-mobile">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} style={{ display: "flex", alignItems: "center", gap: 5, color: "#c4b5fd", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "6px 12px", borderRadius: 8, transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1b4b")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {link.icon}{link.label}
              </Link>
            ))}
          </div>

          {/* Auth — right side */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1b4b")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar src={user.avatar} name={user.name} size={34} />
                  <span style={{ color: "#f3f4f6", fontSize: 14, fontWeight: 500 }} className="hide-mobile">{user.name.split(" ")[0]}</span>
                  <HiOutlineChevronDown size={14} style={{ color: "#9ca3af", transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "none" }} className="hide-mobile" />
                </button>
                {menuOpen && (
                  <div style={{
                    position: "absolute", right: 0, top: 48,
                    background: "#13122a", border: "1px solid #3730a3",
                    borderRadius: 14, minWidth: 200,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                    overflow: "hidden", zIndex: 200,
                    animation: "fadeIn 0.15s ease"
                  }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1b4b" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f3f4f6" }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, textTransform: "capitalize" }}>{user.role}</div>
                    </div>
                    {userMenuItems.map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", color: "#c4b5fd", textDecoration: "none", fontSize: 14, borderBottom: "1px solid #1e1b4b", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1b4b")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {item.icon}{item.label}
                      </Link>
                    ))}
                    <button onClick={handleLogout}
                      style={{ width: "100%", padding: "11px 16px", background: "none", border: "none", color: "#f87171", textAlign: "left", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1e1b4b")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <HiOutlineLogout size={16} />Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }} className="hide-mobile">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
                <Button size="sm" onClick={() => navigate("/register")}>Sign up</Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#c4b5fd", display: "none", padding: 4 }}
              className="show-mobile"
            >
              {mobileOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{ background: "#13122a", borderTop: "1px solid #1e1b4b", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4 }}>
            <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
              <div style={{ position: "relative" }}>
                <HiOutlineSearch size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7280" }} />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search..."
                  style={{ width: "100%", padding: "10px 12px 10px 36px", background: "#1e1b4b", border: "1.5px solid #3730a3", borderRadius: 12, color: "#f3f4f6", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </form>
            {[
              { to: "/", label: "Home", icon: <HiOutlineHome size={18} /> },
              ...navLinks,
            ].map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", color: "#c4b5fd", textDecoration: "none", fontSize: 15, borderRadius: 10, transition: "background 0.15s" }}
              >
                {link.icon}{link.label}
              </Link>
            ))}
            {user ? (
              <>
                {userMenuItems.map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", color: "#c4b5fd", textDecoration: "none", fontSize: 15, borderRadius: 10 }}
                  >
                    {item.icon}{item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "none", border: "none", color: "#f87171", textAlign: "left", cursor: "pointer", fontSize: 15, borderRadius: 10, width: "100%" }}>
                  <HiOutlineLogout size={18} />Log Out
                </button>
              </>
            ) : (
              <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Log in</Button>
                <Button size="sm" onClick={() => { navigate("/register"); setMobileOpen(false); }}>Sign up</Button>
              </div>
            )}
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
