import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Flame,
  Sparkles,
  BookOpen,
  CheckSquare,
  Layers,
  ArrowUpRight,
  Settings2,
  X,
  Plus,
  Trash2,
  GripVertical,
  Save,
} from "lucide-react";
import { fireConfetti as confetti } from "../../utils/confetti";
import { useAuth } from "../../context/AuthContext";
import { soundService } from "../../services/soundService";

const DEFAULT_MISSIONS = [
  {
    id: "topic",
    title: "১টি টপিক রিডিং (২০ মিনিট স্ট্রিক্ট ফোকাস)",
    subtitle: "গুণগত রসায়ন: কোয়ান্টাম সংখ্যা ও পলির নীতি",
    icon: "BookOpen",
    link: "/study",
    actionLabel: "পড়ুন",
    xp: 25,
    isDefault: true,
  },
  {
    id: "mcq",
    title: "১০টি বিগত বছরের বোর্ড ও এডমিশন MCQ প্র্যাকটিস",
    subtitle: "ঢাকা বোর্ড ও বুয়েট প্রিলিমিনারি প্রশ্ন",
    icon: "CheckSquare",
    link: "/exams",
    actionLabel: "প্র্যাকটিস",
    xp: 25,
    isDefault: true,
  },
  {
    id: "flashcards",
    title: "৫টি জৈব রসায়ন ফ্ল্যাশকার্ড রিভিশন",
    subtitle: "অ্যালকাইল হ্যালাইড, উর্টজ ও ক্যানিজারো বিক্রিয়া",
    icon: "Layers",
    link: "/vault",
    actionLabel: "রিভিশন",
    xp: 20,
    isDefault: true,
  },
];

const ICON_MAP = {
  BookOpen,
  CheckSquare,
  Layers,
  Flame,
  Sparkles,
};

const LINK_OPTIONS = [
  { value: "/study", label: "স্টাডি হাব" },
  { value: "/exams", label: "MCQ প্র্যাকটিস" },
  { value: "/vault", label: "কেমিস্ট্রি ভল্ট" },
  { value: "/leaderboard", label: "লিডারবোর্ড" },
  { value: "/profile", label: "প্রোফাইল" },
];

const ICON_OPTIONS = [
  { value: "BookOpen", label: "বই 📖" },
  { value: "CheckSquare", label: "চেকবক্স ✅" },
  { value: "Layers", label: "কার্ড 🗂️" },
  { value: "Flame", label: "ফ্লেম 🔥" },
  { value: "Sparkles", label: "স্পার্কলস ✨" },
];

