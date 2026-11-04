import React, { useState, useEffect } from "react";
import { Users, Flame } from "lucide-react";

export default function CoStudyCounter() {
  const [activeCount, setActiveCount] = useState(342);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(310, Math.min(390, prev + delta));
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-lg px-3.5 py-2">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
          <strong className="text-emerald-400 font-mono font-bold">{activeCount} জন</strong>
          শিক্ষার্থী এখন লাইভ পড়ছে
        </span>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
        <Flame className="w-3.5 h-3.5 fill-amber-400" />
        <span>কো-স্টাডি হাব</span>
      </div>
    </div>
  );
}
