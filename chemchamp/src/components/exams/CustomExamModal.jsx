import React, { useState } from "react";
import { X, Sliders, Zap, BookOpen, Clock, Target, CheckCircle2 } from "lucide-react";

export default function CustomExamModal({
  isOpen,
  chapters = [],
  onClose,
  onStartCustomExam,
}) {
  if (!isOpen) return null;

  const [selectedPaper, setSelectedPaper] = useState("all"); // 1 | 2 | all
  const [selectedChapterId, setSelectedChapterId] = useState("all");
  const [selectedTarget, setSelectedTarget] = useState("all"); // all | board | buet | medical | varsity
  const [questionCount, setQuestionCount] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [customTitle, setCustomTitle] = useState("");

  // Filter chapters based on paper
  const filteredChapters = chapters.filter((c) => {
    if (selectedPaper === "all") return true;
    return Number(c.paper) === Number(selectedPaper);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onStartCustomExam({
      paper: selectedPaper,
      chapterId: selectedChapterId,
      target: selectedTarget,
      questionCount: Number(questionCount),
      durationMinutes: Number(durationMinutes),
      title: customTitle.trim() || "কাস্টম প্র্যাকটিস মক টেস্ট",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1 text-amber-400">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">নিজের মতো টেস্ট তৈরি করুন</h3>
            <p className="text-xs text-slate-400">
              আপনার প্রয়োজন অনুযায়ী অধ্যায়, সময় ও প্রশ্নের সংখ্যা নির্ধারণ করুন
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* ১. টেস্টের শিরোনাম */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">টেস্টের নাম (ঐচ্ছিক)</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="যেমন: আমার রিভিশন স্পিড টেস্ট"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* ২. পত্র নির্বাচন */}
          <div>
            <label className="text-slate-300 font-bold block mb-1.5">পত্র নির্বাচন</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "উভয় পত্র" },
                { id: "1", label: "রসায়ন ১ম পত্র" },
                { id: "2", label: "রসায়ন ২য় পত্র" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPaper(p.id);
                    setSelectedChapterId("all");
                  }}
                  className={`py-2 px-2 rounded-xl text-center font-bold transition-all border ${
                    selectedPaper === p.id
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ৩. অধ্যায় নির্বাচন */}
          <div>
            <label className="text-slate-300 font-bold block mb-1">অধ্যায় নির্বাচন</label>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">📚 সকল অধ্যায় সম্মিলিত</option>
              {filteredChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.paper === 2 ? "[২য়]" : "[১ম]"} {ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* ৪. টার্গেট ক্যাটাগরি */}
          <div>
            <label className="text-slate-300 font-bold block mb-1.5">টার্গেট বা পরীক্ষার ধরণ</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "all", label: "🌟 সব ধরণের প্রশ্ন" },
                { id: "board", label: "🏛️ বোর্ড স্ট্যান্ডার্ড" },
                { id: "buet", label: "🚀 বুয়েট ও ইঞ্জি." },
                { id: "medical", label: "🩺 মেডিকেল স্পেশাল" },
                { id: "varsity", label: "🎯 বিশ্ববিদ্যালয় (ঢাবি)" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTarget(t.id)}
                  className={`py-2 px-2 rounded-xl text-center font-semibold transition-all border text-[11px] truncate ${
                    selectedTarget === t.id
                      ? "bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ৫. প্রশ্নের সংখ্যা ও সময় */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-teal-400" /> প্রশ্নের সংখ্যা
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 15, 20, 25].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setQuestionCount(cnt)}
                    className={`py-1.5 rounded-lg font-mono font-bold transition-all border text-center ${
                      questionCount === cnt
                        ? "bg-teal-500 text-slate-950 border-teal-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-400" /> সময় (মিনিট)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 15, 20, 25].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-1.5 rounded-lg font-mono font-bold transition-all border text-center ${
                      durationMinutes === mins
                        ? "bg-rose-500 text-white border-rose-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* সাবমিট বাটন */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>ইনস্ট্যান্ট টেস্ট শুরু করুন 🚀</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

