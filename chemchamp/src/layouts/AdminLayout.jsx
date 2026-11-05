import React, { useState } from "react";
import { NavLink, Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import Seo from "../components/common/Seo";
import {
  LayoutDashboard,
  FileQuestion,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Image as ImageIcon,
  Zap,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  ExternalLink,
  TrendingUp,
  Sliders,
  Users,
  Megaphone,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navLinks = [
    {
      to: "/admin/overview",
      label: "ওভারভিউ ড্যাশবোর্ড",
      icon: LayoutDashboard,
      badge: "Live",
    },
    {
      to: "/admin/questions",
      label: "প্রশ্ন ব্যাংক (JSON)",
      icon: FileQuestion,
    },
    {
      to: "/admin/curriculum",
      label: "অধ্যায় ও সিলেবাস",
      icon: BookOpen,
    },
    {
      to: "/admin/mock-exams",
      label: "মক ও মডেল টেস্ট",
      icon: GraduationCap,
    },
    {
      to: "/admin/vault",
      label: "শর্টকাট ও ফর্মুলা ভল্ট",
      icon: Zap,
    },
    {
      to: "/admin/admission-edge",
      label: "অ্যাডমিশন স্পেশাল এজ",
      icon: TrendingUp,
      badge: "নতুন",
    },
    {
      to: "/admin/users",
      label: "শিক্ষার্থী ও ইউজার (CRM)",
      icon: Users,
    },
    {
      to: "/admin/results",
      label: "রেজাল্ট ও মেরিট লিস্ট",
      icon: BarChart3,
      badge: "নতুন",
    },
    {
      to: "/admin/announcements",
      label: "নোটিশ ও ব্রডকাস্ট",
      icon: Megaphone,
      badge: "লাইভ",
    },
    {
      to: "/admin/landing-manager",
      label: "হোম পেজ ও ল্যান্ডিং কন্ট্রোল",
      icon: Sliders,
      badge: "লাইভ",
    },
    {
      to: "/admin/doubts",
      label: "ডাউট ডেস্ক",
      icon: HelpCircle,
    },
    {
      to: "/admin/media",
      label: "ImgBB ইমেজ হাব",
      icon: ImageIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-amber-500/30 selection:text-amber-300">
      <Seo title="অ্যাডমিন স্টুডিও" noindex />
      
      {/* ১. মোবাইল ড্রয়ারের জন্য ব্যাকড্রপ */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
        />
      )}

      {/* ২. সাইডবার (Desktop Persistent + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-slate-900 border-r border-slate-800/90 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* ব্র্যান্ড হেডার */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <Link to="/admin/overview" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-lg shadow-amber-500/20">
                🛡️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white tracking-tight">ChemChamp</span>
                  <span className="text-[9px] font-extrabold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded">
                    Studio
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Admin Control Hub</span>
              </div>
            </Link>

            {/* মোবাইল ক্লোজ বাটন */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-white md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* স্টুডেন্ট অ্যাপে ফেরত যাওয়ার লিংক */}
          <div className="px-3 pt-3">
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-all group"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>স্টুডেন্ট ড্যাশবোর্ড</span>
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
            </Link>
          </div>

          {/* সাইডবার মেনু নেভিগেশন লিংকস */}
          <nav className="p-3 space-y-1 mt-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
              প্রধান মেনু
            </span>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-slate-950 text-amber-400"
                          : "bg-slate-950 text-slate-400 border border-slate-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* সাইডবার ফুটার (ইউজার প্রোফাইল ও লগআউট) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                🛡️
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {user?.displayName || "সুপার অ্যাডমিন"}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-bold transition-all active:scale-98"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>অ্যাডমিন লগআউট</span>
          </button>
        </div>
      </aside>

      {/* ৩. মূল কনটেন্ট এরিয়া */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* মোবাইল টপ ন্যাভবার */}
        <header className="md:hidden sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 p-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> ChemChamp Admin
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 text-rose-400 text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* সাব-রাউটের কনটেন্ট রেন্ডারিং */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
}