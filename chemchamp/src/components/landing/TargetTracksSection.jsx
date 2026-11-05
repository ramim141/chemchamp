import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Building2,
  Stethoscope,
  School,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Award,
} from "lucide-react";
import { DEFAULT_TRACKS } from "../../services/landingConfigService";

const TRACK_ICONS = {
  Building2,
  Stethoscope,
  GraduationCap,
  School,
  Sparkles,
  Zap,
  Target,
  Award,
};

export default function TargetTracksSection({ tracks = DEFAULT_TRACKS }) {
  const activeTracks = (tracks || DEFAULT_TRACKS).filter((t) => t.enabled !== false);
  const [selectedTrack, setSelectedTrack] = useState(activeTracks[0]?.id || "engineering");

  // Keep selectedTrack in sync if active tracks list changes
  const currentSelectedId = activeTracks.some((t) => t.id === selectedTrack)
    ? selectedTrack
    : activeTracks[0]?.id || "engineering";

  return (
    <section id="tracks" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto relative">
      {/* Background glow accent */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-cyan-500/5 blur-[100px] pointer-events-none -z-10" />

      <div className="text-center mb-10 sm:mb-14">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
          টার্গেট ভিত্তিক প্রস্তুতি
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3">
          তোমার স্বপ্ন যেখানে, প্রস্তুতিও হোক সেভাবে
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
          বুয়েট, মেডিকেল, ঢাবি 'ক' কিংবা এইচএসসি বোর্ড পরীক্ষা—প্রতিটি লক্ষ্যের পরীক্ষার প্যাটার্ন অনুযায়ী স্পেশালাইজড প্রশ্নব্যাংক ও প্র্যাকটিস মডিউল।
        </p>
      </div>

      {/* Target Tracks Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {activeTracks.map((t) => {
          const Icon = TRACK_ICONS[t.icon] || (t.id === "engineering" ? Building2 : t.id === "medical" ? Stethoscope : t.id === "varsity" ? GraduationCap : School);
          const isSelected = currentSelectedId === t.id;

          return (
            <div
              key={t.id}
              onClick={() => setSelectedTrack(t.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden select-none ${
                isSelected
                  ? "bg-slate-900 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                      t.accentColor || "from-emerald-500 to-teal-400"
                    } flex items-center justify-center font-bold text-slate-950 shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5 text-slate-950" />
                  </div>
                  {t.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.badgeBg || "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                      {t.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1">{t.title}</h3>
                <p className="text-xs text-slate-400 leading-snug">{t.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className={isSelected ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {isSelected ? "বর্তমানে নির্বাচিত ✓" : "বিস্তারিত দেখুন"}
                </span>
                <ArrowRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isSelected ? "text-emerald-400 translate-x-1" : "text-slate-600"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Track Detailed Showcase Card with Smooth Transition */}
      <AnimatePresence mode="wait">
        {(() => {
          const cur = activeTracks.find((t) => t.id === currentSelectedId) || activeTracks[0];
          if (!cur) return null;
          const CurIcon = TRACK_ICONS[cur.icon] || (cur.id === "engineering" ? Building2 : cur.id === "medical" ? Stethoscope : cur.id === "varsity" ? GraduationCap : School);

          return (
            <motion.div
              key={cur.id}
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cur.accentColor || "from-emerald-500 to-teal-400"} flex items-center justify-center font-bold text-slate-950 shadow-lg shrink-0`}
                  >
                    <CurIcon className="w-6 h-6 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-black text-white">{cur.title} স্পেশাল প্যাকেজ</h3>
                      {cur.badge && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cur.badgeBg || "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                          {cur.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300">{cur.subtitle}</p>
                  </div>
                </div>

                {cur.highlight && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300 flex items-center gap-2 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{cur.highlight}</span>
                  </div>
                )}
              </div>

              {/* Features Checklist */}
              {Array.isArray(cur.features) && cur.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {cur.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
                    >
                      <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}

