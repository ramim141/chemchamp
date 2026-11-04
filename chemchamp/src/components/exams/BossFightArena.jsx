import React, { useState } from "react";
import { Swords, Trophy, Shield, Zap, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BossFightArena({
  bosses = [],
  selectedBoss = null,
  onSelectBoss,
  hp = 1000,
  maxHp = 1000,
  shield = 100,
  onStart,
  defeatedBossIds = [],
}) {
  const [filterPaper, setFilterPaper] = useState("all"); // all | 1 | 2

  const activeBoss = selectedBoss || (bosses.length > 0 ? bosses[0] : null);

  const filteredBosses = bosses.filter((b) => {
    if (filterPaper === "all") return true;
    return Number(b.paper) === Number(filterPaper);
  });

  const isCurrentDefeated = activeBoss
    ? defeatedBossIds.includes(activeBoss.id) || hp === 0
    : false;

  if (bosses.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <Swords className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-300">ডাটাবেজে কোনো অধ্যায় পাওয়া যায়নি</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          অ্যাডমিন স্টুডিও থেকে নতুন অধ্যায় ও প্রশ্ন যুক্ত করলে সংশ্লিষ্ট অধ্যায়ের জন্য স্বয়ংক্রিয়ভাবে বস যুদ্ধ আনলক হবে।
        </p>
      </div>
    );
  }

  if (!activeBoss) return null;

  const hasQuestions = (activeBoss.availableQuestionsCount ?? 1) > 0;

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* ১. বস নির্বাচক ক্যারোজল / গ্রিড */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>ডাটাবেজের অধ্যায়ভিত্তিক বস ({filteredBosses.length}টি অধ্যায়):</span>
          </span>

          <div className="flex items-center gap-1 text-[11px] font-bold">
            {[
              { id: "all", label: "সকল বস" },
              { id: "1", label: "১ম পত্র" },
              { id: "2", label: "২য় পত্র" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setFilterPaper(p.id)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterPaper === p.id
                    ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* বস থাম্বনেইল পিলস */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {filteredBosses.map((boss) => {
            const isSelected = activeBoss.id === boss.id;
            const isBeaten = defeatedBossIds.includes(boss.id);

            return (
              <button
                key={boss.id}
                type="button"
                onClick={() => onSelectBoss && onSelectBoss(boss)}
                className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10"
                    : "bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                {isBeaten && (
                  <span className="absolute top-1.5 right-1.5 text-[10px] text-amber-400">
                    🏆
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{boss.avatar}</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{boss.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {boss.chapterName}
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                  <span>{boss.paper === 2 ? "২য় পত্র" : "১ম পত্র"}</span>
                  <span className={boss.availableQuestionsCount > 0 ? "text-teal-400" : "text-slate-600"}>
                    {boss.availableQuestionsCount > 0
                      ? `${boss.availableQuestionsCount}টি প্রশ্ন`
                      : "প্রশ্ন খালি"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ২. সক্রিয় বস যুদ্ধমঞ্চ (Active Boss Arena Card) */}
      <div
        className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-br ${
          activeBoss.colorTheme || "from-amber-950/40 via-slate-900 to-slate-900"
        } border border-amber-500/30 text-center shadow-2xl relative overflow-hidden`}
      >
        {isCurrentDefeated && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/40 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-amber-300 animate-in zoom-in-95">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>বস পরাজিত! আপনি এই অধ্যায়ের "Boss Slayer" 🏆</span>
          </div>
        )}

        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-center text-5xl mb-3 shadow-inner">
          {activeBoss.avatar}
        </div>

        <div className="space-y-1 mb-3">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block ${
              activeBoss.badgeColor || "bg-amber-500/15 text-amber-300 border-amber-500/30"
            }`}
          >
            {activeBoss.chapterName} ({activeBoss.paper === 2 ? "২য় পত্র" : "১ম পত্র"})
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white">{activeBoss.name}</h3>
          <p className="text-xs text-amber-300/90 font-medium">{activeBoss.title}</p>
        </div>

        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed mb-4">
          {activeBoss.description}
        </p>

        {/* বসের দুর্বলতা ও বিশেষ তথ্য */}
        {activeBoss.weakness && (
          <div className="mb-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 max-w-sm mx-auto flex items-center justify-center gap-2">
            <span className="text-amber-400 font-bold shrink-0">⚡ দুর্বলতা:</span>
            <span className="text-slate-200 truncate">{activeBoss.weakness}</span>
          </div>
        )}

        {/* HP ও শিল্ড বার */}
        <div className="max-w-md mx-auto space-y-2 mb-5">
          <div>
            <div className="flex justify-between text-[11px] font-mono font-bold text-rose-300 mb-1">
              <span>Boss HP: {hp} / {maxHp}</span>
              <span>{Math.round((hp / maxHp) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div
                className="bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, (hp / maxHp) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-teal-400" /> ডিফেন্স শিল্ড: {shield}%
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Trophy className="w-3 h-3" /> বিজয়ী পুরস্কার: +{activeBoss.xpReward || 300} XP
            </span>
          </div>
        </div>

        {/* অ্যাকশন বাটন */}
        {hasQuestions ? (
          <button
            type="button"
            onClick={() => onStart && onStart(activeBoss)}
            className="w-full max-w-md mx-auto py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Swords className="w-4 h-4" />
            <span>
              {isCurrentDefeated
                ? "আবার বস ফাইট শুরু করুন ⚔️"
                : `"${activeBoss.name}" এর বিরুদ্ধে যুদ্ধ শুরু করুন ⚔️`}
            </span>
          </button>
        ) : (
          <div className="max-w-md mx-auto p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
            ⚠️ এই অধ্যায়ের জন্য ডাটাবেজে এখনো কোনো MCQ প্রশ্ন যুক্ত করা হয়নি। অ্যাডমিন স্টুডিও থেকে প্রশ্ন যোগ করলে বস ফাইট আনলক হবে।
          </div>
        )}
      </div>
    </div>
  );
}
