import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, getRpgRankInfo } from "../context/AuthContext";
import {
  Flame,
  ChevronRight,
  Atom,
  Share2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Trophy,
  Swords,
  Clock,
  Target,
  X,
  Camera,
  Copy,
  Check,
  Sparkles,
  Activity,
  SlidersHorizontal,
  ArrowRight,
  BookOpen,
  Zap,
} from "lucide-react";
import ExamCountdownBanner from "../components/dashboard/ExamCountdownBanner";
import DailyHabitChecklist from "../components/dashboard/DailyHabitChecklist";
import MorningCapsuleCard from "../components/dashboard/MorningCapsuleCard";
import CoStudyCounter from "../components/dashboard/CoStudyCounter";
import WeaknessHeatmapCard from "../components/dashboard/WeaknessHeatmapCard";
import AdmissionEdgeCard from "../components/dashboard/AdmissionEdgeCard";
import OfflineBandwidthWidget from "../components/dashboard/OfflineBandwidthWidget";
import ResumeStudyHeroCard from "../components/dashboard/ResumeStudyHeroCard";
import ProgressLineGraph from "../components/dashboard/ProgressLineGraph";
import MorningReminderPopup from "../components/dashboard/MorningReminderPopup";
import PomodoroStudyModal from "../components/dashboard/PomodoroStudyModal";
import GlobalAnnouncementBanner from "../components/common/GlobalAnnouncementBanner";
import { soundService } from "../services/soundService";
import { notificationService } from "../services/notificationService";
import { ScrollReveal } from "../components/common/MotionScroll";

