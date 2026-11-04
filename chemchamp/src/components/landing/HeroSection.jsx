import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Sparkles,
  Flame,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  Rotate3d,
  Award,
  Users,
  Timer,
  ChevronRight,
  BookOpen,
  HelpCircle,
  XCircle,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import confetti from "canvas-confetti";

// Interactive Demo Reactions for the Hero Sandbox
const HERO_REACTIONS = [
  {
    name: "গ্রিগনার্ড বিকারক + ফর্মালডিহাইড",
    tag: "১° অ্যালকোহল প্রস্তুতি",
    exam: "BUET '18, DMC '20",
    reactant: "\\text{R-MgX} + \\text{HCHO} \\xrightarrow{\\text{dry ether}} ?",
    product: "\\text{R-CH}_2\\text{OH} + \\text{Mg(OH)X}",
    productLabel: "উৎপাদ: ১° (প্রাইমারি) অ্যালকোহল",
  },
  {
    name: "উর্টজ বিক্রিয়া (Wurtz Reaction)",
    tag: "উচ্চতর অ্যালকেন",
    exam: "DU '21, HSC Board",
    reactant: "2\\text{R-X} + 2\\text{Na} \\xrightarrow{\\text{dry ether}} ?",
    product: "\\text{R-R} + 2\\text{NaX}",
    productLabel: "উৎপাদ: জোড় কার্বনযুক্ত অ্যালকেন",
  },
  {
    name: "ক্যানিজারো বিক্রিয়া (Cannizzaro)",
    tag: "α-হাইড্রোজেনবিহীন অ্যালডিহাইড",
    exam: "BUET '15, Medical '19",
    reactant: "2\\text{HCHO} + 50\\% \\text{NaOH} \\rightarrow ?",
    product: "\\text{CH}_3\\text{OH} + \\text{HCOONa}",
    productLabel: "উৎপাদ: মিথানল + সোডিয়াম ফরমেট (স্বতঃ জারণ-বিজারণ)",
  },
];

// Interactive Demo Quiz for the Hero Sandbox
const HERO_QUIZ = {
  question: "বোর পরমাণু মডেল অনুসারে ২য় কক্ষপথের (n = 2) কৌণিক ভরবেগ কত?",
  examTag: "বুয়েট প্রিলিমিনারি ও ঢাবি 'ক'",
  options: [
    { text: "\\frac{h}{2\\pi}", correct: false },
    { text: "\\frac{h}{\\pi}", correct: true },
    { text: "\\frac{2h}{\\pi}", correct: false },
    { text: "\\frac{4h}{\\pi}", correct: false },
  ],
  explanation: "কৌণিক ভরবেগ L = \\frac{nh}{2\\pi}। এখানে n = 2 হলে, L = \\frac{2h}{2\\pi} = \\frac{h}{\\pi}।",
};

