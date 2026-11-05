import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Video,
  Headphones,
  Play,
  Pause,
  Award,
  Zap,
  Lock,
  Sparkles,
  BookMarked,
  Compass,
  Menu,
  Clock,
  RotateCcw,
  AlertTriangle,
  MessageSquarePlus,
  Bookmark,
  Send,
  Loader2,
  Unlock,
} from "lucide-react";
import ChemistryMarkdownViewer from "../common/ChemistryMarkdownViewer";
import KaTeXMath from "../common/KaTeXMath";
import TopicPracticeZone from "./TopicPracticeZone";
import TopicMiniTest from "./TopicMiniTest";
import { getExamBadgeStyle } from "../../utils/examTagUtils";
import { useAuth } from "../../context/AuthContext";
import { useFeatureFlags } from "../../services/featureFlagService";
import { db } from "../../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// Clean notes fallback when an admin topic doesn't have custom markdown notes yet
function getTopicContent(topic, subtopic, chapterTitle = "") {
  if (subtopic?.notesMarkdown?.trim()) return subtopic.notesMarkdown;
  if (topic?.notesMarkdown?.trim()) return topic.notesMarkdown;

  const title = subtopic?.title || topic?.title || "লেকচার নোট";
  const summary = subtopic?.summary || topic?.summary || "";

  if (summary) {
    return `## ${title}\n\n${summary}`;
  }

  return `## ${title}\n\n> ℹ️ এই টপিকের বিস্তারিত লেকচার নোট এখনো যুক্ত করা হয়নি। খুব শীঘ্রই শিক্ষক/অ্যাডমিন কর্তৃক নোট আপডেট করা হবে।`;
}

