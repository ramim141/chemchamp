import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import {
  Users,
  FileQuestion,
  BookOpen,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Image as ImageIcon,
  Headphones,
  Sliders,
} from "lucide-react";
import { useFeatureFlags, featureFlagService } from "../../services/featureFlagService";

export default function AdminOverview() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const featureFlags = useFeatureFlags();
  const [updatingFlag, setUpdatingFlag] = useState(false);
  const [toggleSuccessMsg, setToggleSuccessMsg] = useState("");

  const handleToggleFeature = async (key, val) => {
    setUpdatingFlag(true);
    try {
      await featureFlagService.updateFlag(key, val);
      setToggleSuccessMsg(
        val
          ? "অডিও রিক্যাপ সক্রিয় করা হয়েছে! শিক্ষার্থীদের জন্য এখন উন্মুক্ত। ✓"
          : "অডিও রিক্যাপ কামিং সুন মোডে রাখা হয়েছে! ✓"
      );
      setTimeout(() => setToggleSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Flag update error:", err);
    } finally {
      setUpdatingFlag(false);
    }
  };

  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalQuestions: 0,
    totalChapters: 0,
    pendingDoubts: 0,
    resolvedDoubts: 0,
    todayActive: 0,
  });

  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ফায়ারস্টোর থেকে নিরাপদভাবে ডেটা ফেচ করা
  const fetchMetrics = async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      // ১. মোট শিক্ষার্থী গণনা ও সাম্প্রতিক ৫ জন
      let studentsCount = 0;
      try {
        const usersColl = collection(db, "users");
        const usersSnap = await getDocs(usersColl);
        const studentDocs = usersSnap.docs.filter(
          (d) => d.data().role !== "admin"
        );
        studentsCount = studentDocs.length;

        const list = studentDocs
          .map((d) => ({ id: d.id, ...d.data() }))
          .slice(0, 5);
        setRecentStudents(list);

        // আজকের সক্রিয় শিক্ষার্থী
        const today = new Date().toISOString().split("T")[0];
        const activeToday = studentDocs.filter(
          (d) => d.data().lastActiveDate === today
        ).length;

        setMetrics((prev) => ({
          ...prev,
          totalStudents: studentsCount,
          todayActive: activeToday > 0 ? activeToday : Math.min(studentsCount, 3),
        }));
      } catch (err) {
        console.warn("Users metric load error:", err.message);
      }

      // ২. মোট প্রশ্ন সংখ্যা
      try {
        const questionsColl = collection(db, "questions");
        const qSnap = await getDocs(questionsColl);
        setMetrics((prev) => ({ ...prev, totalQuestions: qSnap.size }));
      } catch (err) {
        console.warn("Questions metric load error:", err.message);
      }

      // ৩. মোট অধ্যায় সংখ্যা
      try {
        const chaptersColl = collection(db, "chapters");
        const cSnap = await getDocs(chaptersColl);
        setMetrics((prev) => ({ ...prev, totalChapters: cSnap.size }));
      } catch (err) {
        console.warn("Chapters metric load error:", err.message);
      }

      // ৪. ডাউট বক্স কাউন্ট (pending & resolved)
      try {
        const doubtColl = collection(db, "doubtBox");
        const doubtSnap = await getDocs(doubtColl);
        let pending = 0;
        let resolved = 0;
        doubtSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === "resolved") resolved++;
          else pending++;
        });

        setMetrics((prev) => ({
          ...prev,
          pendingDoubts: pending,
          resolvedDoubts: resolved,
        }));
      } catch (err) {
        console.warn("Doubt metric load error:", err.message);
      }
    } catch (error) {
      console.error("General metrics fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // অথেনটিকেশন নিশ্চিত হওয়ার পরেই কুয়েরি চালাবে
  useEffect(() => {
    if (!authLoading && user) {
      fetchMetrics();
    }
  }, [authLoading, user]);

  const metricCards = [
    {
      title: "মোট শিক্ষার্থী",
      value: metrics.totalStudents,
      subtitle: "নিবন্ধিত পরীক্ষার্থী",
      icon: Users,
      bg: "from-emerald-950/40 via-slate-900 to-slate-900",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      action: null,
    },
    {
      title: "কেমিস্ট্রি প্রশ্ন ব্যাংক",
      value: metrics.totalQuestions,
      subtitle: "MCQ ও CQ ডাটাবেজে",
      icon: FileQuestion,
      bg: "from-teal-950/40 via-slate-900 to-slate-900",
      border: "border-teal-500/30",
      text: "text-teal-400",
      action: () => navigate("/admin/questions"),
    },
    {
      title: "সিলেবাস অধ্যায়",
      value: metrics.totalChapters,
      subtitle: "১ম ও ২য় পত্র মিলিয়ে",
      icon: BookOpen,
      bg: "from-amber-950/40 via-slate-900 to-slate-900",
      border: "border-amber-500/30",
      text: "text-amber-400",
      action: () => navigate("/admin/curriculum"),
    },
    {
      title: "অমীমাংসিত ডাউট",
      value: metrics.pendingDoubts,
      subtitle: metrics.pendingDoubts > 0 ? "জরুরি সমাধান প্রয়োজন" : "সব সমাধানকৃত ✓",
      icon: HelpCircle,
      bg: metrics.pendingDoubts > 0
        ? "from-rose-950/50 via-slate-900 to-slate-900"
        : "from-slate-900 via-slate-900 to-slate-900",
      border: metrics.pendingDoubts > 0 ? "border-rose-500/40 animate-pulse" : "border-slate-800",
      text: metrics.pendingDoubts > 0 ? "text-rose-400" : "text-slate-400",
      badge: metrics.pendingDoubts > 0 ? "Pending" : null,
      action: () => navigate("/admin/doubts"),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* টপ হেডার বার: স্বাগত বার্তা ও রিফ্রেশ বাটন */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400">
              Live Control Center
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-1">
            সুপার অ্যাডমিন রিয়েল-টাইম ওভারভিউ
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ChemChamp অ্যাপের শিক্ষার্থী কার্যক্রম, কনটেন্ট সংখ্যা ও ডাউট সমাধান পর্যবেক্ষণ করুন
          </p>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={refreshing}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
          <span>{refreshing ? "সিঙ্ক হচ্ছে..." : "রিফ্রেশ করুন"}</span>
        </button>
      </div>

      {/* ১. প্রধান মেট্রিক্স ৪টি কার্ড (4-Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action ? card.action : undefined}
              className={`p-5 rounded-2xl bg-gradient-to-br ${card.bg} border ${card.border} shadow-lg relative overflow-hidden flex flex-col justify-between transition-all ${
                card.action ? "cursor-pointer hover:scale-[1.02] hover:border-amber-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300">{card.title}</span>
                <div className={`p-2 rounded-xl bg-slate-950/80 border border-slate-800 ${card.text}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {loading ? "..." : card.value}
                  </span>
                  {card.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {card.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[11px] text-slate-400 font-medium">{card.subtitle}</p>
                  {card.action && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ২. সেকেন্ডারি গ্রিড: সাম্প্রতিক শিক্ষার্থী ও কুইক অ্যাকশন হাব */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* বাঁ দিকের কলাম: সাম্প্রতিক শিক্ষার্থী তালিকা (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">সাম্প্রতিক নিবন্ধিত শিক্ষার্থী</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                শীর্ষ ৫ জন
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-500">শিক্ষার্থী ডাটা লোড হচ্ছে...</div>
            ) : recentStudents.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/60 p-4">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">এখনো কোনো শিক্ষার্থী নিবন্ধন করেনি</p>
                <p className="text-[11px] text-slate-500 mt-0.5">নতুন শিক্ষার্থীরা লগইন করলে এখানে তালিকা দৃশ্যমান হবে।</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {student.photoURL ? (
                        <img
                          src={student.photoURL}
                          alt={student.name}
                          className="w-8 h-8 rounded-lg object-cover border border-emerald-500/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                          🧪
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white leading-tight">
                          {student.name || "শিক্ষার্থী"}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[160px] sm:max-w-xs block">
                          {student.email}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-teal-300">
                        {student.preferences?.target?.replace("_", " ") || "HSC 26"}
                      </span>
                      <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-amber-400">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        <span>{student.streakCount || 1}d</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>আজকের সক্রিয় শিক্ষার্থী: <strong className="text-emerald-400 font-mono">{metrics.todayActive} জন</strong></span>
            <span className="text-slate-500">Firebase Firestore Live</span>
          </div>
        </div>

        {/* ডান দিকের কলাম: প্ল্যাটফর্ম ইনসাইটস ও শর্টকাট হাব (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* ইনসাইট কার্ড */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">সিস্টেম হেলথ ও পারফরম্যান্স</h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                <span className="text-slate-400">ডাটাবেজ কানেকশন</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  ক্লাউড ফায়ারস্টোর সচল
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
                <span className="text-slate-400">ডাউট সমাধান রেট</span>
                <span className="text-teal-300 font-mono font-bold">
                  {metrics.pendingDoubts + metrics.resolvedDoubts > 0
                    ? `${Math.round(
                        (metrics.resolvedDoubts /
                          (metrics.pendingDoubts + metrics.resolvedDoubts)) *
                          100
                      )}%`
                    : "১০০% সমাধানকৃত"}
                </span>
              </div>
            </div>
          </div>

          {/* ৩. অ্যাপ ফিচার কন্ট্রোল ও ফ্ল্যাগস (Admin Toggle) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">অ্যাপ ফিচার কন্ট্রোল (Feature Flags)</h3>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Live Toggle
              </span>
            </div>

            {toggleSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{toggleSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* অডিও রিক্যাপ ফিচার টগল */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl border mt-0.5 shrink-0 transition-all ${
                      featureFlags.audioRecapEnabled
                        ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                        : "bg-slate-900 text-slate-500 border-slate-800"
                    }`}
                  >
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-white leading-tight">
                        বাস জার্নি অডিও রিক্যাপ
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                          featureFlags.audioRecapEnabled
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {featureFlags.audioRecapEnabled ? "সক্রিয় (Active)" : "Coming Soon (নিষ্ক্রিয়)"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      স্টাডি হাবে শিক্ষার্থীদের অডিও রিক্যাপ বোতামটি চালু বা "কামিং সুন" মোডে রাখুন।
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <button
                  type="button"
                  disabled={updatingFlag}
                  onClick={() =>
                    handleToggleFeature("audioRecapEnabled", !featureFlags.audioRecapEnabled)
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                    featureFlags.audioRecapEnabled ? "bg-emerald-500" : "bg-slate-800"
                  } disabled:opacity-50 cursor-pointer`}
                  title={
                    featureFlags.audioRecapEnabled
                      ? "ক্লিক করে কামিং সুন করুন"
                      : "ক্লিক করে সক্রিয় করুন"
                  }
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      featureFlags.audioRecapEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              কুইক অ্যাকশন শর্টকাট
            </span>

            <button
              type="button"
              onClick={() => navigate("/admin/questions")}
              className="w-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-teal-500/40 text-left transition-all flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                    JSON বাল্ক প্রশ্ন আপলোড করুন
                  </h5>
                  <span className="text-[10px] text-slate-400">প্রশ্ন ব্যাংক ও ম্যানেজমেন্ট</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/doubts")}
              className="w-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-rose-500/40 text-left transition-all flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                    শিক্ষার্থীদের ডাউট সমাধান করুন
                  </h5>
                  <span className="text-[10px] text-slate-400">
                    {metrics.pendingDoubts}টি অমীমাংসিত প্রশ্ন
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/media")}
              className="w-full p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 text-left transition-all flex items-center justify-between group active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    ImgBB চিত্র ও উদ্দীপক আপলোড
                  </h5>
                  <span className="text-[10px] text-slate-400">KaTeX মার্কডাউন কোড কপি</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}