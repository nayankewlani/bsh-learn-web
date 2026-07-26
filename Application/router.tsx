import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import MobileBottomNav from "./components/layout/MobileBottomNav";

import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import WatchPage from "./pages/WatchPage";
import LivePage from "./pages/LivePage";
import ConsultationPage from "./pages/ConsultationPage";
import StudentDashboard from "./pages/StudentDashboard";
import EducatorDashboard from "./pages/EducatorDashboard";
import CreateCoursePage from "./pages/CreateCoursePage";
import CourseEditorPage from "./pages/CourseEditorPage";
import ProfilePage from "./pages/ProfilePage";
import ScheduleLiveClassPage from "./pages/ScheduleLiveClassPage";
import AdvanceHypnosisPage from "./pages/AdvanceHypnosisPage";
import Hypnosis2Page from "./pages/Hypnosis2Page";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import EducatorApplicationPage from "./pages/auth/EducatorApplicationPage";
import BookSessionPage from "./pages/BookSessionPage";
import ConsultBookingPage from "./pages/ConsultBookingPage";
import PaymentReturnPage from "./pages/PaymentReturnPage";

import AdminLayout       from "./pages/admin/AdminLayout";
import AdminOverview     from "./pages/admin/AdminOverview";
import AdminStudents     from "./pages/admin/AdminStudents";
import AdminTrainers     from "./pages/admin/AdminTrainers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminLiveClasses  from "./pages/admin/AdminLiveClasses";
import AdminSessions     from "./pages/admin/AdminSessions";
import AdminPermissions  from "./pages/admin/AdminPermissions";
import AdminPayouts      from "./pages/admin/AdminPayouts";
import AdminEducatorApplications from "./pages/admin/AdminEducatorApplications";
import AdminCourseManager from "./pages/admin/AdminCourseManager";
import AdminReports       from "./pages/admin/AdminReports";
import AdminHomeClasses   from "./pages/admin/AdminHomeClasses";

const Layout: React.FC = () => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#0a0914" }}>
    <Navbar />
    <main style={{ flex: 1 }} className="mobile-nav-pad"><Outlet /></main>
    <Footer />
    <MobileBottomNav />
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
      <Route path="/apply-educator" element={<EducatorApplicationPage />} />

      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/course/:id" element={<CourseDetailPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/consultation" element={<ConsultationPage />} />
        <Route path="/courses/advance-hypnosis" element={<AdvanceHypnosisPage />} />
        <Route path="/courses/hypnosis-2" element={<Hypnosis2Page />} />
        <Route path="/payment/return" element={<PaymentReturnPage />} />

        <Route element={<AuthGuard />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/book-session"   element={<BookSessionPage />} />
          <Route path="/consult-book"   element={<ConsultBookingPage />} />
        </Route>

        <Route element={<AuthGuard roles={["educator", "admin"]} />}>
          <Route path="/educator" element={<EducatorDashboard />} />
          <Route path="/educator/create" element={<CreateCoursePage />} />
          <Route path="/educator/courses/:id" element={<CourseEditorPage />} />
          <Route path="/live/schedule" element={<ScheduleLiveClassPage />} />
        </Route>
      </Route>

      <Route element={<WatchLayout />}>
        <Route element={<AuthGuard />}>
          <Route path="/watch/:lessonId" element={<WatchPage />} />
        </Route>
      </Route>

      {/* ADMIN DASHBOARD */}
      <Route element={<AuthGuard roles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index               element={<AdminOverview />} />
          <Route path="students"     element={<AdminStudents />} />
          <Route path="trainers"     element={<AdminTrainers />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="live-classes" element={<AdminLiveClasses />} />
          <Route path="sessions"               element={<AdminSessions />} />
          <Route path="permissions"            element={<AdminPermissions />} />
          <Route path="payouts"                element={<AdminPayouts />} />
          <Route path="educator-applications"  element={<AdminEducatorApplications />} />
          <Route path="course-manager"          element={<AdminCourseManager />} />
          <Route path="home-classes"            element={<AdminHomeClasses />} />
          <Route path="reports"                 element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
