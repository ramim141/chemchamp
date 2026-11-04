import React, { useState, useRef } from "react";
import {
  X,
  Save,
  Image as ImageIcon,
  HelpCircle,
  Upload,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Tag,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";
import { uploadToImgBB } from "../../../utils/imgbb";

const PRESET_TAGS = [
  "ঢাকা বোর্ড '২৪",
  "রাজশাহী বোর্ড '২৪",
  "চট্টগ্রাম বোর্ড '২৪",
  "সকল বোর্ড '২৩",
  "BUET '২৩",
  "মেডিকেল '২৪",
  "ঢাবি '২৩",
  "মডেল টেস্ট",
];

export default function SingleQuestionModal({
  isOpen,
  data,
  defaultType = "MCQ",
  chapterTitle,
  topicTitle,
  subtopicTitle,
  subtopics = [],
  onClose,
  onSave,
}) {
  if (!isOpen) return null;

  const [type, setType] = useState(data?.type || defaultType);
  const [stem, setStem] = useState(data?.stem || "");
  const [imageUrl, setImageUrl] = useState(data?.imageUrl || "");
  const [tag, setTag] = useState(data?.tag || "ঢাকা বোর্ড '২৪");
  const [subtopicId, setSubtopicId] = useState(data?.subtopicId || "");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewMath, setPreviewMath] = useState(false);

  const fileInputRef = useRef(null);

  // MCQ স্টেট
  const [options, setOptions] = useState(
    data?.options && data.options.length === 4 ? data.options : ["", "", "", ""]
  );
  const [answerIndex, setAnswerIndex] = useState(data?.answerIndex ?? 0);
  const [explanation, setExplanation] = useState(data?.explanation || "");

  // CQ (সৃজনশীল) স্টেট
  const [subQuestions, setSubQuestions] = useState(
    data?.subQuestions && data.subQuestions.length === 4
      ? data.subQuestions
      : [
          { part: "ক", question: "", answer: "", marks: 1 },
          { part: "খ", question: "", answer: "", marks: 2 },
          { part: "গ", question: "", answer: "", marks: 3 },
          { part: "ঘ", question: "", answer: "", marks: 4 },
        ]
  );

  // SQ (সংক্ষিপ্ত) স্টেট
  const [sqAnswer, setSqAnswer] = useState(data?.answer || "");
  const [sqCategory, setSqCategory] = useState(data?.subCategory || "জ্ঞানমূলক");
  const [sqMarks, setSqMarks] = useState(data?.marks || 1);

  const handleSubQCChange = (index, field, value) => {
    const updated = [...subQuestions];
    updated[index][field] = value;
    setSubQuestions(updated);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const url = await uploadToImgBB(file);
      setImageUrl(url);
    } catch (err) {
      alert("ছবি আপলোড ব্যর্থ: " + (err.message || "ইন্টারনেট কানেকশন চেক করুন"));
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!stem.trim()) {
      alert("দয়া করে মূল প্রশ্ন/উদ্দীপক লিখুন।");
      return;
    }

    const selectedSub = subtopics.find((s) => s.id === subtopicId);

    const payload = {
      id: data?.id,
      type,
      stem: stem.trim(),
      imageUrl: imageUrl.trim(),
      tag: tag.trim(),
      subtopicId: subtopicId || data?.subtopicId || "",
      subtopicTitle: selectedSub?.title || data?.subtopicTitle || "",
    };

    if (type === "MCQ") {
      for (let i = 0; i < 4; i++) {
        if (!options[i].trim()) {
          alert(`দয়া করে অপশন ${String.fromCharCode(65 + i)} পূরণ করুন।`);
          return;
        }
      }
      payload.options = options.map((o) => o.trim());
      payload.answerIndex = Number(answerIndex);
      payload.explanation = explanation.trim();
    } else if (type === "CQ") {
      payload.subQuestions = subQuestions;
    } else if (type === "SQ") {
      payload.answer = sqAnswer.trim();
      payload.subCategory = sqCategory;
      payload.marks = Number(sqMarks);
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden relative">
        {/* হেডার ও টাইপ সুইচ */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-950/70">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{data ? "প্রশ্ন এডিট করুন" : "নতুন প্রশ্ন তৈরি"}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                CRUD
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {chapterTitle || "অধ্যায়"} ➔ {topicTitle || "টপিক"}
              {subtopicTitle ? ` ➔ ${subtopicTitle}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* টাইপ নির্বাচক */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
              {["MCQ", "CQ", "SQ"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    type === t
                      ? "bg-teal-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ম্যাথ প্রিভিউ টগল */}
            <button
              type="button"
              onClick={() => setPreviewMath(!previewMath)}
              className={`p-1.5 rounded-xl border transition-all text-xs flex items-center gap-1 ${
                previewMath
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="KaTeX ম্যাথ প্রিভিউ টগল"
            >
              {previewMath ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">
                {previewMath ? "কোড" : "প্রিভিউ"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ফর্ম বডি */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* সাব-টপিক নির্বাচন (যদি টপিকে সাব-টপিক থাকে) */}
          {subtopics.length > 0 && (
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                সাব-টপিক অ্যাসাইন করুন
              </label>
              <select
                value={subtopicId}
                onChange={(e) => setSubtopicId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="">-- সাধারণ / মূল টপিক প্রশ্ন --</option>
                {subtopics.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.sequenceOrder || 1}. {sub.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* মূল উদ্দীপক / প্রশ্ন */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">
                {type === "CQ" ? "উদ্দীপক (Stimulus)" : "প্রশ্নের মূল বাক্য (Stem)"}{" "}
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {"ম্যাথ ফর্মুলা: $x^2$ বা $$\\frac{a}{b}$$"}
              </span>
            </div>

            <textarea
              required
              rows={type === "CQ" ? 3 : 2}
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder={type === "CQ" ? "উদ্দীপক লিখুন..." : "প্রশ্ন লিখুন..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-500 font-sans leading-relaxed"
            />

            {previewMath && stem && (
              <div className="mt-2 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-200 text-xs">
                <span className="text-[10px] font-bold text-purple-400 uppercase block mb-1">
                  👁️ লাইভ ম্যাথ প্রিভিউ:
                </span>
                <KaTeXMath math={stem} />
              </div>
            )}
          </div>

          {/* ছবি আপলোড ও প্রিভিউ */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                <span>উদ্দীপক / প্রশ্নের ছবি (ImgBB ইন্টিগ্রেশন)</span>
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-rose-400 hover:text-rose-300 text-[10px]"
                >
                  ছবি রিমুভ ✕
                </button>
              )}
            </label>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://i.ibb.co/xxxxxx/image.png"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-teal-300 font-mono focus:outline-none focus:border-teal-500 text-xs"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                disabled={uploadingImg}
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50"
              >
                {uploadingImg ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-teal-400" />
                )}
                <span>{uploadingImg ? "আপলোড হচ্ছে..." : "ফাইল সিলেক্ট"}</span>
              </button>
            </div>

            {imageUrl && (
              <div className="mt-2 text-center p-2 rounded-xl bg-slate-950 border border-slate-800 max-w-xs mx-auto">
                <img
                  src={imageUrl}
                  alt="চিত্র প্রিভিউ"
                  className="max-h-28 rounded object-contain mx-auto"
                />
              </div>
            )}
          </div>

          {/* MCQ অপশনসমূহ */}
          {type === "MCQ" && (
            <div className="space-y-3">
              <label className="text-slate-300 block font-semibold flex items-center justify-between">
                <span>৪টি অপশন ও সঠিক উত্তর (রেডিও বাটনে ক্লিক করে সঠিক উত্তর মার্ক করুন)</span>
                <span className="text-emerald-400 font-bold text-[11px]">
                  সঠিক উত্তর: {String.fromCharCode(65 + answerIndex)}
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                      answerIndex === idx
                        ? "bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/30"
                        : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={answerIndex === idx}
                      onChange={() => setAnswerIndex(idx)}
                      className="w-4 h-4 text-emerald-500 cursor-pointer accent-emerald-500"
                    />
                    <span className="font-bold text-slate-400 font-mono">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const updated = [...options];
                        updated[idx] = e.target.value;
                        setOptions(updated);
                      }}
                      placeholder={`অপশন ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 bg-transparent border-none text-white focus:outline-none text-xs"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  স্মার্ট সমাধান ও ব্যাখ্যা (KaTeX সহ)
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="যেমন: পলির বর্জন নীতি অনুযায়ী একই অরবিটালে ৪টি কোয়ান্টাম সংখ্যা এক হতে পারে না..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* CQ (ক, খ, গ, ঘ) সাব-কোশ্চেন ফর্ম */}
          {type === "CQ" && (
            <div className="space-y-3">
              <span className="text-teal-400 font-bold block">
                সৃজনশীল প্রশ্নাবলি (ক, খ, গ, ঘ) ও আদর্শ উত্তর:
              </span>
              {subQuestions.map((sub, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono">
                      অংশ ({sub.part}) — {sub.marks || idx + 1} নম্বর
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {idx === 0
                        ? "জ্ঞানমূলক (১)"
                        : idx === 1
                        ? "অনুধাবনমূলক (২)"
                        : idx === 2
                        ? "প্রয়োগমূলক (৩)"
                        : "উচ্চতর দক্ষতা (৪)"}
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    value={sub.question}
                    onChange={(e) => handleSubQCChange(idx, "question", e.target.value)}
                    placeholder={`প্রশ্ন (${sub.part})...`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-teal-500"
                  />

                  <textarea
                    rows={2}
                    required
                    value={sub.answer}
                    onChange={(e) => handleSubQCChange(idx, "answer", e.target.value)}
                    placeholder={`উত্তর (${sub.part})...`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-300 text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* SQ সংক্ষিপ্ত উত্তর ফর্ম */}
          {type === "SQ" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">ক্যাটেগরি</label>
                  <select
                    value={sqCategory}
                    onChange={(e) => setSqCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="জ্ঞানমূলক">জ্ঞানমূলক (Knowledge)</option>
                    <option value="অনুধাবনমূলক">অনুধাবনমূলক (Comprehension)</option>
                    <option value="সংক্ষিপ্ত গাণিতিক">সংক্ষিপ্ত গাণিতিক</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">নম্বর (Marks)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={sqMarks}
                    onChange={(e) => setSqMarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">আদর্শ উত্তর</label>
                <textarea
                  rows={3}
                  required
                  value={sqAnswer}
                  onChange={(e) => setSqAnswer(e.target.value)}
                  placeholder="সংক্ষিপ্ত প্রশ্নের আদর্শ উত্তর..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* ট্যাগ ও প্রিসেট বাটনস */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>বোর্ড / এডমিশন এক্সাম ট্যাগ</span>
              </label>
            </div>

            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="যেমন: ঢাকা বোর্ড '২৪ / BUET '২৩"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-amber-300 font-mono focus:outline-none focus:border-amber-500"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {PRESET_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                    tag === t
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>

          {/* ফুটার অ্যাকশন */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{data ? "আপডেট সংরক্ষণ করুন" : "প্রশ্ন তৈরি করুন"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
