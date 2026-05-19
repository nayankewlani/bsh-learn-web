import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaBook, FaVideo, FaUserGraduate } from "react-icons/fa";
import { useAuthStore } from "../../stores/authStore";

const TABS = [
  { to: "/", label: "Home", icon: <FaHome /> },
  { to: "/explore", label: "Courses", icon: <FaBook /> },
  { to: "/live", label: "Live", icon: <FaVideo /> },
];

const MobileBottomNav: React.FC = () => {
  const { user } = useAuthStore();
  const dashTab = { to: user ? (user.role === "educator" ? "/educator" : "/dashboard") : "/register", label: "My Learning", icon: <FaUserGraduate /> };

  return (
    <nav className="mobile-bottom-nav">
      {[...TABS, dashTab].map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
        >
          {tab.icon}
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
