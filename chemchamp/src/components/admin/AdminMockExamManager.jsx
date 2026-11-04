import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  FileText,
  Tag,
  Search,
  X,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import { getExamBadgeStyle } from "../../utils/examTagUtils";
import { cacheService } from "../../services/cacheService";

export default function AdminMockExamManager() {
  const [exams, setExams] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [allMcqs, setAllMcqs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);

  // Form State
  const [title, setTitle] = useState("");
  const [paper, setPaper] = useState(1);
  const [chapterId, setChapterId] = useState("");
  const [category, setCategory] = useState("board"); // board | buet | medical | varsity | chapter
  const [tag, setTag] = useState("ঢাকা বোর্ড '২৪");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [xpReward, setXpReward] = useState(150);
  const [isPublished, setIsPublished] = useState(true);

  // Question Picker State
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [qSearch, setQSearch] = useState("");

  // Admin List Filter & Search
  const [adminFilter, setAdminFilter] = useState("all"); // all | published | draft
  const [adminSearch, setAdminSearch] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setPermissionError(false);
    try {
      // 1. Fetch Mock Exams
      const eSnap = await getDocs(collection(db, "mockExams"));
      const eList = eSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExams(eList);

      // 2. Fetch Chapters
      const cSnap = await getDocs(collection(db, "chapters"));
      const cList = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cList.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
      setChapters(cList);

      // 3. Fetch MCQs
      const qSnap = await getDocs(collection(db, "questions"));
      const qList = qSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((q) => (q.type || "MCQ") === "MCQ" && Array.isArray(q.options));
      setAllMcqs(qList);
    } catch (err) {
      console.error("Error loading admin mock exams:", err);
      if (err?.code === "permission-denied" || String(err?.message || "").includes("permission")) {
        setPermissionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingExamId(null);
    setTitle("");
    setPaper(1);
    setChapterId("");
    setCategory("board");
    setTag("ঢাকা বোর্ড '২৪");
    setDurationMinutes(15);
    setNegativeMarking(0.25);
    setXpReward(150);
    setIsPublished(true);
    setSelectedQuestionIds([]);
    setQSearch("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExamId(exam.id);
    setTitle(exam.title || "");
    setPaper(Number(exam.paper) || 1);
    setChapterId(exam.chapterId || "");
    setCategory(exam.category || "board");
    setTag(exam.tag || "মক টেস্ট");
    setDurationMinutes(Number(exam.durationMinutes) || 15);
    setNegativeMarking(Number(exam.negativeMarking) || 0.25);
    setXpReward(Number(exam.xpReward) || 150);
    setIsPublished(exam.published !== false);

    const ids = Array.isArray(exam.questions)
      ? exam.questions.map((q) => q.id).filter(Boolean)
      : [];
    setSelectedQuestionIds(ids);
    setIsModalOpen(true);
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই মক টেস্টটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "mockExams", examId));
      setExams((prev) => prev.filter((e) => e.id !== examId));
      cacheService.remove("chemchamp_published_mock_exams");
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  const handleTogglePublish = async (exam) => {
    try {
      const nextPublished = !exam.published;
      await setDoc(
        doc(db, "mockExams", exam.id),
        { published: nextPublished, updatedAt: serverTimestamp() },
        { merge: true }
      );
      setExams((prev) =>
        prev.map((e) => (e.id === exam.id ? { ...e, published: nextPublished } : e))
      );
      cacheService.remove("chemchamp_published_mock_exams");
    } catch (err) {
      alert("আপডেট ব্যর্থ: " + err.message);
    }
  };

  const handleToggleQuestionSelect = (qId) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAllFilteredQuestions = (filteredIds) => {
    const combined = Array.from(new Set([...selectedQuestionIds, ...filteredIds]));
    setSelectedQuestionIds(combined);
  };

  const handleSelectRandom = (count) => {
    const pool = modalFilteredMcqs.map((q) => q.id);
    if (pool.length === 0) {
      alert("বর্তমান ফিল্টারে কোনো প্রশ্ন নেই।");
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(count, pool.length));
    setSelectedQuestionIds(chosen);
  };

  const handleDeselectAll = () => {
    setSelectedQuestionIds([]);
  };

  // ১-ক্লিক ৩টি অফিশিয়াল স্ট্যান্ডার্ড টেস্ট অটো-জেনারেটর
  const handleSeedStandardExams = async () => {
    if (allMcqs.length === 0) {
      alert("ডাটাবেজে কোনো MCQ প্রশ্ন পাওয়া যায়নি। প্রথমে প্রশ্ন ব্যাংকে প্রশ্ন আপলোড করুন।");
      return;
    }

    if (!window.confirm("আপনি কি ৩টি স্ট্যান্ডার্ড অফিশিয়াল মক টেস্ট (বুয়েট, মেডিকেল ও বোর্ড) স্বয়ংক্রিয়ভাবে তৈরি ও প্রকাশ করতে চান?")) {
      return;
    }

    setSeeding(true);
    try {
      const presets = [
        {
          id: `official_buet_${Date.now()}`,
          title: "বুয়েট ও ইঞ্জিনিয়ারিং স্পেশাল প্রিলিমিনারি মক-১",
          paper: 1,
          chapterId: "all",
          chapterTitle: "রসায়ন ১ম পত্র সম্মিলিত",
          category: "buet",
          tag: "বুয়েট প্রিলি",
          durationMinutes: 15,
          negativeMarking: 0.25,
          xpReward: 200,
          count: 15,
        },
        {
          id: `official_medical_${Date.now() + 1}`,
          title: "মেডিকেল ও ডেন্টাল স্পেশাল স্পিড ড্রিল-১",
          paper: 1,
          chapterId: "all",
          chapterTitle: "রসায়ন ১ম পত্র সম্মিলিত",
          category: "medical",
          tag: "মেডিকেল ভর্তি",
          durationMinutes: 15,
          negativeMarking: 0.25,
          xpReward: 200,
          count: 20,
        },
        {
          id: `official_board_${Date.now() + 2}`,
          title: "এইচএসসি রসায়ন ১ম পত্র বোর্ড স্ট্যান্ডার্ড মডেল টেস্ট-১",
          paper: 1,
          chapterId: "all",
          chapterTitle: "রসায়ন ১ম পত্র সম্মিলিত",
          category: "board",
          tag: "ঢাকা বোর্ড '২৪",
          durationMinutes: 25,
          negativeMarking: 0.25,
          xpReward: 250,
          count: 25,
        },
      ];

      for (const preset of presets) {
        let pool = allMcqs;
        if (preset.category === "buet") {
          const buetPool = allMcqs.filter((q) => {
            const t = (q.tag || "").toLowerCase();
            return t.includes("buet") || t.includes("ckruet") || t.includes("ইঞ্জি");
          });
          if (buetPool.length >= 10) pool = buetPool;
        } else if (preset.category === "medical") {
          const medPool = allMcqs.filter((q) => {
            const t = (q.tag || "").toLowerCase();
            return t.includes("মেডিকেল") || t.includes("mat") || t.includes("med");
          });
          if (medPool.length >= 10) pool = medPool;
        }

        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(preset.count, pool.length));

        const selectedQuestions = selected.map((q) => ({
          id: q.id,
          stem: q.stem,
          options: q.options,
          answerIndex: q.answerIndex ?? 0,
          explanation: q.explanation || "",
          tag: q.tag || preset.tag,
          imageUrl: q.imageUrl || "",
        }));

        const payload = {
          id: preset.id,
          title: preset.title,
          paper: preset.paper,
          chapterId: preset.chapterId,
          chapterTitle: preset.chapterTitle,
          category: preset.category,
          tag: preset.tag,
          durationMinutes: preset.durationMinutes,
          negativeMarking: preset.negativeMarking,
          xpReward: preset.xpReward,
          published: true,
          questions: selectedQuestions,
          questionsCount: selectedQuestions.length,
          duration: `${preset.durationMinutes} মিনিট`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "mockExams", preset.id), payload, { merge: true });
      }

      cacheService.remove("chemchamp_published_mock_exams");
      await fetchData();
      alert("৩টি স্ট্যান্ডার্ড মক টেস্ট সফলভাবে তৈরি ও প্রকাশিত হয়েছে! 🎉");
    } catch (err) {
      console.error("Seed mock exams error:", err);
      alert("মক টেস্ট তৈরিতে সমস্যা হয়েছে: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("দয়া করে মক টেস্টের শিরোনাম দিন।");
      return;
    }
    if (selectedQuestionIds.length === 0) {
      alert("দয়া করে কমপক্ষে ১টি প্রশ্ন নির্বাচন করুন।");
      return;
    }

    // Map selected IDs to actual question objects
    const selectedQuestions = allMcqs
      .filter((q) => selectedQuestionIds.includes(q.id))
      .map((q) => ({
        id: q.id,
        stem: q.stem,
        options: q.options,
        answerIndex: q.answerIndex ?? 0,
        explanation: q.explanation || "",
        tag: q.tag || tag,
        imageUrl: q.imageUrl || "",
      }));

    const chapterObj = chapters.find((c) => c.id === chapterId);

    const examId = editingExamId || `mock_${Date.now()}`;
    const payload = {
      id: examId,
      title: title.trim(),
      paper: Number(paper),
      chapterId: chapterId || "all",
      chapterTitle: chapterObj ? chapterObj.title : "সকল অধ্যায়",
      category,
      tag: tag.trim() || "মক টেস্ট",
      durationMinutes: Number(durationMinutes),
      negativeMarking: Number(negativeMarking),
      xpReward: Number(xpReward),
      published: isPublished,
      questions: selectedQuestions,
      questionsCount: selectedQuestions.length,
      duration: `${durationMinutes} মিনিট`,
      updatedAt: serverTimestamp(),
      ...(editingExamId ? {} : { createdAt: serverTimestamp() }),
    };

    try {
      await setDoc(doc(db, "mockExams", examId), payload, { merge: true });
      cacheService.remove("chemchamp_published_mock_exams");
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert("সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  // Filter available MCQs in modal
  const modalFilteredMcqs = allMcqs.filter((q) => {
    if (chapterId && q.chapterId && q.chapterId !== chapterId) return false;
    if (paper && q.paper && Number(q.paper) !== Number(paper)) return false;
    if (qSearch.trim()) {
      const s = qSearch.toLowerCase();
      return (
        String(q.stem || "").toLowerCase().includes(s) ||
        String(q.tag || "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Filter displayed exams in Admin View
  const displayedExams = exams.filter((ex) => {
    if (adminFilter === "published" && ex.published === false) return false;
    if (adminFilter === "draft" && ex.published !== false) return false;
    if (adminSearch.trim()) {
      const s = adminSearch.toLowerCase();
      const inTitle = String(ex.title || "").toLowerCase().includes(s);
      const inTag = String(ex.tag || "").toLowerCase().includes(s);
      const inChap = String(ex.chapterTitle || "").toLowerCase().includes(s);
      if (!inTitle && !inTag && !inChap) return false;
    }
    return true;
  });

  const publishedCount = exams.filter((e) => e.published !== false).length;
  const draftCount = exams.filter((e) => e.published === false).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>মক ও মডেল টেস্ট ম্যানেজার</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {exams.length}টি টেস্ট
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              শিক্ষার্থীদের জন্য অফিসিয়াল মক টেস্ট তৈরি, শিডিউল ও লাইভ প্রকাশ করুন
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Seed Button */}
          <button
            type="button"
            onClick={handleSeedStandardExams}
            disabled={seeding || allMcqs.length === 0}
            className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে বুয়েট, মেডিকেল ও বোর্ড টেস্ট তৈরি করুন"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{seeding ? "জেনারেট হচ্ছে..." : "⚡ ৩টি স্যাম্পল টেস্ট বানান"}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন মক টেস্ট তৈরি করুন 🚀</span>
          </button>
        </div>
      </div>

      {/* Firebase Permission Error Banner */}
      {permissionError && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs space-y-1.5 shadow-lg">
          <div className="font-bold flex items-center gap-2 text-amber-300 text-sm">
            <span>⚠️ Firebase Firestore পারমিশন রুলস আপডেট প্রয়োজন</span>
          </div>
          <p className="text-amber-200/90 leading-relaxed">
            আপনার Firebase Console-এ <code>mockExams</code> কালেকশনের রিড/রাইট অনুমতি সক্রিয় নেই (FirebaseError: Missing or insufficient permissions)।
            দয়া করে Firebase Console ➔ <strong>Firestore Database</strong> ➔ <strong>Rules</strong> ট্যাবে গিয়ে <code>chemchamp/firebase.rules</code> ফাইলের রুলস পেস্ট করে <strong>Publish</strong> করুন।
          </p>
        </div>
      )}

      {/* Admin Controls & Filter Bar */}
      {exams.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="text-slate-500 text-[11px] mr-1">ফিল্টার:</span>
            {[
              { id: "all", label: `সকল (${exams.length})` },
              { id: "published", label: `প্রকাশিত (${publishedCount})` },
              { id: "draft", label: `ড্রাফট (${draftCount})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAdminFilter(f.id)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  adminFilter === f.id
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 left-2.5" />
            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="টেস্ট বা ট্যাগ খুঁজুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      )}

      {/* Mock Exams List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
          <span>মক টেস্ট লোড হচ্ছে...</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">এখনো কোনো মক টেস্ট তৈরি করা হয়নি</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              আপনি নিজে নতুন টেস্ট তৈরি করতে পারেন অথবা এক ক্লিকেই বুয়েট, মেডিকেল ও বোর্ড স্পেশাল ৩টি মডেল টেস্ট অটো-জেনারেট করতে পারেন!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSeedStandardExams}
              disabled={seeding || allMcqs.length === 0}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{seeding ? "জেনারেট হচ্ছে..." : "⚡ ৩টি স্যাম্পল টেস্ট অটো-জেনারেট করুন"}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>কাস্টম টেস্ট বানান</span>
            </button>
          </div>
        </div>
      ) : displayedExams.length === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          এই ফিল্টার বা সার্চে কোনো টেস্ট খুঁজে পাওয়া যায়নি।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedExams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border truncate ${getExamBadgeStyle(
                      exam.tag
                    )}`}
                  >
                    {exam.tag || "মক টেস্ট"}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      exam.published !== false
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {exam.published !== false ? "প্রকাশিত ✓" : "ড্রাফট"}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 leading-snug">
                  {exam.title}
                </h3>
                <p className="text-[11px] text-slate-400 mb-3 truncate">
                  📚 {exam.chapterTitle || "সকল অধ্যায়"} ({exam.paper === 2 ? "২য় পত্র" : "১ম পত্র"})
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-2.5 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    {exam.durationMinutes || 15} মিনিট
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    {exam.questionsCount || exam.questions?.length || 0}টি প্রশ্ন
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(exam)}
                  className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                    exam.published !== false
                      ? "text-slate-400 hover:text-amber-400"
                      : "text-emerald-400 hover:text-emerald-300"
                  }`}
                >
                  {exam.published !== false ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>ড্রাফট করুন</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>প্রকাশ করুন</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(exam)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exam.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>{editingExamId ? "মক টেস্ট সম্পাদনা" : "নতুন মক টেস্ট তৈরি"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="flex-1 overflow-y-auto space-y-4 pt-4 pr-1 text-xs">
              {/* ১. টেস্ট শিরোনাম */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">টেস্টের নাম *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: গুণগত রসায়ন ফুল চ্যাপ্টার মক টেস্ট"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* ২. পত্র ও অধ্যায় */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">পত্র</label>
                  <select
                    value={paper}
                    onChange={(e) => setPaper(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>রসায়ন ১ম পত্র</option>
                    <option value={2}>রসায়ন ২য় পত্র</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">অধ্যায়</label>
                  <select
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">📚 সকল অধ্যায় সম্মিলিত</option>
                    {chapters
                      .filter((c) => Number(c.paper) === Number(paper))
                      .map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* ৩. ক্যাটাগরি, ট্যাগ ও সময় */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="board">বোর্ড স্ট্যান্ডার্ড</option>
                    <option value="buet">বুয়েট ও ইঞ্জিনিয়ারিং</option>
                    <option value="medical">মেডিকেল ভর্তি পরীক্ষা</option>
                    <option value="varsity">বিশ্ববিদ্যালয় (ঢাবি/GST)</option>
                    <option value="chapter">অধ্যায়ভিত্তিক</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">ট্যাগ</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="যেমন: ঢাকা বোর্ড '২৪"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">সময় (মিনিট)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* ৪. প্রশ্ন নির্বাচনের সেকশন */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      প্রশ্ন নির্বাচন করুন ({selectedQuestionIds.length}টি নির্বাচিত)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-bold mr-1">র‍্যান্ডম:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectRandom(10)}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/20 transition-colors"
                      title="র‍্যান্ডম ১০টি প্রশ্ন নির্বাচন করুন"
                    >
                      🎲 ১০টি
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRandom(15)}
                      className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/20 transition-colors"
                      title="র‍্যান্ডম ১৫টি প্রশ্ন নির্বাচন করুন"
                    >
                      🎲 ১৫টি
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectRandom(25)}
                      className="px-2 py-0.5 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/20 transition-colors"
                      title="র‍্যান্ডম ২৫টি প্রশ্ন নির্বাচন করুন"
                    >
                      🎲 ২৫টি
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectAllFilteredQuestions(modalFilteredMcqs.map((q) => q.id))
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-bold transition-colors ml-1"
                    >
                      সব সিলেক্ট
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-bold transition-colors"
                    >
                      রিসেট
                    </button>
                  </div>
                </div>

                {/* সার্চ */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 left-2.5" />
                  <input
                    type="text"
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                    placeholder="প্রশ্ন বা ট্যাগ খুঁজুন..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* প্রশ্ন তালিকা */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                  {modalFilteredMcqs.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      নির্বাচিত ফিল্টারে প্রশ্ন পাওয়া যায়নি। প্রশ্ন ব্যাংকে MCQ যোগ করুন।
                    </div>
                  ) : (
                    modalFilteredMcqs.map((q) => {
                      const isSelected = selectedQuestionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-teal-500/10 border border-teal-500/30"
                              : "hover:bg-slate-900"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleQuestionSelect(q.id)}
                            className="mt-0.5 rounded border-slate-700 text-teal-500 focus:ring-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-slate-200 line-clamp-2">
                              <KaTeXMath math={q.stem} />
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span>{q.chapterTitle || "সাধারণ"}</span>
                              {q.tag && (
                                <span className="text-amber-400 font-mono">[{q.tag}]</span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* পাবলিশ টগল */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="font-bold">সরাসরি শিক্ষার্থীদের জন্য প্রকাশ করুন (Published)</span>
              </label>

              {/* সাবমিট বাটন */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
                >
                  {editingExamId ? "মক টেস্ট আপডেট করুন" : "মক টেস্ট সংরক্ষণ করুন 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

