import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Seo from "../components/common/Seo";
import {
  Trophy,
  Swords,
  Users,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  Flame,
  School,
  Sparkles,
  Clock,
  Search,
  Award,
  Zap,
  TrendingUp,
  Share2,
  MessageCircle,
} from "lucide-react";
import { soundService } from "../services/soundService";
import { useAuth, getRpgRankInfo } from "../context/AuthContext";
import { BATTLE_QUESTIONS } from "../data/mockBattleQuestions";
import QuizBattleRunner from "../components/battle/QuizBattleRunner";
import { cacheService } from "../services/cacheService";
import { SkeletonList } from "../components/common/SkeletonLoader";
import { db } from "../services/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const urlRoom = searchParams.get("room") || searchParams.get("duel");
  const initialTab = searchParams.get("tab") || (urlRoom ? "duel" : "individual");

  const [activeTab, setActiveTab] = useState(initialTab); // individual | college | streak | duel
  const [period, setPeriod] = useState("weekly"); // daily | weekly | allTime
  const [searchQuery, setSearchQuery] = useState("");

  // 1v1 Battle state
  const [activeDuel, setActiveDuel] = useState(false);
  const [opponent, setOpponent] = useState("লাইভ প্রতিযোগী");
  const [roomCode, setRoomCode] = useState(() => {
    const num = Math.floor(100 + Math.random() * 900);
    return `CHEM-${num}`;
  });
  const [joinRoomInput, setJoinRoomInput] = useState(urlRoom ? urlRoom.toUpperCase() : "");
  const [activeRoomCode, setActiveRoomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const cachedInitialUsers = cacheService.getSync("chemchamp_leaderboard_users") || [];
  const [firestoreUsers, setFirestoreUsers] = useState(cachedInitialUsers);
  const [battlePool, setBattlePool] = useState(BATTLE_QUESTIONS);
  const [duelQuestions, setDuelQuestions] = useState(BATTLE_QUESTIONS.slice(0, 5));
  const [loading, setLoading] = useState(cachedInitialUsers.length === 0);

  const userXp = profile?.gamification?.currentXP || 100;
  const userAccuracy = profile?.stats?.accuracyRate || 85;
  const userCollege = profile?.college || "ChemChamp স্কলার";
  const userStreak = profile?.streakCount || profile?.gamification?.streakCount || 1;
  const battlesPlayed = profile?.stats?.battlesPlayed || 0;
  const battlesWon = profile?.stats?.battlesWon || 0;
  const winRate = battlesPlayed > 0 ? Math.round((battlesWon / battlesPlayed) * 100) : 0;

  // Weekly season countdown calculation
  const seasonCountdown = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const daysLeft = (7 - day) % 7;
    const hoursLeft = 23 - now.getHours();
    return `${daysLeft} দিন ${Math.max(1, hoursLeft)} ঘণ্টা`;
  }, []);

  // Fetch live users and questions from Firestore
  const fetchLiveUsersAndQuestions = async (forceRefresh = false) => {
    if (!forceRefresh) {
      // 1. Instant Cache-First Display (0ms latency)
      const cachedUsers = await cacheService.get("chemchamp_leaderboard_users");
      if (Array.isArray(cachedUsers) && cachedUsers.length > 0) {
        setFirestoreUsers(cachedUsers);
        setLoading(false);
      } else if (firestoreUsers.length === 0) {
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    try {
      const usersSnap = await getDocs(query(collection(db, "users"), limit(60)));
      const loadedUsers = usersSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        const xp = Number(d.gamification?.currentXP ?? d.xp ?? 0);
        const rankInfo = getRpgRankInfo(xp);

        // Normalize College: only accept if it is an actual college name and not an exam target
        let rawCol = (d.college || "").trim();
        if (
          rawCol.toLowerCase().startsWith("hsc") ||
          rawCol.toLowerCase().startsWith("ssc") ||
          rawCol === "এইচএসসি শিক্ষার্থী" ||
          rawCol === "সাধারণ শিক্ষার্থী"
        ) {
          rawCol = "";
        }

        return {
          uid: docSnap.id,
          name: d.displayName || d.name || "কেমিস্ট্রি শিক্ষার্থী",
          college: rawCol || "সাধারণ শিক্ষার্থী",
          rawCollege: rawCol,
          xp,
          accuracy: Number(d.stats?.accuracyRate) || 85,
          avatar: d.photoURL ? null : rankInfo.badge || "🧪",
          photoURL: d.photoURL || null,
          streak: Number(d.streakCount || d.gamification?.streakCount || d.gamification?.currentStreak) || 1,
          battlesWon: Number(d.stats?.battlesWon) || 0,
          battlesPlayed: Number(d.stats?.battlesPlayed) || 0,
        };
      });
      setFirestoreUsers(loadedUsers);
      await cacheService.set("chemchamp_leaderboard_users", loadedUsers, 10 * 60 * 1000);
    } catch (err) {
      console.warn("Could not load live leaderboard users:", err);
    }

    try {
      const qSnap = await getDocs(query(collection(db, "questions"), limit(60)));
      const loadedQs = qSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (q) =>
            (q.stem || q.question) &&
            Array.isArray(q.options) &&
            q.options.length >= 4 &&
            (q.type === "MCQ" || !q.type)
        )
        .map((q) => ({
          question: q.stem || q.question,
          options: q.options,
          answerIndex:
            typeof q.answerIndex === "number"
              ? q.answerIndex
              : typeof q.correctOption === "number"
              ? q.correctOption
              : 0,
          hint: q.explanation || q.hint || "",
        }));

      if (loadedQs.length >= 5) {
        setBattlePool(loadedQs);
        setDuelQuestions(loadedQs.slice(0, 5));
      }
    } catch (err) {
      console.warn("Using battle question pool fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    soundService.playClick();
    setLoading(true);
    await cacheService.delete("chemchamp_leaderboard_users");
    await fetchLiveUsersAndQuestions(true);
  };

  useEffect(() => {
    fetchLiveUsersAndQuestions();
  }, [userXp]);

  // Combined individual list
  const { individualList, userRank } = useMemo(() => {
    const map = new Map();

    // Insert live firestore users
    firestoreUsers.forEach((u) => {
      // Calculate period multiplier or XP
      let effectiveXp = u.xp;
      if (period === "daily") {
        effectiveXp = Math.max(20, Math.round(u.xp * 0.12));
      } else if (period === "weekly") {
        effectiveXp = Math.max(50, Math.round(u.xp * 0.45));
      }

      map.set(u.uid, {
        ...u,
        effectiveXp,
      });
    });

    // Ensure self is in the map
    const selfKey = user?.uid || "self_user";
    const selfRankInfo = getRpgRankInfo(userXp);
    let selfEffectiveXp = userXp;
    if (period === "daily") {
      selfEffectiveXp = Math.max(20, Math.round(userXp * 0.12));
    } else if (period === "weekly") {
      selfEffectiveXp = Math.max(50, Math.round(userXp * 0.45));
    }

    let selfCollege = (profile?.college || userCollege || "").trim();
    if (
      selfCollege.toLowerCase().startsWith("hsc") ||
      selfCollege.toLowerCase().startsWith("ssc") ||
      selfCollege === "এইচএসসি শিক্ষার্থী" ||
      selfCollege === "সাধারণ শিক্ষার্থী"
    ) {
      selfCollege = "";
    }

    map.set(selfKey, {
      uid: selfKey,
      name: user?.displayName || profile?.displayName || "আপনি",
      college: selfCollege ? selfCollege : "সাধারণ শিক্ষার্থী",
      rawCollege: selfCollege,
      xp: userXp,
      effectiveXp: selfEffectiveXp,
      accuracy: userAccuracy,
      avatar: user?.photoURL ? null : selfRankInfo.badge || "🧪",
      photoURL: user?.photoURL || null,
      streak: userStreak,
      battlesWon,
      battlesPlayed,
      isSelf: true,
    });

    // Sort descending by effectiveXp
    const sorted = Array.from(map.values())
      .sort((a, b) => b.effectiveXp - a.effectiveXp)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

    const foundSelf = sorted.find((i) => i.isSelf || (user?.uid && i.uid === user.uid));
    return {
      individualList: sorted,
      userRank: foundSelf ? foundSelf.rank : 1,
    };
  }, [
    period,
    firestoreUsers,
    user?.uid,
    user?.displayName,
    user?.photoURL,
    profile?.displayName,
    profile?.college,
    userCollege,
    userXp,
    userAccuracy,
    userStreak,
    battlesWon,
    battlesPlayed,
  ]);

  // Filtered by search query
  const filteredIndividualList = useMemo(() => {
    if (!searchQuery.trim()) return individualList;
    const q = searchQuery.toLowerCase();
    return individualList.filter(
      (u) =>
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.college || "").toLowerCase().includes(q)
    );
  }, [individualList, searchQuery]);

  // College Leaderboard aggregation (Strictly real colleges only, never HSC target batches)
  const collegeList = useMemo(() => {
    const collegesMap = new Map();

    individualList.forEach((u) => {
      const colName = (u.rawCollege || (u.college && !u.college.startsWith("HSC") && u.college !== "সাধারণ শিক্ষার্থী" ? u.college : "")).trim();
      if (!colName) return; // Do not include unassigned students or "HSC 27" batches as colleges!

      if (!collegesMap.has(colName)) {
        collegesMap.set(colName, {
          college: colName,
          totalXp: 0,
          studentCount: 0,
          topStudent: u.name,
          topStudentXp: u.xp,
        });
      }
      const existing = collegesMap.get(colName);
      existing.totalXp += u.xp;
      existing.studentCount += 1;
      if (u.xp > existing.topStudentXp) {
        existing.topStudent = u.name;
        existing.topStudentXp = u.xp;
      }
    });

    return Array.from(collegesMap.values())
      .sort((a, b) => b.totalXp - a.totalXp)
      .map((col, idx) => ({
        ...col,
        rank: idx + 1,
        avgXp: Math.round(col.totalXp / col.studentCount),
      }));
  }, [individualList]);

  // Streak Leaderboard
  const streakList = useMemo(() => {
    return [...individualList]
      .sort((a, b) => b.streak - a.streak)
      .map((u, idx) => ({
        ...u,
        streakRank: idx + 1,
      }));
  }, [individualList]);

  // 1v1 Battle Helpers
  const handleCopyRoom = () => {
    soundService.playClick();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getChallengeLink = () => {
    return `${window.location.origin}/leaderboard?room=${roomCode}`;
  };

  const handleCopyChallengeLink = () => {
    soundService.playClick();
    navigator.clipboard.writeText(getChallengeLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    soundService.playClick();
    const shareText = `🧪 ChemChamp ১v১ কুইজ ডুয়েল চ্যালেঞ্জ!\nআমি তোমাকে ৫টি দ্রুতগতির কেমিস্ট্রি MCQ প্রশ্নের ডুয়েলে আহ্বান জানাচ্ছি।\nরুম কোড: ${roomCode}\nখেলা শুরু করতে ক্লিক করো:\n${getChallengeLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const generateNewRoomCode = () => {
    soundService.playClick();
    const num = Math.floor(100 + Math.random() * 900);
    setRoomCode(`CHEM-${num}`);
  };

  const pickRandomBattleQuestions = () => {
    const shuffled = [...battlePool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  };

  const startInstantDuel = (opp, customRoom = "") => {
    soundService.playClick();
    setOpponent(opp || "লাইভ প্রতিযোগী");
    setActiveRoomCode(customRoom);
    setDuelQuestions(pickRandomBattleQuestions());
    setActiveDuel(true);
  };

  const handleJoinCustomRoom = (e) => {
    e.preventDefault();
    const cleanCode = (joinRoomInput.trim() || roomCode).toUpperCase();
    startInstantDuel(`রুম চ্যালেঞ্জার (${cleanCode})`, cleanCode);
  };

  // ELO Combat Level info
  const combatTier = useMemo(() => {
    if (battlesWon >= 20) return { label: "গ্র্যান্ডমাস্টার", icon: "👑", color: "text-amber-400" };
    if (battlesWon >= 10) return { label: "ডায়মন্ড", icon: "💎", color: "text-cyan-400" };
    if (battlesWon >= 5) return { label: "গোল্ড", icon: "🥇", color: "text-yellow-400" };
    if (battlesWon >= 2) return { label: "সিলভার", icon: "🥈", color: "text-slate-300" };
    return { label: "ব্রোঞ্জ", icon: "🥉", color: "text-amber-600" };
  }, [battlesWon]);

  return (
    <div className="text-slate-100 pb-28 md:pb-12 pt-3 md:pt-5 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      <Seo title="লিডারবোর্ড" noindex />
      {/* হেডার */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <Trophy className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>কেমিস্ট্রি লিডারবোর্ড ও এরিনা</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              ব্যক্তিগত র‍্যাংকিং, কলেজ পয়েন্ট টেবিল ও ১v১ স্পিড কুইজ ব্যাটল
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="self-end sm:self-auto p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shrink-0 active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          title="রিফ্রেশ লিডারবোর্ড"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          <span>রিফ্রেশ</span>
        </button>
      </header>

      {/* প্রধান ৪টি ট্যাব ন্যাভিগেশন */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none p-1 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-bold sm:grid sm:grid-cols-4">
        <button
          type="button"
          onClick={() => setActiveTab("individual")}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 sm:shrink flex-1 sm:flex-initial whitespace-nowrap active:scale-95 ${
            activeTab === "individual"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">ব্যক্তিগত</span>
          <span className="hidden sm:inline">ব্যক্তিগত র‍্যাংকিং</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("college")}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 sm:shrink flex-1 sm:flex-initial whitespace-nowrap active:scale-95 ${
            activeTab === "college"
              ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <School className="w-3.5 h-3.5 shrink-0" />
          <span>কলেজ ব্যাটল</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("streak")}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 sm:shrink flex-1 sm:flex-initial whitespace-nowrap active:scale-95 ${
            activeTab === "streak"
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">স্ট্রিক</span>
          <span className="hidden sm:inline">স্ট্রিক মাস্টার্স</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("duel")}
          className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 sm:shrink flex-1 sm:flex-initial whitespace-nowrap active:scale-95 ${
            activeTab === "duel"
              ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-black"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Swords className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden">১v১ ডুয়েল</span>
          <span className="hidden sm:inline">১v১ ডুয়েল এরিনা</span>
        </button>
      </div>

      {/* লোডিং স্কেলিটন */}
      {loading && firestoreUsers.length === 0 ? (
        <div className="py-6 space-y-4">
          <SkeletonList count={6} />
        </div>
      ) : (
        <>
          {/* ট্যাব ১: ব্যক্তিগত র‍্যাংকিং */}
          {activeTab === "individual" && (
            <div className="space-y-6 animate-in fade-in">
              {/* সাব-ফিল্টার ও সিজন কাউন্টডাউন */}
              <div className="p-2.5 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
                {/* Mobile: Top Row with Period Toggle + Season Badge | Desktop: Left side Period Toggle */}
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPeriod("daily")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                        period === "daily"
                          ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      দৈনিক
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriod("weekly")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                        period === "weekly"
                          ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      সাপ্তাহিক
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriod("allTime")}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                        period === "allTime"
                          ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      সর্বকালীন
                    </button>
                  </div>

                  {/* Season countdown badge on mobile */}
                  <div className="sm:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{seasonCountdown}</span>
                  </div>
                </div>

                {/* Mobile: Full-width Search Bar | Desktop: Season Badge + Search Bar */}
                <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium shrink-0">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>সিজন সমাপ্তি: <strong>{seasonCountdown}</strong></span>
                  </div>

                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 left-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="নাম বা কলেজ খুঁজুন..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* টপ ৩ পোডিয়াম (Top 3 Podium) */}
              {individualList.length >= 2 && !searchQuery && (
                <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-1 max-w-3xl mx-auto">
                  {/* Rank 2 - Silver */}
                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl text-center flex flex-col items-center">
                    <span className="text-3xl mb-1">{individualList[1]?.avatar || "🥈"}</span>
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center mb-1">
                      2
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                      {individualList[1]?.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                      {individualList[1]?.college}
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold mt-1">
                      {individualList[1]?.effectiveXp} XP
                    </span>
                  </div>

                  {/* Rank 1 - Gold */}
                  <div className="p-4 bg-gradient-to-t from-amber-950/40 to-slate-900 border-2 border-amber-500/50 rounded-2xl text-center flex flex-col items-center shadow-lg shadow-amber-500/10 -translate-y-2">
                    <span className="text-4xl mb-1">{individualList[0]?.avatar || "👑"}</span>
                    <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center mb-1 shadow">
                      1 👑
                    </span>
                    <h4 className="text-xs sm:text-base font-black text-white truncate max-w-full">
                      {individualList[0]?.name}
                    </h4>
                    <span className="text-[10px] text-slate-300 truncate max-w-full">
                      {individualList[0]?.college}
                    </span>
                    <span className="text-xs sm:text-sm text-amber-300 font-mono font-black mt-1">
                      {individualList[0]?.effectiveXp} XP
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                      {individualList[0]?.accuracy}% নির্ভুল
                    </span>
                  </div>

                  {/* Rank 3 - Bronze */}
                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl text-center flex flex-col items-center">
                    <span className="text-3xl mb-1">{individualList[2]?.avatar || "🥉"}</span>
                    <span className="w-6 h-6 rounded-full bg-amber-800/60 text-amber-200 text-xs font-bold flex items-center justify-center mb-1">
                      3
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-full">
                      {individualList[2]?.name || "প্রস্তুতিশীল"}
                    </h4>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                      {individualList[2]?.college || "ChemChamp"}
                    </span>
                    <span className="text-xs text-amber-400 font-mono font-bold mt-1">
                      {individualList[2]?.effectiveXp || 0} XP
                    </span>
                  </div>
                </div>
              )}

              {/* ব্যবহারকারীর নিজস্ব পজিশন স্ট্রিপ */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center shadow">
                    #{userRank}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>আপনার বর্তমান অবস্থান ({user?.displayName || profile?.displayName || "আপনি"})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        You
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {userCollege} • {userAccuracy}% নির্ভুলতা • 🔥 {userStreak} দিন স্ট্রিক
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-sm font-mono font-black text-emerald-400 block">{userXp} XP</span>
                    <span className="text-[10px] text-slate-400 font-medium">লাইফটাইম অর্জিত</span>
                  </div>
                </div>
              </div>

              {/* র‍্যাংকিং তালিকা */}
              <div className="space-y-2">
                {filteredIndividualList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
                    কোনো শিক্ষার্থী পাওয়া যায়নি।
                  </div>
                ) : (
                  filteredIndividualList.map((item) => (
                    <div
                      key={item.uid}
                      className={`p-3 sm:p-4 rounded-2xl border flex items-center justify-between transition-all ${
                        item.isSelf || (user?.uid && item.uid === user.uid)
                          ? "bg-emerald-950/30 border-emerald-500/40 shadow-sm"
                          : "bg-slate-900/80 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 text-center text-xs font-bold font-mono text-slate-400">
                          #{item.rank}
                        </span>
                        <span className="text-2xl">{item.avatar}</span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {(item.isSelf || (user?.uid && item.uid === user.uid)) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                আপনি
                              </span>
                            )}
                          </h5>
                          <p className="text-[11px] text-slate-400">{item.college}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!(item.isSelf || (user?.uid && item.uid === user.uid)) && (
                          <button
                            type="button"
                            onClick={() => startInstantDuel(`${item.name} (${item.college})`)}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all active:scale-95"
                          >
                            <Swords className="w-3.5 h-3.5" />
                            <span>চ্যালেঞ্জ</span>
                          </button>
                        )}
                        <div className="text-right">
                          <span className="text-xs sm:text-sm font-mono font-bold text-amber-400 block">
                            {item.effectiveXp} XP
                          </span>
                          <span className="text-[10px] text-slate-400">{item.accuracy}% নির্ভুল</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ট্যাব ২: কলেজ চ্যাম্পিয়নশিপ */}
          {activeTab === "college" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-teal-400" />
                    <span>কোন কলেজ কেমিস্ট্রিতে সেরা?</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    শিক্ষার্থীদের সমন্বিত অর্জিত XP অনুযায়ী কলেজের লাইভ পয়েন্ট টেবিল
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20 font-mono">
                    {collegeList.length}টি কলেজ
                  </span>
                </div>
              </div>

              {/* কলেজ যুক্ত করার কল-টু-অ্যাকশন ব্যানার (যদি শিক্ষার্থীর প্রোফাইলে কলেজ সেট না থাকে) */}
              {(!profile?.college || profile.college.trim().length <= 1) && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        আপনার কলেজ এখনও লিডারবোর্ডে যুক্ত হয়নি?
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        প্রোফাইল থেকে আপনার কলেজের নাম সেট করুন। আপনার প্রতিটি অর্জিত XP সরাসরি আপনার কলেজের মোট পয়েন্টে যোগ হবে!
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-sm"
                  >
                    <span>কলেজ যুক্ত করুন ➔</span>
                  </Link>
                </div>
              )}

              {/* টপ ৩ কলেজ পোডিয়াম */}
              {collegeList.length >= 1 && (
                <div
                  className={`grid gap-3 ${
                    collegeList.length === 1
                      ? "grid-cols-1 max-w-sm mx-auto"
                      : collegeList.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-3"
                  }`}
                >
                  {collegeList.slice(0, 3).map((col, idx) => (
                    <div
                      key={col.college}
                      className={`p-4 rounded-2xl border text-center flex flex-col justify-between space-y-2 ${
                        idx === 0
                          ? "bg-gradient-to-t from-amber-950/30 to-slate-900 border-amber-500/50 shadow-md shadow-amber-500/10"
                          : "bg-slate-900/70 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-black flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {col.studentCount} জন শিক্ষার্থী
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate">{col.college}</h4>
                      <div className="pt-1 border-t border-slate-800/80">
                        <span className="text-sm font-mono font-black text-amber-400 block">
                          {col.totalXp} XP
                        </span>
                        <span className="text-[10px] text-slate-400">গড়: {col.avgXp} XP/জন</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ফুল কলেজ র‍্যাংকিং টেবিল */}
              <div className="space-y-2">
                {collegeList.length === 0 ? (
                  <div className="py-12 px-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2.5">
                    <School className="w-8 h-8 text-teal-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-200">
                      এখনও কোনো কলেজের শিক্ষার্থী নিবন্ধিত হয়নি
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      শিক্ষার্থীরা তাদের প্রোফাইল থেকে কলেজের নাম সেট করলেই স্বয়ংক্রিয়ভাবে লাইভ কলেজ র‍্যাংকিং তৈরি হবে।
                    </p>
                    <Link
                      to="/profile"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 mt-2"
                    >
                      <span>আপনার কলেজ যুক্ত করুন ➔</span>
                    </Link>
                  </div>
                ) : (
                  collegeList.map((col) => (
                    <div
                      key={col.college}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 text-center font-mono text-xs font-bold text-slate-400">
                          #{col.rank}
                        </span>
                        <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          <School className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white">{col.college}</h5>
                          <p className="text-[11px] text-slate-400">
                            {col.studentCount} জন শিক্ষার্থী • শীর্ষ: {col.topStudent}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-mono font-black text-teal-300 block">
                          {col.totalXp} XP
                        </span>
                        <span className="text-[10px] text-slate-400">গড়: {col.avgXp} XP</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ট্যাব ৩: স্ট্রিক মাস্টার্স */}
          {activeTab === "streak" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-400 fill-rose-400" />
                    <span>ধারাবাহিক অধ্যবসায়ের চ্যাম্পিয়ন</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    যারা প্রতিদিন নিয়ম করে কেমিস্ট্রি প্র্যাকটিস চালিয়ে যাচ্ছে
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-300 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 font-mono">
                    🔥 স্ট্রিক র‍্যাংক
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {streakList.map((item) => (
                  <div
                    key={item.uid}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between ${
                      item.isSelf || (user?.uid && item.uid === user.uid)
                        ? "bg-rose-950/20 border-rose-500/40"
                        : "bg-slate-900/80 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center font-mono text-xs font-bold text-slate-400">
                        #{item.streakRank}
                      </span>
                      <span className="text-2xl">{item.avatar}</span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {(item.isSelf || (user?.uid && item.uid === user.uid)) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                              আপনি
                            </span>
                          )}
                        </h5>
                        <p className="text-[11px] text-slate-400">{item.college}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold flex items-center gap-1.5 text-xs font-mono">
                        <Flame className="w-3.5 h-3.5 fill-rose-400" />
                        <span>{item.streak} দিন</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ট্যাব ৪: ১v১ কুইজ ডুয়েল এরিনা */}
          {activeTab === "duel" && (
            <div className="space-y-6 animate-in fade-in">
              {/* কমব্যাট স্ট্যাটাস ব্যানার */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-2xl">
                    {combatTier.icon}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">ব্যাটল টায়ার লিগ</span>
                    <h4 className={`text-sm font-black ${combatTier.color}`}>{combatTier.label}</h4>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">মোট ব্যাটল লড়াই</span>
                    <h4 className="text-sm font-black text-white font-mono">{battlesPlayed} ম্যাচ</h4>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">জয় ও উইন রেট</span>
                    <h4 className="text-sm font-black text-emerald-400 font-mono">
                      {battlesWon} জয় ({winRate}%)
                    </h4>
                  </div>
                </div>
              </div>

              {/* ডুয়েল মোড সিলেকশন */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* কার্ড ১: ইনস্ট্যান্ট ম্যাচমেকিং */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col justify-between space-y-4 shadow-xl text-center">
                  <div className="space-y-2">
                    <span className="text-4xl block">⚡</span>
                    <h3 className="text-base font-black text-white">ইনস্ট্যান্ট ১v১ স্পিড ম্যাচ</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      অনলাইনে থাকা যেকোনো শিক্ষার্থীর সাথে ৫টি দ্রুতগতির টাইমড প্রশ্নে সরাসরি লড়াই করুন! জিতলে পাবেন +১০০ XP বোনাস।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startInstantDuel("লাইভ প্রতিযোগী")}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" />
                    <span>ম্যাচমেকিং শুরু করুন ⚔️</span>
                  </button>
                </div>

                {/* কার্ড ২: প্রাইভেট রুম কোড ডুয়েল */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-400" />
                        <h4 className="text-sm font-bold text-white">বন্ধুর সাথে প্রাইভেট রুম ডুয়েল</h4>
                      </div>
                      <button
                        type="button"
                        onClick={generateNewRoomCode}
                        title="নতুন রুম কোড জেনারেট"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      আপনার রুম কোডটি বন্ধুকে শেয়ার করুন অথবা বন্ধুর পাঠানো কোড লিখে ডুয়েলে প্রবেশ করুন।
                    </p>
                  </div>

                    <div className="space-y-3">
                      {/* Incoming Friend Invite Banner */}
                      {urlRoom && (
                        <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-xs text-teal-200 flex items-center justify-between gap-2 animate-pulse">
                          <span>
                            আপনার বন্ধু <strong>{urlRoom}</strong> রুমে চ্যালেঞ্জ করেছে!
                          </span>
                          <button
                            type="button"
                            onClick={() => startInstantDuel(`রুম চ্যালেঞ্জার (${urlRoom})`, urlRoom)}
                            className="px-3 py-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs shrink-0"
                          >
                            লড়াই শুরু করুন ⚔️
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center font-mono font-bold text-sm text-teal-300">
                          {roomCode}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyRoom}
                          className="px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95 border border-slate-700"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copied ? "কপি হয়েছে!" : "কোড"}</span>
                        </button>
                      </div>

                      {/* WhatsApp & Copy Challenge Link Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleShareWhatsApp}
                          className="py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp শেয়ার</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyChallengeLink}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-teal-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? "লিংক কপি হয়েছে!" : "চ্যালেঞ্জ লিংক"}</span>
                        </button>
                      </div>

                      <form onSubmit={handleJoinCustomRoom} className="flex gap-2">
                        <input
                          type="text"
                          value={joinRoomInput}
                          onChange={(e) => setJoinRoomInput(e.target.value)}
                          placeholder="বন্ধুর রুম কোড লিখুন..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition-all border border-teal-400 flex items-center gap-1.5 active:scale-95"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>জয়েন</span>
                        </button>
                      </form>
                    </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Duel Modal */}
      {activeDuel && (
        <QuizBattleRunner
          questions={duelQuestions}
          opponentName={opponent}
          roomCode={activeRoomCode}
          onClose={() => setActiveDuel(false)}
        />
      )}
    </div>
  );
}