export default function LessonReaderModal({
  chapter = {},
  topics = [],
  subtopicsMap = {},
  isInline = true,
  activeTopicIndex: controlledTopicIdx,
  setActiveTopicIndex: setControlledTopicIdx,
  activeSubtopicIndex: controlledSubIdx,
  setActiveSubtopicIndex: setControlledSubIdx,
  introCompleted: controlledIntroCompleted,
  completedTopicIds: controlledCompletedIds,
  onCompleteIntro: controlledOnCompleteIntro,
  onCompleteTopic: controlledOnCompleteTopic,
  lockedPromptTopic,
  onClearLockedPrompt,
  onForceUnlockTopic,
  onOpenMobileSidebar,
  onClose,
  onProgressUpdate,
  isReadMode = false,
  onToggleReadMode,
  readingFontSize = "base",
  readingTheme = "dark",
}) {
  const { user, profile, syncUserProfile } = useAuth();
  const storageKey = `chemchamp_chapter_progress_${user?.uid || "guest"}_${chapter?.id || "ch"}`;

  const [localIntroCompleted, setLocalIntroCompleted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return !!saved.introCompleted;
    } catch {
      return false;
    }
  });

  const [localCompletedTopicIds, setLocalCompletedTopicIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return Array.isArray(saved.completedTopicIds) ? saved.completedTopicIds : [];
    } catch {
      return [];
    }
  });

  const introCompleted =
    controlledIntroCompleted !== undefined ? controlledIntroCompleted : localIntroCompleted;
  const completedTopicIds =
    controlledCompletedIds !== undefined ? controlledCompletedIds : localCompletedTopicIds;

  const [localTopicIdx, setLocalTopicIdx] = useState(() => (introCompleted ? 0 : -1));
  const [localSubIdx, setLocalSubIdx] = useState(0);

  const activeTopicIndex =
    controlledTopicIdx !== undefined ? controlledTopicIdx : localTopicIdx;
  const setActiveTopicIndex = setControlledTopicIdx || setLocalTopicIdx;

  const activeSubtopicIndex =
    controlledSubIdx !== undefined ? controlledSubIdx : localSubIdx;
  const setActiveSubtopicIndex = setControlledSubIdx || setLocalSubIdx;

  // স্টাডি লুপ ট্যাব: note | practice | test
  const [studyTab, setStudyTab] = useState("note");

  // সিস্টেম ফিচার ফ্ল্যাগ: অডিও রিক্যাপ (Admin Controlled)
  const { audioRecapEnabled } = useFeatureFlags();
  const [showComingSoonToast, setShowComingSoonToast] = useState(false);

  // ২০-মিনিট Anti-Cheat ফোকাস টাইমার স্টেট (Integrated directly in Sticky Toolbar!)
  const currentTopic = activeTopicIndex >= 0 ? topics[activeTopicIndex] || null : null;
  const currentSubtopics = currentTopic ? subtopicsMap[currentTopic.id] || [] : [];
  const currentSubtopic = currentSubtopics[activeSubtopicIndex] || null;

  const targetFocusMinutes =
    Number(currentTopic?.minFocusMinutes || currentTopic?.estimatedMinutes) || 20;
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(targetFocusMinutes * 60);
  const [cheatWarning, setCheatWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [focusCompletedBanner, setFocusCompletedBanner] = useState(false);

  // অডিও রিক্যাপ, ভিডিও ও হাইলাইটার স্টেট
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedBookFilter, setSelectedBookFilter] = useState("all");
  const audioRef = useRef(null);
  const videoSectionRef = useRef(null);

  // বুকমার্ক ও ইনলাইন ডাউট স্টেট
  const bookmarkKey = `chemchamp_bookmarks_${user?.uid || "guest"}`;
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(bookmarkKey) || "[]");
    } catch {
      return [];
    }
  });
  const [showDoubtDrawer, setShowDoubtDrawer] = useState(false);
  const [doubtInput, setDoubtInput] = useState("");
  const [sendingDoubt, setSendingDoubt] = useState(false);
  const [doubtSentSuccess, setDoubtSentSuccess] = useState(false);

  // ফায়ারস্টোর প্রশ্ন লোড
  const [topicQuestions, setTopicQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const isCurrentCompleted = currentTopic ? completedTopicIds.includes(currentTopic.id) : false;
  const isBookmarked = currentTopic ? bookmarkedIds.includes(currentTopic.id) : false;

  // টপিক বা সাব-টপিক বদলালে রিসেট
  useEffect(() => {
    setStudyTab("note");
    setShowVideo(false);
    setSelectedBookFilter("all");
    setFocusSecondsLeft(targetFocusMinutes * 60);
    setFocusCompletedBanner(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }, [activeTopicIndex, activeSubtopicIndex, chapter?.id, targetFocusMinutes]);

  // ২০-মিনিট ফোকাস টাইমার কাউন্টডাউন
  useEffect(() => {
    let interval = null;
    if (isFocusActive && focusSecondsLeft > 0) {
      interval = setInterval(() => {
        setFocusSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsFocusActive(false);
            setFocusCompletedBanner(true);
            if (syncUserProfile) {
              const curXp = profile?.gamification?.currentXP || 120;
              const curMins = profile?.stats?.totalStudyMinutes || 20;
              syncUserProfile({
                gamification: { currentXP: curXp + 40 },
                stats: { totalStudyMinutes: curMins + targetFocusMinutes },
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, focusSecondsLeft]);

  // Page Visibility API Anti-Cheat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isFocusActive) {
        setIsFocusActive(false);
        setCheatWarning(true);
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFocusActive]);

  // আনমাউন্টে অডিও বন্ধ
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // এই টপিকের MCQ, CQ, SQ প্রশ্ন লোড করা
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!currentTopic?.id) return;
      setLoadingQuestions(true);
      try {
        const qColl = collection(db, "questions");
        let qQuery = query(qColl, where("topicId", "==", currentTopic.id));
        let snap = await getDocs(qQuery);

        if (snap.empty && chapter?.id) {
          qQuery = query(qColl, where("chapterId", "==", chapter.id));
          snap = await getDocs(qQuery);
        }

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTopicQuestions(list);
      } catch (err) {
        console.warn("Could not load topic questions:", err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [currentTopic?.id, chapter?.id]);

  const getEmbedUrl = (url) => {
    if (!url) return "";
    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("watch?v=")) {
        const id = url.split("watch?v=")[1]?.split("&")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch {
      return url || "";
    }
  };

  // অডিও রিক্যাপ প্লে/পজ
  const handleToggleAudioRecap = () => {
    if (!audioRecapEnabled) {
      setShowComingSoonToast(true);
      setTimeout(() => setShowComingSoonToast(false), 3000);
      return;
    }

    const audioUrl = currentSubtopic?.audioUrl || currentTopic?.audioUrl;
    if (audioUrl && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlayingAudio(true);
      }
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const rawNote =
          currentSubtopic?.notesMarkdown ||
          currentTopic?.notesMarkdown ||
          getTopicContent(currentTopic, currentSubtopic, chapter?.title);
        const cleanText = rawNote.replace(/[$#*>`\\]/g, " ");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "bn-BD";
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } else {
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const handleToggleBookmark = () => {
    if (!currentTopic?.id) return;
    const next = isBookmarked
      ? bookmarkedIds.filter((id) => id !== currentTopic.id)
      : [...bookmarkedIds, currentTopic.id];
    setBookmarkedIds(next);
    try {
      localStorage.setItem(bookmarkKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleQuickDoubtSubmit = async (e) => {
    e.preventDefault();
    if (!doubtInput.trim()) return;
    setSendingDoubt(true);
    try {
      await addDoc(collection(db, "doubtBox"), {
        studentUid: user?.uid || "anonymous",
        studentName: user?.displayName || profile?.displayName || "কেমিস্ট্রি শিক্ষার্থী",
        studentEmail: user?.email || "",
        chapterName: `${chapter?.title || "রসায়ন"} — ${currentTopic?.title || "গাইডলাইন"}`,
        queryText: doubtInput.trim(),
        imageUrl: null,
        status: "pending",
        teacherReply: "",
        createdAt: serverTimestamp(),
      });
      setDoubtInput("");
      setDoubtSentSuccess(true);
      setTimeout(() => {
        setDoubtSentSuccess(false);
        setShowDoubtDrawer(false);
      }, 2200);
    } catch (err) {
      console.error("Quick doubt error:", err);
    } finally {
      setSendingDoubt(false);
    }
  };

  // "শুরুর আগে" সম্পন্ন করে মূল টপিক আনলক করা
  const handleCompleteIntro = () => {
    if (controlledOnCompleteIntro) {
      controlledOnCompleteIntro();
    } else {
      setLocalIntroCompleted(true);
      if (topics.length > 0) {
        setActiveTopicIndex(0);
        setActiveSubtopicIndex(0);
      }
    }
    setStudyTab("note");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // টেস্ট পাস করলে টপিক সম্পন্ন ও পরবর্তী টপিক আনলক
  const handleTestPassed = async () => {
    if (!currentTopic || isCurrentCompleted) return;

    if (controlledOnCompleteTopic) {
      controlledOnCompleteTopic(currentTopic.id);
    } else {
      const nextCompleted = [...completedTopicIds, currentTopic.id];
      setLocalCompletedTopicIds(nextCompleted);
      if (onProgressUpdate) {
        onProgressUpdate(currentTopic.id, nextCompleted.length);
      }
    }

    if (syncUserProfile) {
      const currentXP = (profile?.gamification?.currentXP || 120) + 50;
      const currentMins = (profile?.stats?.totalStudyMinutes || 20) + 20;
      await syncUserProfile({
        gamification: { currentXP },
        stats: { totalStudyMinutes: currentMins },
      });
    }
  };

  const handleGoToNextTopic = () => {
    if (activeTopicIndex + 1 < topics.length) {
      setActiveTopicIndex(activeTopicIndex + 1);
      setActiveSubtopicIndex(0);
      setStudyTab("note");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // টেক্সটবুক হাইলাইটস ডেটা (সাব-টপিক অনুযায়ী লোড হবে)
  const rawHighlights =
    (Array.isArray(currentSubtopic?.bookHighlights) && currentSubtopic.bookHighlights.length > 0)
      ? currentSubtopic.bookHighlights
      : (currentSubtopics.length === 0 && Array.isArray(currentTopic?.bookHighlights) && currentTopic.bookHighlights.length > 0)
      ? currentTopic.bookHighlights
      : [];

  const normalizedHighlights = rawHighlights.map((h) => ({
    bookName: h.bookName || h.book || "পাঠ্যবই",
    text: h.text || h.note || "",
    pageNumber: h.pageNumber || "গুরুত্বপূর্ণ নোট",
    examTags: Array.isArray(h.examTags) ? h.examTags : [],
  }));

  const availableBooks = Array.from(
    new Set(normalizedHighlights.map((h) => h.bookName).filter(Boolean))
  );

  const filteredHighlights = normalizedHighlights.filter((h) =>
    selectedBookFilter === "all"
      ? true
      : h.bookName === selectedBookFilter || h.bookName.includes(selectedBookFilter)
  );

  const activeVideoUrl =
    currentSubtopic?.videoUrl ||
    currentTopic?.videoUrl ||
    "";

  const focusMins = Math.floor(focusSecondsLeft / 60);
  const focusSecs = focusSecondsLeft % 60;

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex flex-col">
      {/* ১. অল-ইন-ওয়ান স্টিকি অ্যাকশন টুলবার (Sticky Reader Toolbar - Single Clean Line!) */}
      <div className="sticky top-14 md:top-16 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Mobile Chapter Picker Button or Desktop Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            {onOpenMobileSidebar && (
              <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="lg:hidden flex items-center gap-1.5 py-1 px-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white max-w-[125px] xs:max-w-[165px] truncate active:scale-95 transition-transform shrink-0"
                title="অধ্যায় বা সিলেবাস পরিবর্তন করুন"
              >
                <Menu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{chapter.title || "অধ্যায়"}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            )}

            <div className="hidden lg:flex items-center gap-1.5 text-xs min-w-0">
              <span className="text-emerald-400 font-bold shrink-0">
                {Number(chapter.paper) === 1 || chapter.paper === "১ম পত্র" ? "১ম পত্র" : "২য় পত্র"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="font-bold text-slate-200 truncate">
                {chapter.title || chapter.chapterTitle}
              </span>
            </div>
          </div>

          {/* Right: Unified Interactive Action Pills (Timer, Read Mode, Doubt, Bookmark) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
            {/* ⏱️ Focus Timer Pill (Compact on Mobile) */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-full px-2 py-0.5">
              <Clock
                className={`w-3.5 h-3.5 ${
                  isFocusActive ? "text-emerald-400 animate-pulse" : "text-teal-400"
                }`}
              />
              <span className="text-[11px] sm:text-xs font-mono font-bold text-white">
                {String(focusMins).padStart(2, "0")}:{String(focusSecs).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsFocusActive(!isFocusActive);
                  if (cheatWarning) setCheatWarning(false);
                }}
                className={`px-1.5 sm:px-2 py-0.2 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer ${
                  isFocusActive
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "bg-teal-500 text-slate-950 hover:bg-teal-400 font-black"
                }`}
              >
                <span className="hidden sm:inline">{isFocusActive ? "পজ" : "ফোকাস"}</span>
                <span className="sm:hidden">{isFocusActive ? "⏸" : "▶"}</span>
              </button>
              {focusSecondsLeft < targetFocusMinutes * 60 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsFocusActive(false);
                    setFocusSecondsLeft(targetFocusMinutes * 60);
                  }}
                  title="টাইমার রিসেট"
                  className="p-0.5 text-slate-400 hover:text-white hidden xs:inline-block"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 🎧 Bus Journey Audio Recap Pill (Desktop / Tablet only when not enabled to prevent mobile wrap) */}
            <div className="relative hidden md:block">
              <button
                type="button"
                onClick={handleToggleAudioRecap}
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                  !audioRecapEnabled
                    ? "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200 cursor-pointer"
                    : isPlayingAudio
                    ? "bg-teal-500 text-slate-950 border-teal-400 shadow-sm"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:text-white"
                }`}
                title={audioRecapEnabled ? "বাস জার্নি অডিও রিক্যাপ" : "অডিও রিক্যাপ — কামিং সুন (শীঘ্রই আসছে)"}
              >
                {isPlayingAudio ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Headphones className={`w-3.5 h-3.5 ${audioRecapEnabled ? "text-teal-400" : "text-amber-400/80"}`} />
                )}
                <span>{isPlayingAudio ? "অডিও..." : "অডিও"}</span>
                {!audioRecapEnabled && (
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 leading-none">
                    শীঘ্রই
                  </span>
                )}
              </button>

              {/* Floating Coming Soon Toast */}
              <AnimatePresence>
                {showComingSoonToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 w-56 p-3 rounded-2xl bg-slate-900 border border-amber-500/30 text-slate-200 text-xs shadow-2xl z-50 text-center select-none"
                  >
                    <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold mb-1">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>শীঘ্রই আসছে (Coming Soon)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      বাস জার্নি অডিও রিক্যাপ ফিচারটি তৈরির কাজ চলছে। অ্যাডমিন প্যানেল থেকে সক্রিয় করলে শুনতে পারবেন! 🚀
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(currentSubtopic?.audioUrl || currentTopic?.audioUrl) && (
              <audio
                ref={audioRef}
                src={currentSubtopic?.audioUrl || currentTopic?.audioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            )}

            {/* 🎬 Video Lecture Toggle Pill */}
            {activeTopicIndex >= 0 && Boolean(activeVideoUrl) && (
              <button
                type="button"
                onClick={() => {
                  setStudyTab("note");
                  setShowVideo(!showVideo);
                }}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                  showVideo
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:text-rose-300"
                }`}
                title="ভিডিও লেকচার"
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">ভিডিও</span>
              </button>
            )}

            {/* 📖 Read Mode Direct Button */}
            {onToggleReadMode && (
              <button
                type="button"
                onClick={() => onToggleReadMode()}
                className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                  isReadMode
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:text-emerald-300 hover:border-emerald-500/40"
                }`}
                title={isReadMode ? "রিড মোড বন্ধ করুন" : "ফুলস্ক্রিন জেন রিড মোড চালু করুন"}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{isReadMode ? "রিড অন" : "রিড মোড"}</span>
              </button>
            )}

            {/* 💬 1-Click Doubt Button */}
            <button
              type="button"
              onClick={() => setShowDoubtDrawer(!showDoubtDrawer)}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                showDoubtDrawer
                  ? "bg-purple-500 text-white border-purple-400"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:text-purple-300"
              }`}
              title="এই টপিক নিয়ে স্যারের কাছে প্রশ্ন পাঠান"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">ডাউট</span>
            </button>

            {/* 🔖 Bookmark Button */}
            {currentTopic && (
              <button
                type="button"
                onClick={handleToggleBookmark}
                className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                  isBookmarked
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
                title={isBookmarked ? "বুকমার্ক করা হয়েছে" : "টপিক বুকমার্ক করুন"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-amber-400" : ""}`} />
              </button>
            )}

            {!isInline && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Anti-Cheat or Focus Complete Slim Notification */}
        {cheatWarning && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>ট্যাব পরিবর্তনের কারণে ফোকাস টাইমার অটো-পজ হয়েছে (ট্যাব সুইচ: {tabSwitchCount})।</span>
            </span>
            <button
              type="button"
              onClick={() => setCheatWarning(false)}
              className="text-[11px] text-amber-300 underline"
            >
              বন্ধ করুন
            </button>
          </div>
        )}

        {focusCompletedBanner && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>অভিনন্দন! ২০ মিনিট ফোকাস সেশন পূর্ণ হয়েছে (+৪০ XP অর্জিত)!</span>
            </span>
            <button
              type="button"
              onClick={() => setFocusCompletedBanner(false)}
              className="text-[11px] underline"
            >
              ঠিক আছে
            </button>
          </div>
        )}

        {/* Interactive Locked Topic Prompt Banner (When user clicks a locked topic in sidebar) */}
        {lockedPromptTopic && (
          <div className="mt-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>"{lockedPromptTopic.title}"</strong> টপিকটি সিকোয়েন্সিয়াল পাথে লক করা আছে। গাইডলাইন/পূর্ববর্তী টপিক শেষ করুন অথবা সরাসরি আনলক করুন:
              </span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {onForceUnlockTopic && (
                <button
                  type="button"
                  onClick={() => onForceUnlockTopic(lockedPromptTopic.index)}
                  className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 hover:bg-amber-400 transition-all"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>এখনই আনলক করে পড়ুন</span>
                </button>
              )}
              {onClearLockedPrompt && (
                <button
                  type="button"
                  onClick={onClearLockedPrompt}
                  className="p-1 text-amber-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Inline Quick Doubt Drawer */}
        {showDoubtDrawer && (
          <form
            onSubmit={handleQuickDoubtSubmit}
            className="mt-2.5 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in"
          >
            <input
              type="text"
              value={doubtInput}
              onChange={(e) => setDoubtInput(e.target.value)}
              placeholder={`"${currentTopic?.title || chapter.title}" নিয়ে আপনার প্রশ্নটি লিখুন...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={sendingDoubt || !doubtInput.trim()}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              {sendingDoubt ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{doubtSentSuccess ? "পাঠানো হয়েছে! ✓" : "স্যারকে পাঠান"}</span>
            </button>
          </form>
        )}
      </div>

      {/* ২. ক্লিন ট্যাব বার (Pill Tabs with Smooth Active State & Instant Feedback) */}
      <div className="px-3 sm:px-6 border-b border-slate-800/80 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none bg-slate-950/40">
        <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-bold shrink-0 py-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTopicIndex(-1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
              activeTopicIndex === -1
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">০. শুরুর আগে (রোডম্যাপ)</span>
            <span className="sm:hidden">০. রোডম্যাপ</span>
          </button>

          {activeTopicIndex >= 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStudyTab("note");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                  studyTab === "note"
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">১. লেকচার নোট ও হাইলাইটস</span>
                <span className="sm:hidden">১. লেকচার নোট</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudyTab("practice");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                  studyTab === "practice"
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-black shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Zap className="w-4 h-4 text-teal-400" />
                <span className="hidden sm:inline">২. অনুশীলন (MCQ/CQ/SQ)</span>
                <span className="sm:hidden">২. প্র্যাকটিস</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudyTab("test");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`px-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                  studyTab === "test"
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-black shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">৩. টপিক টেস্ট 🏆</span>
                <span className="sm:hidden">৩. টেস্ট 🏆</span>
              </button>
            </>
          )}
        </div>

        {activeTopicIndex >= 0 && (
          <div className="hidden md:flex items-center gap-1.5 text-xs shrink-0">
            {isCurrentCompleted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> সম্পন্ন
              </span>
            ) : (
              <span className="text-slate-500">টেস্টে ৬০% পেলে পরের টপিক আনলক হবে</span>
            )}
          </div>
        )}
      </div>

      {/* ৩. ওপেন রিডিং ক্যানভাস (Open Canvas - Breathable Notion/GitBook Style) */}
      <div className="flex-1 px-4 sm:px-8 lg:px-10 py-6 max-w-4xl w-full mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {/* ভিউ ০: "শুরুর আগে" (গাইডলাইন ও সিলেবাস রোডম্যাপ — Clean Open Layout) */}
          {activeTopicIndex === -1 && (
            <motion.div
              key={`roadmap-${chapter?.id || "ch"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
            {/* Chapter Title & Intro */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Compass className="w-4 h-4" />
                <span>অধ্যায় রোডম্যাপ ও প্রশ্ন ট্রেন্ড বিশ্লেষণ</span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                {chapter.title || chapter.chapterTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {chapter.description ||
                  "এই অধ্যায়টি এইচএসসি বোর্ড পরীক্ষা এবং বুয়েট, মেডিকেল ও ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষার জন্য অত্যন্ত গুরুত্বপূর্ণ। নিচে অধ্যায়টির গুরুত্ব এবং টপিকগুলোর ধারাবাহিক তালিকা দেওয়া হলো।"}
              </p>
            </div>

            {/* Clean Left-Accent Metric Strip (No Heavy Nested Boxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4 border-y border-slate-800/80">
              <div className="border-l-2 border-emerald-500 pl-3.5 pr-2">
                <span className="text-xs text-slate-400 block">HSC বোর্ড গুরুত্ব</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                  ১টি সৃজনশীল (CQ) + ৩-৪টি MCQ নিশ্চিত
                </span>
              </div>
              <div className="border-l-2 border-amber-500 pl-3.5 pr-2">
                <span className="text-xs text-slate-400 block">ভর্তি পরীক্ষা ফোকাস</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                  গাণিতিক সমস্যা ও ব্যতিক্রমী উদাহরণ
                </span>
              </div>
              <div className="border-l-2 border-teal-500 pl-3.5 pr-2">
                <span className="text-xs text-slate-400 block">স্মার্ট স্টাডি লুপ</span>
                <span className="text-sm font-bold text-teal-300 mt-0.5 block">
                  নোট ও হাইলাইটস ➔ প্র্যাকটিস ➔ টেস্ট
                </span>
              </div>
            </div>

            {/* Interactive Topic Timeline List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {topics.length > 0
                      ? `এই অধ্যায়ের টপিকসমূহ (${topics.length}টি) — ক্লিক করে সরাসরি পড়ুন:`
                      : "এই অধ্যায়ের টপিকসমূহ"}
                  </span>
                </h3>
              </div>

              {topics.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-xs space-y-1">
                  <p className="font-bold text-slate-300">এই অধ্যায়ে এখনো কোনো টপিক তৈরি করা হয়নি।</p>
                  <p className="text-[11px] text-slate-500">অ্যাডমিন স্টুডিও থেকে টপিক ও লেকচার নোট যোগ করুন।</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70 border-t border-b border-slate-800/70">
                  {topics.map((t, i) => {
                    const done = completedTopicIds.includes(t.id);
                    const topicSubs = Array.isArray(subtopicsMap[t.id]) ? subtopicsMap[t.id] : [];
                    const topicTags = Array.from(
                      new Set([
                        ...(Array.isArray(t.examTags) ? t.examTags : []),
                        ...topicSubs.flatMap((s) => (Array.isArray(s.examTags) ? s.examTags : [])),
                        ...topicSubs.flatMap((s) =>
                          Array.isArray(s.bookHighlights)
                            ? s.bookHighlights.flatMap((h) => h.examTags || [])
                            : []
                        ),
                      ])
                    ).filter(Boolean);

                    return (
                      <button
                        key={t.id || i}
                        type="button"
                        onClick={() => {
                          handleCompleteIntro();
                          setActiveTopicIndex(i);
                          setActiveSubtopicIndex(0);
                          setStudyTab("note");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full py-3.5 px-3 rounded-xl hover:bg-slate-900/60 transition-all duration-200 active:scale-[0.99] flex items-center justify-between gap-4 text-left group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 transition-colors ${
                              done
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-slate-900 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-950"
                            }`}
                          >
                            {done ? "✓" : i + 1}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                              {t.title}
                            </h4>
                            {t.summary && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">{t.summary}</p>
                            )}
                            {topicTags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {topicTags.slice(0, 5).map((tag, tagI) => (
                                  <span
                                    key={tagI}
                                    className={`text-[10px] px-2 py-0.2 rounded-full border font-bold ${getExamBadgeStyle(
                                      tag
                                    )}`}
                                  >
                                    ★ {tag}
                                  </span>
                                ))}
                                {topicTags.length > 5 && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    +{topicTags.length - 5}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-emerald-400">
                          <span className="hidden sm:inline">
                            {done ? "সম্পন্ন" : `${t.estimatedMinutes || t.minFocusMinutes || 20} মিনিট`}
                          </span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary CTA Button */}
            {topics.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteIntro();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {introCompleted
                      ? "১ম টপিকের লেকচার নোটে যান ➔"
                      : "গাইডলাইন পড়েছি — ১ম টপিক শুরু করুন 🚀"}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ধাপ ১: লেকচার নোট, ভিডিও ও টেক্সটবুক হাইলাইটার (Open Document Layout) */}
        {activeTopicIndex >= 0 && studyTab === "note" && (
          <motion.article
            key={`note-${chapter?.id || "ch"}-${activeTopicIndex}-${activeSubtopicIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            {/* Topic Title Header */}
            <div className="space-y-3 border-b border-slate-800/80 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                  টপিক {activeTopicIndex + 1} / {topics.length} •{" "}
                  {currentTopic?.estimatedMinutes || currentTopic?.minFocusMinutes || 20} মিনিট রিডিং
                </span>

                {audioRecapEnabled && currentTopic?.audioDuration && (
                  <span className="text-xs text-slate-400 font-mono">
                    🎧 অডিও রিক্যাপ: {currentTopic.audioDuration}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
                  {currentSubtopic?.title || currentTopic?.title}
                </h1>

                {/* Subtopic or Topic Previous Year Exam Badges */}
                {((Array.isArray(currentSubtopic?.examTags) && currentSubtopic.examTags.length > 0) ||
                  (Array.isArray(currentTopic?.examTags) && currentTopic.examTags.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-slate-400 font-bold mr-1 flex items-center gap-1">
                      <span>🎯 পরীক্ষায় আসা প্রশ্ন:</span>
                    </span>
                    {(currentSubtopic?.examTags || currentTopic?.examTags || []).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-bold shadow-sm ${getExamBadgeStyle(
                          tag
                        )}`}
                      >
                        ★ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {currentTopic?.summary && (
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                  {currentTopic.summary}
                </p>
              )}
            </div>

            {/* Collapsible YouTube Video Player */}
            {showVideo && (
              <div ref={videoSectionRef} className="space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <Video className="w-4 h-4" />
                    <span>
                      {currentTopic?.recommendedVideo?.title ||
                        `${currentTopic?.title} — ভিডিও লেকচার`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVideo(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ভিডিও বন্ধ করুন ✕
                  </button>
                </div>
                <div className="rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl border border-slate-800">
                  <iframe
                    src={getEmbedUrl(activeVideoUrl)}
                    title={currentSubtopic?.title || currentTopic?.title || "Chemistry Lecture"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            )}

            {/* Open Lecture Markdown Content (No Box Wrapper!) */}
            <div
              className={`max-w-none transition-all duration-200 ${
                readingFontSize === "sm"
                  ? "text-sm leading-relaxed"
                  : readingFontSize === "lg"
                  ? "text-lg sm:text-xl leading-loose"
                  : readingFontSize === "xl"
                  ? "text-xl sm:text-2xl leading-loose"
                  : "text-base leading-relaxed"
              } ${
                readingTheme === "sepia"
                  ? "text-[#f5ead8] font-serif"
                  : readingTheme === "oled"
                  ? "text-slate-100"
                  : "text-slate-200"
              }`}
            >
              <ChemistryMarkdownViewer
                content={
                  currentSubtopic?.notesMarkdown ||
                  currentTopic?.notesMarkdown ||
                  getTopicContent(currentTopic, currentSubtopic, chapter.title)
                }
              />
            </div>

            {/* Key Mathematical Formulas */}
            {Array.isArray(currentTopic?.conceptFormulas) &&
              currentTopic.conceptFormulas.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    📐 গুরুত্বপূর্ণ গাণিতিক সূত্র ও সমীকরণ
                  </h3>
                  <div className="divide-y divide-slate-800/70 border-y border-slate-800/70">
                    {currentTopic.conceptFormulas.map((eq, i) => (
                      <div key={i} className="py-3 px-1 text-center text-slate-100 text-[1.05em]">
                        <KaTeXMath math={eq} block />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Textbook Highlighter Section (Clean Callout Strips - Only rendered if real highlights exist) */}
            {Array.isArray(rawHighlights) && rawHighlights.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      মূল বইয়ের দাগানো লাইন (Textbook Highlights)
                    </h3>
                  </div>

                  {/* Clean Dynamic Pill Filter */}
                  {availableBooks.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setSelectedBookFilter("all")}
                        className={`px-3 py-1 rounded-full transition-all ${
                          selectedBookFilter === "all"
                            ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                            : "bg-slate-900 text-slate-400 hover:text-white"
                        }`}
                      >
                        সব বই ({normalizedHighlights.length})
                      </button>

                      {availableBooks.map((bookName) => {
                        const count = normalizedHighlights.filter((h) => h.bookName === bookName).length;
                        const shortLabel = bookName.replace(" স্যার", "");
                        const isSelected = selectedBookFilter === bookName;
                        return (
                          <button
                            key={bookName}
                            type="button"
                            onClick={() => setSelectedBookFilter(isSelected ? "all" : bookName)}
                            className={`px-3 py-1 rounded-full transition-all ${
                              isSelected
                                ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                                : "bg-slate-900 text-slate-400 hover:text-white"
                            }`}
                          >
                            {shortLabel} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {filteredHighlights.map((item, idx) => (
                    <blockquote
                      key={idx}
                      className="border-l-4 border-amber-400 bg-amber-500/[0.06] pl-4 pr-4 sm:pr-5 py-3 rounded-r-xl space-y-2 transition-all hover:bg-amber-500/[0.09]"
                    >
                      <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 shrink-0">📚 {item.bookName}</span>
                          <span className="font-mono text-slate-400 text-[11px] shrink-0">{item.pageNumber}</span>
                        </div>

                        {/* Exam Tags Badges on this highlight card */}
                        {Array.isArray(item.examTags) && item.examTags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.examTags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getExamBadgeStyle(
                                  tag
                                )}`}
                              >
                                ★ {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        <KaTeXMath math={item.text} />
                      </div>
                    </blockquote>
                  ))}
                </div>
              </div>
            )}

            {/* Adaptive Learning Pathway & Next/Prev Footer */}
            <div className="pt-6 border-t border-slate-800/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block">
                    অ্যাডাপটিভ লার্নিং পাথওয়ে
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    টপিকটি কি আপনার কাছে পরিষ্কার হয়েছে?
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {activeVideoUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowVideo(true);
                        setTimeout(() => {
                          videoSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }, 100);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Video className="w-4 h-4 text-rose-400" />
                      <span>কঠিন লাগছে ➔ ভিডিও লেকচার</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDoubtDrawer(true)}
                      className="px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <MessageSquarePlus className="w-4 h-4 text-purple-400" />
                      <span>কোনো সন্দেহ? ➔ প্রশ্ন পাঠান</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStudyTab("practice");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>আলহামদুলিল্লাহ, বুঝেছি ➔ অনুশীলনে যান</span>
                  </button>
                </div>
              </div>

              {/* Prev / Next Topic Quick Links */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs font-semibold text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTopicIndex(activeTopicIndex - 1);
                    setActiveSubtopicIndex(0);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="hover:text-white flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>
                    {activeTopicIndex === 0
                      ? "শুরুর আগে (রোডম্যাপ)"
                      : topics[activeTopicIndex - 1]?.title}
                  </span>
                </button>

                {activeTopicIndex + 1 < topics.length && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudyTab("test");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    <span>টপিক টেস্ট দিয়ে পরের টপিকে যান</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        )}

        {/* ধাপ ২: প্র্যাকটিস জোন (MCQ, CQ, SQ) */}
        {activeTopicIndex >= 0 && studyTab === "practice" && (
          <motion.div
            key={`practice-${chapter?.id || "ch"}-${activeTopicIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <TopicPracticeZone
              questions={topicQuestions}
              topicTitle={currentTopic?.title || chapter.title}
              loading={loadingQuestions}
            />

            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStudyTab("note");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2.5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>লেকচার নোটে ফিরে যান</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudyTab("test");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>টপিক মাস্টারি টেস্ট দিন 🏆</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ধাপ ৩: টপিক মাস্টারি টেস্ট */}
        {activeTopicIndex >= 0 && studyTab === "test" && (
          <motion.div
            key={`test-${chapter?.id || "ch"}-${activeTopicIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="py-2"
          >
            <TopicMiniTest
              questions={topicQuestions}
              topicTitle={currentTopic?.title || chapter.title}
              onPassTest={handleTestPassed}
              onNextTopic={
                activeTopicIndex + 1 < topics.length ? handleGoToNextTopic : undefined
              }
            />
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

