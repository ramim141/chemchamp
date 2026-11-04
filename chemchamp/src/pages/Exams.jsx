import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Swords,
  AlertCircle,
  Trophy,
  FileText,
  Eye,
  EyeOff,
  Tag,
  Zap,
  History,
  Search,
  Filter,
  RefreshCw,
  BookOpen,
  Clock,
  ChevronRight,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  Target,
  Flame,
  Stethoscope,
  ChevronDown,
} from "lucide-react";
import MockExamCard from "../components/exams/MockExamCard";
import BossFightArena from "../components/exams/BossFightArena";
import MistakeBoxList from "../components/exams/MistakeBoxList";
import ExamRunnerModal from "../components/exams/ExamRunnerModal";
import CustomExamModal from "../components/exams/CustomExamModal";
import ExamHistoryModal from "../components/exams/ExamHistoryModal";
import GlobalAnnouncementBanner from "../components/common/GlobalAnnouncementBanner";
import KaTeXMath from "../components/common/KaTeXMath";
import { mistakeService } from "../services/mistakeService";
import { examHistoryService } from "../services/examHistoryService";
import { cacheService } from "../services/cacheService";
import { getExamBadgeStyle } from "../utils/examTagUtils";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";

// অধ্যায়ের নামের সাথে মিলিয়ে ডাইনামিক বসের থিম ও মেটাডাটা
function getDynamicBossMeta(chapterTitle = "") {
  const t = chapterTitle.toLowerCase();
  if (t.includes("গুণগত")) {
    return {
      name: "কোয়ান্টাম টাইটান",
      title: "পরমাণুর মাইক্রো-ওয়ার্ল্ডের মহাশক্তি",
      avatar: "⚛️",
      weakness: "পলির বর্জন নীতি, আউফবাউ ও কোয়ান্টাম বলবিজ্ঞান",
      description: "কোয়ান্টাম স্পিন ও ইলেকট্রন তরঙ্গের দুর্ভেদ্য প্রাচীর ভেদ করে এই অধ্যায়ের সমস্ত সমীকরণ জয় করুন!",
      colorTheme: "from-teal-500/20 via-slate-900 to-slate-900 border-teal-500/40",
      badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    };
  }
  if (t.includes("পর্যায়বৃত্ত") || t.includes("বন্ধন")) {
    return {
      name: "পিরিওডিক ড্রাগন",
      title: "মৌল ও রাসায়নিক বন্ধনের অগ্নিমূর্তি",
      avatar: "🐉",
      weakness: "ফাযানের পোলারায়ন নীতি ও তড়িৎ ঋণাত্মকতা",
      description: "পর্যায় সারণির মৌলসমূহের আয়নীকরণ শক্তি ও বন্ধন বৈশিষ্ট্যের রহস্য ভেদ করে একে পরাস্ত করুন!",
      colorTheme: "from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/40",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    };
  }
  if (t.includes("রাসায়নিক পরিবর্তন") || t.includes("সাম্যাবস্থা")) {
    return {
      name: "ইকুইলিব্রিয়াম বেহিমোথ",
      title: "গতিশীল সাম্যাবস্থা ও বাফার রক্ষক",
      avatar: "⚖️",
      weakness: "লা-শাতেলিয়ার নীতি ও হ্যান্ডারসন-হ্যাসেলবাল্ক সমীকরণ",
      description: "pH পরিবর্তন বা চাপের আঘাতে সহজে নড়ে না এই ভারসাম্য রক্ষক। সঠিক গাণিতিক শক্তিতে একে দমন করুন!",
      colorTheme: "from-blue-500/20 via-slate-900 to-slate-900 border-blue-500/40",
      badgeColor: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    };
  }
  if (t.includes("জৈব")) {
    return {
      name: "অর্গানিক ডেভিল",
      title: "জৈব রসায়নের অন্ধকার অধিপতি",
      avatar: "💀",
      weakness: "উর্টজ-ফিটিগ, ক্যানিজারো ও অ্যারোমেটিসিটি থিওরি",
      description: "কার্বনিল যৌগ ও বেনজিন রিং-এর মারপ্যাঁচে শিক্ষার্থীদের পরাস্ত করতে প্রস্তুত। সঠিক বিক্রিয়া দিয়ে একে পরাজিত করুন!",
      colorTheme: "from-rose-500/20 via-slate-900 to-slate-900 border-rose-500/40",
      badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    };
  }
  if (t.includes("পরিবেশ")) {
    return {
      name: "টক্সিক সাইক্লোন",
      title: "বায়ুমণ্ডল ও গ্যাসীয় সূত্রের প্রলয়",
      avatar: "🌪️",
      weakness: "আদর্শ গ্যাস সমীকরণ, ডাল্টনের আংশিক চাপ ও গ্রাহামের ব্যাপন সূত্র",
      description: "প্রাকৃতিক গ্যাস ও এসিড বৃষ্টির ঘূর্ণিপাকে যে কাউকে আটকে দিতে পারে। গ্যাসের গতিতত্ত্ব দিয়ে একে শান্ত করুন!",
      colorTheme: "from-emerald-500/20 via-slate-900 to-slate-900 border-emerald-500/40",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    };
  }
  if (t.includes("পরিমাণগত")) {
    return {
      name: "মোল ম্যাট্রিক্স মাস্টার",
      title: "স্টয়কিওমিত্রি ও জারণ-বিজারণ টাইটান",
      avatar: "🔢",
      weakness: "আয়ন-ইলেকট্রন পদ্ধতি ও মোলারিটি সমীকরণ",
      description: "শতকরা সংযুতি ও টাইট্রেশন হিসাবের গোলকধাঁধা দিয়ে পরীক্ষা নেবে এই মাস্টার। সঠিক সমতাকরণে বিজয় অর্জন করুন!",
      colorTheme: "from-purple-500/20 via-slate-900 to-slate-900 border-purple-500/40",
      badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    };
  }
  if (t.includes("তড়িৎ") || t.includes("তড়িৎ")) {
    return {
      name: "ভোল্টেজ বেহিমোথ",
      title: "কোষ বিভব ও তড়িৎ রাসায়নিক দানব",
      avatar: "🔋",
      weakness: "নার্নস্ট সমীকরণ ও ফ্যারাডের তড়িৎ বিশ্লেষণ সূত্র",
      description: "তড়িৎ কোষের বিশাল ইলেকট্রন স্রোতে যে কাউকে ঘায়েল করতে পারে। নার্নস্ট সূত্রের নিখুঁত প্রয়োগে একে দমন করুন!",
      colorTheme: "from-emerald-500/20 via-slate-900 to-slate-900 border-emerald-500/40",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    };
  }
  if (t.includes("ল্যাবরেটরি") || t.includes("ব্যবহার")) {
    return {
      name: "হ্যাজার্ড গার্ডিয়ান",
      title: "ল্যাবরেটরির নিরাপদ পরিচালনাকারী",
      avatar: "🛡️",
      weakness: "সেফটি প্রটোকল, গ্লাস সামগ্রীর ব্যবহার ও পরিমাপের নির্ভুলতা",
      description: "রাসায়নিক বিকারক ও নিরাপত্তা চিহ্নের নিখুঁত জ্ঞান থাকলে সহজেই একে অতিক্রম করতে পারবেন!",
      colorTheme: "from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/40",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    };
  }

  // ডিফল্ট জেনেরিক বস (যেকোনো কাস্টম অধ্যায়ের জন্য)
  return {
    name: `${chapterTitle} গার্ডিয়ান`,
    title: "অধ্যায়ভিত্তিক মেগা বস",
    avatar: "⚔️",
    weakness: "মূল বইয়ের থিওরি ও গাণিতিক সমীকরণ",
    description: `এই অধ্যায়ের সমস্ত মৌলিক ধারণা ও প্রশ্ন ব্যাংক আয়ত্ত করে বসকে পরাস্ত করুন!`,
    colorTheme: "from-teal-500/20 via-slate-900 to-slate-900 border-teal-500/40",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  };
}

