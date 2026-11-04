import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, ChevronRight, Sparkles, Award } from "lucide-react";

export default function SyllabusSection() {
  const [selectedPaper, setSelectedPaper] = useState("paper1");

  const paper1Chapters = [
    {
      num: "০১",
      title: "ল্যাবরেটরির নিরাপদ ব্যবহার",
      weight: "১টি CQ নিশ্চিত + ২-৩টি MCQ",
      tag: "বোর্ড ও মেডিকেল হটস্পট",
      topics: "সেফটি গ্লাস, বুনসেন বার্নার, দ্রাবক নিষ্কাশন, গ্লাস সামগ্রী পরিষ্কারকরণ ও প্রাথমিক চিকিৎসা",
    },
    {
      num: "০২",
      title: "গুণগত রসায়ন (Qualitative Chem)",
      weight: "২টি CQ + ৪-৫টি MCQ",
      tag: "বুয়েট ও মেডিকেল মাস্ট",
      topics: "রাদারফোর্ড ও বোর মডেল, কোয়ান্টাম সংখ্যা, পলির অপবর্জন, হুন্ডের নীতি, দ্রাব্যতা ও দ্রাব্যতা গুণফল (Ksp)",
    },
    {
      num: "০৩",
      title: "মৌলের পর্যায়বৃত্ত ধর্ম ও বন্ধন",
      weight: "২টি CQ + ৪-৫টি MCQ",
      tag: "বুয়েট রিটেন ফেভারিট",
      topics: "s, p, d, f ব্লক মৌল, আয়নীকরণ শক্তি, ইলেকট্রন আসক্তি, ফাজানের নীতি ও সংকরায়ণ (Hybridization)",
    },
    {
      num: "০৪",
      title: "রাসায়নিক পরিবর্তন (Chemical Change)",
      weight: "২টি CQ + ৪-৫টি MCQ",
      tag: "ম্যাথ ও বাফার স্পেশাল",
      topics: "লা-শাতেলিয়ারের নীতি, Kp ও Kc হিসাব, pH ও বাফার দ্রবণ, তাপোৎপাদী ও তাপহারী বিক্রিয়া, আর্হেনিয়াস সমীকরণ",
    },
    {
      num: "০৫",
      title: "কর্মমুখী রসায়ন (Applied Chemistry)",
      weight: "১টি CQ + ৩টি MCQ",
      tag: "মেডিকেল ইনফো ব্যাংক",
      topics: "খাদ্য নিরাপত্তা, প্রিজারভেটিভস এর ক্রিয়াকৌশল, সাসপেনশন ও কোলয়েড, টয়লেট্রিজ প্রস্তুতি",
    },
  ];

  const paper2Chapters = [
    {
      num: "০১",
      title: "পরিবেশ রসায়ন (Environmental Chem)",
      weight: "২টি CQ + ৪টি MCQ",
      tag: "গ্যাস সূত্র ও ডাল্টন",
      topics: "বয়েল, চার্লস ও ডাল্টনের আংশিক চাপ সূত্র, গ্রাহামের ব্যাপন, আদর্শ ও বাস্তব গ্যাস, ভ্যান ডার ওয়ালস সমীকরণ, এসিড বৃষ্টি",
    },
    {
      num: "০২",
      title: "জৈব রসায়ন (Organic Chemistry)",
      weight: "৩টি CQ + ৬-৭টি MCQ",
      tag: "সর্বোচ্চ মার্কস কনটেন্ট",
      topics: "সমগোত্রীয় শ্রেণি, আইসোমারিজম, ইলেক্ট্রোফাইল ও নিউক্লিওফাইল, মার্কনিকভ নীতি, বেনজিন ও অ্যারোমেটিসিটি, পলিমার",
    },
    {
      num: "০৩",
      title: "পরিমাণগত রসায়ন (Quantitative Chem)",
      weight: "২টি CQ + ৪-৫টি MCQ",
      tag: "টাইট্রেশন ও ম্যাথ",
      topics: "মোলারিটি ও শতকরা মাত্রা, অম্ল-ক্ষার টাইট্রেশন, জারণ-বিজারণ আয়ন-ইলেকট্রন সমতাকরণ ও বিয়ার-ল্যাম্বার্ট সূত্র",
    },
    {
      num: "০৪",
      title: "তড়িৎ রসায়ন (Electrochemistry)",
      weight: "১টি CQ + ৩-৪টি MCQ",
      tag: "নর্ন্সট ও ফুয়েল সেল",
      topics: "তড়িৎ পরিবাহী, ফ্যারাডের সূত্রাবলি, প্রমাণ কোষ বিভব ও নর্ন্সট সমীকরণ, ফুয়েল সেল ও লেড-এসিড ব্যাটারি",
    },
    {
      num: "০৫",
      title: "অর্থনৈতিক রসায়ন (Economic Chem)",
      weight: "১টি CQ + ২-৩টি MCQ",
      tag: "শিল্পকারখানা ও পরিবেশ",
      topics: "ইউরিয়া সার কারখানা, সিমেন্ট ও কাচ শিল্প, চামড়া ট্যানিং, পাল্প ও কাগজ শিল্প এবং বর্জ্য পরিশোধন",
    },
  ];

  const chapters = selectedPaper === "paper1" ? paper1Chapters : paper2Chapters;

  return (
    <section id="syllabus" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center mb-10 sm:mb-12">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          সিলেবাস কভারেজ
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3">
          এইচএসসি ও এডমিশনের পূর্ণাঙ্গ অধ্যায়ভিত্তিক সিলেবাস
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
          এনসিটিবি পাঠ্যক্রম ও বিগত ২০ বছরের বুয়েট, মেডিকেল ও ঢাবি ট্রেন্ড অনুসারে প্রতিটি অধ্যায়ের নোটস, প্রশ্নব্যাংক ও দাগানো বই সাজানো।
        </p>
      </div>

      {/* Paper Switcher Tabs */}
      <div className="flex justify-center mb-8 sm:mb-10">
        <div className="p-1 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-1 shadow-md">
          <button
            type="button"
            onClick={() => setSelectedPaper("paper1")}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedPaper === "paper1"
                ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            রসায়ন ১ম পত্র (HSC & Admission)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPaper("paper2")}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedPaper === "paper2"
                ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            রসায়ন ২য় পত্র (HSC & Admission)
          </button>
        </div>
      </div>

      {/* Chapter Cards Grid with Smooth Tab Switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPaper}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {chapters.map((ch) => (
            <div
              key={ch.num}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    {ch.num}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {ch.tag}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                  {ch.title}
                </h3>
                <span className="text-[11px] font-mono font-semibold text-amber-400/90 block mb-2">
                  ★ গুরুত্ব: {ch.weight}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{ch.topics}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-emerald-400">
                <span>MCQ + CQ + দাগানো বই</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
