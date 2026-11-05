import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Flame, BookOpen } from "lucide-react";
import { fireConfetti as confetti } from "../../utils/confetti";

export default function CTASection({ onStartClick, user }) {
  const handleClick = (e) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    if (onStartClick) onStartClick(e);
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto relative">
      <div className="relative rounded-3xl p-8 sm:p-12 md:p-14 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl overflow-hidden text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-emerald-500/20 to-teal-500/0 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>১০০% ফ্রি সেলফ-স্টাডি প্ল্যাটফর্ম</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            রসায়ন তোমার ভীতি নয়, <br className="hidden sm:inline" />
            হবে তোমার সবচেয়ে বড়{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              শক্তির জায়গা
            </span>
          </h2>

          <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            আজই ১-ক্লিকে বিনামূল্যে সাইনআপ করো। হাজারো সহপাঠীর সাথে যুক্ত হয়ে প্রতিদিনের স্ট্রিক ও ডেইলি মিশন সম্পন্ন করে রসায়নের পূর্ণাঙ্গ সিলেবাস গুছিয়ে নাও।
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleClick}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{user ? "ড্যাশবোর্ডে প্রবেশ করুন 🚀" : "গুগল দিয়ে বিনামূল্যে শুরু করুন"}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              কোনো হিডেন ফি নেই
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              অফলাইন ও লো-ডাটা ক্যাশ
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              সকল ডিভাইসে রেসপনসিভ
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ১০০% এনসিটিবি সিলেবাস সম্মত
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

