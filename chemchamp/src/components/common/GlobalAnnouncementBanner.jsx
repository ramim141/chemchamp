import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Megaphone, X, AlertTriangle, Gift, Sparkles, Info, ArrowRight } from "lucide-react";
import { db } from "../../services/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";
import { cacheService } from "../../services/cacheService";
import { useAuth } from "../../context/AuthContext";

export default function GlobalAnnouncementBanner() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState(() => {
    try {
      const cached = localStorage.getItem("chemchamp_cached_announcements");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const d = localStorage.getItem("chemchamp_dismissed_announcements");
      return d ? JSON.parse(d) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const list = await cacheService.getOrFetch(
          "chemchamp_announcements_cache",
          async () => {
            const snap = await getDocs(query(collection(db, "announcements"), limit(10)));
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          },
          10 * 60 * 1000, // 10 min TTL
          []
        );
        setAnnouncements(list);
      } catch (err) {
        // silent fail
      }
    };
    fetchLive();
  }, []);

  // Filter active, non-dismissed, and audience matching
  const activeNotice = announcements.find((a) => {
    if (a.isActive === false) return false;
    if (dismissedIds.includes(a.id)) return false;

    // Audience filtering
    if (a.target === "pro_only" && !profile?.isPro) return false;
    if (a.target === "free_only" && profile?.isPro) return false;
    if (a.target === "hsc25" && profile?.hscBatch && !profile.hscBatch.includes("25")) return false;
    if (a.target === "hsc26" && profile?.hscBatch && !profile.hscBatch.includes("26")) return false;

    return true;
  });

  if (!activeNotice) return null;

  const handleDismiss = () => {
    const next = [...dismissedIds, activeNotice.id];
    setDismissedIds(next);
    try {
      localStorage.setItem("chemchamp_dismissed_announcements", JSON.stringify(next));
    } catch {}
  };

  // Type styling
  const getTypeTheme = (type) => {
    switch (type) {
      case "alert":
        return {
          bg: "from-rose-950/80 via-slate-900 to-rose-950/80 border-rose-500/40 text-rose-300",
          icon: AlertTriangle,
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          btn: "bg-rose-500 hover:bg-rose-400 text-slate-950",
        };
      case "event":
        return {
          bg: "from-purple-950/80 via-slate-900 to-purple-950/80 border-purple-500/40 text-purple-300",
          icon: Sparkles,
          badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
          btn: "bg-purple-500 hover:bg-purple-400 text-slate-950",
        };
      case "offer":
        return {
          bg: "from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-500/40 text-amber-300",
          icon: Gift,
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          btn: "bg-amber-500 hover:bg-amber-400 text-slate-950",
        };
      default:
        return {
          bg: "from-blue-950/80 via-slate-900 to-teal-950/80 border-teal-500/40 text-teal-300",
          icon: Megaphone,
          badge: "bg-teal-500/20 text-teal-300 border-teal-500/30",
          btn: "bg-teal-500 hover:bg-teal-400 text-slate-950",
        };
    }
  };

  const theme = getTypeTheme(activeNotice.type);
  const IconComp = theme.icon;

  return (
    <div className={`p-3 md:py-2.5 md:px-4 rounded-2xl bg-gradient-to-r ${theme.bg} border shadow-lg flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-xl shrink-0 ${theme.badge} border`}>
          <IconComp className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-white">{activeNotice.title}</span>
            {activeNotice.isSticky && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                পিন নোটিশ
              </span>
            )}
          </div>
          <p className="text-[11.5px] text-slate-300 line-clamp-1">{activeNotice.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {activeNotice.actionLink && (
          <Link
            to={activeNotice.actionLink}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 shadow-md ${theme.btn}`}
          >
            <span>{activeNotice.actionLabel || "অংশ নিন"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="নোটিশ বন্ধ করুন"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

