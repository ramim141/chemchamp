import React, { useState, useEffect, useMemo } from "react";
import { db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  Compass,
  RefreshCw,
  CheckCircle2,
  Lock,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
  Type,
  Sun,
  Moon,
  ArrowLeft,
  Sparkles,
  Layers,
  Menu,
} from "lucide-react";
import LessonReaderModal from "../components/study/LessonReaderModal";
import { getExamBadgeStyle } from "../utils/examTagUtils";
import { cacheService } from "../services/cacheService";
import { useAuth } from "../context/AuthContext";
import { soundService } from "../services/soundService";

export default function StudyHub() {
  const { user } = useAuth();
  const [selectedPaper, setSelectedPaper] = useState(1);
  const initialCachedChapters = cacheService.getSync(`chapters_paper_1`) || [];
  const [chapters, setChapters] = useState(initialCachedChapters);
  const [loading, setLoading] = useState(initialCachedChapters.length === 0);
  const [searchQuery, setSearchQuery] = useState("");

  // Active chapter & topics
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterTopics, setChapterTopics] = useState([]);
  const [subtopicsMap, setSubtopicsMap] = useState({});
  const [loadingLesson, setLoadingLesson] = useState(false);

  // Active topic & subtopic controlled from sidebar or reader
  const [activeTopicIndex, setActiveTopicIndex] = useState(-1);
  const [activeSubtopicIndex, setActiveSubtopicIndex] = useState(0);
  const [introCompleted, setIntroCompleted] = useState(false);
  const [completedTopicIds, setCompletedTopicIds] = useState([]);
  const [lockedPromptTopic, setLockedPromptTopic] = useState(null);

  // Mobile Drawer Sidebar State
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 📖 Zen Read Mode Feature States
  const [isReadMode, setIsReadMode] = useState(false);
  const [readingFontSize, setReadingFontSize] = useState("base"); // 'sm' | 'base' | 'lg' | 'xl'
  const [readingTheme, setReadingTheme] = useState("dark"); // 'dark' | 'sepia' | 'oled'
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle Read Mode with sound & body class
  const toggleReadMode = (val = !isReadMode) => {
    soundService.playClick();
    setIsReadMode(val);
  };

  // Sync scroll progress & Esc key for Read Mode
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const p = Math.min(100, Math.max(0, Math.round((window.scrollY / totalHeight) * 100)));
        setScrollProgress(p);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isReadMode) {
        setIsReadMode(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isReadMode]);

  // Sync body class for Read Mode
  useEffect(() => {
    if (isReadMode) {
      document.body.classList.add("study-read-mode");
    } else {
      document.body.classList.remove("study-read-mode");
    }
    return () => {
      document.body.classList.remove("study-read-mode");
    };
  }, [isReadMode]);

  // Fullscreen helper
  const handleToggleFullscreen = () => {
    soundService.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const readChapterProgress = (chapterId) => {
    const key = `chemchamp_chapter_progress_${user?.uid || "guest"}_${chapterId || "ch"}`;
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        introCompleted: !!saved.introCompleted,
        completedTopicIds: Array.isArray(saved.completedTopicIds) ? saved.completedTopicIds : [],
      };
    } catch {
      return { introCompleted: false, completedTopicIds: [] };
    }
  };

  const saveChapterProgress = (chapterId, nextIntro, nextCompletedIds) => {
    const key = `chemchamp_chapter_progress_${user?.uid || "guest"}_${chapterId || "ch"}`;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          introCompleted: nextIntro,
          completedTopicIds: nextCompletedIds,
        })
      );
    } catch {
      // ignore
    }
  };

  const handleOpenChapter = async (chapter, targetTopicIndex = null) => {
    if (!chapter) return;
    setSelectedChapter(chapter);
    setLockedPromptTopic(null);

    const prog = readChapterProgress(chapter.id);
    setIntroCompleted(prog.introCompleted);
    setCompletedTopicIds(prog.completedTopicIds);

    // 1. Instant Cache-First Display (0ms delay)
    const cachedTopics = await cacheService.get(`chapter_topics_${chapter.id}`);
    const cachedSubtopics = await cacheService.get(`chapter_subtopics_${chapter.id}`);
    if (Array.isArray(cachedTopics) && cachedTopics.length > 0 && cachedSubtopics) {
      setChapterTopics(cachedTopics);
      setSubtopicsMap(cachedSubtopics);
      setLoadingLesson(false);
      if (targetTopicIndex !== null) {
        setActiveTopicIndex(targetTopicIndex);
      } else {
        setActiveTopicIndex(prog.introCompleted && cachedTopics.length > 0 ? 0 : -1);
      }
      setActiveSubtopicIndex(0);
    } else {
      setLoadingLesson(true);
    }

    try {
      const topQuery = query(
        collection(db, "topics"),
        where("chapterId", "==", chapter.id)
      );
      const topSnap = await getDocs(topQuery);
      const topicsList = topSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      topicsList.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));

      const map = {};
      for (const t of topicsList) {
        try {
          const subQuery = query(collection(db, "subtopics"), where("topicId", "==", t.id));
          const subSnap = await getDocs(subQuery);
          const subList = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          subList.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
          map[t.id] = subList;
        } catch {
          map[t.id] = [];
        }
      }

      setChapterTopics(topicsList);
      setSubtopicsMap(map);
      await cacheService.set(`chapter_topics_${chapter.id}`, topicsList);
      await cacheService.set(`chapter_subtopics_${chapter.id}`, map);

      if (targetTopicIndex !== null) {
        setActiveTopicIndex(targetTopicIndex);
      } else if (!cachedTopics) {
        setActiveTopicIndex(prog.introCompleted && topicsList.length > 0 ? 0 : -1);
      }
      setActiveSubtopicIndex(0);

      // Save Last Studied for Dashboard Resume Card
      try {
        const topIdx = targetTopicIndex !== null ? targetTopicIndex : 0;
        const currentTop = topicsList[topIdx];
        const lastSession = {
          chapterId: chapter.id,
          chapterTitle: chapter.title || chapter.name,
          paper: selectedPaper,
          topicTitle: currentTop?.title || currentTop?.name || "মূল কনসেপ্ট ও লেকচার নোট",
          topicIndex: topIdx,
          totalTopics: topicsList.length,
          timestamp: Date.now(),
        };
        localStorage.setItem(`chemchamp_last_studied_${user?.uid || "guest"}`, JSON.stringify(lastSession));
        localStorage.setItem(`chemchamp_study_active_today_${new Date().toISOString().split("T")[0]}`, "true");
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn("Load chapter topics error:", err);
      if (!cachedTopics) {
        setChapterTopics([]);
        setSubtopicsMap({});
        setActiveTopicIndex(-1);
        setActiveSubtopicIndex(0);
      }
    } finally {
      setLoadingLesson(false);
    }
  };

  const fetchChapters = async () => {
    // 1. Instant Cache-First (0ms latency, eliminates loading spinner on revisit)
    const cached = await cacheService.get(`chapters_paper_${selectedPaper}`);
    if (Array.isArray(cached) && cached.length > 0) {
      setChapters(cached);
      setLoading(false);
      const currentMatch =
        selectedChapter && Number(selectedChapter.paper) === Number(selectedPaper)
          ? cached.find((c) => c.id === selectedChapter.id)
          : null;
      handleOpenChapter(currentMatch || cached[0]);
    } else {
      if (!selectedChapter || Number(selectedChapter.paper) !== Number(selectedPaper)) {
        setSelectedChapter(null);
      }
      setLoading(true);
    }

    try {
      const q = query(
        collection(db, "chapters"),
        where("paper", "in", [Number(selectedPaper), String(selectedPaper)])
      );
      const snap = await getDocs(q);
      const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      remoteList.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));

      setChapters(remoteList);
      await cacheService.set(`chapters_paper_${selectedPaper}`, remoteList);

      if (remoteList.length > 0) {
        const currentMatch =
          selectedChapter && Number(selectedChapter.paper) === Number(selectedPaper)
            ? remoteList.find((c) => c.id === selectedChapter.id)
            : null;
        handleOpenChapter(currentMatch || remoteList[0]);
      } else {
        setSelectedChapter(null);
        setChapterTopics([]);
        setSubtopicsMap({});
      }
    } catch (err) {
      console.warn("Fetch chapters error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [selectedPaper]);

  const handleCompleteIntro = () => {
    if (!selectedChapter) return;
    setIntroCompleted(true);
    setLockedPromptTopic(null);
    saveChapterProgress(selectedChapter.id, true, completedTopicIds);
    if (chapterTopics.length > 0) {
      setActiveTopicIndex(0);
      setActiveSubtopicIndex(0);
    }
  };

  const handleCompleteTopic = (topicId) => {
    if (!selectedChapter || !topicId) return;
    if (completedTopicIds.includes(topicId)) return;
    const nextIds = [...completedTopicIds, topicId];
    setCompletedTopicIds(nextIds);
    saveChapterProgress(selectedChapter.id, introCompleted, nextIds);
  };

  // Force unlock a locked topic when the student clicks "এখনই আনলক করে পড়ুন"
  const handleForceUnlockTopic = (targetIdx) => {
    if (!selectedChapter) return;
    const prevTopicIds = chapterTopics.slice(0, targetIdx).map((t) => t.id);
    const mergedCompleted = Array.from(new Set([...completedTopicIds, ...prevTopicIds]));
    setIntroCompleted(true);
    setCompletedTopicIds(mergedCompleted);
    saveChapterProgress(selectedChapter.id, true, mergedCompleted);
    setActiveTopicIndex(targetIdx);
    setActiveSubtopicIndex(0);
    setLockedPromptTopic(null);
  };

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(
      (ch) =>
        ch.title?.toLowerCase().includes(q) ||
        ch.description?.toLowerCase().includes(q) ||
        (ch.id === selectedChapter?.id &&
          chapterTopics.some((t) => t.title?.toLowerCase().includes(q)))
    );
  }, [chapters, searchQuery, selectedChapter?.id, chapterTopics]);

  const completionPercent = useMemo(() => {
    if (!chapterTopics.length) return introCompleted ? 100 : 0;
    const totalSteps = chapterTopics.length + 1;
    const doneSteps = (introCompleted ? 1 : 0) + completedTopicIds.length;
    return Math.min(100, Math.round((doneSteps / totalSteps) * 100));
  }, [chapterTopics, introCompleted, completedTopicIds]);

  // Flat, Clean Tree Navigation Sidebar (No Box-in-Box Clutter)
  const renderSidebarContent = (isMobileDrawer = false) => (
    <div className="flex flex-col h-full bg-slate-950 select-none">
      {/* Sidebar Top Controls */}
      <div className="p-4 border-b border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            সিলেবাস ও লার্নিং পাথ
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={fetchChapters}
              className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
              title="সিলেবাস রিফ্রেশ করুন"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            {isMobileDrawer && (
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Clean Segmented Paper Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setSelectedPaper(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`py-1.5 rounded-lg transition-all active:scale-95 ${
              selectedPaper === 1
                ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            রসায়ন ১ম পত্র
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedPaper(2);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`py-1.5 rounded-lg transition-all active:scale-95 ${
              selectedPaper === 2
                ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            রসায়ন ২য় পত্র
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="অধ্যায় বা টপিক খুঁজুন..."
            className="w-full bg-slate-900/70 border border-slate-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>
      </div>

      {/* Flat Tree List of Chapters & Topics */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {loading && chapters.length === 0 ? (
          <div className="py-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 animate-pulse space-y-1.5">
                <div className="w-3/4 h-3.5 bg-slate-800 rounded-lg" />
                <div className="w-1/2 h-2.5 bg-slate-800/60 rounded" />
              </div>
            ))}
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            কোনো অধ্যায় পাওয়া যায়নি।
          </div>
        ) : (
          filteredChapters.map((ch, cIdx) => {
            const isSelectedChapter = selectedChapter?.id === ch.id;
            const chProg = isSelectedChapter
              ? { introCompleted, completedTopicIds }
              : readChapterProgress(ch.id);

            return (
              <div key={ch.id || cIdx} className="space-y-1">
                {/* Chapter Row (Clean Tree Item — No Bordered Card) */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isSelectedChapter) {
                      handleOpenChapter(ch);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                    isSelectedChapter
                      ? "bg-slate-900 text-white font-bold"
                      : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        isSelectedChapter
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-900 text-slate-500"
                      }`}
                    >
                      {ch.sequenceOrder || cIdx + 1}
                    </span>
                    <span className="text-xs truncate">{ch.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {chProg.completedTopicIds.length > 0 && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        ✓{chProg.completedTopicIds.length}
                      </span>
                    )}
                    {isSelectedChapter ? (
                      <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </button>

                {/* Indented Tree Branch for Topics of Active Chapter */}
                {isSelectedChapter && (
                  <div className="ml-5 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                    {/* Step 0: শুরুর আগে (রোডম্যাপ) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTopicIndex(-1);
                        setLockedPromptTopic(null);
                        if (isMobileDrawer) setMobileSidebarOpen(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center gap-2 transition-all active:scale-[0.98] ${
                        activeTopicIndex === -1
                          ? "bg-amber-500/15 text-amber-300 font-bold border-l-2 border-amber-400"
                          : introCompleted
                          ? "text-emerald-400/90 hover:bg-slate-900/60"
                          : "text-amber-300 hover:bg-slate-900/60"
                      }`}
                    >
                      {introCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      ) : (
                        <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      )}
                      <span className="truncate">০. শুরুর আগে (রোডম্যাপ)</span>
                    </button>

                    {/* Sequential Topics (Always Clickable! Shows prompt if locked) */}
                    {chapterTopics.map((t, tIdx) => {
                      const isDone = completedTopicIds.includes(t.id);
                      const isLocked =
                        !introCompleted ||
                        (tIdx > 0 && !completedTopicIds.includes(chapterTopics[tIdx - 1].id));
                      const isActive = activeTopicIndex === tIdx;
                      const subList = subtopicsMap[t.id] || [];

                      return (
                        <div key={t.id || tIdx} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (isLocked) {
                                // Show interactive unlock prompt instead of doing nothing!
                                setLockedPromptTopic({ title: t.title, index: tIdx });
                              } else {
                                setLockedPromptTopic(null);
                                setActiveTopicIndex(tIdx);
                                setActiveSubtopicIndex(0);
                                if (isMobileDrawer) setMobileSidebarOpen(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });

                                try {
                                  const lastSession = {
                                    chapterId: selectedChapter?.id,
                                    chapterTitle: selectedChapter?.title || selectedChapter?.name,
                                    paper: selectedPaper,
                                    topicTitle: t.title || t.name || "মূল কনসেপ্ট ও লেকচার নোট",
                                    topicIndex: tIdx,
                                    totalTopics: chapterTopics.length,
                                    timestamp: Date.now(),
                                  };
                                  localStorage.setItem(`chemchamp_last_studied_${user?.uid || "guest"}`, JSON.stringify(lastSession));
                                  localStorage.setItem(`chemchamp_study_active_today_${new Date().toISOString().split("T")[0]}`, "true");
                                } catch {
                                  // ignore
                                }
                              }
                            }}
                            className={`w-full px-2.5 py-2 rounded-lg text-left text-xs flex items-center justify-between gap-2 transition-all active:scale-[0.98] ${
                              isActive
                                ? "bg-teal-500/15 text-teal-300 font-bold border-l-2 border-teal-400"
                                : isLocked
                                ? "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                                : isDone
                                ? "text-emerald-400/90 hover:bg-slate-900/60"
                                : "text-slate-300 hover:bg-slate-900/60 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {isLocked ? (
                                <Lock className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              ) : isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                              )}
                              <span className="truncate">
                                {tIdx + 1}. {t.title}
                              </span>
                            </div>
                          </button>

                          {/* Nested Subtopics if active */}
                          {isActive && subList.length > 0 && (
                            <div className="pl-5 py-0.5 space-y-0.5">
                              {subList.map((sub, sIdx) => {
                                const isSelected = activeSubtopicIndex === sIdx;
                                const firstTag =
                                  Array.isArray(sub.examTags) && sub.examTags.length > 0
                                    ? sub.examTags[0]
                                    : null;
                                return (
                                  <button
                                    key={sub.id || sIdx}
                                    type="button"
                                    onClick={() => {
                                      setActiveSubtopicIndex(sIdx);
                                      if (isMobileDrawer) setMobileSidebarOpen(false);
                                    }}
                                    className={`w-full px-2 py-1 rounded text-left text-[11px] transition-all flex items-center justify-between gap-1.5 ${
                                      isSelected
                                        ? "text-emerald-300 font-bold bg-emerald-500/10"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                                    }`}
                                  >
                                    <span className="truncate">• {sub.title}</span>
                                    {firstTag && (
                                      <span
                                        className={`shrink-0 text-[9px] px-1.5 py-0.2 rounded-full border font-mono font-bold ${getExamBadgeStyle(
                                          firstTag
                                        )}`}
                                      >
                                        {firstTag}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Slim Bottom Progress Strip */}
      {selectedChapter && (
        <div className="px-4 py-3 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">অধ্যায় অগ্রগতি</span>
            <span className="font-mono font-bold text-emerald-400">{completionPercent}%</span>
          </div>
          <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`text-slate-100 pb-24 md:pb-8 w-full transition-colors duration-300 min-h-[calc(100vh-4rem)] ${
        isReadMode
          ? readingTheme === "sepia"
            ? "bg-[#1c1814] text-[#f5ead8]"
            : readingTheme === "oled"
            ? "bg-black text-slate-100"
            : "bg-slate-950 text-slate-100"
          : "bg-slate-950"
      }`}
    >
      {/* 📖 রিড মোড স্ক্রোল প্রগ্রেস বার */}
      {isReadMode && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-slate-900/60 z-50 pointer-events-none">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      {/* 📖 রিড মোড জেন কন্ট্রোল হেডার */}
      {isReadMode && (
        <div
          className={`sticky top-0 z-40 backdrop-blur-xl border-b px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xl animate-in slide-in-from-top-2 duration-200 ${
            readingTheme === "sepia"
              ? "bg-[#231f1a]/95 border-[#3d3429] text-[#f5ead8]"
              : readingTheme === "oled"
              ? "bg-black/95 border-neutral-900 text-slate-100"
              : "bg-slate-950/95 border-slate-800/90 text-slate-100"
          }`}
        >
          {/* Exit Read Mode */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleReadMode(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 border border-slate-800 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>এক্সিট রিড মোড</span>
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                ESC
              </kbd>
            </button>
            <span className="text-[11px] font-mono font-bold text-emerald-400 hidden sm:inline">
              📖 {scrollProgress}% পড়া হয়েছে
            </span>
          </div>

          {/* Reading Customization Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Font Size Changer */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-xs font-bold">
              {[
                { id: "sm", label: "A-" },
                { id: "base", label: "A" },
                { id: "lg", label: "A+" },
                { id: "xl", label: "A++" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    soundService.playClick();
                    setReadingFontSize(f.id);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    readingFontSize === f.id
                      ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Reading Theme Switcher */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setReadingTheme("dark");
                }}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  readingTheme === "dark"
                    ? "bg-slate-800 text-teal-300 font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="ডার্ক মোড"
              >
                <span>🌙 ডার্ক</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setReadingTheme("sepia");
                }}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  readingTheme === "sepia"
                    ? "bg-[#3d3429] text-amber-200 font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="বুক সেপিয়া মোড (চোখের আরামদায়ক)"
              >
                <span>📜 সেপিয়া</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setReadingTheme("oled");
                }}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                  readingTheme === "oled"
                    ? "bg-black text-white border border-neutral-700 font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="ওলেড ব্ল্যাক মোড"
              >
                <span>🖤 OLED</span>
              </button>
            </div>

            {/* Native Fullscreen Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              title={isFullscreen ? "ফুলস্ক্রিন থেকে বের হন" : "ফুলস্ক্রিন রিডিং"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* মেইন কন্টেন্ট র‍্যাপার (রিড মোডে সেন্টার্ড ও ম্যাক্স-উইডথ, অন্যথায় স্প্লিট-প্যান) */}
      <div
        className={`w-full mx-auto flex ${
          isReadMode ? "max-w-4xl px-3 sm:px-6 py-4 justify-center" : "max-w-[1440px]"
        }`}
      >
        {/* ১. বাম পাশে ফ্ল্যাট ও ক্লিন সাইডবার (রিড মোডে সম্পূর্ণ লুকায়িত) */}
        {!isReadMode && (
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-r border-slate-800/80 sticky top-16 h-[calc(100vh-4rem)] self-start z-30">
            {renderSidebarContent(false)}
          </aside>
        )}

        {/* ২. ডান পাশে ওপেন রিডিং ক্যানভাস */}
        <div className="flex-1 min-w-0 relative">
          {/* Subtle Top Accent Progress Indicator when loading without jarring screen wipe */}
          {loadingLesson && selectedChapter && (
            <div className="absolute top-0 left-0 right-0 z-40 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
          )}

          {loadingLesson && !selectedChapter ? (
            <div className="py-24 text-center text-xs text-slate-500 animate-pulse">
              লেকচার ওয়ার্কস্পেস প্রস্তুত হচ্ছে...
            </div>
          ) : !selectedChapter ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white">
                {selectedPaper === 1 ? "রসায়ন ১ম পত্র" : "রসায়ন ২য় পত্র"}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm">
                এই পত্রে এখনো কোনো অধ্যায় তৈরি করা হয়নি। অ্যাডমিন স্টুডিও থেকে নতুন অধ্যায় ও টপিক যোগ করলে তা এখানে দেখতে পাবেন।
              </p>
            </div>
          ) : (
            <LessonReaderModal
              isInline={true}
              chapter={selectedChapter}
              topics={chapterTopics}
              subtopicsMap={subtopicsMap}
              activeTopicIndex={activeTopicIndex}
              setActiveTopicIndex={(idx) => {
                setLockedPromptTopic(null);
                setActiveTopicIndex(idx);
              }}
              activeSubtopicIndex={activeSubtopicIndex}
              setActiveSubtopicIndex={setActiveSubtopicIndex}
              introCompleted={introCompleted}
              completedTopicIds={completedTopicIds}
              onCompleteIntro={handleCompleteIntro}
              onCompleteTopic={handleCompleteTopic}
              lockedPromptTopic={lockedPromptTopic}
              onClearLockedPrompt={() => setLockedPromptTopic(null)}
              onForceUnlockTopic={handleForceUnlockTopic}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
              isReadMode={isReadMode}
              onToggleReadMode={toggleReadMode}
              readingFontSize={readingFontSize}
              readingTheme={readingTheme}
            />
          )}
        </div>
      </div>

      {/* ৩. মোবাইল স্লাইড-ওভার সাইডবার ড্রয়ার */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-[85vw] max-w-xs h-full bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </div>
  );
}
