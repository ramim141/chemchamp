import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Flame,
  CheckCircle2,
  Atom,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundService } from "../../services/soundService";
import { useAuth } from "../../context/AuthContext";

const MOTIVATIONAL_QUOTES = [
  "রসায়নে বিক্রিয়ার মতোই, একটানা গভীর মনোযোগ নতুন জ্ঞান সৃষ্টি করে। 🧪",
  "বুয়েট ও মেডিকেল ভর্তি পরীক্ষায় ২৫ মিনিটের গভীর পড়াশোনা ঘন্টার পর ঘন্টা ভাসমান পড়ার চেয়ে বেশি কার্যকর। 🎯",
  "অরবিটালে ইলেকট্রনের মতো আপনার মনোযোগকে নির্দিষ্ট কক্ষে ফোকাসড রাখুন। ⚛️",
  "প্রতিটি সমাধান করা প্রশ্ন আপনাকে আপনার স্বপ্নের ক্যাম্পাসের এক ধাপ কাছে নিয়ে যাচ্ছে। 🏛️",
];

export default function PomodoroStudyModal({ isOpen, onClose }) {
  const { profile, syncUserProfile } = useAuth();

  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const totalSeconds = sessionMinutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  // Change quote periodically
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Main Timer Loop
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // Handle ambient hum
  useEffect(() => {
    if (isActive && ambientAudio) {
      soundService.startAmbientHum();
    } else {
      soundService.stopAmbientHum();
    }
    return () => soundService.stopAmbientHum();
  }, [isActive, ambientAudio]);

  const handleStartPause = () => {
    soundService.playClick();
    setIsActive(!isActive);
  };

  const handleReset = (mins = sessionMinutes) => {
    soundService.playClick();
    setIsActive(false);
    setSessionMinutes(mins);
    setSecondsLeft(mins * 60);
    setSessionCompleted(false);
  };

  const handleCompleteSession = async () => {
    setIsActive(false);
    setSessionCompleted(true);
    soundService.stopAmbientHum();
    soundService.playLevelUp();

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b"],
    });

    // Save study focus minutes & XP
    if (syncUserProfile) {
      const currentXP = profile?.gamification?.currentXP || 120;
      const currentMins = profile?.stats?.totalStudyMinutes || 20;
      const todayStr = new Date().toISOString().split("T")[0];

      // Mark study active today for habits
      try {
        localStorage.setItem(`chemchamp_study_active_today_${todayStr}`, "true");
      } catch {
        // ignore
      }

      await syncUserProfile({
        gamification: {
          currentXP: currentXP + 30, // 30 bonus XP for focus study
        },
        stats: {
          totalStudyMinutes: currentMins + sessionMinutes,
        },
      });
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG Circular progress ring
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="pomodoro-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={() => {
            soundService.stopAmbientHum();
            onClose();
          }}
        >
          <motion.div
            key="pomodoro-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <button
              type="button"
              onClick={() => {
                soundService.stopAmbientHum();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Atom className="w-4 h-4 animate-spin-slow" />
              </div>
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
                পোমোডোরো ল্যাব ফোকাস মোড
              </span>
            </div>
            <h3 className="text-lg font-black text-white">ডিপ কেমিস্ট্রি স্টাডি সেশন</h3>

            {/* Duration Pills */}
            {!isActive && !sessionCompleted && (
              <div className="flex justify-center gap-2 my-4">
                {[15, 25, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleReset(m)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      sessionMinutes === m
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {m} মিনিট
                  </button>
                ))}
              </div>
            )}

            {/* Circular Progress Ring */}
            <div className="relative my-6 flex items-center justify-center">
              <svg className="w-56 h-56 transform -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  className="text-slate-800 stroke-current"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="112"
                  cy="112"
                  r={radius}
                  className="text-emerald-400 stroke-current transition-all duration-1000 ease-linear"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Time text centered */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {sessionCompleted ? (
                  <div className="space-y-1 animate-in zoom-in">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto fill-emerald-400/20" />
                    <span className="text-sm font-black text-white block">সেশন সমাপ্ত!</span>
                    <span className="text-xs font-mono font-bold text-amber-400">+30 XP অর্জিত 🎉</span>
                  </div>
                ) : (
                  <>
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                      {timeDisplay}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {isActive ? "ফোকাস চলছে..." : "বিরতি"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Ambient Noise Toggle */}
            <div className="flex items-center justify-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => {
                  soundService.playClick();
                  setAmbientAudio(!ambientAudio);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  ambientAudio
                    ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {ambientAudio ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>অ্যাম্বিয়েন্ট ল্যাব নয়েজ: {ambientAudio ? "চালু" : "বন্ধ"}</span>
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {sessionCompleted ? (
                <button
                  type="button"
                  onClick={() => handleReset(sessionMinutes)}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>আরেকটি সেশন শুরু করুন</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleStartPause}
                    className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isActive
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Pause className="w-4 h-4" /> বিরতি দিন
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-slate-950" /> পড়াশোনা শুরু করুন
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReset()}
                    title="রিসেট করুন"
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Motivational line */}
            <p className="text-[11px] text-slate-400 mt-5 italic leading-relaxed min-h-[32px]">
              "{MOTIVATIONAL_QUOTES[quoteIdx]}"
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

