import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, AdminRoute } from "./components/common/ProtectedRoute";
import BottomNav from "./components/common/BottomNav";
import DesktopNavbar from "./components/common/DesktopNavbar";
import FloatingDoubtButton from "./components/common/FloatingDoubtButton";
import ScrollToTop from "./components/common/ScrollToTop";
import PageTransition from "./components/common/PageTransition";

// মূল পেইজসমূহ
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import StudyHub from "./pages/StudyHub";
import Exams from "./pages/Exams";
import Vault from "./pages/Vault";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Leaderboard from "./pages/Leaderboard";

// অ্যাডমিন লেআউট ও মডিউলসমূহ
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./components/admin/AdminOverview";
import JsonBatchUploader from "./components/admin/JsonBatchUploader";
import ImgBBUploader from "./components/admin/ImgBBUploader";
import CurriculumManager from "./components/admin/CurriculumManager";
import AdminMockExamManager from "./components/admin/AdminMockExamManager";
import AdminDoubtDesk from "./components/admin/AdminDoubtDesk";
import AdminVaultStudio from "./components/admin/AdminVaultStudio";
import AdminAdmissionEdgeManager from "./components/admin/AdminAdmissionEdgeManager";
import AdminLandingManager from "./components/admin/AdminLandingManager";
import AdminUserManager from "./components/admin/AdminUserManager";
import AdminAnnouncementManager from "./components/admin/AdminAnnouncementManager";
import AdminExamResultsManager from "./components/admin/AdminExamResultsManager";

// প্রটেক্টেড স্টুডেন্ট প্রধান ট্যাব কনফিগ (Keep-Alive Memory)
const STUDENT_MAIN_TABS = [
  { path: "/dashboard", Component: Dashboard },
  { path: "/study", Component: StudyHub },
  { path: "/exams", Component: Exams },
  { path: "/vault", Component: Vault },
  { path: "/leaderboard", Component: Leaderboard },
  { path: "/profile", Component: Profile },
];

// শিক্ষার্থী শেল লেআউট (Keep-Alive Multi-Tab Memory & Zero-Reload App Experience)
const AppLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Track visited tabs to lazy-mount each tab on its first navigation
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([currentPath]));
  const scrollPositions = useRef({});
  const lastPath = useRef(currentPath);

  useEffect(() => {
    // 1. Save scroll position of previous tab
    if (lastPath.current) {
      scrollPositions.current[lastPath.current] = window.scrollY;
    }

    // 2. Mark current tab as visited so it mounts
    setVisitedTabs((prev) => {
      if (prev.has(currentPath)) return prev;
      const next = new Set(prev);
      next.add(currentPath);
      return next;
    });

    // 3. Restore scroll position of the active tab (or top if first time)
    const targetScroll = scrollPositions.current[currentPath] || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, left: 0, behavior: "instant" });
    });

    lastPath.current = currentPath;
  }, [currentPath]);

  const isMainTab = STUDENT_MAIN_TABS.some((tab) => tab.path === currentPath);

  return (
    <div className="relative min-h-screen bg-slate-950 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Premium Ambient Atmospheric Glow Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.08),transparent_70%),radial-gradient(ellipse_60%_50%_at_100%_100%,rgba(99,102,241,0.05),transparent_60%)] z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <DesktopNavbar />
        <main className="flex-1 flex flex-col">
          {STUDENT_MAIN_TABS.map(({ path, Component }) => {
            if (!visitedTabs.has(path)) return null;
            const isActive = currentPath === path;
            return (
              <div
                key={path}
                className={`w-full flex-1 flex flex-col ${isActive ? "animate-tab-switch" : ""}`}
                style={{ display: isActive ? "flex" : "none" }}
              >
                <Component />
              </div>
            );
          })}

          {/* If route is an auxiliary page under AppLayout, render via Outlet */}
          {!isMainTab && (
            <div className="w-full flex-1 flex flex-col animate-tab-switch">
              <Outlet />
            </div>
          )}
        </main>
        <FloatingDoubtButton />
        <BottomNav />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Route smooth auto scroll-to-top */}
        <ScrollToTop />

        <Routes>
          {/* পাবলিক রুট */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />

          {/* প্রটেক্টেড স্টুডেন্ট শেল (Keep-Alive Zero-Reload Persistence) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<></>} />
              <Route path="/study" element={<></>} />
              <Route path="/exams" element={<></>} />
              <Route path="/vault" element={<></>} />
              <Route path="/profile" element={<></>} />
              <Route path="/leaderboard" element={<></>} />
            </Route>
          </Route>

          {/* প্রটেক্টেড সুপার অ্যাডমিন রাউটিং */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<AdminOverview />} />
              <Route path="questions" element={<JsonBatchUploader />} />
              <Route path="curriculum" element={<CurriculumManager />} />
              <Route path="mock-exams" element={<AdminMockExamManager />} />
              <Route path="vault" element={<AdminVaultStudio />} />
              <Route path="admission-edge" element={<AdminAdmissionEdgeManager />} />
              <Route path="landing-manager" element={<AdminLandingManager />} />
              <Route path="users" element={<AdminUserManager />} />
              <Route path="announcements" element={<AdminAnnouncementManager />} />
              <Route path="results" element={<AdminExamResultsManager />} />
              <Route path="doubts" element={<AdminDoubtDesk />} />
              <Route path="media" element={<ImgBBUploader />} />
            </Route>
          </Route>

          {/* অজানা লিংকে হোমপেজে রিডাইরেক্ট */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
