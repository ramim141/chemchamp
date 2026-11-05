import React, { useState, useEffect, useRef } from "react";
import { useAuth, getRpgRankInfo } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Seo from "../components/common/Seo";
import {
  User,
  LogOut,
  Flame,
  Award,
  Camera,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  MessageSquare,
  Clock,
  Sparkles,
  Settings,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  Target,
  BookOpen,
  TrendingUp,
  Check,
  SlidersHorizontal,
  Zap,
  ChevronRight,
  GraduationCap,
  Save,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import KaTeXMath from "../components/common/KaTeXMath";
import { soundService } from "../services/soundService";
import { notificationService } from "../services/notificationService";

const PRESET_AVATARS = ["🧪", "👩‍🔬", "👨‍🔬", "⚡", "🧬", "🪐", "🏆", "⚗️"];

export default function Profile() {
  const { user, profile, syncUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Active Profile Tab: "overview" | "achievements" | "analytics" | "doubts" | "settings"
  const [activeTab, setActiveTab] = useState("overview");

  // Editable Profile State
  const [displayName, setDisplayName] = useState(
    profile?.displayName || profile?.name || user?.displayName || ""
  );
  const [collegeInput, setCollegeInput] = useState(profile?.college || "");
  const [phoneInput, setPhoneInput] = useState(profile?.phone || "");
  const [selectedAvatar, setSelectedAvatar] = useState(
    profile?.avatar || "🧪"
  );
  const [targetBatch, setTargetBatch] = useState(
    profile?.preferences?.target || "HSC_26"
  );
  const [paperFocus, setPaperFocus] = useState(
    profile?.preferences?.paper || "both"
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(
    String(profile?.preferences?.dailyGoalMinutes || 45)
  );
  const [deadlineDays, setDeadlineDays] = useState(
    String(profile?.preferences?.deadlineDays || 90)
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // App Settings State
  const [soundEnabled, setSoundEnabled] = useState(() => soundService.isSoundEnabled());
  const [notifPermission, setNotifPermission] = useState(() => notificationService.getPermission());

  // Doubt History
  const [myDoubts, setMyDoubts] = useState([]);
  const [loadingDoubts, setLoadingDoubts] = useState(false);
  const [doubtFilter, setDoubtFilter] = useState("all"); // "all" | "resolved" | "pending"

  // Logout Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Gamification & Stats
  const streak = profile?.streakCount || profile?.gamification?.streakCount || 1;
  const xp = profile?.gamification?.currentXP || 120;
  const rankInfo = getRpgRankInfo(xp);
  const isAdmin = profile?.role === "admin";

  const totalSolvedMCQ = profile?.stats?.totalSolvedMCQ ?? 24;
  const accuracyRate = profile?.stats?.accuracyRate ?? 88;
  const totalStudyMinutes = profile?.stats?.totalStudyMinutes ?? 45;
  const examsTaken = profile?.stats?.examsTaken ?? 3;

  const xpInTier = Math.max(0, xp - rankInfo.minXp);
  const tierRange = Math.max(1, rankInfo.nextXp - rankInfo.minXp);
  const progressPercent = Math.min(100, Math.round((xpInTier / tierRange) * 100));

  useEffect(() => {
    if (profile) {
      if (profile.displayName || profile.name) {
        setDisplayName(profile.displayName || profile.name);
      }
      if (profile.college) setCollegeInput(profile.college);
      if (profile.phone) setPhoneInput(profile.phone);
      if (profile.avatar) setSelectedAvatar(profile.avatar);
      if (profile.preferences?.target) setTargetBatch(profile.preferences.target);
      if (profile.preferences?.paper) setPaperFocus(profile.preferences.paper);
      if (profile.preferences?.dailyGoalMinutes) {
        setDailyGoalMinutes(String(profile.preferences.dailyGoalMinutes));
      }
      if (profile.preferences?.deadlineDays) {
        setDeadlineDays(String(profile.preferences.deadlineDays));
      }
    }
  }, [profile]);

  // Fetch student's submitted doubts
  const fetchMyDoubts = async () => {
    if (!user?.uid) return;
    setLoadingDoubts(true);
    try {
      const cached = await cacheService.get(`user_doubts_${user.uid}`);
      if (cached) {
        setMyDoubts(cached);
        setLoadingDoubts(false);
        return;
      }
      const q = query(
        collection(db, "doubtBox"),
        where("studentUid", "==", user.uid),
        limit(20)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });
      setMyDoubts(list);
      await cacheService.set(`user_doubts_${user.uid}`, list, 10 * 60 * 1000); // 10 min
    } catch (err) {
      console.warn("Could not fetch user doubts:", err);
    } finally {
      setLoadingDoubts(false);
    }
  };

  useEffect(() => {
    fetchMyDoubts();
  }, [user?.uid]);

  // Save Profile & Academic Target Changes
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    soundService.playClick();
    setSavingProfile(true);

    try {
      const updatedPreferences = {
        ...(profile?.preferences || {}),
        target: targetBatch,
        paper: paperFocus,
        dailyGoalMinutes: Number(dailyGoalMinutes),
        deadlineDays: Number(deadlineDays),
      };

      await syncUserProfile({
        name: displayName.trim(),
        displayName: displayName.trim(),
        college: collegeInput.trim(),
        phone: phoneInput.trim(),
        avatar: selectedAvatar,
        preferences: updatedPreferences,
      });

      // Clear countdown cache so target recalculates
      try {
        localStorage.removeItem(
          `chemchamp_deadline_${targetBatch}_${deadlineDays}`
        );
      } catch {
        // ignore
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const nextState = soundService.toggleSound();
    setSoundEnabled(nextState);
    if (nextState) soundService.playClick();
  };

  // Toggle Push Notification
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

  // Logout confirmation
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  // Badges Calculation
  const badgesList = [
    {
      id: "badge_novice",
      title: "টেস্ট টিউব নভিস",
      subtitle: "ChemChamp প্ল্যাটফর্মে যাত্রা শুরু ও প্রথম অধ্যায় রিভিশন",
      icon: "🧪",
      unlocked: true,
      tier: "ব্রোঞ্জ",
    },
    {
      id: "badge_catalyst",
      title: "ক্যাটালিস্ট ট্রেইনি",
      subtitle: "২০০+ XP অর্জন করে ২য় স্তরে পদার্পণ",
      icon: "⚡",
      unlocked: xp >= 200,
      progress: `${Math.min(200, xp)}/200 XP`,
      tier: "সিলভার",
    },
    {
      id: "badge_reaction",
      title: "রিঅ্যাকশন মাস্টার",
      subtitle: "৫০০+ XP ও জৈব রসায়ন মেকানিজম রিভিশন",
      icon: "⚗️",
      unlocked: xp >= 500,
      progress: `${Math.min(500, xp)}/500 XP`,
      tier: "গোল্ড",
    },
    {
      id: "badge_nobel",
      title: "নোবেল লরিয়েট",
      subtitle: "১০০০+ XP অর্জন ও অ্যাডমিশন স্পেশাল এজ সম্পন্ন",
      icon: "🏆",
      unlocked: xp >= 1000,
      progress: `${Math.min(1000, xp)}/1000 XP`,
      tier: "প্ল্যাটিনাম",
    },
    {
      id: "badge_streak_3",
      title: "স্ট্রিক অন ফায়ার",
      subtitle: "টানা ৩ দিন পড়াশোনা চালিয়ে রাখা",
      icon: "🔥",
      unlocked: streak >= 3,
      progress: `${Math.min(3, streak)}/৩ দিন`,
      tier: "ব্রোঞ্জ",
    },
    {
      id: "badge_streak_7",
      title: "স্ট্রিক লেজেন্ড",
      subtitle: "টানা ৭ দিন রিভিশন মিশন পূর্ণ করে স্ট্রিক ধরে রাখা",
      icon: "🌟",
      unlocked: streak >= 7,
      progress: `${Math.min(7, streak)}/৭ দিন`,
      tier: "গোল্ড",
    },
    {
      id: "badge_accuracy",
      title: "স্নাইপার এক্যুরেসি",
      subtitle: "৮৫%+ নির্ভুলতায় বোর্ড ও অ্যাডমিশন MCQ সমাধান",
      icon: "🎯",
      unlocked: accuracyRate >= 85,
      progress: `${accuracyRate}% / ৮৫%`,
      tier: "গোল্ড",
    },
    {
      id: "badge_focus",
      title: "ডিপ ফোকাস স্কলার",
      subtitle: "ফোকাস ল্যাবে ৩০+ মিনিট নিবিড় পড়াশোনা সম্পন্ন",
      icon: "⏱️",
      unlocked: totalStudyMinutes >= 30,
      progress: `${totalStudyMinutes}/৩০ মিনিট`,
      tier: "সিলভার",
    },
  ];

  const resolvedDoubtsCount = myDoubts.filter(
    (d) => d.status === "resolved" || Boolean(d.teacherReply)
  ).length;
  const pendingDoubtsCount = myDoubts.length - resolvedDoubtsCount;

  const filteredDoubts = myDoubts.filter((item) => {
    const isResolved = item.status === "resolved" || Boolean(item.teacherReply);
    if (doubtFilter === "resolved") return isResolved;
    if (doubtFilter === "pending") return !isResolved;
    return true;
  });

  return (
    <div className="text-slate-100 pb-28 md:pb-12 pt-3 md:pt-6 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <Seo title="প্রোফাইল" noindex />
      {/* 1. Header Hero Banner */}
      <header className="mb-6 pb-5 border-b border-slate-900 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-emerald-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-2xl shadow-lg shadow-purple-950/30">
            {selectedAvatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">
                {displayName || "কেমিস্ট্রি শিক্ষার্থী"}
              </h1>
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PRO সদস্য
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ব্যক্তিগত প্রোফাইল, অ্যাকাডেমিক গোল, আরপিজি অগ্রগতি ও ডাউট হিস্টোরি
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/20 transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>অ্যাডমিন স্টুডিও</span>
            </Link>
          )}

          <Link
            to="/dashboard"
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
          >
            <span>ড্যাশবোর্ড</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>
      </header>

      {/* 2. Top Navigation Tabs - Native App Horizontal Scrolling Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 p-1 sm:p-1.5 rounded-2xl flex items-center gap-1.5 mb-6 shadow-sm overflow-x-auto scrollbar-none sm:grid sm:grid-cols-5">
        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveTab("overview");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 sm:shrink active:scale-95 ${
            activeTab === "overview"
              ? "bg-gradient-to-r from-emerald-500/25 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-black"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
          <span className="sm:hidden">প্রোফাইল</span>
          <span className="hidden sm:inline">প্রোফাইল ও লক্ষ্য</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveTab("achievements");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 sm:shrink active:scale-95 ${
            activeTab === "achievements"
              ? "bg-gradient-to-r from-purple-500/25 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10 font-black"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
          <span className="sm:hidden">ব্যাজ</span>
          <span className="hidden sm:inline">আরপিজি ও ব্যাজ</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveTab("analytics");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 sm:shrink active:scale-95 ${
            activeTab === "analytics"
              ? "bg-gradient-to-r from-teal-500/25 to-cyan-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10 font-black"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400 shrink-0" />
          <span>পারফর্ম্যান্স</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveTab("doubts");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 sm:shrink active:scale-95 ${
            activeTab === "doubts"
              ? "bg-gradient-to-r from-amber-500/25 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 font-black"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span className="sm:hidden">ডাউট ({myDoubts.length})</span>
          <span className="hidden sm:inline">ডাউট বক্স ({myDoubts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundService.playClick();
            setActiveTab("settings");
          }}
          className={`flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 sm:shrink active:scale-95 ${
            activeTab === "settings"
              ? "bg-gradient-to-r from-slate-700/50 to-slate-800/50 text-white border border-slate-600 shadow-sm font-black"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
          }`}
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 shrink-0" />
          <span>সেটিংস</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: Profile Overview & Academic Target Settings */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left Column: Quick Profile Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-center relative overflow-hidden shadow-xl">
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs text-amber-400 font-bold font-mono">
                <Flame className="w-3.5 h-3.5 fill-amber-400 animate-pulse" />
                <span>{streak} দিন স্ট্রিক</span>
              </div>

              {/* Avatar Selector Display */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-3xl mx-auto mb-3 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/20">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="User"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <span>{selectedAvatar}</span>
                )}
              </div>

              <h2 className="text-base font-bold text-white tracking-tight">
                {displayName || "কেমিস্ট্রি চ্যাম্পিয়ন"}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold bg-slate-950/80 border-slate-800">
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${rankInfo.color}`}>
                  ⚔️ {rankInfo.title}
                </span>
                <span className="text-amber-400 font-mono font-bold">• {xp} XP</span>
              </div>

              {/* Preset Avatar Selector */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  পছন্দের কেমিস্ট্রি অবতার নির্বাচন করুন
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => {
                        soundService.playClick();
                        setSelectedAvatar(av);
                      }}
                      className={`text-xl p-2 rounded-xl border transition-all ${
                        selectedAvatar === av
                          ? "border-emerald-500 bg-emerald-500/20 scale-105 shadow-md shadow-emerald-500/20"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">টার্গেট ব্যাচ</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {targetBatch.replace("_", " ")}
                  </span>
                </div>
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">দৈনিক সময়</span>
                  <span className="text-xs font-bold text-teal-400">
                    {dailyGoalMinutes} মিনিট
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Profile Form & Academic Target */}
          <div className="lg:col-span-8">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <span>শিক্ষার্থীর তথ্য ও অ্যাকাডেমিক লক্ষ্য এডিট করুন</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  আপনার সঠিক লক্ষ্য ও প্রতিষ্ঠান নির্ধারণ করুন, যা লিডারবোর্ড ও স্টাডি কাউন্টডাউনে সিঙ্ক হবে।
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                {/* Name & College */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      পূর্ণ নাম
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="আপনার নাম লিখুন"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      কলেজ / প্রতিষ্ঠান
                    </label>
                    <input
                      type="text"
                      value={collegeInput}
                      onChange={(e) => setCollegeInput(e.target.value)}
                      placeholder="যেমন: নটর ডেম কলেজ / ঢাকা কলেজ"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Phone & Email (Readonly) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      হোয়াটসঅ্যাপ / ফোন নম্বর
                    </label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="যেমন: 017XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      রেজিস্টার্ড ইমেইল
                    </label>
                    <input
                      type="text"
                      value={user?.email || ""}
                      readOnly
                      disabled
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-slate-400 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                {/* Target Examination Selection */}
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                    টার্গেট পরীক্ষা নির্বাচন
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "HSC_26", label: "HSC 26" },
                      { id: "HSC_27", label: "HSC 27" },
                      { id: "Admission", label: "অ্যাডমিশন (DU/BUET/Med)" },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          soundService.playClick();
                          setTargetBatch(item.id);
                        }}
                        className={`py-2 px-3 font-bold rounded-xl border text-center transition-all ${
                          targetBatch === item.id
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paper Focus */}
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
                        onClick={() => {
                          soundService.playClick();
                          setPaperFocus(p.id);
                        }}
                        className={`py-2 font-bold rounded-xl border transition-all ${
                          paperFocus === p.id
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-sm"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Daily Study Goal & Syllabus Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 uppercase mb-1.5">
                      দৈনিক পড়ার লক্ষ্য
                    </label>
                    <select
                      value={dailyGoalMinutes}
                      onChange={(e) => setDailyGoalMinutes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
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
                      value={deadlineDays}
                      onChange={(e) => setDeadlineDays(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="45">৪৫ দিন</option>
                      <option value="60">৬০ দিন</option>
                      <option value="90">৯০ দিন</option>
                      <option value="120">১২০ দিন</option>
                    </select>
                  </div>
                </div>

                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>প্রোফাইল ও অ্যাকাডেমিক লক্ষ্য সফলভাবে সংরক্ষণ করা হয়েছে!</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>তথ্য সংরক্ষণ করুন 🚀</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RPG Progression, Rank Tiers & Achievement Badges */}
      {activeTab === "achievements" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Rank Hero Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-3xl shadow-lg">
                  ⚔️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {rankInfo.title}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {rankInfo.levelBn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    বর্তমান XP: <strong className="text-amber-400 font-mono">{xp} XP</strong> • পরবর্তী লেভেলের লক্ষ্যমাত্রা: <strong className="text-purple-300 font-mono">{rankInfo.nextXp} XP</strong>
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-xs text-slate-400 block">লেভেল অগ্রগতি</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{progressPercent}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 pt-3 border-t border-purple-500/20">
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${rankInfo.barColor} transition-all duration-700`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1.5">
                <span>{rankInfo.minXp} XP</span>
                <span>{rankInfo.nextXp} XP ({rankInfo.nextTitle})</span>
              </div>
            </div>
          </div>

          {/* Badges Showcase Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  কেমিস্ট্রি চ্যাম্পিয়ন অ্যাচিভমেন্ট ব্যাজ
                </h4>
                <p className="text-[11px] text-slate-400">
                  নিয়মিত পড়া, কুইজ ও স্ট্রিক পূর্ণ করে ব্যাজ আনলক করুন
                </p>
              </div>
              <span className="text-xs font-bold text-purple-400 font-mono bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-xl">
                {badgesList.filter((b) => b.unlocked).length} / {badgesList.length} আনলকড
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {badgesList.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    badge.unlocked
                      ? "bg-slate-900 border-purple-500/30 hover:border-purple-500/50 shadow-md"
                      : "bg-slate-950/60 border-slate-800/80 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {badge.icon}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        badge.unlocked
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {badge.unlocked ? "আনলকড ✓" : "লকড 🔒"}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-white mb-0.5">{badge.title}</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                      {badge.subtitle}
                    </p>
                    {badge.progress && (
                      <span className="text-[10px] font-mono text-amber-400 block">
                        প্রগ্রেস: {badge.progress}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Academic Analytics & Performance */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
              <span className="text-2xl mb-1 block">🎯</span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">মোট সমাধানকৃত MCQ</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                {totalSolvedMCQ} টি
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
              <span className="text-2xl mb-1 block">⚡</span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">গড় নির্ভুলতা (Accuracy)</span>
              <span className="text-lg sm:text-xl font-black text-teal-400 font-mono mt-0.5 block">
                {accuracyRate}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
              <span className="text-2xl mb-1 block">⏱️</span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">ফোকাস পড়ার সময়</span>
              <span className="text-lg sm:text-xl font-black text-purple-400 font-mono mt-0.5 block">
                {totalStudyMinutes} মিনিট
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md text-center">
              <span className="text-2xl mb-1 block">📝</span>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">মক এক্সাম সম্পন্ন</span>
              <span className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5 block">
                {examsTaken} টি
              </span>
            </div>
          </div>

          {/* Paper Preparation Progress */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>রসায়ন পেপারভিত্তিক প্রস্তুতি ও সিলেবাস কভারেজ</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>রসায়ন ১ম পত্র (গুণগত, পর্যায়বৃত্ত, রাসায়নিক পরিবর্তন)</span>
                  <span className="text-emerald-400 font-bold font-mono">৮৫% কভার্ড</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>রসায়ন ২য় পত্র (পরিবেশ, জৈব রসায়ন, পরিমাণগত, তড়িৎ)</span>
                  <span className="text-teal-400 font-bold font-mono">৭২% কভার্ড</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                দুর্বল অধ্যায়গুলো আরও বিশদভাবে বিশ্লেষণ করতে চান?
              </span>
              <Link
                to="/dashboard"
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <span>হিটম্যাপ দেখুন</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Student Doubt Box & Teacher Solutions */}
      {activeTab === "doubts" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Doubt Desk Header & Quick Action */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  স্যারের ডাউট ডেস্ক ও অডিও সমাধান আর্কাইভ
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                আপনার পাঠানো সমস্ত প্রশ্ন, খাতার ছবি, স্যারের টেক্সট ও ভয়েস নোট সলিউশন এখানে সংরক্ষিত থাকে।
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                window.dispatchEvent(new CustomEvent("open-doubt-modal"));
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>নতুন ডাউট জিজ্ঞাসা করুন 🎙️📸</span>
            </button>
          </div>

          {/* Doubt Filters & Counts */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDoubtFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  doubtFilter === "all"
                    ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                সবগুলো ({myDoubts.length})
              </button>
              <button
                type="button"
                onClick={() => setDoubtFilter("resolved")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  doubtFilter === "resolved"
                    ? "bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                সমাধান প্রাপ্ত ({resolvedDoubtsCount})
              </button>
              <button
                type="button"
                onClick={() => setDoubtFilter("pending")}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  doubtFilter === "pending"
                    ? "bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                অপেক্ষমাণ ({pendingDoubtsCount})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMyDoubts}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              রিফ্রেশ করুন 🔄
            </button>
          </div>

          {/* Doubt List */}
          {loadingDoubts ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>ডাউট হিস্টোরি লোড হচ্ছে...</span>
            </div>
          ) : filteredDoubts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <span className="text-3xl block">📨</span>
              <p className="text-xs text-slate-400">এই ফিল্টারে কোনো ডাউট পাওয়া যায়নি।</p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-doubt-modal"))}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                প্রথম প্রশ্নটি পাঠান ➔
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoubts.map((item) => {
                const isResolved = item.status === "resolved" || Boolean(item.teacherReply);
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-teal-300 border border-slate-800">
                        {item.chapterName || "রসায়ন প্রশ্ন"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          isResolved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> সমাধান প্রাপ্ত
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> উত্তরের অপেক্ষায়
                          </>
                        )}
                      </span>
                    </div>

                    {item.queryText && (
                      <div className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                        <KaTeXMath text={item.queryText} />
                      </div>
                    )}

                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block"
                      >
                        <img
                          src={item.imageUrl}
                          alt="Student doubt attachment"
                          className="max-h-36 rounded-xl border border-slate-800 object-contain hover:border-emerald-500/40 transition-colors"
                        />
                      </a>
                    )}

                    {/* Teacher's LaTeX Reply */}
                    {item.teacherReply && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> স্যারের লিখিত ব্যাখ্যা:
                        </span>
                        <div className="text-xs text-slate-100 leading-relaxed">
                          <KaTeXMath text={item.teacherReply} />
                        </div>
                      </div>
                    )}

                    {/* Teacher's Voice Solution */}
                    {item.teacherVoiceUrl && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-slate-900 border border-emerald-500/30 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-emerald-400 block mb-1">
                            স্যারের ভয়েস সলিউশন 🎙️ (প্লে করুন)
                          </span>
                          <audio controls src={item.teacherVoiceUrl} className="h-8 w-full max-w-sm" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Settings & Account Security */}
      {activeTab === "settings" && (
        <div className="space-y-5 max-w-2xl animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>অ্যাপ সেটিংস ও প্রিফারেন্স</span>
            </h3>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">সাউন্ড ইফেক্ট ও অডিও ফিডব্যাক</h5>
                  <p className="text-[11px] text-slate-400">বাটন ক্লিক, সঠিক উত্তর ও টাইমার সাউন্ড</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  soundEnabled
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {soundEnabled ? "চালু ✓" : "বন্ধ"}
              </button>
            </div>

            {/* Push Notifications Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {notifPermission === "granted" ? (
                    <BellRing className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">ডেইলি স্টাডি রিমাইন্ডার ও পুশ নোটিফিকেশন</h5>
                  <p className="text-[11px] text-slate-400">প্রতিদিন সন্ধ্যায় স্ট্রিক বাঁচানোর সতর্কতা</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotif}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  notifPermission === "granted"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {notifPermission === "granted" ? "অনুমোদিত ✓" : "অনুমতি দিন"}
              </button>
            </div>
          </div>

          {/* Account Security & Sign Out */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>অ্যাকাউন্ট সিকিউরিটি</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
              <p>ইউজার আইডি (UID): <span className="text-slate-200">{user?.uid || "N/A"}</span></p>
              <p>রেজিস্টার্ড ইমেইল: <span className="text-slate-200">{user?.email || "N/A"}</span></p>
            </div>

            <button
              type="button"
              onClick={() => {
                soundService.playClick();
                setShowLogoutModal(true);
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>অ্যাকাউন্ট থেকে লগআউট করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-1">
              লগআউট করতে চান?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              আপনি কি নিশ্চিতভাবে ChemChamp থেকে সাইন-আউট করতে চাচ্ছেন? পরবর্তীতে পুনরায় লগইন করতে হবে।
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLoggingOut ? "লগআউট হচ্ছে..." : "হ্যাঁ, লগআউট"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
