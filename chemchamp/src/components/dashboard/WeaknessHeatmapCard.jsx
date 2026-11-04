import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ArrowRight, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { mistakeService } from "../../services/mistakeService";

export default function WeaknessHeatmapCard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all"); // all | weak | medium | strong
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMistakes = async () => {
      setLoading(true);
      try {
        const list = await mistakeService.fetchMistakes(user?.uid);
        setMistakes(list || []);
      } catch (err) {
        console.warn("Could not load mistakes for heatmap:", err);
        setMistakes([]);
      } finally {
        setLoading(false);
      }
    };
    loadMistakes();
  }, [user?.uid]);

  // Group mistakes dynamically by chapter & topic
  const dynamicTopics = useMemo(() => {
    if (!mistakes || mistakes.length === 0) {
      return [];
    }

    const groups = new Map();
    mistakes.forEach((m) => {
      const chName = m.chapter || "জৈব রসায়ন";
      const topName = m.topic || m.title || "গুরুত্বপূর্ণ কনসেপ্ট";
      const key = `${chName}_${topName}`;

      if (!groups.has(key)) {
        groups.set(key, {
          id: `dyn_${key}`,
          paper: m.paper || 1,
          chapter: chName,
          topic: topName,
          mistakeCount: 0,
        });
      }
      const existing = groups.get(key);
      existing.mistakeCount += 1;
    });

    return Array.from(groups.values()).map((item) => {
      let status = "strong";
      let score = 90;
      if (item.mistakeCount >= 2) {
        status = "weak";
        score = Math.max(30, 60 - item.mistakeCount * 10);
      } else if (item.mistakeCount === 1) {
        status = "medium";
        score = 70;
      }

      return {
        ...item,
        status,
        score,
        solvedCount: item.mistakeCount + 5,
      };
    });
  }, [mistakes]);

  const filtered = dynamicTopics.filter((item) =>
    filter === "all" ? true : item.status === filter
  );

  const counts = {
    strong: dynamicTopics.filter((t) => t.status === "strong").length,
    medium: dynamicTopics.filter((t) => t.status === "medium").length,
    weak: dynamicTopics.filter((t) => t.status === "weak").length,
  };

  const getBadgeStyle = (status) => {
    if (status === "strong") {
      return {
        label: "সবল",
        card: "bg-emerald-950/25 border-emerald-500/35 hover:border-emerald-400",
        pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        bar: "bg-emerald-500",
        dot: "bg-emerald-400",
      };
    }
    if (status === "medium") {
      return {
        label: "মাঝারি",
        card: "bg-amber-950/25 border-amber-500/35 hover:border-amber-400",
        pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        bar: "bg-amber-400",
        dot: "bg-amber-400",
      };
    }
    return {
      label: "দুর্বল ⚠️",
      card: "bg-rose-950/25 border-rose-500/40 hover:border-rose-400",
      pill: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      bar: "bg-rose-500",
      dot: "bg-rose-500 animate-pulse",
    };
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <span>ব্যক্তিগত উইকনেস হিটম্যাপ</span>
              {mistakes.length > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {mistakes.length}টি ভুল চিহ্নিত
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              মক টেস্ট ও কুইজের ভুল হওয়া প্রশ্ন অনুযায়ী লাইভ এনালাইসিস
            </p>
          </div>
        </div>

        {/* Filter Pills (only show if we have topics) */}
        {dynamicTopics.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === "all" ? "bg-slate-800 text-white font-black" : "text-slate-400 hover:text-white"
              }`}
            >
              সব ({dynamicTopics.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("weak")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === "weak"
                  ? "bg-rose-500 text-white font-black"
                  : "text-rose-400 hover:text-rose-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>দুর্বল ({counts.weak})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("medium")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === "medium"
                  ? "bg-amber-500 text-slate-950 font-black"
                  : "text-amber-400 hover:text-amber-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>মাঝারি ({counts.medium})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("strong")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === "strong"
                  ? "bg-emerald-500 text-slate-950 font-black"
                  : "text-emerald-400 hover:text-emerald-300"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>সবল ({counts.strong})</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Empty State */}
      {dynamicTopics.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-white mb-1">
              এখনো কোনো দুর্বল টপিক রেকর্ড হয়নি 🎉
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              আপনি এখনো কোনো মক টেস্ট বা MCQ প্র্যাকটিসে ভুল করেননি। নিয়মিত কুইজ ও চ্যাপ্টার টেস্ট দিলে যে টপিকগুলোতে আপনার ভুল হবে, সেগুলো স্বয়ংক্রিয়ভাবে এখানে <strong>দুর্বল (Weak)</strong>, <strong>মাঝারি (Medium)</strong> এবং <strong>সবল (Strong)</strong> ক্যাটাগরিতে হিটম্যাপ হিসেবে দৃশ্যমান হবে।
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              to="/exams"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>MCQ প্র্যাকটিস শুরু করুন</span>
            </Link>
            <Link
              to="/study"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>টপিক পড়ুন</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Grid of Dynamic Topics */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item) => {
            const style = getBadgeStyle(item.status);
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border ${style.card} flex flex-col justify-between transition-all group shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-slate-800">
                      {item.chapter}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${style.pill}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <span>{style.label}</span>
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {item.topic}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400 font-mono">দখল: {item.score}%</span>
                      {item.mistakeCount > 0 && (
                        <span className="text-rose-400 font-mono text-[9.5px]">
                          {item.mistakeCount}টি ভুল
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={item.status === "weak" ? "/exams?tab=mistakes" : "/study"}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10.5px] font-bold text-slate-300 hover:text-white border border-slate-800 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <span>{item.status === "weak" ? "ভুল রিভিশন" : "পড়ুন"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