export default function Exams() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "tests";
  const [activeTab, setActiveTab] = useState(initialTab); // tests | cq | boss | mistakes

  // Paper & Tag Filters
  const [selectedPaper, setSelectedPaper] = useState("all"); // all | 1 | 2
  const [selectedTagFilter, setSelectedTagFilter] = useState("all"); // all | board | buet | medical | varsity | chapter

  // Modal States
  const [activeExam, setActiveExam] = useState(null);
  const [isCustomExamOpen, setIsCustomExamOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Firestore Live Data States (100% Dynamic & Synchronously Cached for 0ms Instant Render)
  const [chapters, setChapters] = useState(() => cacheService.getSync("chemchamp_all_chapters") || []);
  const [adminMockExams, setAdminMockExams] = useState(() => cacheService.getSync("chemchamp_published_mock_exams") || []);
  const [allQuestions, setAllQuestions] = useState(() => cacheService.getSync("chemchamp_all_questions") || []);
  const [mistakesList, setMistakesList] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [examStats, setExamStats] = useState({
    totalExams: 0,
    averageAccuracy: 0,
    highestScore: 0,
    totalXpEarned: 0,
  });

  // CQ States
  const [cqPaperFilter, setCqPaperFilter] = useState("all");
  const [cqChapterFilter, setCqChapterFilter] = useState("all");
  const [cqTagFilter, setCqTagFilter] = useState("all");
  const [cqSearchQuery, setCqSearchQuery] = useState("");
  const [revealedCqMap, setRevealedCqMap] = useState({});

  // Dynamic Boss Fight State
  const [selectedBossId, setSelectedBossId] = useState(null);
  const [bossHp, setBossHp] = useState(1000);
  const [bossShield, setBossShield] = useState(100);
  const [defeatedBossIds, setDefeatedBossIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`chemchamp_defeated_bosses_${user?.uid || "guest"}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync tab from URL
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && ["tests", "cq", "boss", "mistakes"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Load ALL dynamic data strictly from Firestore
  const refreshAllData = async () => {
    // 1. Exam History & Stats (Real attempts from user)
    const hist = examHistoryService.getHistory(user?.uid);
    setExamHistory(hist);
    const st = examHistoryService.getStats(user?.uid);
    setExamStats(st);

    // 2. Mistakes (Only real mistakes made during tests)
    const mList = await mistakeService.fetchMistakes(user?.uid);
    setMistakesList(mList);

    // 3. Chapters from Firestore (Cache-First Instant Display)
    try {
      const cList = await cacheService.getOrFetch("chemchamp_all_chapters", async () => {
        const cSnap = await getDocs(collection(db, "chapters"));
        const list = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
        return list;
      }, 30 * 60 * 1000, []);
      setChapters(cList || []);
    } catch (err) {
      console.warn("Could not load chapters:", err);
    }

    // 4. Questions from Firestore (MCQ & CQ) (Cache-First Instant Display)
    try {
      const list = await cacheService.getOrFetch("chemchamp_all_questions", async () => {
        const qSnap = await getDocs(collection(db, "questions"));
        return qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }, 30 * 60 * 1000, []);
      setAllQuestions(list || []);
    } catch (err) {
      console.warn("Could not load questions:", err);
      setAllQuestions([]);
    }

    // 5. Admin Created Mock Exams from Firestore (Cache-First Instant Display)
    try {
      const list = await cacheService.getOrFetch("chemchamp_published_mock_exams", async () => {
        const eSnap = await getDocs(collection(db, "mockExams"));
        return eSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((e) => e.published !== false);
      }, 30 * 60 * 1000, []);
      setAdminMockExams(list || []);
    } catch (err) {
      console.warn("Could not load mock exams:", err);
      setAdminMockExams([]);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [user?.uid]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Dynamic MCQs Pool from Firestore
  const mcqPool = useMemo(() => {
    return allQuestions.filter(
      (q) => (q.type || "MCQ") === "MCQ" && Array.isArray(q.options) && q.options.length >= 2
    );
  }, [allQuestions]);

  // 2. Dynamic CQs Pool from Firestore (100% database-driven, zero static data!)
  const cqList = useMemo(() => {
    const remoteCqs = allQuestions.filter((q) => q.type === "CQ");

    return remoteCqs.filter((cq) => {
      // Paper filter
      if (cqPaperFilter !== "all" && cq.paper && Number(cq.paper) !== Number(cqPaperFilter)) {
        return false;
      }
      // Chapter filter
      if (cqChapterFilter !== "all") {
        const title = cq.chapterTitle || "";
        if (!title.includes(cqChapterFilter) && cq.chapterId !== cqChapterFilter) {
          return false;
        }
      }
      // Tag filter
      if (cqTagFilter !== "all" && cq.tag !== cqTagFilter) {
        return false;
      }
      // Search query
      if (cqSearchQuery.trim()) {
        const query = cqSearchQuery.toLowerCase();
        const inStem = String(cq.stem || "").toLowerCase().includes(query);
        const inChapter = String(cq.chapterTitle || "").toLowerCase().includes(query);
        const inTag = String(cq.tag || "").toLowerCase().includes(query);
        if (!inStem && !inChapter && !inTag) return false;
      }
      return true;
    });
  }, [allQuestions, cqPaperFilter, cqChapterFilter, cqTagFilter, cqSearchQuery]);

  // Available CQ tags from Firestore
  const availableCqTags = useMemo(() => {
    const tags = new Set();
    allQuestions.forEach((q) => q.type === "CQ" && q.tag && tags.add(q.tag));
    return Array.from(tags);
  }, [allQuestions]);

  // 3. Dynamic Mock Exams List: Admin Published Tests strictly from Firestore
  const effectiveMockExams = useMemo(() => {
    return adminMockExams || [];
  }, [adminMockExams]);

  const filteredExams = useMemo(() => {
    return effectiveMockExams.filter((ex) => {
      // Paper filter
      if (selectedPaper !== "all" && ex.paper && Number(ex.paper) !== Number(selectedPaper)) {
        return false;
      }
      // Category filter
      if (selectedTagFilter !== "all") {
        if (selectedTagFilter === "chapter" && ex.category !== "chapter") return false;
        if (selectedTagFilter !== "chapter" && ex.category !== selectedTagFilter) return false;
      }
      return true;
    });
  }, [effectiveMockExams, selectedPaper, selectedTagFilter]);

  // 4. Dynamic Bosses derived ONLY from database chapters!
  const databaseChapterBosses = useMemo(() => {
    return chapters.map((ch) => {
      const meta = getDynamicBossMeta(ch.title);
      const chMcqs = mcqPool.filter(
        (q) => q.chapterId === ch.id || q.chapterTitle === ch.title
      );

      return {
        id: `boss_${ch.id}`,
        chapterId: ch.id,
        chapterName: ch.title,
        paper: Number(ch.paper) || 1,
        name: meta.name,
        title: meta.title,
        avatar: meta.avatar,
        weakness: meta.weakness,
        description: meta.description,
        colorTheme: meta.colorTheme,
        badgeColor: meta.badgeColor,
        maxHp: 1000,
        xpReward: 300,
        availableQuestionsCount: chMcqs.length,
        questions: chMcqs,
      };
    });
  }, [chapters, mcqPool]);

  // Active selected boss
  const selectedBoss = useMemo(() => {
    if (selectedBossId) {
      const found = databaseChapterBosses.find((b) => b.id === selectedBossId);
      if (found) return found;
    }
    return databaseChapterBosses.length > 0 ? databaseChapterBosses[0] : null;
  }, [databaseChapterBosses, selectedBossId]);

  // Handle start admin mock exam
  const handleStartExam = (exam) => {
    let questions = Array.isArray(exam.questions) ? exam.questions : [];

    if (questions.length === 0 && exam.chapterId) {
      questions = mcqPool.filter(
        (q) => q.chapterId === exam.chapterId || q.chapterTitle === exam.chapterTitle
      );
    }

    if (questions.length === 0) {
      alert("এই টেস্টের জন্য ডাটাবেজে এখনো প্রশ্ন পাওয়া যায়নি। অ্যাডমিন স্টুডিও থেকে প্রশ্ন যুক্ত করুন।");
      return;
    }

    setActiveExam({
      id: exam.id,
      title: exam.title,
      chapter: exam.chapterTitle || "সাধারণ রসায়ন",
      paper: exam.paper || 1,
      tag: exam.tag || "মক টেস্ট",
      durationMinutes: Number(exam.durationMinutes) || 15,
      negativeMarking: Number(exam.negativeMarking) || 0.25,
      questions,
    });
  };

  // Handle start custom exam (Pulls real MCQs from database)
  const handleStartCustomExam = ({ paper, chapterId, target, questionCount, durationMinutes, title }) => {
    setIsCustomExamOpen(false);

    let pool = [...mcqPool];

    // Filter by paper
    if (paper !== "all") {
      pool = pool.filter((q) => Number(q.paper) === Number(paper));
    }

    // Filter by chapter
    if (chapterId !== "all") {
      pool = pool.filter((q) => q.chapterId === chapterId);
    }

    // Filter by target
    if (target !== "all") {
      pool = pool.filter((q) => {
        const t = (q.tag || "").toLowerCase();
        if (target === "buet") return t.includes("buet") || t.includes("ckruet");
        if (target === "medical") return t.includes("মেডিকেল") || t.includes("mat");
        if (target === "board") return t.includes("বোর্ড") || t.includes("বো.");
        if (target === "varsity") return t.includes("du") || t.includes("ঢাবি") || t.includes("gst");
        return true;
      });
    }

    if (pool.length === 0) {
      alert("আপনার নির্বাচিত ফিল্টারে ডাটাবেজে কোনো প্রশ্ন পাওয়া যায়নি। অন্য অধ্যায় বা ফিল্টার নির্বাচন করুন।");
      return;
    }

    // Shuffle and pick real questions
    pool.sort(() => Math.random() - 0.5);
    const selected = pool.slice(0, questionCount);

    const chapterObj = chapters.find((c) => c.id === chapterId);

    setActiveExam({
      id: `custom_${Date.now()}`,
      title: title || "কাস্টম প্র্যাকটিস টেস্ট",
      chapter: chapterObj ? chapterObj.title : "সম্মিলিত অধ্যায়",
      paper: paper === "all" ? 1 : Number(paper),
      tag: target === "all" ? "কাস্টম টেস্ট" : target.toUpperCase(),
      durationMinutes,
      negativeMarking: 0.25,
      questions: selected,
    });
  };

  // Boss selection & start battle
  const handleSelectBoss = (boss) => {
    setSelectedBossId(boss.id);
    setBossHp(boss.maxHp);
    setBossShield(100);
  };

  const handleStartBossFight = (boss) => {
    if (!boss.questions || boss.questions.length === 0) {
      alert(`"${boss.chapterName}" অধ্যায়ের কোনো প্রশ্ন ডাটাবেজে পাওয়া যায়নি। অ্যাডমিন কর্তৃক প্রশ্ন যোগ করা হলে এই বস আনলক হবে।`);
      return;
    }

    // Shuffle up to 5 questions from database for boss battle
    const shuffled = [...boss.questions].sort(() => Math.random() - 0.5).slice(0, 5);

    setActiveExam({
      id: `boss_${boss.id}`,
      title: `বস ফাইট: ${boss.name} (${boss.chapterName})`,
      chapter: boss.chapterName,
      paper: boss.paper,
      tag: "Boss Arena",
      durationMinutes: 10,
      negativeMarking: 0.5,
      questions: shuffled,
      isBossBattle: true,
      bossData: boss,
    });
  };

  // Exam Finish Callback
  const handleExamFinish = async (results) => {
    if (activeExam?.isBossBattle && activeExam?.bossData) {
      const currentBoss = activeExam.bossData;
      const totalQ = results.totalQuestions || 4;
      const damagePerCorrect = Math.ceil(currentBoss.maxHp / totalQ);
      const totalDamage = results.correctCount * damagePerCorrect;
      const newHp = Math.max(0, bossHp - totalDamage);
      const shieldLoss = results.wrongCount * 35;
      const newShield = Math.max(0, bossShield - shieldLoss);

      setBossHp(newHp);
      setBossShield(newShield);

      if (newHp === 0 && !defeatedBossIds.includes(currentBoss.id)) {
        const nextDefeated = [...defeatedBossIds, currentBoss.id];
        setDefeatedBossIds(nextDefeated);
        try {
          localStorage.setItem(
            `chemchamp_defeated_bosses_${user?.uid || "guest"}`,
            JSON.stringify(nextDefeated)
          );
        } catch {
          // ignore
        }
      }
    }

    // Refresh history, mistakes, and stats
    const hist = examHistoryService.getHistory(user?.uid);
    setExamHistory(hist);
    const st = examHistoryService.getStats(user?.uid);
    setExamStats(st);
    const mList = await mistakeService.fetchMistakes(user?.uid);
    setMistakesList(mList);
  };

  const handleClearHistory = () => {
    examHistoryService.clearHistory(user?.uid);
    setExamHistory([]);
    setExamStats({
      totalExams: 0,
      averageAccuracy: 0,
      highestScore: 0,
      totalXpEarned: 0,
    });
  };

  const toggleCqSolution = (key) => {
    setRevealedCqMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="text-slate-100 pb-28 md:pb-12 pt-2.5 sm:pt-5 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-3.5 sm:space-y-5">
      {/* গ্লোবাল ব্রডকাস্ট নোটিশ ব্যানার */}
      <GlobalAnnouncementBanner />

      {/* ১. ইন্টিগ্রেটেড স্টুডিও হেডার ও কুইক অ্যাকশন বার */}
      <header className="space-y-3 sm:space-y-4">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-950 border border-slate-800 shadow-xl backdrop-blur-md flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h1 className="text-sm sm:text-lg md:text-xl font-black text-white tracking-tight truncate sm:whitespace-normal">
                  কেমিস্ট্রি এক্সাম রুম
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live DB
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
                  ({allQuestions.length}টি প্রশ্ন)
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none leading-relaxed">
                বোর্ড, বুয়েট, মেডিকেল ও ভার্সিটি স্ট্যান্ডার্ড মক টেস্ট, CQ ব্যাংক ও গ্যামিফায়েড বস ফাইট
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-2.5 shrink-0 pt-0.5 sm:pt-0">
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="px-3 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            >
              <History className="w-3.5 h-3.5 text-teal-400" />
              <span>রেকর্ড ({examHistory.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCustomExamOpen(true)}
              className="px-3 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>নিজের মতো টেস্ট ⚡</span>
            </button>
          </div>
        </div>

        {/* Live Performance Stats Micro-Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium truncate">মোট সম্পন্ন</span>
              <span className="text-xs sm:text-sm font-black text-white font-mono truncate block">
                {examStats.totalExams} টি টেস্ট
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium truncate">গড় নির্ভুলতা</span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono truncate block">
                {examStats.averageAccuracy}%
              </span>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium truncate">মোট অর্জিত XP</span>
              <span className="text-xs sm:text-sm font-black text-amber-400 font-mono truncate block">
                +{examStats.totalXpEarned} XP
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleTabChange("mistakes")}
            className="p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-rose-500/40 flex items-center gap-2.5 text-left transition-colors group cursor-pointer shadow-sm active:scale-95"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium truncate">মিস্টেক বক্স</span>
              <span className="text-xs sm:text-sm font-black text-rose-400 font-mono truncate block">
                {mistakesList.length} টি ভুল ➔
              </span>
            </div>
          </button>
        </div>

        {/* ২. সেগমেন্টেড ৪-মোড নেভিগেশন ট্যাব */}
        <div className="p-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none md:grid md:grid-cols-4">
          <button
            type="button"
            onClick={() => handleTabChange("tests")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] text-xs font-bold shrink-0 md:shrink ${
              activeTab === "tests"
                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="sm:hidden">মক টেস্ট</span>
            <span className="hidden sm:inline">মক ও প্র্যাকটিস টেস্ট</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
              {filteredExams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("cq")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] text-xs font-bold shrink-0 md:shrink ${
              activeTab === "cq"
                ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/40 shadow-sm font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="sm:hidden">CQ ব্যাংক</span>
            <span className="hidden sm:inline">সৃজনশীল (CQ) ব্যাংক</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
              {cqList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("boss")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] text-xs font-bold shrink-0 md:shrink ${
              activeTab === "boss"
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 shadow-sm font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="sm:hidden">বস ফাইট</span>
            <span className="hidden sm:inline">অধ্যায় বস ফাইট</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              {databaseChapterBosses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("mistakes")}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[38px] text-xs font-bold shrink-0 md:shrink ${
              activeTab === "mistakes"
                ? "bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-300 border border-rose-500/40 shadow-sm font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>মিস্টেক বক্স</span>
            <span className="px-1.5 py-0.2 rounded-md text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
              {mistakesList.length}
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ট্যাব ১: ডাইনামিক MCQ মক টেস্ট (অ্যাডমিন প্রকাশিত টেস্ট) */}
        {activeTab === "tests" && (
          <motion.section
            key="tests"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 sm:space-y-6"
          >
            {/* অফিশিয়াল মক টেস্ট শিডিউল সেকশন */}
            <div className="space-y-3">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-white">
                    অফিশিয়াল মক টেস্ট শিডিউল
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {filteredExams.length}টি
                  </span>
                </div>

                {/* এক সারিতে ২টি ড্রপডাউন ফিল্টার (1-Row Dropdowns) */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                  {/* ড্রপডাউন ১: পেপার ফিল্টার */}
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={selectedPaper}
                      onChange={(e) => setSelectedPaper(e.target.value)}
                      className="w-full sm:w-36 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer appearance-none pr-8 shadow-sm"
                    >
                      <option value="all">📚 উভয় পত্র</option>
                      <option value="1">📖 ১ম পত্র</option>
                      <option value="2">📖 ২য় পত্র</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* ড্রপডাউন ২: ক্যাটাগরি ফিল্টার */}
                  <div className="relative flex-1 sm:flex-none">
                    <select
                      value={selectedTagFilter}
                      onChange={(e) => setSelectedTagFilter(e.target.value)}
                      className="w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-teal-500 transition-colors cursor-pointer appearance-none pr-8 shadow-sm"
                    >
                      <option value="all">🎯 সকল ক্যাটাগরি</option>
                      <option value="board">বোর্ড স্ট্যান্ডার্ড</option>
                      <option value="buet">বুয়েট ও ইঞ্জি.</option>
                      <option value="medical">মেডিকেল স্পেশাল</option>
                      <option value="varsity">ভার্সিটি 'ক'</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* মক এক্সাম কার্ড গ্রিড (Firestore Data Only) */}
              {filteredExams.length === 0 ? (
                <div className="py-12 px-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto text-amber-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">
                    এই মুহূর্তে কোনো অফিশিয়াল টেস্ট শিডিউল নেই
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    অ্যাডমিন প্যানেল থেকে নতুন মক টেস্ট পাবলিশ করা হলে তা সরাসরি এখানে যুক্ত হবে। আপনি চাইলে যেকোনো সময় নিজের মতো কাস্টম টেস্ট তৈরি করে অনুশীলন শুরু করতে পারেন।
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCustomExamOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 text-xs font-black transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>কাস্টম মক টেস্ট শুরু করুন</span>
                    </button>
                    {(selectedPaper !== "all" || selectedTagFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPaper("all");
                          setSelectedTagFilter("all");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                      >
                        ফিল্টার রিসেট ↺
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExams.map((exam) => (
                    <MockExamCard key={exam.id} exam={exam} onStart={handleStartExam} />
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

      {/* ট্যাব ২: ফিল্টারেবল ও সার্চেবল সৃজনশীল (CQ) ব্যাংক (Firestore Data Only) */}
      {activeTab === "cq" && (
        <motion.section
          key="cq"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* CQ ফিল্টার ও সার্চ কন্ট্রোল বার */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>বোর্ড স্ট্যান্ডার্ড সৃজনশীল (CQ) ব্যাংক</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  অ্যাডমিন কর্তৃক আপলোডকৃত CQ প্রশ্ন, উদ্দীপক ও ক, খ, গ, ঘ আদর্শ সমাধান
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
                {cqList.length}টি সৃজনশীল প্রশ্ন দৃশ্যমান
              </span>
            </div>

            {/* ফিল্টার ও সার্চ গ্রিড */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-xs">
              {/* ১. সার্চ ইনপুট */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute top-3 left-3" />
                <input
                  type="text"
                  value={cqSearchQuery}
                  onChange={(e) => setCqSearchQuery(e.target.value)}
                  placeholder="উদ্দীপক বা কীওয়ার্ড খুঁজুন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* ২. পত্র ড্রপডাউন */}
              <select
                value={cqPaperFilter}
                onChange={(e) => setCqPaperFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="all">📚 সকল পত্র</option>
                <option value="1">রসায়ন ১ম পত্র</option>
                <option value="2">রসায়ন ২য় পত্র</option>
              </select>

              {/* ৩. অধ্যায় ড্রপডাউন (Chapters from Firestore) */}
              <select
                value={cqChapterFilter}
                onChange={(e) => setCqChapterFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="all">📖 সকল অধ্যায়</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.title}>
                    {ch.paper === 2 ? "[২য়]" : "[১ম]"} {ch.title}
                  </option>
                ))}
              </select>

              {/* ৪. ট্যাগ/সাল ড্রপডাউন (Tags from Firestore) */}
              <select
                value={cqTagFilter}
                onChange={(e) => setCqTagFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="all">🎯 সকল বোর্ড ও সাল</option>
                {availableCqTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CQ লিস্ট ডিসপ্লে */}
          {cqList.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6 space-y-3">
              <FileText className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">কোনো সৃজনশীল প্রশ্ন পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                ডাটাবেজে এখনো কোনো সৃজনশীল (CQ) প্রশ্ন যোগ করা হয়নি। অ্যাডমিন স্টুডিও থেকে JSON আপলোড বা প্রশ্ন ব্যাংকের মাধ্যমে CQ যোগ করা হলে তা এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
              </p>
              {(cqPaperFilter !== "all" || cqChapterFilter !== "all" || cqTagFilter !== "all" || cqSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setCqPaperFilter("all");
                    setCqChapterFilter("all");
                    setCqTagFilter("all");
                    setCqSearchQuery("");
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold rounded-xl transition-colors"
                >
                  ফিল্টার রিসেট করুন ↺
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {cqList.map((cq, idx) => (
                <div
                  key={cq.id || idx}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-bold">
                        সৃজনশীল প্রশ্ন #{idx + 1}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        📚 {cq.chapterTitle || "সাধারণ রসায়ন"}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${getExamBadgeStyle(
                        cq.tag || "বোর্ড সৃজনশীল"
                      )}`}
                    >
                      [{cq.tag || "বোর্ড সৃজনশীল"}]
                    </span>
                  </div>

                  {/* Stimulus (উদ্দীপক) */}
                  <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs sm:text-sm text-white leading-relaxed">
                    <KaTeXMath math={cq.stem} />
                  </div>

                  {/* Stimulus Image if exists */}
                  {(cq.imageUrl || cq.cqData?.stimulusImage) && (
                    <div className="text-center my-2">
                      <img
                        src={cq.imageUrl || cq.cqData?.stimulusImage}
                        alt="সৃজনশীল উদ্দীপক চিত্র"
                        className="max-h-52 rounded-xl object-contain mx-auto border border-slate-800 p-1 bg-slate-950"
                      />
                    </div>
                  )}

                  {/* SubQuestions (ক, খ, গ, ঘ) */}
                  <div className="space-y-2.5 pt-1">
                    {(cq.subQuestions || cq.cqData?.subQuestions || []).map((sub, sIdx) => {
                      const toggleKey = `${cq.id || idx}_${sIdx}`;
                      const isOpen = !!revealedCqMap[toggleKey];
                      return (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-bold text-slate-100 flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold shrink-0">
                                {sub.part}
                              </span>
                              <span className="leading-snug">
                                <KaTeXMath math={sub.question} />
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                ({sub.marks || sIdx + 1} নম্বর)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleCqSolution(toggleKey)}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-amber-400 flex items-center gap-1 transition-all shrink-0"
                            >
                              {isOpen ? (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  <span>সমাধান লুকান</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>আদর্শ সমাধান দেখুন</span>
                                </>
                              )}
                            </button>
                          </div>

                          {isOpen && (
                            <div className="mt-2.5 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-slate-200 leading-relaxed animate-in fade-in">
                              <strong className="text-emerald-400 block mb-1">
                                ✓ বোর্ড আদর্শ সমাধান ({sub.part}):
                              </strong>
                              <KaTeXMath math={sub.answer} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* ট্যাব ৩: ডাটাবেজের অধ্যায়ভিত্তিক ডাইনামিক বস ফাইট (Boss Arena) */}
      {activeTab === "boss" && (
        <motion.section
          key="boss"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto space-y-4"
        >
          <BossFightArena
            bosses={databaseChapterBosses}
            selectedBoss={selectedBoss}
            onSelectBoss={handleSelectBoss}
            hp={bossHp}
            maxHp={selectedBoss?.maxHp || 1000}
            shield={bossShield}
            onStart={handleStartBossFight}
            defeatedBossIds={defeatedBossIds}
          />
        </motion.section>
      )}

      {/* ট্যাব ৪: স্মার্ট মিস্টেক বক্স (Leitner System - Real Mistakes Only) */}
      {activeTab === "mistakes" && (
        <motion.section
          key="mistakes"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          {mistakesList.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">আপনার মিস্টেক বক্স বর্তমানে সম্পূর্ণ খালি! 🎉</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                আপনি যখন কোনো মক টেস্ট বা মডেল টেস্টে ভুল উত্তর দেবেন, তখন সিস্টেম স্বয়ংক্রিয়ভাবে সেই প্রশ্নগুলোকে এখানে Leitner রিভিশন বক্সে সাজিয়ে রাখবে।
              </p>
            </div>
          ) : (
            <MistakeBoxList
              questions={mistakesList}
              onUpdateMistake={async (updated) => {
                const nextList = await mistakeService.updateMistake(user?.uid, updated);
                setMistakesList(nextList);
              }}
              onClearMistake={async (mistakeId) => {
                const nextList = await mistakeService.removeMistake(user?.uid, mistakeId);
                setMistakesList(nextList);
              }}
            />
          )}
        </motion.section>
      )}
      </AnimatePresence>

      {/* লাইভ এক্সাম রানার মোডাল */}
      {activeExam && (
        <ExamRunnerModal
          examData={activeExam}
          onClose={() => setActiveExam(null)}
          onFinish={handleExamFinish}
        />
      )}

      {/* কাস্টম এক্সাম ক্রিয়েটর মোডাল (Real DB Questions) */}
      <CustomExamModal
        isOpen={isCustomExamOpen}
        chapters={chapters}
        onClose={() => setIsCustomExamOpen(false)}
        onStartCustomExam={handleStartCustomExam}
      />

      {/* পরীক্ষার ইতিহাস মোডাল */}
      <ExamHistoryModal
        isOpen={isHistoryOpen}
        history={examHistory}
        stats={examStats}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
