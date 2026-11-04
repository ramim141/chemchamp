import React, { useState, useMemo } from "react";
import { CheckCircle2, Target, Clock, TrendingUp, Sparkles } from "lucide-react";

export default function ProgressLineGraph({
  currentRank,
  xp = 170,
  levelProgressPercent = 85,
  totalSolvedMCQ = 5,
  accuracyRate = 88,
  totalStudyMinutes = 20,
  onOpenPomodoro,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Generate or retrieve 7-day XP progression curve
  const dataPoints = useMemo(() => {
    const days = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "আজ"];
    const target = currentRank.nextXp || 200;
    const base = currentRank.minXp || 0;
    const current = Math.max(base, xp);

    // Calculate realistic incremental points over the last 7 days ending at current XP
    const step = (current - base) / 6;
    return days.map((day, idx) => {
      let val;
      if (idx === 6) {
        val = current;
      } else {
        // slight natural curve
        const factor = Math.pow(idx / 6, 1.2);
        val = Math.round(base + (current - base) * factor);
      }
      return {
        day,
        xp: Math.max(0, val),
        target,
      };
    });
  }, [xp, currentRank.nextXp, currentRank.minXp]);

  // Chart dimensions for SVG
  const width = 360;
  const height = 75;
  const paddingX = 20;
  const paddingY = 14;

  const minVal = currentRank.minXp || 0;
  const maxVal = Math.max(currentRank.nextXp || 200, xp + 20);

  const getCoordinates = (index, value) => {
    const x = paddingX + (index / (dataPoints.length - 1)) * (width - 2 * paddingX);
    const range = maxVal - minVal || 1;
    const y = height - paddingY - ((value - minVal) / range) * (height - 2 * paddingY);
    return { x, y };
  };

  const points = dataPoints.map((pt, i) => getCoordinates(i, pt.xp));

  // Build SVG Path string
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    // Catmull-Rom or smooth curve between points
    const prev = points[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
  }, "");

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        {/* Left: Interactive Line Graph */}
        <div className="lg:col-span-7 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 font-semibold">
                RPG প্রগ্রেস:{" "}
                <strong className="text-white">{currentRank.title}</strong> ➔{" "}
                <strong className="text-emerald-400">{currentRank.nextTitle}</strong>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                +{levelProgressPercent}%
              </span>
            </div>
            <span className="font-mono text-slate-300 font-bold text-[11px]">
              <span className="text-emerald-400">{xp}</span> / {currentRank.nextXp} XP
            </span>
          </div>

          {/* SVG Line Chart Container */}
          <div className="relative bg-slate-950/70 border border-slate-800/80 rounded-xl px-2 py-1 overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-16 sm:h-20 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="xpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="xpLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Target threshold reference line */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - paddingX}
                y2={paddingY}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />

              {/* Gradient Area under curve */}
              <path d={areaD} fill="url(#xpAreaGrad)" />

              {/* Main Line */}
              <path
                d={pathD}
                fill="none"
                stroke="url(#xpLineGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                filter="url(#glow)"
              />

              {/* Interactive Data points */}
              {points.map((pt, i) => {
                const isHovered = hoveredIdx === i;
                const isLatest = i === points.length - 1;
                return (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isLatest ? 4.5 : isHovered ? 4 : 2.5}
                      className={`cursor-pointer transition-all ${
                        isLatest
                          ? "fill-emerald-400 stroke-slate-950 stroke-2 animate-pulse"
                          : isHovered
                          ? "fill-teal-300 stroke-slate-950 stroke-2"
                          : "fill-emerald-400"
                      }`}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Day Labels below chart */}
            <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono px-2 pt-0.5 pb-0.5">
              {dataPoints.map((pt, i) => (
                <span
                  key={i}
                  className={`transition-colors ${
                    i === dataPoints.length - 1
                      ? "text-emerald-400 font-bold"
                      : hoveredIdx === i
                      ? "text-teal-300 font-bold"
                      : ""
                  }`}
                >
                  {pt.day}
                  {hoveredIdx === i && (
                    <span className="block text-[8px] text-white font-bold font-mono">
                      {pt.xp} XP
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: 3 Quick Stats Pills (as in the screenshot) */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-2 text-center lg:border-l lg:border-slate-800/80 pt-2 lg:pt-0 lg:pl-3">
          <div className="bg-slate-950/70 rounded-xl py-2 px-2 border border-slate-800/70 hover:border-emerald-500/30 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">সমাধানকৃত MCQ</span>
            <span className="text-xs font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{totalSolvedMCQ}টি</span>
            </span>
          </div>

          <div className="bg-slate-950/70 rounded-xl py-2 px-2 border border-slate-800/70 hover:border-teal-500/30 transition-all flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 block mb-0.5">গড় এক্যুরেসি</span>
            <span className="text-xs font-black text-teal-400 font-mono flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5" />
              <span>{accuracyRate}%</span>
            </span>
          </div>

          <div
            onClick={onOpenPomodoro}
            className={`bg-slate-950/70 rounded-xl py-2 px-2 border border-slate-800/70 hover:border-amber-500/50 transition-all flex flex-col justify-center ${
              onOpenPomodoro ? "cursor-pointer group hover:bg-amber-950/20" : ""
            }`}
            title="পোমোডোরো ফোকাস স্টাডি সেশন চালু করুন"
          >
            <span className="text-[10px] text-slate-400 group-hover:text-amber-300 block mb-0.5">
              ফোকাস স্টাডি {onOpenPomodoro && "⚡"}
            </span>
            <span className="text-xs font-black text-amber-400 font-mono flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{totalStudyMinutes} মি.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

