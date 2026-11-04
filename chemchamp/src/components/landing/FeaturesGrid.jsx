import React from "react";
import {
  Clock,
  Layers,
  AlertCircle,
  Swords,
  Calculator,
  WifiOff,
  Sparkles,
  ShieldCheck,
  Zap,
  BookMarked,
  GraduationCap,
  CheckCircle2,
  Atom,
  Flame,
  Target,
  FileSpreadsheet,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import { DEFAULT_FEATURES } from "../../services/landingConfigService";

const ICON_MAP = {
  Clock,
  Layers,
  AlertCircle,
  Swords,
  Calculator,
  WifiOff,
  Sparkles,
  ShieldCheck,
  Zap,
  BookMarked,
  GraduationCap,
  CheckCircle2,
  Atom,
  Flame,
  Target,
  FileSpreadsheet,
};

export default function FeaturesGrid({ features = DEFAULT_FEATURES }) {
  // Only display features that are enabled by admin
  const activeFeatures = (features || DEFAULT_FEATURES).filter((f) => f.enabled !== false);

  return (
    <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto relative">
      {/* Background glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />

      <div className="text-center mb-12 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          কোর ফিচার ও পাওয়ার টুলস
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3">
          রসায়নের জটিল পড়াগুলোকে করো পানির মতো সহজ
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
          গতানুগতিক গাইড মুখস্থের বাইরে সাইকোলজিক্যাল রিটেনশন, স্মার্ট ফ্লিপকার্ড ও ডাটা-ড্রাইভেন প্র্যাকটিসের পারফেক্ট কম্বিনেশন।
        </p>
      </div>

      {/* Smart Dynamic Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {activeFeatures.map((feat) => {
          const IconComponent = ICON_MAP[feat.icon] || Sparkles;
          const isLarge = Boolean(feat.isLarge);

          return (
            <div
              key={feat.id}
              className={`${
                isLarge ? "lg:col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-900/60" : "bg-slate-900/70"
              } p-5 sm:p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">{feat.title}</h3>
                      {isLarge && (
                        <span className="text-[10px] text-teal-400 font-mono">Page Visibility API Driven</span>
                      )}
                    </div>
                  </div>
                  {feat.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${
                        feat.badgeBg || "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {feat.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  {feat.description}
                </p>
              </div>

              {/* Dynamic Feature Sub-Widget Preview */}
              {feat.id === "focus_hub" ? (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <span className="text-slate-300 font-medium">স্মার্ট প্রটেকশন: সক্রিয়</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-400 h-full w-3/4 rounded-full" />
                    </div>
                    <span className="text-teal-300 font-mono font-bold">১৫:০০ / ২০:০০</span>
                  </div>
                </div>
              ) : feat.id === "organic_flipcards" ? (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-amber-400 block mb-0.5">উর্টজ-ফিটিগ বিক্রিয়া</span>
                  <KaTeXMath math="\text{Ar-X} + \text{R-X} + 2\text{Na}" block className="text-xs text-slate-300" />
                </div>
              ) : feat.id === "leitner_repetition" ? (
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span>রিভিশন ইন্টারভ্যাল:</span>
                  <span className="text-rose-400 font-bold">1d → 3d → 7d → 21d</span>
                </div>
              ) : feat.id === "textbook_highlights" ? (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-amber-300/90 flex items-center justify-between">
                  <span>📚 হাজারী ও নাগ স্যার</span>
                  <span className="text-[10px] font-mono text-slate-400">পৃষ্ঠা ও বোর্ড ট্যাগসহ</span>
                </div>
              ) : feat.id === "non_calc_math" ? (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <KaTeXMath math="\text{pH} = -\log[\text{H}^+]" />
                  <span className="text-[10px] text-slate-400">৫ সেকেন্ডে সলভ</span>
                </div>
              ) : (
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>প্রস্তুতি বুস্টার</span>
                  </span>
                  <span className="text-[10px] font-mono">ChemChamp Pro</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