export default function HeroSection() {
  const { user, profile, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Hero interactive mockup state
  const [activeTab, setActiveTab] = useState("flipcard"); // "flipcard" | "mcq" | "timer"
  const [reactionIdx, setReactionIdx] = useState(0);
  const [heroFlipped, setHeroFlipped] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState(null);
  const [focusSimActive, setFocusSimActive] = useState(true);
  const [focusSeconds, setFocusSeconds] = useState(1175); // 19:35

  const handleStart = async () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
    });

    if (user) {
      if (profile?.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } else {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error("Login error:", err);
      }
    }
  };

  const handleSelectQuiz = (optIdx, isCorrect) => {
    if (selectedQuizOption !== null) return;
    setSelectedQuizOption(optIdx);
    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 45,
        origin: { y: 0.7 },
      });
    }
  };

  const handleNextReaction = (e) => {
    e.stopPropagation();
    setHeroFlipped(false);
    setReactionIdx((prev) => (prev + 1) % HERO_REACTIONS.length);
  };

  const currentRx = HERO_REACTIONS[reactionIdx];

  return (
    <section className="relative pt-24 sm:pt-28 md:pt-36 pb-14 sm:pb-20 px-4 sm:px-6 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[350px] sm:w-[650px] md:w-[900px] h-[380px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Value Prop, CTA */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Top Target Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-inner mb-4 sm:mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-200">
                HSC '২৬ ও '২৭ ব্যাচ এবং এডমিশন ২০২৫-২৬ স্পেশাল
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                ১০০% ফ্রি
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-white tracking-tight leading-[1.2] mb-4 sm:mb-6">
              কেমিস্ট্রির ভয় দূর করে <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                চ্যাম্পিয়ন হওয়ার
              </span>{" "}
              স্মার্ট প্ল্যাটফর্ম
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              রোজকার পড়ার ধারাবাহিকতা (Daily Habit Loop), ২০ মিনিট অ্যান্টি-চিট ফোকাস মোড,
              জৈব রসায়ন সোয়াইপ ফ্লিপকার্ড এবং এনসিটিবি অনুমোদিত শীর্ষ শিক্ষকদের দাগানো বই দিয়ে কেমিস্ট্রি করো একদম সহজ ও আকর্ষণীয়!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mb-6 sm:mb-8">
              <button
                onClick={handleStart}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{user ? "ড্যাশবোর্ডে প্রবেশ করুন 🚀" : "গুগল দিয়ে বিনামূল্যে শুরু করুন"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#demo"
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-slate-300" />
                <span>লাইভ ইন্টারঅ্যাক্টিভ ডেমো</span>
              </a>
            </div>

            {/* Quick Value Props Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-xs text-slate-400 mb-6 max-w-lg mx-auto lg:mx-0">
              <span className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> ১-ক্লিকে ফ্রি সাইনআপ
              </span>
              <span className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> অফলাইন ও লো-ডাটা ক্যাশ
              </span>
              <span className="flex items-center justify-center lg:justify-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> হাজারী ও সঞ্জিত স্যারের নোটস
              </span>
            </div>

            {/* Social Proof Counter */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-4 border-t border-slate-900">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950">🧪</div>
                <div className="w-7 h-7 rounded-full bg-teal-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950">⚡</div>
                <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-950">🔥</div>
              </div>
              <p className="text-[11px] text-slate-400">
                <strong className="text-white">১,২০০+ শিক্ষার্থী</strong> প্রতিদিন স্ট্রিক বজায় রেখে পড়াশোনা করছে
              </p>
            </div>
          </div>

          {/* Right Column: Live Interactive ChemChamp Web App Sandbox */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Backlight Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-amber-500/20 rounded-2xl blur-xl opacity-75 transition duration-1000" />

            <div className="relative rounded-2xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 shadow-2xl shadow-black/80 backdrop-blur-xl">
              {/* App Window Top Bar with Streak Indicator */}
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-[11px] font-mono text-slate-400 ml-1">chemchamp.app/live-sandbox</span>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-400">
                  <Flame className="w-3 h-3 fill-amber-400 animate-pulse" />
                  <span>৩ দিনের স্ট্রিক 🔥</span>
                </div>
              </div>

              {/* Interactive Module Tabs inside Sandbox */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl mb-3 text-center text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("flipcard")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "flipcard"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🧪 ফ্লিপকার্ড
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mcq")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "mcq"
                      ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🎯 লাইভ MCQ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("timer")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === "timer"
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ⏱️ ফোকাস মোড
                </button>
              </div>

              {/* Animated Sandbox Tab Content */}
              <div className="min-h-[175px]">
                <AnimatePresence mode="wait">
                  {/* Tab 1: Organic Reactions Flipcard Sandbox */}
                  {activeTab === "flipcard" && (
                    <motion.div
                      key="flipcard"
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.99 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      onClick={() => setHeroFlipped(!heroFlipped)}
                      className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all mb-3 select-none group min-h-[165px] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-2">
                          <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            {currentRx.name}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                            <Rotate3d className="w-3 h-3" /> ট্যাপ করে উত্তর দেখুন
                          </span>
                        </div>

                        {!heroFlipped ? (
                          <div className="py-3 text-center">
                            <span className="text-[10px] text-slate-400 block mb-1">
                              বিক্রিয়ক ও শর্ত ({currentRx.exam}):
                            </span>
                            <KaTeXMath math={currentRx.reactant} block className="text-emerald-300 font-bold text-xs sm:text-sm" />
                          </div>
                        ) : (
                          <div className="py-2.5 bg-emerald-950/20 rounded-lg border border-emerald-500/30 text-center animate-in fade-in">
                            <span className="text-[10px] text-emerald-400 font-bold block mb-1">
                              ✓ {currentRx.productLabel}
                            </span>
                            <KaTeXMath math={currentRx.product} block className="text-emerald-300 font-bold text-xs sm:text-sm" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                        <span className="text-slate-500">কার্ড {reactionIdx + 1} / {HERO_REACTIONS.length}</span>
                        <button
                          type="button"
                          onClick={handleNextReaction}
                          className="text-emerald-400 hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                        >
                          পরবর্তী বিক্রিয়া <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Tab 2: Live Instant MCQ Sandbox */}
                  {activeTab === "mcq" && (
                    <motion.div
                      key="mcq"
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.99 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 transition-all mb-3 select-none min-h-[165px] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1.5">
                          <span className="font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                            বুয়েট ও ভার্সিটি MCQ
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {HERO_QUIZ.examTag}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 mb-2 leading-relaxed">
                          {HERO_QUIZ.question}
                        </h4>

                        {/* Options Grid */}
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {HERO_QUIZ.options.map((opt, oIdx) => {
                            const isChosen = selectedQuizOption === oIdx;
                            let btnStyle = "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700";
                            if (selectedQuizOption !== null) {
                              if (opt.correct) {
                                btnStyle = "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 font-bold";
                              } else if (isChosen) {
                                btnStyle = "bg-rose-500/20 border-rose-500/60 text-rose-300";
                              } else {
                                btnStyle = "bg-slate-950 text-slate-500 border-slate-900 opacity-50";
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleSelectQuiz(oIdx, opt.correct)}
                                className={`p-1.5 rounded-lg border text-center text-xs transition-all cursor-pointer ${btnStyle}`}
                              >
                                <KaTeXMath math={opt.text} />
                              </button>
                            );
                          })}
                        </div>

                        {selectedQuizOption !== null && (
                          <p className="text-[10px] text-emerald-400 font-mono leading-tight bg-emerald-500/5 p-1.5 rounded border border-emerald-500/20">
                            ✓ সঠিক ব্যাখ্যা: {HERO_QUIZ.explanation}
                          </p>
                        )}
                      </div>

                      {selectedQuizOption === null && (
                        <p className="text-[10px] text-slate-500 text-center">
                          👆 সঠিক উত্তরে ক্লিক করে টেস্ট করুন
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 3: Anti-Cheat Focus Lab Sandbox */}
                  {activeTab === "timer" && (
                    <motion.div
                      key="timer"
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.99 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 transition-all mb-3 min-h-[165px] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3.5 h-3.5" /> অ্যান্টি-চিট সিকিউরিটি
                        </span>
                        <span className="text-emerald-400 font-mono font-bold">লাইভ একটিভ</span>
                      </div>

                      <div className="text-center py-2">
                        <div className="text-3xl font-mono font-black text-white tracking-wider">
                          {Math.floor(focusSeconds / 60)}:
                          {String(focusSeconds % 60).padStart(2, "0")}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          অন্য ট্যাবে গেলে অটোমেটিক পজ ও অ্যালার্ট আসবে 🔒
                        </span>
                      </div>

                      <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="text-slate-300">স্টাডি ট্র্যাকার</span>
                        <span className="text-amber-300 font-bold">গুণগত রসায়ন • লেকচার ১</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Lower Strip: Daily Habit Progress & Quick Metric */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">ডেইলি মিশন প্রগ্রেস</span>
                  <div className="flex items-center justify-between text-[11px] font-bold text-white mb-1">
                    <span>আজকের কাজ</span>
                    <span className="text-emerald-400 font-mono">২/৩ সম্পন্ন</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-2/3 rounded-full" />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-teal-400 font-bold">লাইভ স্টুডেন্ট ল্যাব</span>
                    <Users className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <span className="text-[11px] text-white font-mono font-bold mt-1">৩ জন সহপাঠী</span>
                  <span className="text-[9px] text-slate-400">একসাথে পড়াশোনা করছে 🔥</span>
                </div>
              </div>

              {/* Bottom Feature Teaser */}
              <div className="p-2 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-xl flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-300 font-medium">হাজারী-নাগ ও সঞ্জিত স্যারের দাগানো লাইন</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold">আনলকড ✓</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
