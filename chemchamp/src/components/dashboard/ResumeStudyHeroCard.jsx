import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Sparkles, ArrowRight, Play, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ResumeStudyHeroCard() {
  const { user } = useAuth();
  const [lastSession, setLastSession] = useState(null);

  useEffect(() => {
    try {
      const key = `chemchamp_last_studied_${user?.uid || "guest"}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.chapterTitle) {
          setLastSession(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default recommendation if no previous session
    setLastSession({
      chapterId: "ch_gunogoto",
      chapterTitle: "গুণগত রসায়ন",
      paper: 1,
      topicTitle: "কোয়ান্টাম সংখ্যা ও পলির বর্জন নীতি",
      topicIndex: 0,
      totalTopics: 5,
      completedCount: 1,
      timestamp: Date.now(),
    });
  }, [user?.uid]);

  if (!lastSession) return null;

  const paperLabel = Number(lastSession.paper) === 2 ? "রসায়ন ২য় পত্র" : "রসায়ন ১ম পত্র";
  const studyLink = `/study?paper=${lastSession.paper || 1}`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/40 border border-emerald-500/30 p-4 sm:p-5 shadow-xl group hover:border-emerald-500/50 transition-all">
      {/* Background Subtle Glow & Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              যেখানে পড়া ছেড়েছিলেন
            </span>
            <span className="text-[10px] font-medium text-slate-400 font-mono">
              • {paperLabel}
            </span>
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
              <span>{lastSession.chapterTitle}</span>
              <span className="text-slate-500 font-normal">|</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                {lastSession.topicTitle}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>লেকচার নোট ও গুরুত্বপূর্ণ বোর্ড প্রশ্নাবলি</span>
              <span className="text-amber-400 font-mono font-bold">• +২৫ XP বোনাস</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={studyLink}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>পড়া চালিয়ে যান</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

