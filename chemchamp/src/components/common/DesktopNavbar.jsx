import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  GraduationCap,
  Flame,
  Trophy,
  ShieldCheck,
  Zap,
  LogOut,
  Search,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  User,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useAuth, getRpgRankInfo } from "../../context/AuthContext";
import GlobalSearchModal from "./GlobalSearchModal";
import { soundService } from "../../services/soundService";
import { notificationService } from "../../services/notificationService";

export default function DesktopNavbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === "admin";
  const streak = profile?.streakCount || profile?.gamification?.streakCount || 1;
  const xp = profile?.gamification?.currentXP || 120;
  const currentRank = getRpgRankInfo(xp);

  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundService.isSoundEnabled());
  const [notifPermission, setNotifPermission] = useState(() => notificationService.getPermission());

  const userMenuRef = useRef(null);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowUserMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleSound = () => {
    const nextState = soundService.toggleSound();
    setSoundEnabled(nextState);
    if (nextState) soundService.playClick();
  };

  const handleToggleNotif = async () => {
    soundService.playClick();
    if (notifPermission !== "granted") {
      const granted = await notificationService.requestPermission();
      setNotifPermission(granted ? "granted" : "denied");
    } else {
      notificationService.sendNotification(
        "রিমাইন্ডার সক্রিয় আছে! 🔔",
        "প্রতিদিন সন্ধ্যা ও সকালে আপনার স্টাডি রিমাইন্ডার পৌঁছে যাবে।"
      );
    }
  };

  const handleLogout = async () => {
    soundService.playClick();
    setShowUserMenu(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const navLinks = [
    { to: "/dashboard", label: "হোম", icon: Home },
    { to: "/study", label: "স্টাডি হাব", icon: BookOpen },
    { to: "/exams", label: "এক্সাম রুম", icon: GraduationCap },
    { to: "/vault", label: "কেমিস্ট্রি ভল্ট", icon: Flame },
    { to: "/leaderboard", label: "লিডারবোর্ড", icon: Trophy },
  ];

  return (
    <>
      {/* 1. Mobile Compact Sticky Top Bar */}
      <header className="desktop-navbar-container md:hidden sticky top-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="px-2.5 sm:px-3.5 h-13 sm:h-14 flex items-center justify-between gap-1 sm:gap-2">
          {/* Logo */}
          <Link
            to="/dashboard"
            onClick={() => soundService.playClick()}
            className="flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-xs sm:text-sm shadow-md shadow-emerald-500/30 ring-1 ring-emerald-400/40">
              🧪
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm font-black text-white tracking-tight">ChemChamp</span>
              <span className="text-[8.5px] sm:text-[9px] font-extrabold uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                PRO
              </span>
            </div>
          </Link>

          {/* Right Mobile Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all active:scale-90 ${
                soundEnabled
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "bg-slate-900/90 border-slate-800 text-slate-500 hover:text-slate-300"
              }`}
              title={soundEnabled ? "শব্দ বন্ধ করুন" : "শব্দ চালু করুন"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowSearch(true);
              }}
              className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all active:scale-90"
              title="সার্চ করুন"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-400 active:scale-90 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                title="অ্যাডমিন স্টুডিও"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            )}

            <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold font-mono shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>{streak}</span>
            </div>

            <Link
              to="/profile"
              onClick={() => soundService.playClick()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 active:scale-90 transition-all ring-1 ring-white/10"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] sm:text-xs">👩‍🔬</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Desktop Premium Top Navbar */}
      <header className="desktop-navbar-container hidden md:block sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 lg:gap-6">
          {/* Left: Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-base shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              🧪
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-white tracking-tight">ChemChamp</span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
          </Link>

          {/* Center Navigation Links - Guaranteed Space & Zero Overlap */}
          <nav className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80 shrink-0 shadow-inner shadow-black/20">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 lg:px-3.5 xl:px-4 py-1.5 rounded-full text-xs lg:text-[13px] font-medium flex items-center gap-1.5 xl:gap-2 whitespace-nowrap border transition-colors duration-150 select-none ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Cluster - Compact & Harmonious Circles (No Overlap) */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
            {/* Quick Search Button (Cmd+K) - Compact Circle Icon */}
            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowSearch(true);
              }}
              className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 flex items-center justify-center transition-colors shrink-0"
              title="কুইক স্পটলাইট সার্চ (Ctrl+K বা Cmd+K)"
            >
              <Search className="w-4 h-4 text-emerald-400 shrink-0" />
            </button>

            {/* Streak Counter Pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold font-mono shadow-sm shrink-0 whitespace-nowrap"
              title={`আপনার বর্তমান স্ট্রিক ${streak} দিন`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
              <span>{streak} দিন</span>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              title={soundEnabled ? "সাউন্ড বন্ধ করুন" : "সাউন্ড চালু করুন"}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                soundEnabled
                  ? "bg-slate-900/80 border-slate-800 text-emerald-400 hover:border-emerald-500/40"
                  : "bg-slate-900/40 border-slate-800/80 text-slate-500 hover:text-slate-300"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={handleToggleNotif}
              title={
                notifPermission === "granted"
                  ? "ডেইলি স্টাডি রিমাইন্ডার সক্রিয় আছে"
                  : "স্টাডি ও স্ট্রিক পুশ নোটিফিকেশন চালু করুন"
              }
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                notifPermission === "granted"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {notifPermission === "granted" ? (
                <BellRing className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            {/* Admin Quick Icon (if Admin) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 flex items-center justify-center transition-colors shrink-0"
                title="অ্যাডমিন স্টুডিও"
              >
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}

            {/* User Profile Avatar with Dropdown Menu */}
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setShowUserMenu((prev) => !prev);
                }}
                className="flex items-center gap-1.5 p-1 pl-1 pr-2 rounded-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors group shrink-0"
              >
                <div className="relative">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                      🧪
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                    showUserMenu ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>

              {/* Floating Profile Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Identity Header Card */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.displayName || profile?.name || "কেমিস্ট্রি চ্যাম্পিয়ন"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {user?.email || "student@chemchamp.com"}
                    </p>

                    <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-800/80">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentRank.color}`}>
                        ⚔️ {currentRank.title}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-teal-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-teal-400/40" />
                        {xp} XP
                      </span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-1 text-xs font-medium">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>আমার প্রোফাইল ও স্ট্যাটস</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-500/10 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>অ্যাডমিন স্টুডিও</span>
                      </Link>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-1.5 border-t border-slate-800/80" />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <GlobalSearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