function getMissions(uid) {
  try {
    const key = `chemchamp_custom_missions_${uid}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_MISSIONS;
}

function saveMissions(uid, missions) {
  try {
    localStorage.setItem(`chemchamp_custom_missions_${uid}`, JSON.stringify(missions));
  } catch {
    // ignore
  }
}

const defaultCompleted = (missions) =>
  Object.fromEntries(missions.map((m) => [m.id, false]));

export default function DailyHabitChecklist({ onStreakUpdate, onCompletedChange }) {
  const { user, profile, syncUserProfile } = useAuth();
  const uid = user?.uid || "guest";
  const todayStr = new Date().toISOString().split("T")[0];
  const todayKey = `chemchamp_daily_missions_${todayStr}`;
  const streakAwardedKey = `chemchamp_streak_awarded_${todayStr}`;
  const allCelebratedKey = `chemchamp_missions_celebrated_${todayStr}`;

  const [missions, setMissions] = useState(() => getMissions(uid));

  const [completedMap, setCompletedMap] = useState(() => {
    try {
      const saved = localStorage.getItem(todayKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return defaultCompleted(getMissions(uid));
  });

  const [streakTriggeredToday, setStreakTriggeredToday] = useState(() => {
    try {
      return localStorage.getItem(streakAwardedKey) === "true";
    } catch {
      return false;
    }
  });

  // Customize modal state
  const [showCustomize, setShowCustomize] = useState(false);
  const [editMissions, setEditMissions] = useState([]);

  const missionsList = missions.map((m) => ({ ...m, completed: !!completedMap[m.id] }));
  const completedCount = missionsList.filter((m) => m.completed).length;
  const isAtLeastOneCompleted = completedCount >= 1;
  const isAllCompleted = completedCount === missionsList.length && missionsList.length > 0;

  // Notify parent of completedMap changes (for MorningReminderPopup)
  useEffect(() => {
    if (onCompletedChange) onCompletedChange(missionsList, completedMap);
  }, [completedMap, missions]);

  useEffect(() => {
    try {
      localStorage.setItem(todayKey, JSON.stringify(completedMap));
    } catch {
      // ignore
    }
  }, [completedMap, todayKey]);

  // Auto-sync missions with actual user activities
  useEffect(() => {
    try {
      const studyToday =
        localStorage.getItem(`chemchamp_study_active_today_${todayStr}`) === "true";
      const mcqCount = profile?.stats?.totalSolvedMCQ || 0;
      const masteredCards = localStorage.getItem("chemchamp_mastered_flashcards");
      const hasFlashcards =
        !!masteredCards && JSON.parse(masteredCards || "[]").length > 0;

      let hasChanges = false;
      const nextMap = { ...completedMap };

      if (studyToday && !nextMap.topic) {
        nextMap.topic = true;
        hasChanges = true;
      }
      if (mcqCount >= 10 && !nextMap.mcq) {
        nextMap.mcq = true;
        hasChanges = true;
      }
      if (hasFlashcards && !nextMap.flashcards) {
        nextMap.flashcards = true;
        hasChanges = true;
      }

      if (hasChanges) {
        setCompletedMap(nextMap);
        localStorage.setItem(todayKey, JSON.stringify(nextMap));
      }
    } catch {
      // ignore
    }
  }, [profile?.stats?.totalSolvedMCQ, todayStr]);

  const toggleMission = async (mission) => {
    const wasCompleted = !!completedMap[mission.id];
    const nextState = !wasCompleted;
    const nextMap = { ...completedMap, [mission.id]: nextState };
    setCompletedMap(nextMap);

    const nextCompletedCount = Object.values(nextMap).filter(Boolean).length;

    if (nextState) {
      soundService.playCorrect();
    } else {
      soundService.playClick();
    }

    let newStreak = profile?.streakCount || profile?.gamification?.streakCount || 1;

    if (nextCompletedCount >= 1 && !streakTriggeredToday) {
      setStreakTriggeredToday(true);
      newStreak = newStreak + 1;
      try {
        localStorage.setItem(streakAwardedKey, "true");
      } catch {
        // ignore
      }
      if (onStreakUpdate) onStreakUpdate(newStreak);
    }

    const currentXP = profile?.gamification?.currentXP || 120;
    const xpDelta = nextState ? mission.xp : -mission.xp;
    let bonusXp = 0;

    if (nextCompletedCount === missions.length) {
      const alreadyCelebrated = localStorage.getItem(allCelebratedKey) === "true";
      if (!alreadyCelebrated) {
        bonusXp = 30;
        soundService.playLevelUp();
        try {
          localStorage.setItem(allCelebratedKey, "true");
        } catch {
          // ignore
        }
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"],
        });
      }
    }

    const updatedXP = Math.max(0, currentXP + xpDelta + bonusXp);
    const currentStudyMins = profile?.stats?.totalStudyMinutes || 20;
    const studyDelta = mission.id === "topic" ? (nextState ? 20 : -20) : 0;

    if (syncUserProfile) {
      await syncUserProfile({
        streakCount: newStreak,
        lastActiveDate: todayStr,
        gamification: {
          currentXP: updatedXP,
          streakCount: newStreak,
          lastActiveDate: todayStr,
        },
        stats: {
          totalStudyMinutes: Math.max(0, currentStudyMins + studyDelta),
        },
      });
    }
  };

  // Open customize modal
  const openCustomize = () => {
    setEditMissions(missions.map((m) => ({ ...m })));
    setShowCustomize(true);
  };

  const addMission = () => {
    const newId = `custom_${Date.now()}`;
    setEditMissions((prev) => [
      ...prev,
      {
        id: newId,
        title: "নতুন মিশন",
        subtitle: "বিস্তারিত লিখুন",
        icon: "BookOpen",
        link: "/study",
        actionLabel: "শুরু",
        xp: 15,
        isDefault: false,
      },
    ]);
  };

  const removeMission = (id) => {
    setEditMissions((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMission = (id, field, value) => {
    setEditMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const saveCustomMissions = () => {
    const valid = editMissions.filter((m) => m.title.trim().length > 0);
    saveMissions(uid, valid);
    setMissions(valid);
    // Reset completedMap for new missions that don't have a state
    const newMap = { ...completedMap };
    valid.forEach((m) => {
      if (!(m.id in newMap)) newMap[m.id] = false;
    });
    setCompletedMap(newMap);
    setShowCustomize(false);
  };

  const resetToDefault = () => {
    setEditMissions(DEFAULT_MISSIONS.map((m) => ({ ...m })));
  };

  return (
    <>
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                ডেইলি মিশন লুপ (Habit Checklist)
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {completedCount}/{missionsList.length} সম্পন্ন
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                প্রতিদিন অন্তত ১টি মিশন সম্পন্ন করলে ডেইলি স্ট্রিক 🔥 বাড়বে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAllCompleted ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" /> সব মিশন শেষ! বোনাস XP অর্জিত 🎉
              </span>
            ) : isAtLeastOneCompleted ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> আজকের স্ট্রিক সক্রিয়!
              </span>
            ) : null}

            {/* Customize Button */}
            <button
              type="button"
              onClick={openCustomize}
              title="মিশন কাস্টমাইজ করুন"
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mb-3.5 border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
            style={{ width: missionsList.length > 0 ? `${(completedCount / missionsList.length) * 100}%` : "0%" }}
          />
        </div>

        {/* Missions List */}
        <div className="space-y-2">
          {missionsList.map((mission) => {
            const Icon = ICON_MAP[mission.icon] || BookOpen;
            return (
              <div
                key={mission.id}
                onClick={() => toggleMission(mission)}
                className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  mission.completed
                    ? "bg-emerald-950/20 border-emerald-500/30 text-slate-300"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-100 hover:bg-slate-950"
                }`}
              >
                <button
                  type="button"
                  className="text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none shrink-0"
                >
                  {mission.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-bold leading-tight truncate ${
                        mission.completed ? "line-through text-slate-400" : "text-slate-100"
                      }`}
                    >
                      {mission.title}
                    </p>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                      +{mission.xp} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{mission.subtitle}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={mission.link}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/30 text-[11px] font-bold text-emerald-400 flex items-center gap-1 transition-all"
                  >
                    <span>{mission.actionLabel}</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <div className="hidden sm:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Customize Modal ── */}
      {showCustomize && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-lg shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setShowCustomize(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                মিশন কাস্টমাইজ করুন
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                আপনার দৈনিক মিশন সম্পাদনা, যোগ বা মুছে ফেলুন। সর্বোচ্চ ৫টি মিশন।
              </p>
            </div>

            <div className="space-y-3 mb-4 max-h-[60vh] overflow-y-auto pr-1">
              {editMissions.map((m, idx) => (
                <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                      <GripVertical className="w-3 h-3" />
                      মিশন #{idx + 1}
                      {m.isDefault && (
                        <span className="text-emerald-500/70 text-[9px]">(ডিফল্ট)</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMission(m.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      মিশনের নাম *
                    </label>
                    <input
                      type="text"
                      value={m.title}
                      onChange={(e) => updateMission(m.id, "title", e.target.value)}
                      placeholder="যেমন: ২০টি MCQ প্র্যাকটিস করুন"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      সাবটাইটেল
                    </label>
                    <input
                      type="text"
                      value={m.subtitle}
                      onChange={(e) => updateMission(m.id, "subtitle", e.target.value)}
                      placeholder="টপিক বা বিস্তারিত নোট"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    />
                  </div>

                  {/* Row: XP + Icon + Link + ActionLabel */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        XP পুরস্কার
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={m.xp}
                        onChange={(e) => updateMission(m.id, "xp", Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        বাটন টেক্সট
                      </label>
                      <input
                        type="text"
                        value={m.actionLabel}
                        onChange={(e) => updateMission(m.id, "actionLabel", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        আইকন
                      </label>
                      <select
                        value={m.icon}
                        onChange={(e) => updateMission(m.id, "icon", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {ICON_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        গন্তব্য লিংক
                      </label>
                      <select
                        value={m.link}
                        onChange={(e) => updateMission(m.id, "link", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        {LINK_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Mission Button */}
            {editMissions.length < 5 && (
              <button
                type="button"
                onClick={addMission}
                className="w-full mb-3 flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন মিশন যোগ করুন
              </button>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetToDefault}
                className="flex-1 py-2 rounded-xl border border-slate-800 bg-slate-950 text-xs font-bold text-slate-400 hover:text-white transition-all"
              >
                ডিফল্টে রিসেট
              </button>
              <button
                type="button"
                onClick={saveCustomMissions}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
