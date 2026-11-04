import React, { useState, useEffect } from "react";
import {
  Clock,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function StrictFocusTracker({
  topicName = "কোয়ান্টাম সংখ্যা ও পলির নীতি",
  targetMinutes = 20,
  compactDefault = false,
}) {
  const { profile, syncUserProfile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(targetMinutes * 60);
  const [cheatWarning, setCheatWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [completedSession, setCompletedSession] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compactDefault);

  useEffect(() => {
    setSecondsLeft(targetMinutes * 60);
  }, [targetMinutes, topicName]);

  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setCompletedSession(true);
            if (syncUserProfile) {
              const curXp = profile?.gamification?.currentXP || 120;
              const curMins = profile?.stats?.totalStudyMinutes || 20;
              syncUserProfile({
                gamification: { currentXP: curXp + 40 },
                stats: { totalStudyMinutes: curMins + targetMinutes },
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // Page Visibility API: Detect tab switch or minimize (Anti-Cheat)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setIsActive(false);
        setCheatWarning(true);
        setIsExpanded(true);
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isActive]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progressPercent = Math.min(
    100,
    Math.round(((targetMinutes * 60 - secondsLeft) / (targetMinutes * 60)) * 100)
  );

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/30 relative overflow-hidden shadow-md">
      {/* Compact Top Row (Always visible & mobile friendly) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-md border border-teal-500/25 flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden xs:inline">Anti-Cheat</span> ফোকাস
          </span>
          <h3 className="text-xs sm:text-sm font-bold text-white truncate">
            {topicName}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {tabSwitchCount > 0 && (
            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/25 px-1.5 py-0.5 rounded">
              ট্যাব সুইচ: {tabSwitchCount}
            </span>
          )}

          <span className="text-xs sm:text-sm text-white font-mono font-black flex items-center gap-1 bg-slate-950/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className={`w-3.5 h-3.5 text-teal-400 ${isActive ? "animate-pulse" : ""}`} />
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsActive(!isActive);
              if (cheatWarning) setCheatWarning(false);
            }}
            className={`px-3 py-1 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95 ${
              isActive
                ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                : "bg-teal-500 text-slate-950 hover:bg-teal-400"
            }`}
          >
            {isActive ? (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                <span>পজ</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{secondsLeft < targetMinutes * 60 ? "চালু" : "শুরু"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setSecondsLeft(targetMinutes * 60);
              setCheatWarning(false);
              setCompletedSession(false);
            }}
            title="টাইমার রিসেট"
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-950/60 text-slate-400 hover:text-white sm:hidden"
            aria-label="বিস্তারিত টগল"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2.5 border border-slate-800">
        <div
          className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isExpanded && (
        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
          Page Visibility API সক্রিয়: পড়ার সময় অন্য ট্যাবে গেলে বা ব্রাউজার মিনিমাইজ করলে টাইমার অটো-পজ হবে। ২০ মিনিট পূর্ণ হলে <strong className="text-teal-300">+৪০ XP</strong> পাবেন।
        </p>
      )}

      {cheatWarning && (
        <div className="mt-2.5 p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-[11px] text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>অ্যান্টি-চিট সতর্কতা:</strong> আপনি ট্যাব পরিবর্তন বা মিনিমাইজ করেছিলেন! ফোকাস টাইমার স্বয়ংক্রিয়ভাবে পজ করা হয়েছে।
          </span>
        </div>
      )}

      {completedSession && (
        <div className="mt-2.5 p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>অভিনন্দন! ২০ মিনিট স্ট্রিক্ট ফোকাস সম্পন্ন হয়েছে (+৪০ XP অর্জিত)!</span>
        </div>
      )}
    </div>
  );
}
