import React from "react";
import { CheckCircle2, Lock, ArrowRight, BookOpen } from "lucide-react";

export default function ChapterPathwayCard({ chapter, onOpen }) {
  const { paper, title, topicsCount, completedTopics, isUnlocked, currentTopic } = chapter;

  return (
    <div
      onClick={() => isUnlocked && onOpen && onOpen(chapter)}
      className={`p-4 rounded-xl border transition-all ${
        isUnlocked
          ? "bg-slate-900/80 border-slate-800 hover:border-teal-500/40 cursor-pointer group shadow-sm"
          : "bg-slate-950/60 border-slate-900 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          {paper}
        </span>

        {isUnlocked ? (
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {completedTopics}/{topicsCount} টপিক
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> লক করা
          </span>
        )}
      </div>

      <h3 className="text-xs font-bold text-white mb-1 group-hover:text-teal-300 transition-colors">
        {title}
      </h3>
      <p className="text-[11px] text-slate-400 truncate">
        {isUnlocked ? `চলমান: ${currentTopic}` : "আগের অধ্যায় শেষ করে আনলক করুন"}
      </p>

      {isUnlocked && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
            <span>অগ্রগতি ({Math.round((completedTopics / topicsCount) * 100)}%)</span>
            <span className="text-teal-400 flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform">
              পড়ুন <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedTopics / topicsCount) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
