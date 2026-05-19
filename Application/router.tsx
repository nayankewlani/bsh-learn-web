import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import WatchPage from "./pages/WatchPage";
import LivePage from "./pages/LivePage";
import StudentDashboard from "./pages/StudentDashboard";
import EducatorDashboard from "./pages/EducatorDashboard";
import CreateCoursePage from "./pages/CreateCoursePage";
import ProfilePage from "./pages/ProfilePage";
import ScheduleLiveClassPage from "./pages/ScheduleLiveClassPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

const Layout: React.FC = () => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0914" }}>
    <Navbar />
    <main style={{ flex: 1 }}><Outlet /></main>
    <Footer />
  </div>
);

const AuthGuard: React.FC<{ roles?: string[] }> = ({ roles }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const WatchLayout: React.FC = () => (
  <div style={{ background: "#0a0914", minHeight: "100vh" }}>
    <Navbar />
    <Outlet />
  </div>
);

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/live" element={<LivePage />} />

        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<AuthGuard roles={["educator", "admin"]} />}>
          <Route path="/educator" element={<EducatorDashboard />} />
          <Route path="/educator/create" element={<CreateCoursePage />} />
          <Route path="/educator/courses/:id" element={<CreateCoursePage />} />
          <Route path="/live/schedule" element={<ScheduleLiveClassPage />} />
        </Route>
      </Route>

      <Route element={<WatchLayout />}>
        <Route element={<AuthGuard />}>
          <Route path="/watch/:lessonId" element={<WatchPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
