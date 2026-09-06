import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useThemeStore } from "../../stores/themeStore";
import Avatar from "../ui/Avatar";
import client from "../../api/client";
import bshIcon from "../../assets/BSH-logo-02.png";
import {
  HiOutlineSearch, HiOutlineBookOpen, HiOutlineAcademicCap,
  HiOutlineUser, HiOutlinePlusCircle, HiOutlineLogout,
  HiOutlineChevronDown, HiOutlineCog, HiOutlineChatAlt2,
  HiOutlineBell, HiMenu, HiX,
} from "react-icons/hi";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";

// ── Notification types ──────────────────────────────────────────────────────
interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ── Notification Bell + Dropdown ────────────────────────────────────────────
const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const { isDark, t } = useThemeStore();
  const [open, setOpen]           = useState(false);
  const [notifs, setNotifs]       = useState<AppNotification[]>([]);
  const [unread, setUnread]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await client.get("/notifications");
      setNotifs(res.data.notifications ?? []);
      setUnread(res.data.unreadCount ?? 0);
    } catch {}
  }, [user]);

  // Poll every 60 s when logged in
  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const id = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(id);
  }, [user, fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openPanel = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await client.get("/notifications");
      setNotifs(res.data.notifications ?? []);
      setUnread(res.data.unreadCount ?? 0);
    } catch {}
    finally { setLoading(false); }
  };

  const markAllRead = async () => {
    try {
      await client.put("/notifications/read-all");
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
  };

  const markRead = async (id: string, link?: string) => {
    try { await client.put(`/notifications/${id}/read`); } catch {}
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
    if (link) {
      if (link.startsWith("http")) window.open(link, "_blank");
      else window.location.href = link;
    }
    setOpen(false);
  };

  const fmtTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const typeIcon: Record<string, string> = {
    system: '📣', live_class: '🔴', payment: '💳', lesson: '📚', quiz: '✏️',
  };

  if (!user) return null;

  return (
    <div ref={panelRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={openPanel}
        title="Notifications"
        style={{
          position: "relative",
          background: open ? (isDark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.08)") : "none",
          border: `1.5px solid ${open ? t.accent : t.border}`,
          borderRadius: 10, width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: open ? t.accent : t.textMuted, transition: "all 0.18s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; } }}
      >
        <HiOutlineBell size={17} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "#fff",
            borderRadius: "50%", minWidth: 16, height: 16,
            fontSize: 9, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", border: `2px solid ${isDark ? "#0a0914" : "#f8fafc"}`,
            animation: "bellBadgePop 0.25s ease",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: 46,
          width: 360, maxWidth: "calc(100vw - 32px)",
          background: t.bgCard, border: `1px solid ${t.borderLight}`,
          borderRadius: 16, boxShadow: `0 20px 60px ${t.shadow}, 0 0 0 1px ${t.border}`,
          zIndex: 400, overflow: "hidden", animation: "ddFadeIn 0.15s ease",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px 12px",
            background: isDark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.05)",
            borderBottom: `1px solid ${t.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HiOutlineBell size={15} style={{ color: t.accent }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: t.textPrimary }}>Notifications</span>
              {unread > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: 50, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: t.textMuted, fontSize: 11, cursor: "pointer", padding: 0 }}>Mark all read</button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "28px 0", textAlign: "center", color: t.textMuted, fontSize: 13 }}>Loading…</div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: "36px 0", textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                <div style={{ color: t.textMuted, fontSize: 13 }}>No notifications yet</div>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id, n.link)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${t.border}`,
                    background: n.isRead
                      ? "transparent"
                      : (isDark ? "rgba(124,58,237,0.07)" : "rgba(124,58,237,0.04)"),
                    cursor: n.link ? "pointer" : "default",
                    display: "flex", gap: 10, alignItems: "flex-start",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = n.isRead ? "transparent" : (isDark ? "rgba(124,58,237,0.07)" : "rgba(124,58,237,0.04)"); }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isDark ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
                    {typeIcon[n.type] || "📣"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 13, color: t.textPrimary, lineHeight: 1.3 }}>{n.title}</div>
                      {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: 3 }} />}
                    </div>
                    <div style={{ fontSize: 12, color: t.textSecond, marginTop: 2, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{n.body}</div>
                    <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>{fmtTime(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div style={{ padding: "8px 16px", borderTop: `1px solid ${t.border}`, textAlign: "center" }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>Showing last {notifs.length} notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface NavItem {
  to: string;
  label: string;
  emoji: string;
  live?: boolean;
  isHash?: boolean;
  consultation?: boolean;
}

const NAV_LINKS: NavItem[] = [
  { to: "/",                  label: "Home",             emoji: "🏠" },
  { to: "/live",              label: "Live",             emoji: "📡",  live: true },
  { to: "/consultation",      label: "Consultation",     emoji: "💬",  consultation: true },
  { to: "/explore",           label: "Courses",          emoji: "🎓" },
  { to: "/#healing-tools",    label: "Healing Tools",    emoji: "🌿",  isHash: true },
];

const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggle, t } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen]     = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (link: NavItem): boolean => {
    if (link.isHash) {
      const hash = "#" + link.to.split("#")[1];
      return location.pathname === "/" && location.hash === hash;
    }
    if (link.to === "/") return location.pathname === "/" && !location.hash;
    return location.pathname.startsWith(link.to);
  };

  const handleNavClick = (link: NavItem, closeMobile = false) => (e: React.MouseEvent) => {
    if (closeMobile) setMobileMenuOpen(false);
    if (!link.isHash) return;
    e.preventDefault();
    const hash = link.to.split("#")[1];
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 350);
    } else {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setProfileOpen(false);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const userMenuItems = user ? [
    ...(user.role === "admin" ? [{ label: "Admin Dashboard", to: "/admin", icon: <HiOutlineCog size={15} /> }] : []),
    { label: user.role === "educator" ? "Educator Dashboard" : "My Learning", to: user.role === "educator" ? "/educator" : "/dashboard", icon: <HiOutlineAcademicCap size={15} /> },
    { label: "My Courses", to: "/dashboard", icon: <HiOutlineBookOpen size={15} /> },
    { label: "Profile", to: "/profile", icon: <HiOutlineUser size={15} /> },
    ...(user.role === "educator" ? [{ label: "Create Course", to: "/educator/create", icon: <HiOutlinePlusCircle size={15} /> }] : []),
  ] : [];

  return (
    <>
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        backgroundColor: t.bgNav,
        borderBottom: `1px solid ${t.border}`,
        boxShadow: scrolled ? `0 4px 28px ${t.shadow}` : "none",
        transition: "box-shadow 0.25s, background-color 0.2s",
      }}>
        <div style={{
          maxWidth: 1360, margin: "0 auto", padding: "0 24px",
          height: 64, display: "flex", alignItems: "center", gap: 10,
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{ textDecoration: "none", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <img src={bshIcon} alt="BSH" style={{ height: 36, width: 36, borderRadius: "50%", objectFit: "cover", display: "block" }} />
            <div>
              <span style={{ color: t.textPrimary, fontWeight: 900, fontSize: 16, letterSpacing: -0.5, display: "block", lineHeight: 1 }}>BSH</span>
              <span style={{ color: t.textMuted, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", display: "block", lineHeight: 1.2 }}>Healers</span>
            </div>
          </Link>

          {/* ── Mobile: Consultation shortcut (always visible beside logo) ── */}
          <Link
            className="nav-mobile-only"
            to="/consultation"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 11px 6px 9px", borderRadius: 50, flexShrink: 0,
              background: isDark ? "rgba(255,255,255,0.09)" : "#ffffff",
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
              boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.1)",
              color: isDark ? t.textPrimary : "#1e1040",
              textDecoration: "none", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
            }}
          >
            <HiOutlineChatAlt2 size={13} style={{ color: isDark ? t.textAccent : "#7c3aed", flexShrink: 0 }} />
            Consult
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 10, height: 10, flexShrink: 0 }}>
              <span className="consult-ring" />
              <span className="consult-dot" />
            </span>
          </Link>

          {/* ── Divider (desktop only) ── */}
          <div className="nav-desktop" style={{ width: 1, height: 26, background: t.border, flexShrink: 0, marginLeft: 4 }} />

          {/* ── Desktop Nav links ── */}
          <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              const isLiveLink = !!link.live;

              if (link.consultation) {
                return (
                  <Link
                    key="Consultation"
                    to={link.to}
                    onClick={handleNavClick(link)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7,
                      padding: "7px 14px 7px 11px", borderRadius: 50,
                      background: isDark ? "rgba(255,255,255,0.09)" : "#ffffff",
                      border: `1.5px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.11)"}`,
                      boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.13)",
                      color: isDark ? t.textPrimary : "#222",
                      textDecoration: "none", fontSize: 13, fontWeight: 700,
                      transition: "all 0.2s", whiteSpace: "nowrap", cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.55)" : "0 8px 24px rgba(0,0,0,0.18)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.13)"; }}
                  >
                    <HiOutlineChatAlt2 size={16} style={{ color: isDark ? t.textAccent : "#444", flexShrink: 0 }} />
                    Consultation
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 12, height: 12, flexShrink: 0 }}>
                      <span className="consult-ring" />
                      <span className="consult-dot" />
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={handleNavClick(link)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "7px 13px 7px 11px", borderRadius: 50,
                    background: active
                      ? (isLiveLink ? "rgba(239,68,68,0.1)" : isDark ? "rgba(124,58,237,0.18)" : "rgba(124,58,237,0.1)")
                      : (isDark ? "rgba(255,255,255,0.09)" : "#ffffff"),
                    border: `1.5px solid ${active
                      ? (isLiveLink ? "rgba(239,68,68,0.45)" : "rgba(124,58,237,0.45)")
                      : (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.11)")}`,
                    boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.13)",
                    color: active ? (isLiveLink ? "#f87171" : t.accentLight) : (isDark ? t.textPrimary : "#222"),
                    textDecoration: "none", fontSize: 13, fontWeight: 700,
                    transition: "all 0.2s", whiteSpace: "nowrap", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = isDark ? "0 8px 24px rgba(0,0,0,0.55)" : "0 8px 24px rgba(0,0,0,0.18)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.13)"; } }}
                >
                  {isLiveLink ? (
                    <>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#f87171" : "#ef4444", display: "inline-block", flexShrink: 0, animation: "navLivePulse 1.5s ease-in-out infinite", boxShadow: "0 0 6px #ef4444" }} />
                      {link.label}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 12, lineHeight: 1 }}>{link.emoji}</span>
                      {link.label}
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Flex spacer ── */}
          <div style={{ flex: 1 }} />

          {/* ── Search icon (desktop) ── */}
          <button
            className="nav-desktop"
            onClick={() => navigate("/explore")}
            title="Search courses"
            style={{ background: "none", border: `1.5px solid ${t.border}`, borderRadius: 10, width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textMuted, transition: "all 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.color = t.accent; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textMuted; }}
          >
            <HiOutlineSearch size={16} />
          </button>

          {/* ── Theme toggle ── */}
          <button
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: isDark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.08)", border: `1.5px solid ${t.border}`, borderRadius: 10, width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textAccent, transition: "all 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.boxShadow = `0 0 14px ${t.accent}44`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = "none"; }}
          >
            {isDark ? <MdOutlineLightMode size={17} /> : <MdOutlineDarkMode size={17} />}
          </button>

          {/* ── Notification Bell (desktop, logged-in only) ── */}
          {user && <div className="nav-desktop"><NotificationBell /></div>}

          {/* ── Auth / Profile (desktop) ── */}
          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {user ? (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{ background: profileOpen ? t.bgTertiary : "none", border: `1.5px solid ${profileOpen ? t.accent : t.border}`, borderRadius: 50, cursor: "pointer", padding: "4px 10px 4px 4px", display: "flex", alignItems: "center", gap: 8, transition: "all 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; }}
                  onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.borderColor = t.border; }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", backgroundColor: t.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>{user.name[0].toUpperCase()}</span>}
                  </div>
                  <span style={{ color: t.textPrimary, fontSize: 13, fontWeight: 600, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name.split(" ")[0]}</span>
                  <HiOutlineChevronDown size={12} style={{ color: t.textMuted, transform: profileOpen ? "rotate(180deg)" : "none", transition: "0.2s", flexShrink: 0 }} />
                </button>

                {profileOpen && (
                  <div style={{ position: "absolute", right: 0, top: 50, background: t.bgCard, border: `1px solid ${t.borderLight}`, borderRadius: 14, minWidth: 220, boxShadow: `0 20px 60px ${t.shadow}, 0 0 0 1px ${t.border}`, overflow: "hidden", zIndex: 300, animation: "ddFadeIn 0.15s ease" }}>
                    <div style={{ padding: "16px 16px 12px", background: isDark ? "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(79,172,254,0.06))" : "linear-gradient(135deg,rgba(124,58,237,0.06),rgba(79,172,254,0.03))", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar src={user.avatar} name={user.name} size={40} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: t.textPrimary }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: t.accentLight, textTransform: "capitalize", marginTop: 1 }}>✦ {user.role}</div>
                      </div>
                    </div>
                    <div style={{ padding: "6px 0" }}>
                      {userMenuItems.map((item) => (
                        <Link key={item.to + item.label} to={item.to} onClick={() => setProfileOpen(false)}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: t.textAccent, textDecoration: "none", fontSize: 13, transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = t.bgTertiary)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ color: t.textMuted }}>{item.icon}</span> {item.label}
                        </Link>
                      ))}
                    </div>
                    <div style={{ borderTop: `1px solid ${t.border}`, padding: "6px 0 6px" }}>
                      <button onClick={handleLogout}
                        style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", color: "#f87171", textAlign: "left", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <HiOutlineLogout size={15} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  style={{ background: "none", border: `1.5px solid ${t.borderLight}`, color: t.textAccent, padding: "8px 18px", borderRadius: 50, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.2s", letterSpacing: 0.1 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = isDark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.06)"; e.currentTarget.style.boxShadow = `0 0 16px ${t.accent}30`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.borderLight; e.currentTarget.style.background = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  Log in
                </button>
                <button
                  onClick={() => navigate("/register")}
                  style={{ background: "linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)", border: "none", color: "#fff", padding: "9px 20px", borderRadius: 50, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(124,58,237,0.45)", transition: "all 0.2s", letterSpacing: 0.2 }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.6)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,58,237,0.45)"; }}
                >
                  ✨ Join Free
                </button>
              </>
            )}
          </div>

          {/* ── Mobile: hamburger button ── */}
          <button
            className="nav-mobile-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            style={{ background: mobileMenuOpen ? t.bgTertiary : "none", border: `1.5px solid ${mobileMenuOpen ? t.accent : t.border}`, borderRadius: 10, width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.textPrimary, transition: "all 0.18s" }}
          >
            {mobileMenuOpen ? <HiX size={20} /> : <HiMenu size={20} />}
          </button>
        </div>

        <style>{`
          @media (max-width: 1000px) { .nav-desktop { display: none !important; } }
          @media (min-width: 1001px) { .nav-desktop { display: flex !important; } .nav-mobile-only { display: none !important; } }
          .nav-mobile-only { display: flex; }

          @keyframes navLivePulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 6px #ef4444; transform: scale(1); }
            50%       { opacity: 0.6; box-shadow: 0 0 10px #ef4444; transform: scale(1.5); }
          }
          @keyframes consultDotColor {
            0%, 45%  { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
            50%, 95% { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
            100%     { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
          }
          @keyframes consultRingColor {
            0%, 45%  { background: #22c55e; }
            50%, 95% { background: #ef4444; }
            100%     { background: #22c55e; }
          }
          @keyframes pingExpand {
            0%        { transform: scale(1); opacity: 0.6; }
            75%, 100% { transform: scale(2.4); opacity: 0; }
          }
          .consult-dot {
            width: 9px; height: 9px; border-radius: 50%; display: block; flex-shrink: 0;
            animation: consultDotColor 4s ease-in-out infinite;
          }
          .consult-ring {
            position: absolute; inset: 0; border-radius: 50%;
            animation: consultRingColor 4s ease-in-out infinite, pingExpand 2s ease-out infinite;
            opacity: 0.5;
          }
          @keyframes ddFadeIn {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes bellBadgePop {
            from { transform: scale(0.5); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
          @keyframes mobileMenuIn {
            from { opacity: 0; transform: translateY(-12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </header>

      {/* ── Mobile Menu Overlay ── */}
      {mobileMenuOpen && (
        <div style={{
          position: "fixed", top: 64, left: 0, right: 0, bottom: 0,
          background: t.bgPrimary, zIndex: 199,
          overflowY: "auto", animation: "mobileMenuIn 0.22s ease",
          borderTop: `1px solid ${t.border}`,
        }}>
          {/* Nav links */}
          <div style={{ padding: "8px 0" }}>
            {NAV_LINKS.map((link) => {
              const active = isActive(link);
              const isLiveLink = !!link.live;

              return (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={handleNavClick(link, true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "15px 24px",
                    textDecoration: "none",
                    borderBottom: `1px solid ${t.border}`,
                    background: active ? (isDark ? "rgba(124,58,237,0.1)" : "rgba(124,58,237,0.06)") : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  {/* Icon / indicator */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: active
                      ? (isLiveLink ? "rgba(239,68,68,0.12)" : "rgba(124,58,237,0.15)")
                      : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                    border: `1.5px solid ${active ? (isLiveLink ? "rgba(239,68,68,0.35)" : "rgba(124,58,237,0.35)") : t.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {isLiveLink ? (
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "block", animation: "navLivePulse 1.5s infinite", boxShadow: "0 0 6px #ef4444" }} />
                    ) : link.consultation ? (
                      <HiOutlineChatAlt2 size={18} style={{ color: active ? t.accentLight : t.textSecond }} />
                    ) : (
                      <span style={{ fontSize: 16 }}>{link.emoji}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: active ? (isLiveLink ? "#f87171" : t.accentLight) : t.textPrimary, fontWeight: active ? 700 : 600, fontSize: 15 }}>
                      {link.label}
                      {isLiveLink && (
                        <span style={{ marginLeft: 8, background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)" }}>LIVE</span>
                      )}
                    </div>
                    <div style={{ color: t.textMuted, fontSize: 11, marginTop: 1 }}>
                      {link.label === "Home" && "Back to home page"}
                      {link.label === "Live" && "Watch live spiritual classes"}
                      {link.label === "Consultation" && "Talk to expert healers"}
                      {link.label === "Courses" && "Explore all courses"}
                      {link.label === "Healing Tools" && "Free meditation & breathing tools"}
                    </div>
                  </div>

                  {/* Consultation dot */}
                  {link.consultation && (
                    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, flexShrink: 0 }}>
                      <span className="consult-ring" />
                      <span className="consult-dot" />
                    </span>
                  )}

                  {/* Chevron */}
                  <span style={{ color: t.textMuted, fontSize: 16 }}>›</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }} />

          {/* Auth section */}
          <div style={{ padding: "20px 24px 32px" }}>
            {user ? (
              <>
                {/* User info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isDark ? "rgba(124,58,237,0.08)" : "rgba(124,58,237,0.05)", borderRadius: 14, border: `1px solid ${t.border}`, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: t.accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{user.name[0].toUpperCase()}</span>}
                  </div>
                  <div>
                    <div style={{ color: t.textPrimary, fontWeight: 700, fontSize: 15 }}>{user.name}</div>
                    <div style={{ color: t.accentLight, fontSize: 12, textTransform: "capitalize" }}>✦ {user.role}</div>
                  </div>
                </div>

                {userMenuItems.map((item) => (
                  <Link key={item.to + item.label} to={item.to} onClick={() => setMobileMenuOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: `1px solid ${t.border}`, color: t.textAccent, textDecoration: "none", fontSize: 14 }}
                  >
                    <span style={{ color: t.textMuted }}>{item.icon}</span> {item.label}
                  </Link>
                ))}

                {/* Notification bell for mobile */}
                <div style={{ paddingTop: 16 }} onClick={() => setMobileMenuOpen(false)}>
                  <NotificationBell />
                </div>

                <button onClick={handleLogout}
                  style={{ width: "100%", marginTop: 16, padding: "13px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, color: "#f87171", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <HiOutlineLogout size={16} /> Log Out
                </button>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ color: t.textMuted, fontSize: 13, marginBottom: 4 }}>Join 50,000+ spiritual learners</p>
                <button onClick={() => { setMobileMenuOpen(false); navigate("/register"); }}
                  style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)", border: "none", color: "#fff", padding: "14px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 700, boxShadow: "0 4px 16px rgba(124,58,237,0.4)" }}
                >
                  ✨ Join Free
                </button>
                <button onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                  style={{ background: "none", border: `1.5px solid ${t.borderLight}`, color: t.textAccent, padding: "13px", borderRadius: 12, cursor: "pointer", fontSize: 15, fontWeight: 600 }}
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
