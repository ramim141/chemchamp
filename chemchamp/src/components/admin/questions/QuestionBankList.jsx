import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import {
  Edit2,
  Trash2,
  RefreshCw,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Search,
  Copy,
  Download,
  CheckSquare,
  Square,
  HelpCircle,
  Sparkles,
  Layers,
  Filter,
  X,
  Tag,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";
import SingleQuestionModal from "./SingleQuestionModal";
import { cacheService } from "../../../services/cacheService";
import { contentVersionService } from "../../../services/contentVersionService";

export default function QuestionBankList({
  selectedChapter,
  selectedTopic,
  selectedSubtopic,
  selectedPaper,
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("ALL"); // ALL | MCQ | CQ | SQ
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTagFilter, setSelectedTagFilter] = useState("ALL");
  const [editModal, setEditModal] = useState({ open: false, data: null });

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Subtopics for the current topic (for modal assignment)
  const [subtopics, setSubtopics] = useState([]);

  // Fetch Subtopics for SingleQuestionModal assignment
  useEffect(() => {
    const fetchSubtopics = async () => {
      if (!selectedTopic?.id) {
        setSubtopics([]);
        return;
      }
      try {
        const snap = await getDocs(
          query(collection(db, "subtopics"), where("topicId", "==", selectedTopic.id))
        );
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
        setSubtopics(list);
      } catch {
        setSubtopics([]);
      }
    };
    fetchSubtopics();
  }, [selectedTopic?.id]);

  // Fetch Questions from Firestore
  const fetchQuestions = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const qColl = collection(db, "questions");
      let qConstraint;

      if (selectedSubtopic?.id) {
        qConstraint = query(qColl, where("subtopicId", "==", selectedSubtopic.id));
      } else if (selectedTopic?.id) {
        qConstraint = query(qColl, where("topicId", "==", selectedTopic.id));
      } else if (selectedChapter?.id) {
        qConstraint = query(qColl, where("chapterId", "==", selectedChapter.id));
      } else {
        qConstraint = query(qColl, limit(80));
      }

      const snap = await getDocs(qConstraint);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setQuestions(list);
    } catch (err) {
      console.error("Fetch questions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedChapter?.id, selectedTopic?.id, selectedSubtopic?.id]);

  // Create / Update Question
  const handleSaveQuestion = async (formData) => {
    try {
      const id = formData.id || `q_${Date.now()}`;
      await setDoc(
        doc(db, "questions", id),
        {
          ...formData,
          paper: Number(selectedPaper),
          chapterId: selectedChapter?.id || "",
          chapterTitle: selectedChapter?.title || "সাধারণ রসায়ন",
          topicId: selectedTopic?.id || "",
          topicTitle: selectedTopic?.title || "সাধারণ টপিক",
          subtopicId: formData.subtopicId || selectedSubtopic?.id || "",
          subtopicTitle: formData.subtopicTitle || selectedSubtopic?.title || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setEditModal({ open: false, data: null });
      cacheService.remove("chemchamp_all_questions");
      contentVersionService.bumpVersion("questions");
      fetchQuestions();
    } catch (err) {
      alert("সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // Single Delete
  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই প্রশ্নটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "questions", id));
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      cacheService.remove("chemchamp_all_questions");
      contentVersionService.bumpVersion("questions");
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `আপনি কি নিশ্চিতভাবে নির্বাচিত ${selectedIds.size}টি প্রশ্ন স্থায়ীভাবে মুছে ফেলতে চান?`
      )
    ) {
      return;
    }

    setBulkDeleting(true);
    try {
      const idList = Array.from(selectedIds);
      const CHUNK_SIZE = 400;

      for (let i = 0; i < idList.length; i += CHUNK_SIZE) {
        const chunk = idList.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);
        chunk.forEach((id) => {
          batch.delete(doc(db, "questions", id));
        });
        await batch.commit();
      }

      setQuestions((prev) => prev.filter((q) => !selectedIds.has(q.id)));
      setSelectedIds(new Set());
      cacheService.remove("chemchamp_all_questions");
      contentVersionService.bumpVersion("questions");
    } catch (err) {
      alert("বাল্ক ডিলিট ব্যর্থ: " + err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Clone / Duplicate Question
  const handleCloneQuestion = (q) => {
    const clonedData = {
      ...q,
      id: undefined, // Will generate new ID upon save
      stem: `${q.stem} (কপি)`,
    };
    setEditModal({ open: true, data: clonedData });
  };

  // Export Filtered Questions as JSON Backup
  const handleExportJSON = () => {
    if (filteredQuestions.length === 0) {
      alert("এক্সপোর্ট করার মতো কোনো প্রশ্ন নেই।");
      return;
    }

    const exportData = filteredQuestions.map((q) => {
      const { id, createdAt, updatedAt, ...cleanQ } = q;
      return cleanQ;
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTopic = (selectedTopic?.title || selectedChapter?.title || "questions").replace(
      /\s+/g,
      "_"
    );
    link.href = url;
    link.download = `chemchamp_${safeTopic}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Available unique tags across fetched questions
  const availableTags = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      if (q.tag) set.add(q.tag);
    });
    return Array.from(set);
  }, [questions]);

  // Filtered Questions by Type, Search Query & Tag
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 1. Type Filter
      if (filterType !== "ALL" && (q.type || "MCQ") !== filterType) {
        return false;
      }

      // 2. Tag Filter
      if (selectedTagFilter !== "ALL" && q.tag !== selectedTagFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase();
        const stemMatch = (q.stem || "").toLowerCase().includes(queryLower);
        const tagMatch = (q.tag || "").toLowerCase().includes(queryLower);
        const optionMatch = Array.isArray(q.options)
          ? q.options.some((o) => String(o).toLowerCase().includes(queryLower))
          : false;
        const answerMatch = (q.answer || "").toLowerCase().includes(queryLower);

        return stemMatch || tagMatch || optionMatch || answerMatch;
      }

      return true;
    });
  }, [questions, filterType, selectedTagFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = questions.length;
    const mcq = questions.filter((q) => (q.type || "MCQ") === "MCQ").length;
    const cq = questions.filter((q) => q.type === "CQ").length;
    const sq = questions.filter((q) => q.type === "SQ").length;
    return { total, mcq, cq, sq };
  }, [questions]);

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
      {/* ১. হেডার ও স্ট্যাটাস বার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>প্রশ্ন ব্যাংক ব্যবস্থাপনা (CRUD Desk)</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300">
              {selectedTopic
                ? `${selectedTopic.title}${selectedSubtopic ? ` ➔ ${selectedSubtopic.title}` : ""}`
                : selectedChapter?.title || "সকল অধ্যায়"}
            </span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            প্রশ্ন তৈরি (Create), অনুসন্ধান (Read), পরিবর্তন (Update) ও মুছে ফেলার (Delete) সম্পূর্ণ নিয়ন্ত্রণ
          </p>
        </div>

        {/* প্রাইমারি অ্যাকশন বাটনস */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition-all"
            title="বর্তমান প্রশ্ন তালিকা JSON আকারে ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>JSON ব্যাকআপ</span>
          </button>

          <button
            type="button"
            onClick={() => setEditModal({ open: true, data: null })}
            className="flex items-center gap-1.5 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-3.5 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন প্রশ্ন তৈরি</span>
          </button>

          <button
            type="button"
            onClick={fetchQuestions}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ২. লাইভ স্ট্যাটস মাইক্রো-স্ট্রিপ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 font-medium">মোট প্রশ্ন:</span>
          <span className="font-mono font-bold text-white text-sm">{stats.total}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <span className="text-emerald-400 font-medium">MCQ:</span>
          <span className="font-mono font-bold text-emerald-300 text-sm">{stats.mcq}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <span className="text-teal-400 font-medium">CQ (সৃজনশীল):</span>
          <span className="font-mono font-bold text-teal-300 text-sm">{stats.cq}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
          <span className="text-amber-400 font-medium">SQ (সংক্ষিপ্ত):</span>
          <span className="font-mono font-bold text-amber-300 text-sm">{stats.sq}</span>
        </div>
      </div>

      {/* ৩. সার্চ ও ফিল্টার বার */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
        {/* রিয়েল-টাইম সার্চ ইনপুট */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="প্রশ্নের মূল বাক্য, ট্যাগ বা অপশন খুঁজুন..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* টাইপ নির্বাচক পিলস */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            {["ALL", "MCQ", "CQ", "SQ"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === t
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "ALL" ? "সকল" : t}
              </button>
            ))}
          </div>

          {/* ট্যাগ ফিল্টার ড্রপডাউন (যদি একাধিক ট্যাগ থাকে) */}
          {availableTags.length > 0 && (
            <select
              value={selectedTagFilter}
              onChange={(e) => setSelectedTagFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">সকল ট্যাগ</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  ★ {t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ৪. বাল্ক সিলেকশন অ্যাকশন বার (যখন কোনো প্রশ্ন সিলেক্ট করা থাকবে) */}
      {filteredQuestions.length > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold cursor-pointer"
          >
            {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {selectedIds.size === filteredQuestions.length
                ? "সব অনির্বাচন করুন"
                : "সব নির্বাচন করুন"}
            </span>
          </button>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-400 font-bold">
                {selectedIds.size} টি প্রশ্ন নির্বাচিত
              </span>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={handleBulkDelete}
                className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{bulkDeleting ? "মুছে ফেলা হচ্ছে..." : "একসাথে ডিলিট"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ৫. প্রশ্নের তালিকা (CRUD Cards) */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
          প্রশ্ন ব্যাংক ডেটা লোড হচ্ছে...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <p className="font-bold text-slate-400">কোনো প্রশ্ন পাওয়া যায়নি।</p>
          <p className="text-[11px] text-slate-500">
            {searchQuery
              ? "সার্চ ফিল্টারের সাথে মিলছে না। ফিল্টার পরিবর্তন করে দেখুন।"
              : 'উপরে "নতুন প্রশ্ন তৈরি" বাটনে ক্লিক করুন অথবা JSON বাল্ক আপলোড ট্যাব থেকে আপলোড করুন।'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {filteredQuestions.map((q, idx) => {
            const qType = q.type || "MCQ";
            const isSelected = selectedIds.has(q.id);

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl transition-all flex flex-col gap-2.5 border ${
                  isSelected
                    ? "bg-slate-950 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                    : "bg-slate-950/90 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                {/* কার্ড হেডার ও মেটাডাটা */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* সিলেকশন চেকবক্স */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(q.id)}
                      className="cursor-pointer mr-1"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>

                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                      {qType}
                    </span>

                    {q.tag && (
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        ★ {q.tag}
                      </span>
                    )}

                    {q.subtopicTitle && (
                      <span className="text-[10px] text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded truncate max-w-[150px]">
                        📑 {q.subtopicTitle}
                      </span>
                    )}
                  </div>

                  {/* কার্ড অ্যাকশনস: ক্লোন, এডিট, ডিলিট */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCloneQuestion(q)}
                      className="p-1.5 text-slate-400 hover:text-teal-300 rounded-lg hover:bg-slate-900 transition-colors"
                      title="ক্লোন / ডুপ্লিকেট কপি তৈরি"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditModal({ open: true, data: q })}
                      className="p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-slate-900 transition-colors"
                      title="এডিট করুন"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* মূল প্রশ্নের বাক্য (KaTeX সহ) */}
                <div className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                  <KaTeXMath math={q.stem} />
                </div>

                {/* চিত্র (যদি থাকে) */}
                {q.imageUrl && (
                  <div className="my-1.5 text-center">
                    <img
                      src={q.imageUrl}
                      alt="উদ্দীপক চিত্র"
                      className="max-h-36 rounded-lg object-contain mx-auto border border-slate-800 shadow-md"
                    />
                  </div>
                )}

                {/* MCQ অপশনসমূহ (গ্রিড ডিসপ্লে) */}
                {qType === "MCQ" && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          oIdx === q.answerIndex
                            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold ring-1 ring-emerald-500/20"
                            : "bg-slate-900/60 border-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="font-mono text-slate-400 font-bold">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <div className="flex-1">
                          <KaTeXMath math={opt} />
                        </div>
                        {oIdx === q.answerIndex && (
                          <span className="ml-auto text-emerald-400 font-black text-xs shrink-0">
                            ✓ সঠিক
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* MCQ সমাধান ও ব্যাখ্যা */}
                {qType === "MCQ" && q.explanation && (
                  <div className="mt-1 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs leading-relaxed text-slate-300">
                    <span className="text-amber-400 font-bold block mb-0.5 flex items-center gap-1">
                      <span>💡 সমাধান ও ব্যাখ্যা:</span>
                    </span>
                    <KaTeXMath math={q.explanation} />
                  </div>
                )}

                {/* CQ সৃজনশীল প্রশ্ন ও উত্তর */}
                {qType === "CQ" && q.subQuestions && (
                  <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {q.subQuestions.map((sub, sIdx) => (
                      <div
                        key={sIdx}
                        className="border-b border-slate-800/80 pb-2 last:border-none last:pb-0"
                      >
                        <p className="text-teal-300 font-bold mb-1">
                          ({sub.part}) <KaTeXMath math={sub.question} /> (
                          {sub.marks || sIdx + 1} নম্বর)
                        </p>
                        <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <strong className="text-emerald-400">উত্তরঃ </strong>
                          <KaTeXMath math={sub.answer} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SQ সংক্ষিপ্ত উত্তর */}
                {qType === "SQ" && (
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-2 inline-block">
                      {q.subCategory || "জ্ঞানমূলক"} ({q.marks || 1} নম্বর)
                    </span>
                    <div className="text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      <strong className="text-emerald-400">উত্তরঃ </strong>
                      <KaTeXMath math={q.answer} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* এডিট / তৈরি মডাল */}
      {editModal.open && (
        <SingleQuestionModal
          isOpen={true}
          data={editModal.data}
          chapterTitle={selectedChapter?.title}
          topicTitle={selectedTopic?.title}
          subtopicTitle={selectedSubtopic?.title}
          subtopics={subtopics}
          onClose={() => setEditModal({ open: false, data: null })}
          onSave={handleSaveQuestion}
        />
      )}
    </div>
  );
}
