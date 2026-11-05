import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import {
  Sun,
  Flame,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  X,
  Sparkles,
  BookOpen,
  CheckSquare,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ICON_MAP = {
  BookOpen,
  CheckSquare,
  Layers,
  Flame,
  Sparkles,
};

export default function MorningReminderPopup() {
  const { user, profile } = useAuth();
  const uid = user?.uid || "guest";
  const todayStr = new Date().toISOString().split("T")[0];
  const dismissedKey = `chemchamp_morning_popup_dismissed_${todayStr}_${uid}`;

  const [isOpen, setIsOpen] = useState(false);
  const [pendingMissions, setPendingMissions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    try {
      const alreadyDismissed = localStorage.getItem(dismissedKey) === "true";
      if (alreadyDismissed) {
        setIsOpen(false);
        return;
      }

      // Read missions config
      let missions = [];
      const customKey = `chemchamp_custom_missions_${uid}`;
      const savedMissions = localStorage.getItem(customKey);
      if (savedMissions) {
        try {
          const parsed = JSON.parse(savedMissions);
          if (Array.isArray(parsed) && parsed.length > 0) missions = parsed;
        } catch {
          // ignore
        }
      }

      if (missions.length === 0) {
        missions = [
          {
            id: "topic",
            title: "১টি টপিক রিডিং (২০ মিনিট ফোকাস)",
            subtitle: "গুণগত রসায়ন বা আপনার চলমান চ্যাপ্টার",
            icon: "BookOpen",
            link: "/study",
            xp: 25,
          },
          {
            id: "mcq",
            title: "১০টি বিগত বছরের MCQ প্র্যাকটিস",
            subtitle: "বোর্ড ও বুয়েট প্রিলিমিনারি প্রশ্ন",
            icon: "CheckSquare",
            link: "/exams",
            xp: 25,
          },
          {
            id: "flashcards",
            title: "৫টি জৈব রসায়ন ফ্ল্যাশকার্ড রিভিশন",
            subtitle: "বিক্রিয়া ও মেকানিজম নোট",
            icon: "Layers",
            link: "/vault",
            xp: 20,
          },
        ];
      }

      // Read today's completed map
      const todayKey = `chemchamp_daily_missions_${todayStr}`;
      let completedMap = {};
      const savedToday = localStorage.getItem(todayKey);
      if (savedToday) {
        try {
          completedMap = JSON.parse(savedToday) || {};
        } catch {
          // ignore
        }
      }

      const remaining = missions.filter((m) => !completedMap[m.id]);
      setTotalCount(missions.length);
      setPendingMissions(remaining);

      // Only show popup if there are uncompleted tasks
      if (remaining.length > 0) {
        // Slight delay for smooth entrance after page mount
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.warn("Could not load morning popup state:", err);
    }
  }, [todayStr, uid]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissedKey, "true");
    } catch {
      // ignore
    }
    setIsOpen(false);
  };

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "শুভ সকাল"
      : currentHour < 17
      ? "শুভ অপরাহ্ন"
      : "শুভ সন্ধ্যা";

  const studentName = user?.displayName || profile?.name || "চ্যাম্পিয়ন";

  return createPortal(
    <AnimatePresence>
      {isOpen && pendingMissions.length > 0 && (
        <motion.div
          key="morning-popup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={handleDismiss}
        >
          <motion.div
            key="morning-popup-card"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow corner */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-inner">
                <Sun className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  আজকের রিমাইন্ডার
                </span>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {greeting}, {studentName}!
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              আপনার <strong>🔥 ডেইলি স্ট্রিক</strong> সচল রাখতে এবং ভর্তি পরীক্ষার প্রস্তুতি এগিয়ে নিতে আজকের বাকি মিশনগুলো শেষ করুন:
            </p>

            {/* Pending missions checklist */}
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
              {pendingMissions.map((mission) => {
                const Icon = ICON_MAP[mission.icon] || BookOpen;
                return (
                  <div
                    key={mission.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100 truncate">
                          {mission.title}
                        </p>
                        <p className="text-[10.5px] text-slate-400 truncate">
                          {mission.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        +{mission.xp} XP
                      </span>
                      <Link
                        to={mission.link || "/study"}
                        onClick={handleDismiss}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 transition-all border border-slate-700"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Motivational note */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                আজকে বাকি আছে <strong>{pendingMissions.length}টি</strong> মিশন। অন্তত ১টি শেষ করলেই স্ট্রিক বৃদ্ধি পাবে!
              </span>
            </div>

            {/* Action button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <span>মিশনে নামুন 🚀</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                পরে করব
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}


