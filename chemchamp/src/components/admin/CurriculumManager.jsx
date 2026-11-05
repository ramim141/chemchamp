import React, { useState, useEffect } from "react";
import { cacheService } from "../../services/cacheService";
import { contentVersionService } from "../../services/contentVersionService";
import { db } from "../../services/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  BookOpen,
  Layers,
  FolderPlus,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
  CheckCircle2,
  Folder,
  FolderOpen,
  Sparkles,
  BookMarked,
} from "lucide-react";

import ChapterModal from "./curriculum/ChapterModal";
import TopicModal from "./curriculum/TopicModal";
import SubtopicEditorModal from "./curriculum/SubtopicEditorModal";
import TopicHighlightsModal from "./curriculum/TopicHighlightsModal";
import { getExamBadgeStyle } from "../../utils/examTagUtils";

export default function CurriculumManager() {
  const [selectedPaper, setSelectedPaper] = useState(1); // 1 = ১ম পত্র, 2 = ২য় পত্র

  const [chapters, setChapters] = useState([]);
  const [topicsMap, setTopicsMap] = useState({}); // { [chapterId]: [topics] }
  const [subtopicsMap, setSubtopicsMap] = useState({}); // { [topicId]: [subtopics] }

  // অ্যাকর্ডিয়ন ওপেন/ক্লোজ স্টেট
  const [expandedChapters, setExpandedChapters] = useState({}); // { [chapterId]: boolean }
  const [expandedTopics, setExpandedTopics] = useState({}); // { [topicId]: boolean }

  const [loading, setLoading] = useState(false);

  // মোডাল স্টেটস
  const [chapterModal, setChapterModal] = useState({ open: false, data: null });
  const [topicModal, setTopicModal] = useState({
    open: false,
    data: null,
    chapter: null,
  });
  const [subtopicModal, setSubtopicModal] = useState({
    open: false,
    data: null,
    chapter: null,
    topic: null,
  });
  const [highlightsModal, setHighlightsModal] = useState({
    open: false,
    subtopic: null,
    topic: null,
    chapter: null,
  });

  // ১. অধ্যায় লোড করা
  const fetchChapters = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "chapters"),
        where("paper", "==", Number(selectedPaper))
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
      setChapters(list);

      // প্রথম অধ্যায়টি স্বয়ংক্রিয়ভাবে ওপেন রাখা
      if (list.length > 0) {
        setExpandedChapters((prev) => ({ ...prev, [list[0].id]: true }));
        fetchTopicsForChapter(list[0].id);
      }
    } catch (err) {
      console.error("Fetch chapters error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [selectedPaper]);

  // ২. নির্দিষ্ট অধ্যায়ের টপিক লোড করা
  const fetchTopicsForChapter = async (chapterId) => {
    try {
      const q = query(
        collection(db, "topics"),
        where("chapterId", "==", chapterId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
      
      setTopicsMap((prev) => ({ ...prev, [chapterId]: list }));

      // টপিকগুলোর সাব-টপিকও লোড করে নেওয়া
      list.forEach((top) => {
        fetchSubtopicsForTopic(top.id);
      });
    } catch (err) {
      console.error("Fetch topics error:", err);
    }
  };

  // ৩. নির্দিষ্ট টপিকের সাব-টপিক লোড করা
  const fetchSubtopicsForTopic = async (topicId) => {
    try {
      const q = query(
        collection(db, "subtopics"),
        where("topicId", "==", topicId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
      setSubtopicsMap((prev) => ({ ...prev, [topicId]: list }));
    } catch (err) {
      console.error("Fetch subtopics error:", err);
    }
  };

  // অ্যাকর্ডিয়ন টগল হ্যান্ডলার
  const toggleChapter = (chapterId) => {
    const isCurrentlyExpanded = !!expandedChapters[chapterId];
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded && !topicsMap[chapterId]) {
      fetchTopicsForChapter(chapterId);
    }
  };

  const toggleTopic = (topicId) => {
    const isCurrentlyExpanded = !!expandedTopics[topicId];
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !isCurrentlyExpanded,
    }));

    if (!isCurrentlyExpanded && !subtopicsMap[topicId]) {
      fetchSubtopicsForTopic(topicId);
    }
  };

  // ===================== CRUD অ্যাকশনসমূহ =====================

  // অধ্যায় সেভ
  const handleSaveChapter = async (formData) => {
    try {
      const id = formData.id || `ch_${Date.now()}`;
      await setDoc(
        doc(db, "chapters", id),
        {
          paper: Number(selectedPaper),
          title: formData.title,
          sequenceOrder: formData.sequenceOrder,
          description: formData.description,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setChapterModal({ open: false, data: null });
      cacheService.remove("chemchamp_all_chapters");
      contentVersionService.bumpVersion("curriculum");
      fetchChapters();
    } catch (err) {
      alert("অধ্যায় সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // অধ্যায় ডিলিট
  const handleDeleteChapter = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অধ্যায়টি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "chapters", id));
      cacheService.remove("chemchamp_all_chapters");
      contentVersionService.bumpVersion("curriculum");
      fetchChapters();
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  // টপিক সেভ
  const handleSaveTopic = async (formData) => {
    const chapterId = topicModal.chapter?.id;
    if (!chapterId) return;

    try {
      const id = formData.id || `top_${Date.now()}`;
      await setDoc(
        doc(db, "topics", id),
        {
          chapterId: chapterId,
          title: formData.title,
          sequenceOrder: formData.sequenceOrder,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setTopicModal({ open: false, data: null, chapter: null });
      contentVersionService.bumpVersion("curriculum");
      fetchTopicsForChapter(chapterId);
      // টপিক যোগ হলে সেই অধ্যায়টি এক্সপ্যান্ড করে রাখা
      setExpandedChapters((prev) => ({ ...prev, [chapterId]: true }));
    } catch (err) {
      alert("টপিক সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // টপিক ডিলিট
  const handleDeleteTopic = async (topicId, chapterId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই টপিকটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "topics", topicId));
      contentVersionService.bumpVersion("curriculum");
      fetchTopicsForChapter(chapterId);
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  // টপিকের বইয়ের দাগানো লাইন (Textbook Highlights) সেভ
  const handleSaveTopicHighlights = async (topicId, highlights, chapterId) => {
    try {
      await setDoc(
        doc(db, "topics", topicId),
        {
          bookHighlights: highlights,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (chapterId) {
        fetchTopicsForChapter(chapterId);
      }
    } catch (err) {
      alert("বইয়ের দাগানো লাইন সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // সাব-টপিকের বইয়ের দাগানো লাইন (Textbook Highlights) সেভ
  const handleSaveSubtopicHighlights = async (subtopicId, highlights, topicId) => {
    try {
      await setDoc(
        doc(db, "subtopics", subtopicId),
        {
          bookHighlights: highlights,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      if (topicId) {
        fetchSubtopicsForTopic(topicId);
      }
    } catch (err) {
      alert("সাব-টপিকের দাগানো লাইন সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // সাব-টপিক সেভ
  const handleSaveSubtopic = async (formData) => {
    const chapterId = subtopicModal.chapter?.id;
    const topicId = subtopicModal.topic?.id;
    if (!topicId) return;

    try {
      const id = formData.id || `sub_${Date.now()}`;
      await setDoc(
        doc(db, "subtopics", id),
        {
          chapterId: chapterId || "",
          topicId: topicId,
          title: formData.title,
          sequenceOrder: formData.sequenceOrder,
          videoUrl: formData.videoUrl,
          notesMarkdown: formData.notesMarkdown,
          examTags: Array.isArray(formData.examTags) ? formData.examTags : [],
          bookHighlights: Array.isArray(formData.bookHighlights) ? formData.bookHighlights : [],
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSubtopicModal({ open: false, data: null, chapter: null, topic: null });
      contentVersionService.bumpVersion("curriculum");
      fetchSubtopicsForTopic(topicId);
      // সাব-টপিক যোগ হলে টপিকটি এক্সপ্যান্ড করে রাখা
      setExpandedTopics((prev) => ({ ...prev, [topicId]: true }));
    } catch (err) {
      alert("সাব-টপিক সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // সাব-টপিক ডিলিট
  const handleDeleteSubtopic = async (subtopicId, topicId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই সাব-টপিক ও লেকচার নোট মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "subtopics", subtopicId));
      contentVersionService.bumpVersion("curriculum");
      fetchSubtopicsForTopic(topicId);
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ১. শীর্ষ হেডার বার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              অধ্যায়, টপিক ও লেকচার নোট স্টুডিও
            </h2>
            <p className="text-xs text-slate-400">
              নেস্টেড ট্রি ভিউ: অধ্যায় ➔ টপিক ➔ সাব-টপিক ➔ লেকচার নোট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* পেপার সুইচ বাটন */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedPaper(1)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPaper === 1
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              রসায়ন ১ম পত্র
            </button>
            <button
              type="button"
              onClick={() => setSelectedPaper(2)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedPaper === 2
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              রসায়ন ২য় পত্র
            </button>
          </div>

          {/* নতুন অধ্যায় বাটন */}
          <button
            type="button"
            onClick={() => setChapterModal({ open: true, data: null })}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন অধ্যায়</span>
          </button>
        </div>
      </div>

      {/* ২. নেস্টেড অ্যাকর্ডিয়ন ট্রি স্ট্রাকচার (Unified Tree View) */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            সিলেবাস লোড হচ্ছে...
          </div>
        ) : chapters.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">কোনো অধ্যায় তৈরি করা হয়নি</h4>
            <p className="text-xs text-slate-400 mb-4">
              রসায়ন {selectedPaper === 1 ? "১ম" : "২য়"} পত্রে প্রথম অধ্যায় যোগ করে শুরু করুন।
            </p>
            <button
              type="button"
              onClick={() => setChapterModal({ open: true, data: null })}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
            >
              + নতুন অধ্যায় যোগ করুন
            </button>
          </div>
        ) : (
          chapters.map((ch) => {
            const isChapterOpen = !!expandedChapters[ch.id];
            const chapterTopics = topicsMap[ch.id] || [];

            return (
              <div
                key={ch.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden transition-all"
              >
                {/* লেভেল ১: অধ্যায় হেডার (Chapter Accordion Header) */}
                <div
                  onClick={() => toggleChapter(ch.id)}
                  className={`p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                    isChapterOpen
                      ? "bg-amber-500/10 border-b border-amber-500/20"
                      : "hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {isChapterOpen ? (
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {ch.sequenceOrder || 1}
                    </span>

                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                      {ch.title}
                    </h3>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                      {chapterTopics.length}টি টপিক
                    </span>
                  </div>

                  {/* অধ্যায় অ্যাকশন বাটনসমূহ */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() =>
                        setTopicModal({
                          open: true,
                          data: null,
                          chapter: ch,
                        })
                      }
                      className="flex items-center gap-1 text-[11px] font-bold text-teal-300 hover:text-teal-200 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>টপিক যোগ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChapterModal({ open: true, data: ch })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="অধ্যায় এডিট"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(ch.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* লেভেল ২: অধ্যায়ের ভেতরের টপিকসমূহ (Topics inside Chapter) */}
                {isChapterOpen && (
                  <div className="p-3 sm:p-4 bg-slate-950/50 space-y-3">
                    {chapterTopics.length === 0 ? (
                      <div className="p-4 text-center rounded-xl bg-slate-900/50 border border-slate-850 text-xs text-slate-400">
                        এই অধ্যায়ে কোনো টপিক নেই। ডানপাশের{" "}
                        <strong className="text-teal-400">"+ টপিক যোগ"</strong>{" "}
                        বাটনে ক্লিক করুন।
                      </div>
                    ) : (
                      chapterTopics.map((top) => {
                        const isTopicOpen =
                          expandedTopics[top.id] === undefined
                            ? true // ডিফল্টভাবে টপিক ওপেন
                            : !!expandedTopics[top.id];
                        const topicSubtopics = subtopicsMap[top.id] || [];

                        return (
                          <div
                            key={top.id}
                            className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden ml-2 sm:ml-5 shadow-md"
                          >
                            {/* টপিক হেডার (Topic Accordion Header) */}
                            <div
                              onClick={() => toggleTopic(top.id)}
                              className={`p-3 flex items-center justify-between cursor-pointer select-none transition-colors ${
                                isTopicOpen
                                  ? "bg-teal-500/10 border-b border-teal-500/20"
                                  : "hover:bg-slate-850"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <button
                                  type="button"
                                  className="p-0.5 text-slate-400 hover:text-white"
                                >
                                  {isTopicOpen ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-teal-400" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />

                                <h4 className="text-xs sm:text-sm font-bold text-teal-200 truncate">
                                  {top.title}
                                </h4>

                                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                                  {topicSubtopics.length}টি সাব-টপিক
                                </span>
                              </div>

                              {/* টপিক অ্যাকশন বাটনসমূহ */}
                              <div
                                className="flex items-center gap-1.5 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setHighlightsModal({
                                      open: true,
                                      topic: top,
                                      chapter: ch,
                                    })
                                  }
                                  className="flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 active:scale-95 transition-all shadow-sm"
                                  title="বিভিন্ন বইয়ের গুরুত্বপূর্ণ দাগানো লাইন (Textbook Highlights) যোগ/সম্পাদনা করুন"
                                >
                                  <BookMarked className="w-3 h-3 text-amber-400" />
                                  <span>
                                    দাগানো লাইন{" "}
                                    {Array.isArray(top.bookHighlights) && top.bookHighlights.length > 0
                                      ? `(${top.bookHighlights.length})`
                                      : "+"}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSubtopicModal({
                                      open: true,
                                      data: null,
                                      chapter: ch,
                                      topic: top,
                                    })
                                  }
                                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 active:scale-95 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>সাব-টপিক যোগ</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setTopicModal({
                                      open: true,
                                      data: top,
                                      chapter: ch,
                                    })
                                  }
                                  className="p-1 rounded-md text-slate-400 hover:text-white"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteTopic(top.id, ch.id)
                                  }
                                  className="p-1 rounded-md text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* লেভেল ৩: টপিকের ভেতরের সাব-টপিকসমূহ (Sub-topics inside Topic) */}
                            {isTopicOpen && (
                              <div className="p-3 pl-4 sm:pl-8 space-y-2 bg-slate-950/40">
                                {topicSubtopics.length === 0 ? (
                                  <div className="p-3 text-center rounded-lg border border-dashed border-slate-800 text-[11px] text-slate-500">
                                    কোনো সাব-টপিক নেই (যেমন: পরমাণুর মডেল)।
                                    ডানপাশের{" "}
                                    <strong className="text-emerald-400">
                                      "+ সাব-টপিক যোগ"
                                    </strong>{" "}
                                    বাটনে ক্লিক করুন।
                                  </div>
                                ) : (
                                  topicSubtopics.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                                    >
                                      {/* সাব-টপিক টাইটেল ও ব্যাজসমূহ */}
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                          <FileText className="w-3.5 h-3.5" />
                                        </div>

                                        <div className="min-w-0">
                                          <span className="text-xs font-bold text-white block truncate group-hover:text-emerald-300 transition-colors">
                                            #{sub.sequenceOrder || 1}{" "}
                                            {sub.title}
                                          </span>

                                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px]">
                                            {sub.videoUrl && (
                                              <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                                                <Video className="w-3 h-3" />{" "}
                                                ভিডিও যুক্ত
                                              </span>
                                            )}
                                            {sub.notesMarkdown ? (
                                              <span className="text-emerald-400 flex items-center gap-0.5">
                                                <CheckCircle2 className="w-3 h-3" />{" "}
                                                নোট আছে
                                              </span>
                                            ) : (
                                              <span className="text-amber-400">
                                                নোট খালি
                                              </span>
                                            )}
                                            {Array.isArray(sub.examTags) && sub.examTags.length > 0 && (
                                              <div className="flex items-center gap-1">
                                                {sub.examTags.slice(0, 3).map((tag, tIdx) => (
                                                  <span
                                                    key={tIdx}
                                                    className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${getExamBadgeStyle(
                                                      tag
                                                    )}`}
                                                  >
                                                    ★ {tag}
                                                  </span>
                                                ))}
                                                {sub.examTags.length > 3 && (
                                                  <span className="text-slate-500 text-[9px]">
                                                    +{sub.examTags.length - 3}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* সাব-টপিক অ্যাকশন বাটনসমূহ */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setHighlightsModal({
                                              open: true,
                                              subtopic: sub,
                                              topic: top,
                                              chapter: ch,
                                            })
                                          }
                                          className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                                          title="এই সাব-টপিকের বইয়ের দাগানো লাইন (Textbook Highlights) যোগ/সম্পাদনা করুন"
                                        >
                                          <BookMarked className="w-3.5 h-3.5 text-amber-400" />
                                          <span>
                                            দাগানো লাইন{" "}
                                            {Array.isArray(sub.bookHighlights) && sub.bookHighlights.length > 0
                                              ? `(${sub.bookHighlights.length})`
                                              : "+"}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setSubtopicModal({
                                              open: true,
                                              data: sub,
                                              chapter: ch,
                                              topic: top,
                                            })
                                          }
                                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                          <span>নোট এডিট / পড়ুন</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteSubtopic(
                                              sub.id,
                                              top.id
                                            )
                                          }
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                          title="মুছুন"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ৩টি পৃথক মডাল (Chapter, Topic, Subtopic) */}
      <ChapterModal
        isOpen={chapterModal.open}
        data={chapterModal.data}
        defaultSequence={chapters.length + 1}
        onClose={() => setChapterModal({ open: false, data: null })}
        onSave={handleSaveChapter}
      />

      <TopicModal
        isOpen={topicModal.open}
        data={topicModal.data}
        chapterTitle={topicModal.chapter?.title}
        defaultSequence={
          (topicsMap[topicModal.chapter?.id] || []).length + 1
        }
        onClose={() =>
          setTopicModal({ open: false, data: null, chapter: null })
        }
        onSave={handleSaveTopic}
      />

      <SubtopicEditorModal
        isOpen={subtopicModal.open}
        data={subtopicModal.data}
        chapterTitle={subtopicModal.chapter?.title}
        topicTitle={subtopicModal.topic?.title}
        onClose={() =>
          setSubtopicModal({
            open: false,
            data: null,
            chapter: null,
            topic: null,
          })
        }
        onSave={handleSaveSubtopic}
      />

      <TopicHighlightsModal
        isOpen={highlightsModal.open}
        subtopic={highlightsModal.subtopic}
        topic={highlightsModal.topic}
        chapterTitle={highlightsModal.chapter?.title}
        topicTitle={highlightsModal.topic?.title}
        onClose={() =>
          setHighlightsModal({ open: false, subtopic: null, topic: null, chapter: null })
        }
        onSave={
          highlightsModal.subtopic
            ? handleSaveSubtopicHighlights
            : handleSaveTopicHighlights
        }
      />
    </div>
  );
}