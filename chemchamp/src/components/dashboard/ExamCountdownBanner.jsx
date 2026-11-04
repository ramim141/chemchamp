import React, { useState, useEffect } from "react";
import { Clock, Calendar, Sparkles, SlidersHorizontal, BookOpen, Timer } from "lucide-react";

export default function ExamCountdownBanner({ preferences, onEditPlan }) {
  const target = preferences?.target || "HSC_26";
  const deadlineDays = Number(preferences?.deadlineDays) || 90;
  const dailyGoalMinutes = Number(preferences?.dailyGoalMinutes) || 45;
  const paper = preferences?.paper || "both";

  const getTargetTimestamp = () => {
    const storageKey = `chemchamp_deadline_${target}_${deadlineDays}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (parsed > Date.now() + 60 * 1000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // Calculate future target timestamp based on deadlineDays + hours/mins offset so live timer ticks visibly
    const futureTs =
      Date.now() +
      deadlineDays * 24 * 60 * 60 * 1000 +
      6 * 60 * 60 * 1000 +
      42 * 60 * 1000;

    try {
      localStorage.setItem(storageKey, String(futureTs));
    } catch {
      // ignore
    }
    return futureTs;
  };

  const [timeLeft, setTimeLeft] = useState({
    days: deadlineDays,
    hours: 6,
    minutes: 42,
    seconds: 0,
  });

  useEffect(() => {
    const targetTs = getTargetTimestamp();

    const calculateTime = () => {
      const diff = targetTs - Date.now();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [target, deadlineDays]);

  const targetLabel =
    target === "HSC_26"
      ? "HSC ২৬ বোর্ড ও ফাইনাল প্রস্তুতি"
      : target === "HSC_27"
      ? "HSC ২৭ বোর্ড ও একাডেমিক প্রস্তুতি"
      : "মেডিকেল, বুয়েট ও ভার্সিটি এডমিশন";

  const paperLabel =
    paper === "paper1"
      ? "রসায়ন ১ম পত্র"
      : paper === "paper2"
      ? "রসায়ন ২য় পত্র"
      : "রসায়ন উভয় পত্র";

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950/75 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 shadow-md">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/90 block">
              লাইভ এক্সাম ও সিলেবাস কাউন্টডাউন
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              {targetLabel}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 px-2 py-1 rounded-lg text-[10px] text-slate-300 font-semibold">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span>{deadlineDays} দিনের টার্গেট</span>
          </div>

          {onEditPlan && (
            <button
              type="button"
              onClick={onEditPlan}
              title="টার্গেট ও রুটিন পরিবর্তন করুন"
              className="flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-300 transition-all active:scale-95"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>প্ল্যান এডিট</span>
            </button>
          )}
        </div>
      </div>

      {/* Countdown Boxes */}
      <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
        {[
          { label: "দিন বাকি", value: timeLeft.days },
          { label: "ঘণ্টা", value: timeLeft.hours },
          { label: "মিনিট", value: timeLeft.minutes },
          { label: "সেকেন্ড", value: timeLeft.seconds },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 border border-slate-800/90 rounded-lg py-2.5 px-1 backdrop-blur-sm shadow-inner"
          >
            <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono tracking-tight block">
              {String(item.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Onboarding Metadata Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/70 pt-2.5 relative z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-emerald-300 font-medium">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>ফোকাস: {paperLabel}</span>
          </span>
          <span className="flex items-center gap-1 text-teal-300 font-medium">
            <Timer className="w-3.5 h-3.5 text-teal-400" />
            <span>দৈনিক লক্ষ্য: {dailyGoalMinutes} মিনিট</span>
          </span>
        </div>

        <span className="flex items-center gap-1 text-amber-300 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ডেইলি মিশন: ৩টি
        </span>
      </div>
    </div>
  );
}
