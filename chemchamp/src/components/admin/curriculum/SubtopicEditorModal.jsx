import React, { useState } from "react";
import {
  FileText,
  Video,
  Code,
  Eye,
  Save,
  X,
  Image as ImageIcon,
  CheckCircle2,
  BookMarked,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Tag,
} from "lucide-react";
import ChemistryMarkdownViewer from "../../common/ChemistryMarkdownViewer";
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

export default function SubtopicEditorModal({
  isOpen,
  data,
  chapterTitle,
  topicTitle,
  onClose,
  onSave,
}) {
  if (!isOpen) return null;

  // Controlled State
  const [title, setTitle] = useState(data?.title || "");
  const [videoUrl, setVideoUrl] = useState(data?.videoUrl || "");
  const [sequenceOrder, setSequenceOrder] = useState(data?.sequenceOrder || 1);
  const [markdown, setMarkdown] = useState(
    data?.notesMarkdown ||
      `## মূল শিখনফল\nএখানে আপনার লেকচার নোট লিখুন...\n\n$$\nmvr = \\frac{nh}{2\\pi}\n$$\n`
  );
  const [editorTab, setEditorTab] = useState("write"); // write | highlights | preview

  // Subtopic-level Exam Tags
  const [subtopicExamTags, setSubtopicExamTags] = useState(() => {
    return Array.isArray(data?.examTags) ? data.examTags : [];
  });
  const [customSubtopicTagInput, setCustomSubtopicTagInput] = useState("");

  // Subtopic-wise Textbook Highlights State
  const [highlights, setHighlights] = useState(() => {
    return Array.isArray(data?.bookHighlights) ? data.bookHighlights : [];
  });
  const [selectedPreset, setSelectedPreset] = useState(WRITER_PRESETS[0]);
  const [customBookName, setCustomBookName] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const [highlightExamTags, setHighlightExamTags] = useState([]);
  const [customHighlightTagInput, setCustomHighlightTagInput] = useState("");
  const [editingHighlightIndex, setEditingHighlightIndex] = useState(null);

  const resetHighlightForm = () => {
    setSelectedPreset(WRITER_PRESETS[0]);
    setCustomBookName("");
    setPageNumber("");
    setHighlightText("");
    setHighlightExamTags([]);
    setCustomHighlightTagInput("");
    setEditingHighlightIndex(null);
  };

  const getEffectiveBookName = () => {
    if (selectedPreset === "অন্যান্য (কাস্টম লেখক/বই)") {
      return customBookName.trim() || "অন্যান্য পাঠ্যবই";
    }
    return selectedPreset;
  };

  const handleToggleSubtopicTag = (tag) => {
    if (subtopicExamTags.includes(tag)) {
      setSubtopicExamTags(subtopicExamTags.filter((t) => t !== tag));
    } else {
      setSubtopicExamTags([...subtopicExamTags, tag]);
    }
  };

  const handleAddCustomSubtopicTag = () => {
    const trimmed = customSubtopicTagInput.trim();
    if (trimmed && !subtopicExamTags.includes(trimmed)) {
      setSubtopicExamTags([...subtopicExamTags, trimmed]);
      setCustomSubtopicTagInput("");
    }
  };

  const handleToggleHighlightTag = (tag) => {
    if (highlightExamTags.includes(tag)) {
      setHighlightExamTags(highlightExamTags.filter((t) => t !== tag));
    } else {
      setHighlightExamTags([...highlightExamTags, tag]);
    }
  };

  const handleAddCustomHighlightTag = () => {
    const trimmed = customHighlightTagInput.trim();
    if (trimmed && !highlightExamTags.includes(trimmed)) {
      setHighlightExamTags([...highlightExamTags, trimmed]);
      setCustomHighlightTagInput("");
    }
  };

  const handleAddOrUpdateHighlight = (e) => {
    e.preventDefault();
    const finalBook = getEffectiveBookName();
    if (!finalBook) {
      alert("বই বা লেখকের নাম লিখুন।");
      return;
    }
    if (!highlightText.trim()) {
      alert("দাগানো লাইনটি লিখুন।");
      return;
    }

    const newItem = {
      bookName: finalBook,
      pageNumber: pageNumber.trim() || "গুরুত্বপূর্ণ লাইন",
      text: highlightText.trim(),
      examTags: highlightExamTags,
    };

    if (editingHighlightIndex !== null) {
      const updated = [...highlights];
      updated[editingHighlightIndex] = newItem;
      setHighlights(updated);
    } else {
      setHighlights((prev) => [...prev, newItem]);
    }

    resetHighlightForm();
  };

  const handleEditHighlight = (idx) => {
    const item = highlights[idx];
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
    setHighlightExamTags(Array.isArray(item.examTags) ? item.examTags : []);
    setEditingHighlightIndex(idx);
    setEditorTab("highlights");
  };

  const handleDeleteHighlight = (idx) => {
    if (window.confirm("আপনি কি এই দাগানো লাইনটি মুছে ফেলতে চান?")) {
      setHighlights((prev) => prev.filter((_, i) => i !== idx));
      if (editingHighlightIndex === idx) {
        resetHighlightForm();
      }
    }
  };

  const handleMoveHighlight = (idx, direction) => {
    const target = idx + direction;
    if (target < 0 || target >= highlights.length) return;
    const updated = [...highlights];
    const temp = updated[idx];
    updated[idx] = updated[target];
    updated[target] = temp;
    setHighlights(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("দয়া করে সাব-টপিকের নাম লিখুন।");
      return;
    }
    onSave({
      id: data?.id,
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      sequenceOrder: Number(sequenceOrder) || 1,
      notesMarkdown: markdown,
      examTags: subtopicExamTags,
      bookHighlights: highlights,
    });
  };

  const insertSnippet = (snippet) => {
    const textarea = document.getElementById("lectureMarkdownArea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = markdown.substring(0, start) + snippet + markdown.substring(end);
    setMarkdown(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[94vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* মডাল হেডার */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {data ? "সাব-টপিক ও লেকচার নোট এডিটর" : "নতুন সাব-টপিক ও লেকচার নোট"}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono block truncate">
                {chapterTitle} ➔ {topicTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* ৩টি ট্যাব সুইচ: মার্কডাউন কোড | বইয়ের দাগানো লাইন | স্টুডেন্ট প্রিভিউ */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setEditorTab("write")}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  editorTab === "write"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>মার্কডাউন নোট</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab("highlights")}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  editorTab === "highlights"
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "text-amber-400/80 hover:text-amber-300"
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>দাগানো লাইন ({highlights.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setEditorTab("preview")}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  editorTab === "preview"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>স্টুডেন্ট প্রিভিউ 👁️</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ফর্ম বডি */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* ইনপুট সেকশন: সাব-টপিক শিরোনাম, সিকোয়েন্স, ভিডিও লিংক ও সাব-টপিক এক্সাম ব্যাজ */}
          <div className="p-3.5 sm:p-4 bg-slate-950/50 border-b border-slate-800 space-y-3 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              {/* সাব-টপিকের নাম */}
              <div className="sm:col-span-9">
                <label className="text-slate-300 block mb-1 font-semibold">
                  সাব-টপিকের নাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: রাদারফোর্ড পরমাণু মডেল ও সীমাবদ্ধতা"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* ক্রম নম্বর */}
              <div className="sm:col-span-3">
                <label className="text-slate-300 block mb-1 font-semibold">
                  ক্রম নম্বর (Sequence)
                </label>
                <input
                  type="number"
                  required
                  value={sequenceOrder}
                  onChange={(e) => setSequenceOrder(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* ডেডিকেটেড ইউটিউব ভিডিও লিংক ও সাব-টপিক পরীক্ষার বছর ব্যাজ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-500" />
                    <span>ইউটিউব লেকচার ভিডিও লিংক</span>
                    <span className="text-[10px] text-slate-500 font-normal">(ঐচ্ছিক)</span>
                  </label>
                  {videoUrl && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> লিংক সংযুক্ত
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=xxxxxx"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-rose-300 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono text-xs"
                />
              </div>

              {/* সাব-টপিক লেভেল এক্সাম ইয়ার ব্যাজ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>এই সাব-টপিকের বোর্ড/ভর্তি পরীক্ষার বছর ব্যাজ</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {subtopicExamTags.length}টি ব্যাজ
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customSubtopicTagInput}
                    onChange={(e) => setCustomSubtopicTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSubtopicTag();
                      }
                    }}
                    placeholder="ট্যাগ লিখুন (BUET '22, ঢা.বো. '২৩)..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubtopicTag}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0 hover:bg-amber-500/30"
                  >
                    + যোগ
                  </button>
                </div>

                {/* সাব-টপিক সিলেক্টেড ব্যাজ চিপস */}
                {subtopicExamTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {subtopicExamTags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded-full border flex items-center gap-1 ${getExamBadgeStyle(
                          tag
                        )}`}
                      >
                        <span>★ {tag}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSubtopicExamTags(subtopicExamTags.filter((_, i) => i !== tIdx))
                          }
                          className="hover:text-white ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ট্যাব ১: মার্কডাউন কুইক টুলবার ও টেক্সট এরিয়া */}
          {editorTab === "write" && (
            <>
              <div className="px-3.5 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] shrink-0">
                <span className="text-slate-500 font-mono font-bold mr-1">টুলস:</span>
                <button
                  type="button"
                  onClick={() => insertSnippet("\n## হেডিং ২\n")}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 text-slate-300"
                >
                  H2 হেডিং
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("**বোল্ড টেক্সট**")}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 text-slate-300 font-bold"
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet(" $E = h\\nu$ ")}
                  className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono rounded-lg"
                >
                  $ইনলাইন সমীকরণ$
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet("\n$$\nmvr = \\frac{nh}{2\\pi}\n$$\n")
                  }
                  className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono rounded-lg"
                >
                  $$সমীকরণ ব্লক$$
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertSnippet("\n![উদ্দীপক চিত্র](https://i.ibb.co/আপনার_ছবি_লিংক.png)\n")
                  }
                  className="px-2.5 py-1 bg-teal-950/40 border border-teal-500/30 text-teal-300 font-mono rounded-lg flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>ImgBB ছবি যোগ</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-slate-950/30">
                <textarea
                  id="lectureMarkdownArea"
                  required
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="এখানে সাব-টপিকের বিস্তারিত লেকচার নোট লিখুন..."
                />
              </div>
            </>
          )}

          {/* ট্যাব ২: সাব-টপিক ওয়াইজ বইয়ের দাগানো লাইন (Textbook Highlights Manager with Exam Badges) */}
          {editorTab === "highlights" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/30">
              {/* বাম পাশ: ফর্ম */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {editingHighlightIndex !== null
                          ? `দাগানো লাইন #${editingHighlightIndex + 1} এডিট করা হচ্ছে`
                          : "এই সাব-টপিকে বইয়ের দাগানো লাইন ও এক্সাম ব্যাজ যোগ করুন"}
                      </span>
                    </span>

                    {editingHighlightIndex !== null && (
                      <button
                        type="button"
                        onClick={resetHighlightForm}
                        className="text-[11px] text-slate-400 hover:text-rose-400"
                      >
                        এডিট বাতিল ✕
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
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
                          value={customBookName}
                          onChange={(e) => setCustomBookName(e.target.value)}
                          placeholder="লেখকের নাম লিখুন (যেমন: আহসানুল কবির স্যার)"
                          className="mt-2 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        পৃষ্ঠা নম্বর / অনুচ্ছেদ (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={pageNumber}
                        onChange={(e) => setPageNumber(e.target.value)}
                        placeholder="যেমন: পৃষ্ঠা ১০৮ ও ১২১ অথবা অনুচ্ছেদ ২.৩"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* এই লাইনের বোর্ড ও ভর্তি পরীক্ষার প্রিভিয়াস ইয়ার ব্যাজ */}
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-teal-300 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-teal-400" />
                          <span>এই লাইনের পরীক্ষার বছর ব্যাজ (Exam Badges)</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {highlightExamTags.length}টি ব্যাজ
                        </span>
                      </div>

                      {/* নির্বাচিত ব্যাজসমূহ */}
                      {highlightExamTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          {highlightExamTags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getExamBadgeStyle(
                                tag
                              )}`}
                            >
                              <span>★ {tag}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setHighlightExamTags(
                                    highlightExamTags.filter((_, i) => i !== tIdx)
                                  )
                                }
                                className="hover:text-white ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* প্রিসেট বাটনসমূহ */}
                      <div className="flex flex-wrap items-center gap-1">
                        {POPULAR_EXAM_TAGS.map((tag) => {
                          const isSelected = highlightExamTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleToggleHighlightTag(tag)}
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
                          value={customHighlightTagInput}
                          onChange={(e) => setCustomHighlightTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomHighlightTag();
                            }
                          }}
                          placeholder="কাস্টম ট্যাগ (যেমন: DU '20, কু.বো. '২১)..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomHighlightTag}
                          className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-bold text-xs shrink-0"
                        >
                          + যোগ
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          বইয়ের গুরুত্বপূর্ণ লাইন <span className="text-rose-400">*</span>
                        </label>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setHighlightText((prev) => prev + " $n^2$ ")}
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300 font-mono"
                          >
                            $গণিত$
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={4}
                        value={highlightText}
                        onChange={(e) => setHighlightText(e.target.value)}
                        placeholder="বইয়ের যে লাইনটি মেডিকেল/ভার্সিটি/বোর্ড পরীক্ষার জন্য গুরুত্বপূর্ণ তা হুবহু লিখুন..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                      />
                    </div>

                    {highlightText.trim() && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between text-[10px] gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-amber-300">
                              📚 {getEffectiveBookName()}
                            </span>
                            {highlightExamTags.map((tag, tIdx) => (
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
                      type="button"
                      onClick={handleAddOrUpdateHighlight}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {editingHighlightIndex !== null
                          ? "লাইনটি আপডেট করুন ✓"
                          : "এই সাব-টপিকে যোগ করুন ➔"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ডান পাশ: বর্তমানে যুক্ত করা লাইনসমূহ */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                    <span>এই সাব-টপিকের দাগানো লাইনসমূহ ({highlights.length}টি):</span>
                  </span>
                </div>

                {highlights.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-xs text-slate-500 space-y-2 bg-slate-900/30">
                    <BookMarked className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-bold text-slate-400">এই সাব-টপিকে কোনো দাগানো লাইন নেই</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      বামপাশের ফর্ম পূরণ করে বিভিন্ন বইয়ের গুরুত্বপূর্ণ লাইন ও পরীক্ষার বছর ট্যাগ যুক্ত করুন।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {highlights.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all space-y-2 ${
                          editingHighlightIndex === idx
                            ? "bg-amber-500/10 border-amber-500/60 shadow-lg"
                            : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
                        }`}
                      >
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

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveHighlight(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                              title="উপরে নিন"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveHighlight(idx, 1)}
                              disabled={idx === highlights.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                              title="নিচে নিন"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditHighlight(idx)}
                              className="p-1 text-slate-400 hover:text-teal-300"
                              title="এডিট"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHighlight(idx)}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* পরীক্ষার বছর ব্যাজসমূহ */}
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

                        <div className="text-xs text-slate-200 leading-relaxed pl-7 border-l-2 border-amber-400/40">
                          <KaTeXMath math={item.text} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ট্যাব ৩: স্টুডেন্ট প্রিভিউ (মার্কডাউন নোট এবং ঠিক নিচে টেক্সটবুক হাইলাইটস + এক্সাম ব্যাজ) */}
          {editorTab === "preview" && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 bg-slate-950/30">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 inline-block">
                    স্টুডেন্ট ভিউ প্রিভিউ (লেকচার নোট ➔ দাগানো লাইন)
                  </span>

                  {subtopicExamTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {subtopicExamTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm ${getExamBadgeStyle(
                            tag
                          )}`}
                        >
                          ★ {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* লেকচার নোট মার্কডাউন */}
                <div className="max-w-none">
                  <ChemistryMarkdownViewer content={markdown} />
                </div>

                {/* লেকচার নোটের ঠিক নিচে সাব-টপিকের বইয়ের দাগানো লাইনসমূহ */}
                {highlights.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <BookMarked className="w-4 h-4 text-amber-400 shrink-0" />
                      <h4 className="text-sm font-bold text-white">
                        মূল বইয়ের দাগানো লাইন (Textbook Highlights — {highlights.length}টি)
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {highlights.map((item, idx) => (
                        <blockquote
                          key={idx}
                          className="border-l-4 border-amber-400 bg-amber-500/[0.06] pl-4 pr-4 py-3 rounded-r-xl space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-amber-300">📚 {item.bookName}</span>
                              {Array.isArray(item.examTags) && item.examTags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
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
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">{item.pageNumber}</span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                            <KaTeXMath math={item.text} />
                          </div>
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ফুটার অ্যাকশন */}
          <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                দাগানো লাইন: <strong>{highlights.length}টি</strong>
                {subtopicExamTags.length > 0 && (
                  <> | এক্সাম ব্যাজ: <strong>{subtopicExamTags.length}টি</strong></>
                )}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>সাব-টপিক ও নোট সংরক্ষণ করুন 🚀</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
