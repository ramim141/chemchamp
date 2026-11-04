import React from "react";
import { Timer, FileText, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { getExamBadgeStyle } from "../../utils/examTagUtils";

export default function MockExamCard({ exam, onStart }) {
  const {
    title,
    chapterTitle,
    duration,
    questionsCount,
    negativeMark = "-0.25",
    tag = "বোর্ড স্ট্যান্ডার্ড",
    paper,
    category,
    isCompleted = false,
    lastScore = null,
  } = exam;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg hover:shadow-emerald-500/5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border truncate max-w-[65%] ${getExamBadgeStyle(
              tag
            )}`}
          >
            ★ {tag}
          </span>
          <span className="text-[10px] text-rose-400 font-mono font-bold shrink-0">
            নেগেটিভ: {negativeMark}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug mb-1">
          {title}
        </h3>

        {chapterTitle && (
          <p className="text-[11px] text-slate-400 truncate mb-3">
            📚 {chapterTitle} {paper ? `(${paper === 2 ? "২য় পত্র" : "১ম পত্র"})` : ""}
          </p>
        )}
      </div>

      <div className="border-t border-slate-800/80 pt-3 mt-2 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-teal-400" />
            <span>{duration}</span>
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{questionsCount}টি প্রশ্ন</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => onStart && onStart(exam)}
          className="w-full py-2 bg-slate-950 group-hover:bg-emerald-500 border border-slate-800 group-hover:border-emerald-400 text-slate-200 group-hover:text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
        >
          <span>পরীক্ষা শুরু করুন</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}