export default function Dashboard() {
  const { user, profile, syncUserProfile } = useAuth();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Smart Learning Hub Tabs: "vault" | "heatmap" | "admission"
  const [activeHubTab, setActiveHubTab] = useState("vault");

  const preferences = profile?.preferences || {
    target: "HSC_26",
    paper: "both",
    dailyGoalMinutes: 45,
    deadlineDays: 90,
  };

  const [planForm, setPlanForm] = useState({
    target: preferences.target || "HSC_26",
    paper: preferences.paper || "both",
    dailyGoalMinutes: String(preferences.dailyGoalMinutes || 45),
    deadlineDays: String(preferences.deadlineDays || 90),
  });

  const streakCount = profile?.streakCount || profile?.gamification?.streakCount || 1;
  const xp = profile?.gamification?.currentXP || 120;
  const totalSolvedMCQ = profile?.stats?.totalSolvedMCQ ?? 24;
  const accuracyRate = profile?.stats?.accuracyRate ?? 88;
  const totalStudyMinutes = profile?.stats?.totalStudyMinutes ?? 45;

  // Check evening streak reminder
  useEffect(() => {
    notificationService.checkAndSendStreakReminder(streakCount, true);
  }, [streakCount]);

  const currentRank = getRpgRankInfo(xp);
  const xpInCurrentTier = Math.max(0, xp - currentRank.minXp);
  const tierSpan = Math.max(1, currentRank.nextXp - currentRank.minXp);
  const levelProgressPercent = Math.min(100, Math.round((xpInCurrentTier / tierSpan) * 100));

  const handleStreakUpdate = async (newStreakVal) => {
    if (syncUserProfile) {
      await syncUserProfile({
        streakCount: newStreakVal,
        gamification: { streakCount: newStreakVal },
      });
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    const updatedPrefs = {
      ...preferences,
      target: planForm.target,
      paper: planForm.paper,
      dailyGoalMinutes: Number(planForm.dailyGoalMinutes),
      deadlineDays: Number(planForm.deadlineDays),
    };
    // Reset deadline cache so countdown recalculates cleanly
    try {
      localStorage.removeItem(
        `chemchamp_deadline_${updatedPrefs.target}_${updatedPrefs.deadlineDays}`
      );
    } catch {
      // ignore
    }
    if (syncUserProfile) {
      await syncUserProfile({
        preferences: updatedPrefs,
        onboardingCompleted: true,
      });
    }
    setShowPlanModal(false);
  };

  const shareReportText = `🧪 আমার ChemChamp সাপ্তাহিক রিপোর্ট:\n🔥 স্ট্রিক: ${streakCount} দিন\n⚔️ পদবি: ${currentRank.title} (${xp} XP)\n🎯 MCQ এক্যুরেসি: ${accuracyRate}% (${totalSolvedMCQ}টি সমাধান)\n⏱️ মোট ফোকাস রিডিং: ${totalStudyMinutes} মিনিট!`;

  const handleShareSocial = (platform) => {
    const encodedText = encodeURIComponent(shareReportText);
    const encodedUrl = encodeURIComponent(window.location.origin);

    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, "_blank");
    } else if (platform === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
        "_blank"
      );
    } else if (navigator.share) {
      navigator
        .share({
          title: "আমার ChemChamp প্রগ্রেস কার্ড",
          text: shareReportText,
          url: window.location.origin,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(shareReportText);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
    }
  };

  const rawDisplayName = user?.displayName || profile?.name || "কেমিস্ট্রি চ্যাম্পিয়ন";
  const idMatch = rawDisplayName.match(/^(.*?)\s*(\([0-9-]+\))$/);
  const cleanName = idMatch ? idMatch[1] : rawDisplayName;
  const studentIdBadge = idMatch ? idMatch[2] : null;

  return (
    <div className="text-slate-100 pb-28 md:pb-12 pt-2.5 sm:pt-5 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-4">
      {/* গ্লোবাল ব্রডকাস্ট নোটিশ ব্যানার */}
      <GlobalAnnouncementBanner />

      {/* 1. Sleek Modern Header Zone (User Profile, RPG Rank, Streak & Quick Actions) */}
      <header className="pb-4 mb-5 border-b border-slate-900 space-y-3 sm:space-y-4">
        {/* Modern Profile Card with Mobile Optimized Hierarchy */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800/90 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between gap-3">
            {/* User Identity & RPG Badge */}
            <div className="flex items-center gap-3 min-w-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Student"}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 border-emerald-500/40 shadow-lg object-cover ring-2 ring-emerald-500/20 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-lg sm:text-xl shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/20 shrink-0">
                  🧪
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[170px] sm:max-w-none">
                    {cleanName}
                  </h1>
                  {studentIdBadge && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
                      {studentIdBadge.replace(/[()]/g, "")}
                    </span>
                  )}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                    {preferences.target?.replace("_", " ") || "HSC 26"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${currentRank.color}`}
                  >
                    ⚔️ {currentRank.title} ({currentRank.levelBn})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    {xp} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Desktop */}
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-sm">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                  {streakCount} দিন স্ট্রিক
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setShowPomodoro(true);
                }}
                title="২৫ মিনিটের ফোকাস স্টাডি পোমোডোরো শুরু করুন"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ফোকাস ল্যাব</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setPlanForm({
                    target: preferences.target || "HSC_26",
                    paper: preferences.paper || "both",
                    dailyGoalMinutes: String(preferences.dailyGoalMinutes || 45),
                    deadlineDays: String(preferences.deadlineDays || 90),
                  });
                  setShowPlanModal(true);
                }}
                title="লক্ষ্য ও সময়সীমা পরিবর্তন করুন"
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setShowShareModal(true);
                }}
                title="সাপ্তাহিক রিপোর্ট কার্ড শেয়ার করুন"
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>

            {/* Mobile Utility Icons on Top Right */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setPlanForm({
                    target: preferences.target || "HSC_26",
                    paper: preferences.paper || "both",
                    dailyGoalMinutes: String(preferences.dailyGoalMinutes || 45),
                    deadlineDays: String(preferences.deadlineDays || 90),
                  });
                  setShowPlanModal(true);
                }}
                title="লক্ষ্য ও সময়সীমা পরিবর্তন করুন"
                className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setShowShareModal(true);
                }}
                title="রিপোর্ট কার্ড শেয়ার করুন"
                className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Bottom Row: 50/50 Symmetrical Grid for Streak & Focus Lab */}
          <div className="grid grid-cols-2 gap-2 sm:hidden pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 py-2 px-3 rounded-xl shadow-sm text-center">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse shrink-0" />
              <span className="text-xs font-black text-amber-300 font-mono">
                {streakCount} দিন স্ট্রিক
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowPomodoro(true);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>ফোকাস ল্যাব</span>
            </button>
          </div>
        </div>

        {/* RPG Level Progress Line Graph & Interactive Quick Stats */}
        <ProgressLineGraph
          currentRank={currentRank}
          xp={xp}
          levelProgressPercent={levelProgressPercent}
          totalSolvedMCQ={totalSolvedMCQ}
          accuracyRate={accuracyRate}
          totalStudyMinutes={totalStudyMinutes}
          onOpenPomodoro={() => {
            soundService.playClick();
            setShowPomodoro(true);
          }}
        />
      </header>

      {/* Morning Reminder Popup for remaining missions */}
      <MorningReminderPopup />

      {/* Pomodoro Focus Study Mode Modal */}
      <PomodoroStudyModal isOpen={showPomodoro} onClose={() => setShowPomodoro(false)} />

      {/* 2. Structured Multi-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Main Focus Zone: Live Status, Resume Study, Habits, Countdown, Segmented Tab Hub) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Live Co-Study Pulse Banner */}
          <CoStudyCounter />

          {/* Section A: Resume Learning Hero Card (যেখানে পড়া ছেড়েছিলেন — Primary Call to Action) */}
          <ResumeStudyHeroCard />

          {/* Section B: Daily Habit Checklist (আজকের ৩টি মিশন ও স্ট্রিক লক) */}
          <DailyHabitChecklist onStreakUpdate={handleStreakUpdate} />

          {/* Section C: Exam Target Countdown & Syllabus Pace */}
          <ExamCountdownBanner
            preferences={preferences}
            onEditPlan={() => {
              setPlanForm({
                target: preferences.target || "HSC_26",
                paper: preferences.paper || "both",
                dailyGoalMinutes: String(preferences.dailyGoalMinutes || 45),
                deadlineDays: String(preferences.deadlineDays || 90),
              });
              setShowPlanModal(true);
            }}
          />

          {/* Section D: Smart Modular Learning Center (Segmented Tab Controller - Clutter Elimination) */}
          <div className="space-y-4 pt-2">
            {/* Segmented Tab Navigation Bar - Perfectly Balanced 3-Column Grid, Zero Wrapping */}
            <div className="bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveHubTab("vault");
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap min-h-[44px] ${
                  activeHubTab === "vault"
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">ভল্ট ও টুলস</span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono shrink-0 whitespace-nowrap">
                  ৪টি টুল
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveHubTab("heatmap");
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap min-h-[44px] ${
                  activeHubTab === "heatmap"
                    ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">উইকনেস অ্যানালাইসিস</span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono shrink-0 whitespace-nowrap">
                  হিটম্যাপ
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setActiveHubTab("admission");
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all whitespace-nowrap min-h-[44px] ${
                  activeHubTab === "admission"
                    ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                <Target className="w-4 h-4 text-teal-400 shrink-0" />
                <span className="whitespace-nowrap">অ্যাডমিশন স্পেশাল এজ</span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono shrink-0 whitespace-nowrap">
                  ২০ বছর
                </span>
              </button>
            </div>

            {/* Animated Tab Content with Smooth Height & Fluid Fade/Glide Transition */}
            <motion.div layout transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="min-h-[260px]">
              <AnimatePresence mode="wait">
                {/* Tab 1 Content: Special Chemistry Vault Hub Shortcuts */}
                {activeHubTab === "vault" && (
                  <motion.div
                    key="vault"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                        <span>⚡ প্রয়োজনীয় কেমিস্ট্রি পাওয়ার টুল ও দ্রুত রিভিশন ভল্ট</span>
                      </span>
                      <Link
                        to="/vault"
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group"
                      >
                        <span>ভল্ট এক্সপ্লোর করুন</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <Link
                        to="/vault?tab=reactions"
                        className="group p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-950/20 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            ⚡
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ফ্লিপকার্ড</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                            জৈব রসায়ন ফ্লিপকার্ড
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            বিক্রিয়া ও মেকানিজম নোট
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/vault?tab=periodic"
                        className="group p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-950/20 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform">
                            <Atom className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ব্যতিক্রম সহ</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                            পর্যায় সারণি
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            Cr, Cu, N বনাম O অ্যালার্ট
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/vault?tab=formulas"
                        className="group p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-950/20 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ম্যাথ হ্যাকস</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                            ফর্মুলা ভল্ট
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            বাফার, গ্যাস ও ফ্যারাডে সূত্র
                          </p>
                        </div>
                      </Link>

                      <Link
                        to="/exams?tab=mistakes"
                        className="group p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/20 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
                            <AlertCircle className="w-4 h-4" />
                          </span>
                          <span className="text-[10px] text-rose-400/80 font-mono font-bold">Leitner</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                            স্মার্ট মিস্টেক বক্স
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            ১, ৩, ৭ ও ২১ দিনের রিভিশন
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Printable A4 Cheat Sheet Quick Bar */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-emerald-950/30 border border-teal-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white">
                            ওয়ান-ক্লিক A4 প্রিন্টযোগ্য চিটশিট
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            আপনার পছন্দের অধ্যায় ও ফর্মুলা সিলেক্ট করে পরীক্ষার আগের রাতে পড়ার A4 শিট প্রিন্ট করুন
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/vault"
                        className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 font-bold text-xs shrink-0 flex items-center gap-1 transition-all"
                      >
                        <span>বানিয়ে নিন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                )}

                {/* Tab 2 Content: Weakness Heatmap */}
                {activeHubTab === "heatmap" && (
                  <motion.div
                    key="heatmap"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <WeaknessHeatmapCard />
                  </motion.div>
                )}

                {/* Tab 3 Content: Admission Special Edge Matrix */}
                {activeHubTab === "admission" && (
                  <motion.div
                    key="admission"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <AdmissionEdgeCard totalSolved={totalSolvedMCQ} accuracy={accuracyRate} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Right Column (Companion Sidebar: Morning Capsule, 1v1 Battle Arena, Doubt Assist Desk & Offline Mode) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* 1. Morning Chemistry Micro-Capsule */}
          <MorningCapsuleCard />

          {/* 2. 1v1 Quiz Battle Duel & Live Leaderboard Banner */}
          <Link
            to="/leaderboard"
            className="group block p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 border border-amber-500/30 hover:border-amber-500/50 shadow-md transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> লাইভ লিডারবোর্ড
              </span>
              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 text-rose-400" /> ১v১ কুইজ ব্যাটল
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <h4 className="text-xs md:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  বন্ধুদের সাথে ১v১ কুইজ ডুয়েল ও র‍্যাংকিং
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  হোয়াটসঅ্যাপে রুম কোড পাঠিয়ে ৫টি দ্রুত প্রশ্নের সরাসরি চ্যালেঞ্জ দিন!
                </p>
              </div>
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2">
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* 3. Direct Teacher Doubt Box Assistant (Triggers Floating Doubt Modal) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-md flex items-center justify-between gap-3 group">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  শিক্ষকের কাছে ডাউট বক্স 🎙️📸
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  খাতার ম্যাথ বা বিক্রিয়ার ছবি তুলে সরাসরি সাবমিট করুন। ভয়েস নোটে সমাধান মিলবে!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                window.dispatchEvent(new CustomEvent("open-doubt-modal"));
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ডাউট পাঠান</span>
            </button>
          </div>

          {/* 4. Offline Practice Pack & Low-Bandwidth Mode */}
          <OfflineBandwidthWidget />
        </div>
      </div>

      {/* Onboarding / Study Plan Edit Modal (Portaled to document.body, dead-centered with smooth motion) */}
      {createPortal(
        <AnimatePresence>
          {showPlanModal && (
            <motion.div
              key="plan-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowPlanModal(false)}
            >
              <motion.div
                key="plan-modal-card"
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 14 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-base font-bold text-white mb-1">স্টাডি প্ল্যান কাস্টমাইজ করুন</h3>
                <p className="text-xs text-slate-400 mb-4">
                  আপনার লক্ষ্য, পেপার ফোকাস ও সিলেবাস শেষের সময়সীমা নির্ধারণ করুন
                </p>

                <form onSubmit={handleSavePlan} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      টার্গেট নির্বাচন
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "HSC_26", label: "HSC 26" },
                        { id: "HSC_27", label: "HSC 27" },
                        { id: "Admission", label: "Admission" },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setPlanForm({ ...planForm, target: item.id })}
                          className={`py-2 px-3 font-bold rounded-lg border transition-all ${
                            planForm.target === item.id
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                              : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      পেপার ফোকাস
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "paper1", label: "১ম পত্র" },
                        { id: "paper2", label: "২য় পত্র" },
                        { id: "both", label: "উভয় পত্র" },
                      ].map((p) => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setPlanForm({ ...planForm, paper: p.id })}
                          className={`py-2 font-bold rounded-lg border transition-all ${
                            planForm.paper === p.id
                              ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                              : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                        দৈনিক পড়ার সময়
                      </label>
                      <select
                        value={planForm.dailyGoalMinutes}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, dailyGoalMinutes: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="30">৩০ মিনিট</option>
                        <option value="45">৪৫ মিনিট</option>
                        <option value="60">১ ঘণ্টা</option>
                        <option value="120">২ ঘণ্টা</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                        সিলেবাস শেষের সময়সীমা
                      </label>
                      <select
                        value={planForm.deadlineDays}
                        onChange={(e) => setPlanForm({ ...planForm, deadlineDays: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="45">৪৫ দিন</option>
                        <option value="60">৬০ দিন</option>
                        <option value="90">৯০ দিন</option>
                        <option value="120">১২০ দিন</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    প্ল্যান আপডেট করুন 🚀
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Share Weekly Report Card Modal (PRD Module 1 - Portaled to document.body) */}
      {createPortal(
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              key="share-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                key="share-modal-card"
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 14 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-4">
                  <span className="text-4xl">🏆</span>
                  <h3 className="text-base font-bold text-white mt-2">
                    শেয়ারযোগ্য সাপ্তাহিক রিপোর্ট কার্ড
                  </h3>
                  <p className="text-xs text-slate-400">
                    ফেসবুক বা হোয়াটসঅ্যাপে আপনার প্রস্তুতির অগ্রগতি শেয়ার করুন
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 mb-4 space-y-2.5 text-xs shadow-inner">
                  <div className="flex justify-between text-slate-300 border-b border-slate-800/80 pb-2">
                    <span>শিক্ষার্থী:</span>
                    <strong className="text-white">{user?.displayName || profile?.name || "Student"}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>টার্গেট ব্যাচ:</span>
                    <strong className="text-teal-300">
                      {preferences.target?.replace("_", " ")}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ডেইলি স্ট্রিক স্কোর:</span>
                    <strong className="text-amber-400">🔥 {streakCount} দিন</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>বর্তমান RPG পদবি:</span>
                    <strong className="text-emerald-400">
                      ⚔️ {currentRank.title} ({xp} XP)
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>MCQ নির্ভুলতা:</span>
                    <strong className="text-teal-400">
                      {accuracyRate}% এক্যুরেসি ({totalSolvedMCQ}টি সমাধান)
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>ফোকাস স্টাডি সময়:</span>
                    <strong className="text-purple-400">{totalStudyMinutes} মিনিট</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleShareSocial("whatsapp")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition-all"
                  >
                    WhatsApp শেয়ার 💬
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareSocial("facebook")}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition-all"
                  >
                    Facebook শেয়ার 📘
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleShareSocial("copy")}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    {copiedReport ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedReport ? "রিপোর্ট কপি হয়েছে!" : "রিপোর্ট কপি / শেয়ার করুন 📲"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl text-xs transition-all"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
