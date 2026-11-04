import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, DownloadCloud, CheckCircle2, Zap, RefreshCw } from "lucide-react";
import { cacheService } from "../../services/cacheService";
import { MOCK_LESSONS } from "../../data/mockLessons";
import { MOCK_EXAM_DATA } from "../../data/mockExams";
import { useAuth } from "../../context/AuthContext";

export default function OfflineBandwidthWidget() {
  const { profile, syncUserProfile } = useAuth();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [lowBandwidth, setLowBandwidth] = useState(
    () =>
      profile?.preferences?.lowBandwidthMode ||
      localStorage.getItem("chemchamp_low_bandwidth") === "true"
  );
  const [packSaved, setPackSaved] = useState(false);
  const [savingPack, setSavingPack] = useState(false);

  useEffect(() => {
    const checkPack = async () => {
      const saved = await cacheService.get("offline_practice_pack_v1");
      if (saved) setPackSaved(true);
    };
    checkPack();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleLowBandwidth = async () => {
    const next = !lowBandwidth;
    setLowBandwidth(next);
    try {
      localStorage.setItem("chemchamp_low_bandwidth", String(next));
    } catch {
      // ignore
    }
    if (syncUserProfile) {
      await syncUserProfile({
        preferences: {
          ...(profile?.preferences || {}),
          lowBandwidthMode: next,
        },
      });
    }
  };

  const handleSaveOfflinePack = async () => {
    setSavingPack(true);
    try {
      await cacheService.set(
        "offline_practice_pack_v1",
        {
          lessons: MOCK_LESSONS,
          exams: MOCK_EXAM_DATA,
          savedAt: new Date().toISOString(),
        },
        7 * 24 * 60 * 60 * 1000 // 7 days TTL in IndexedDB
      );
      setPackSaved(true);
    } finally {
      setSavingPack(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              অফলাইন প্যাক ও ব্যান্ডউইথ সেভার
            </h3>
            <p className="text-[10px] text-slate-400">
              {isOnline
                ? "অনলাইন • ব্যাকগ্রাউন্ড অটো-সিঙ্ক সক্রিয়"
                : "অফলাইন মোড • IndexedDB থেকে চলছে"}
            </p>
          </div>
        </div>

        {/* Low-Bandwidth Toggle */}
        <button
          type="button"
          onClick={toggleLowBandwidth}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
            lowBandwidth
              ? "bg-teal-500 text-slate-950 border-teal-400 shadow-sm"
              : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700"
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>লো-ব্যান্ডউইথ: {lowBandwidth ? "চালু" : "বন্ধ"}</span>
        </button>
      </div>

      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs">
        <div className="pr-2">
          <span className="font-semibold text-slate-200 block text-[11px]">
            অফলাইন প্র্যাকটিস প্যাক (IndexedDB)
          </span>
          <span className="text-[10px] text-slate-400">
            ইন্টারনেট ছাড়াই নোট, সূত্র ও MCQ পড়ার জন্য সেভ করুন
          </span>
        </div>

        <button
          type="button"
          onClick={handleSaveOfflinePack}
          disabled={savingPack}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1.5 transition-all ${
            packSaved
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
          }`}
        >
          {savingPack ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>সেভ হচ্ছে...</span>
            </>
          ) : packSaved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>প্যাক সেভড ✓</span>
            </>
          ) : (
            <>
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>ডাউনলোড প্যাক</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

