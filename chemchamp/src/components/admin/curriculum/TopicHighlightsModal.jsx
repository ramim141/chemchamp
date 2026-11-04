import React, { useState, useEffect } from "react";
import {
  X,
  BookMarked,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Tag,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";
import { POPULAR_EXAM_TAGS, getExamBadgeStyle } from "../../../utils/examTagUtils";

const WRITER_PRESETS = [
  "হাজারী ও নাগ স্যার",
  "সঞ্জিত কুমার গুহ স্যার",
  "ড. মহসিন স্যার",
  "ড. সরোজ কান্তি সিংহ হাজারী",
  "কবীর ও লিংকন স্যার",
  "স্বপন কুমার মন্ডল স্যার",
  "অন্যান্য (কাস্টম লেখক/বই)",
];

export default function TopicHighlightsModal({
  isOpen,
  subtopic = null,
  topic = null,
  chapterTitle = "",
  topicTitle = "",
  onClose,
  onSave,
}) {
  const targetItem = subtopic || topic;
  if (!isOpen || !targetItem) return null;

  const [highlights, setHighlights] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(WRITER_PRESETS[0]);
  const [customBookName, setCustomBookName] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const [selectedExamTags, setSelectedExamTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [saving, setSaving] = useState(false);

  // টার্গেট ওপেন হলে বর্তমান হাইলাইটস লোড করা
  useEffect(() => {
    if (targetItem) {
      const existing = Array.isArray(targetItem.bookHighlights)
        ? targetItem.bookHighlights
        : Array.isArray(targetItem.textbookHighlights)
        ? targetItem.textbookHighlights
        : [];
      setHighlights(
        existing.map((item) => ({
          bookName: item.bookName || item.book || "হাজারী ও নাগ স্যার",
          text: item.text || item.note || "",
          pageNumber: item.pageNumber || "",
          examTags: Array.isArray(item.examTags) ? item.examTags : [],
        }))
      );
      resetForm();
    }
  }, [targetItem]);

  const resetForm = () => {
    setSelectedPreset(WRITER_PRESETS[0]);
    setCustomBookName("");
    setPageNumber("");
    setHighlightText("");
    setSelectedExamTags([]);
    setCustomTagInput("");
    setEditingIndex(null);
  };

  const getEffectiveBookName = () => {
    if (selectedPreset === "অন্যান্য (কাস্টম লেখক/বই)") {
      return customBookName.trim() || "অন্যান্য পাঠ্যবই";
    }
    return selectedPreset;
  };

  const handleToggleExamTag = (tag) => {
    if (selectedExamTags.includes(tag)) {
      setSelectedExamTags(selectedExamTags.filter((t) => t !== tag));
    } else {
      setSelectedExamTags([...selectedExamTags, tag]);
    }
  };

  const handleAddCustomExamTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedExamTags.includes(trimmed)) {
      setSelectedExamTags([...selectedExamTags, trimmed]);
      setCustomTagInput("");
    }
  };

  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    const finalBook = getEffectiveBookName();
    if (!finalBook) {
      alert("দয়া করে বই বা লেখকের নাম নির্বাচন করুন।");
      return;
    }
    if (!highlightText.trim()) {
      alert("বইয়ের গুরুত্বপূর্ণ লাইনটি লিখুন।");
      return;
    }

    const newItem = {
      bookName: finalBook,
      pageNumber: pageNumber.trim() || "গুরুত্বপূর্ণ লাইন",
      text: highlightText.trim(),
      examTags: selectedExamTags,
    };

    if (editingIndex !== null) {
      const updated = [...highlights];
      updated[editingIndex] = newItem;
      setHighlights(updated);
    } else {
      setHighlights((prev) => [...prev, newItem]);
    }

    resetForm();
  };

  const handleEditItem = (index) => {
    const item = highlights[index];
    if (!item) return;

    if (WRITER_PRESETS.includes(item.bookName)) {
      setSelectedPreset(item.bookName);
      setCustomBookName("");
    } else {
      setSelectedPreset("অন্যান্য (কাস্টম লেখক/বই)");
      setCustomBookName(item.bookName);
    }

    setPageNumber(item.pageNumber === "গুরুত্বপূর্ণ লাইন" ? "" : item.pageNumber);
    setHighlightText(item.text);
    setSelectedExamTags(Array.isArray(item.examTags) ? item.examTags : []);
    setEditingIndex(index);
  };

  const handleDeleteItem = (index) => {
    if (window.confirm("আপনি কি এই লাইনটি তালিকা থেকে মুছে ফেলতে চান?")) {
      setHighlights((prev) => prev.filter((_, idx) => idx !== index));
      if (editingIndex === index) {
        resetForm();
      }
    }
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= highlights.length) return;
    const updated = [...highlights];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setHighlights(updated);
  };

  const insertSnippet = (snippet) => {
    setHighlightText((prev) => prev + snippet);
  };

  const handleSaveToFirestore = async () => {
    setSaving(true);
    try {
      if (subtopic) {
        await onSave(subtopic.id, highlights, subtopic.topicId || topic?.id);
      } else if (topic) {
        await onSave(topic.id, highlights, topic.chapterId);
      }
      onClose();
    } catch (err) {
      console.error("Save highlights error:", err);
      alert("সংরক্ষণ ব্যর্থ: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* হেডার */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <BookMarked className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <span>
                  {subtopic
                    ? "সাব-টপিকের বইয়ের দাগানো লাইন ও পরীক্ষার ট্যাগস"
                    : "টপিকের বইয়ের দাগানো লাইন (Textbook Highlights)"}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                  {highlights.length}টি লাইন
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {chapterTitle ? `${chapterTitle} ➔ ` : ""}
                {topicTitle || topic?.title ? `${topicTitle || topic?.title} ➔ ` : ""}
                <strong className="text-amber-300">{subtopic?.title || topic?.title}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* বডি */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/30">
          {/* বাম পাশ: ফর্ম */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {editingIndex !== null
                      ? `দাগানো লাইন #${editingIndex + 1} এডিট করা হচ্ছে`
                      : "নতুন দাগানো লাইন ও এক্সাম ব্যাজ যোগ করুন"}
                  </span>
                </span>

                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    এডিট বাতিল ✕
                  </button>
                )}
              </div>

              <form onSubmit={handleAddOrUpdate} className="space-y-3 text-xs">
                {/* ১. বই/লেখক নির্বাচন */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    বই বা লেখকের নাম <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {WRITER_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  {selectedPreset === "অন্যান্য (কাস্টম লেখক/বই)" && (
                    <input
                      type="text"
                      required
                      value={customBookName}
                      onChange={(e) => setCustomBookName(e.target.value)}
                      placeholder="লেখকের নাম লিখুন (যেমন: আহসানুল কবির স্যার)"
                      className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>

                {/* ২. পৃষ্ঠা নম্বর বা রেফারেন্স */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    পৃষ্ঠা নম্বর / অনুচ্ছেদ (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    placeholder="যেমন: পৃষ্ঠা ৯৪ ও ১৫২ অথবা অনুচ্ছেদ ২.৩"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* ৩. বোর্ড ও ভর্তি পরীক্ষার প্রিভিয়াস ইয়ার ব্যাজ (Exam Year Badges) */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-teal-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-teal-400" />
                      <span>বোর্ড ও ভর্তি পরীক্ষার বছর ব্যাজ (Exam Badges)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {selectedExamTags.length}টি ব্যাজ যুক্ত
                    </span>
                  </div>

                  {/* নির্বাচিত ট্যাগসমূহ */}
                  {selectedExamTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {selectedExamTags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${getExamBadgeStyle(
                            tag
                          )}`}
                        >
                          <span>★ {tag}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedExamTags(selectedExamTags.filter((_, i) => i !== tIdx))
                            }
                            className="hover:text-white ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* জনপ্রিয় প্রিসেট ব্যাজ বাটনসমূহ */}
                  <div className="flex flex-wrap items-center gap-1">
                    {POPULAR_EXAM_TAGS.map((tag) => {
                      const isSelected = selectedExamTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleExamTag(tag)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all border ${
                            isSelected
                              ? "bg-amber-400 text-slate-950 border-amber-300 shadow-sm"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* কাস্টম ট্যাগ ইনপুট */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomExamTag();
                        }
                      }}
                      placeholder="কাস্টম ট্যাগ (যেমন: DU '20, ঢা.বো. '২১)..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomExamTag}
                      className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-bold text-xs shrink-0"
                    >
                      + যোগ
                    </button>
                  </div>
                </div>

                {/* ৪. বইয়ের দাগানো লাইন (Textarea with KaTeX support) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      বইয়ের গুরুত্বপূর্ণ লাইন <span className="text-rose-400">*</span>
                    </label>

                    {/* KaTeX Snippet Helpers */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => insertSnippet(" $n^2$ ")}
                        className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300 font-mono"
                        title="ইনলাইন KaTeX গণিত"
                      >
                        $গণিত$
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet(" $\\text{CO}_2$ ")}
                        className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300 font-mono"
                        title="সংকেত"
                      >
                        \text{}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    required
                    value={highlightText}
                    onChange={(e) => setHighlightText(e.target.value)}
                    placeholder="বইয়ের যে লাইনটি মেডিকেল/ভার্সিটি/বোর্ডের জন্য গুরুত্বপূর্ণ তা হুবহু লিখুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                  />
                </div>

                {/* লাইভ প্রিভিউ বক্স */}
                {highlightText.trim() && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between text-[10px] gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-amber-300">
                          📚 {getEffectiveBookName()}
                        </span>
                        {selectedExamTags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`font-mono font-bold px-1.5 py-0.2 rounded border ${getExamBadgeStyle(
                              tag
                            )}`}
                          >
                            ★ {tag}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono text-slate-400">
                        {pageNumber || "পৃষ্ঠা রেফারেন্স"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed">
                      <KaTeXMath math={highlightText} />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {editingIndex !== null
                      ? "লাইনটি আপডেট করুন ✓"
                      : "তালিকায় যুক্ত করুন ➔"}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* ডান পাশ: বর্তমানে যুক্ত করা লাইনসমূহের তালিকা */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                <span>যুক্ত করা দাগানো লাইনসমূহ ({highlights.length}টি):</span>
              </span>

              {highlights.length > 0 && (
                <span className="text-[10px] text-slate-500">
                  স্টুডেন্ট লেকচার নোটের ঠিক নিচে এটি প্রদর্শিত হবে
                </span>
              )}
            </div>

            {highlights.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 space-y-2 bg-slate-900/30">
                <BookMarked className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="font-bold text-slate-400">এখনো কোনো বইয়ের লাইন যুক্ত করা হয়নি</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  বামপাশের ফর্ম পূরণ করে বিভিন্ন রাইটারের গুরুত্বপূর্ণ লাইন ও পরীক্ষার বছর ট্যাগ যোগ করুন।
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                      editingIndex === idx
                        ? "bg-amber-500/10 border-amber-500/60 shadow-lg"
                        : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* কার্ড হেডার: রাইটার নাম, পৃষ্ঠা, এক্সাম ট্যাগ ও অ্যাকশন */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-amber-300 truncate">
                          📚 {item.bookName}
                        </span>
                        {item.pageNumber && (
                          <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 truncate">
                            {item.pageNumber}
                          </span>
                        )}
                      </div>

                      {/* কন্ট্রোল বাটনসমূহ */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="উপরে নিন"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 1)}
                          disabled={idx === highlights.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="নিচে নিন"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditItem(idx)}
                          className="p-1 text-slate-400 hover:text-teal-300"
                          title="এডিট করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* এক্সাম ব্যাজসমূহ */}
                    {Array.isArray(item.examTags) && item.examTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pl-7">
                        {item.examTags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getExamBadgeStyle(
                              tag
                            )}`}
                          >
                            ★ {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* কার্ড বডি: ফরম্যাটেড লাইন */}
                    <div className="text-xs text-slate-200 leading-relaxed pl-7 border-l-2 border-amber-400/40">
                      <KaTeXMath math={item.text} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ফুটার */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              মোট <strong>{highlights.length}</strong>টি লাইন সেভ করতে ডানপাশের বাটনে চাপুন
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              বন্ধ করুন
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveToFirestore}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "সংরক্ষণ হচ্ছে..." : "দাগানো লাইন সংরক্ষণ করুন 🚀"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
