import React, { useState, useEffect, useMemo } from "react";
import {
  Rotate3d,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Search,
  Shuffle,
  Bookmark,
  CheckCircle2,
  LayoutGrid,
  Layers,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";

export default function ReactionFlipCard({ cards = [] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewMode, setViewMode] = useState("focus"); // focus | grid
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [masteredIds, setMasteredIds] = useState(() => {
    try {
      const saved = localStorage.getItem("chemchamp_mastered_flashcards");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    cards.forEach((c) => {
      const t = c.type || c.topic || c.chapter;
      if (t) cats.add(t);
    });
    return Array.from(cats);
  }, [cards]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const cType = card.type || card.topic || card.chapter || "";
      if (selectedCategory !== "all" && cType !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = String(card.name || "").toLowerCase().includes(q);
        const inFront = String(card.front || "").toLowerCase().includes(q);
        const inBack = String(card.back || "").toLowerCase().includes(q);
        const inType = String(cType).toLowerCase().includes(q);
        if (!inName && !inFront && !inBack && !inType) return false;
      }
      return true;
    });
  }, [cards, selectedCategory, searchQuery]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIdx >= filteredCards.length) {
      setCurrentIdx(0);
    }
  }, [filteredCards.length, currentIdx]);

  // Keyboard navigation for focus mode
  useEffect(() => {
    if (viewMode !== "focus") return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, filteredCards.length]);

  if (!cards || cards.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6 space-y-2">
        <Rotate3d className="w-8 h-8 text-amber-500/70 mx-auto animate-pulse" />
        <h4 className="text-sm font-bold text-white">শীঘ্রই আসছে...</h4>
        <p className="text-xs text-slate-400">অ্যাডমিন স্টুডিও থেকে নতুন ফ্লিপকার্ড যুক্ত করা হলে এখানে প্রদর্শিত হবে।</p>
      </div>
    );
  }

  const safeIdx = currentIdx < filteredCards.length ? currentIdx : 0;
  const activeCard = filteredCards[safeIdx] || filteredCards[0];

  const handleNext = () => {
    if (filteredCards.length <= 1) return;
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    if (filteredCards.length <= 1) return;
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleShuffle = () => {
    if (filteredCards.length <= 1) return;
    setIsFlipped(false);
    const rand = Math.floor(Math.random() * filteredCards.length);
    setCurrentIdx(rand);
  };

  const toggleMastered = (cardId) => {
    const next = masteredIds.includes(cardId)
      ? masteredIds.filter((id) => id !== cardId)
      : [...masteredIds, cardId];
    setMasteredIds(next);
    try {
      localStorage.setItem("chemchamp_mastered_flashcards", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const cardName = activeCard?.name || activeCard?.reactionName || "জৈব বিক্রিয়া";
  const cardType = activeCard?.type || activeCard?.topic || activeCard?.chapter || "জৈব রসায়ন";
  const cardFront = activeCard?.front || activeCard?.frontReactant || "";
  const cardBack = activeCard?.back || activeCard?.backProduct || "";
  const cardMechanism = activeCard?.mechanism || activeCard?.mechanismNotes || "";
  const isMastered = activeCard ? masteredIds.includes(activeCard.id) : false;

  return (
    <div className="space-y-4">
      {/* ১. শীর্ষ কন্ট্রোল বার (সার্চ, ক্যাটাগরি ও ভিউ মোড টগল) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        {/* সার্চ বার */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute top-3 left-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="বিক্রিয়ার নাম বা বিকারক খুঁজুন..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* ভিউ মোড ও মাস্টার্ড কাউন্টার */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
            ✓ {masteredIds.length}টি আয়ত্ত
          </span>

          <div className="flex items-center p-0.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("focus")}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === "focus"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="ফোকাস কার্ড ভিউ"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ফোকাস</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                viewMode === "grid"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="গ্রিড ভিউ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">সব কার্ড</span>
            </button>
          </div>
        </div>
      </div>

      {/* ২. ক্যাটাগরি ফিল্টার পিলস */}
      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-amber-500 text-slate-950 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            সব বিক্রিয়া ({cards.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filteredCards.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6 space-y-2">
          <p className="text-xs text-slate-400">আপনার অনুসন্ধানের সাথে কোনো রিঅ্যাকশন মেলেনি।</p>
        </div>
      ) : viewMode === "focus" ? (
        /* ৩. ফোকাস ৩ডি স্টাডি কার্ড (Large Interactive Focus Card) */
        <div className="max-w-3xl mx-auto space-y-3">
          {/* প্রগ্রেস স্ট্রিপ ও কীবোর্ড টিপ */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-mono font-bold text-slate-300">
              কার্ড {safeIdx + 1} / {filteredCards.length}
            </span>
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
              <span>কীবোর্ড:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">←</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">→</kbd>
              <span className="text-slate-500">নেভিগেশন,</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Space</kbd>
              <span className="text-slate-500">ফ্লিপ</span>
            </span>
          </div>

          {/* প্রগ্রেস বার */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-400 h-full transition-all duration-300"
              style={{ width: `${((safeIdx + 1) / filteredCards.length) * 100}%` }}
            />
          </div>

          {/* মূল ফ্লিপ কার্ড কন্টেইনার (Smooth 3D Touch Card) */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[340px] sm:min-h-[360px] cursor-pointer rounded-2xl p-6 sm:p-8 border border-slate-800/90 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl relative flex flex-col justify-between transition-all hover:border-amber-500/50 hover:shadow-amber-500/5 select-none group"
          >
            <div>
              {/* কার্ড টপ বার */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs uppercase font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  {cardType}
                </span>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => toggleMastered(activeCard.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      isMastered
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                    title={isMastered ? "আয়ত্ত করা থেকে সরান" : "আয়ত্ত করা হিসেবে চিহ্নিত করুন"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">{isMastered ? "আয়ত্ত হয়েছে" : "আয়ত্ত করুন"}</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {isFlipped ? "উৎপাদ (Back)" : "বিক্রিয়ক (Front)"}
                  </span>
                </div>
              </div>

              {/* বিক্রিয়ার নাম */}
              <h3 className="text-base sm:text-lg font-black text-white mb-4 group-hover:text-amber-300 transition-colors">
                {cardName}
              </h3>

              {/* ফ্রন্ট ও ব্যাক কনটেন্ট */}
              {!isFlipped ? (
                <div className="text-center py-8 sm:py-10 bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 shadow-inner">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-2 font-mono font-bold">
                    বিক্রিয়ক ও বিক্রিয়ার শর্ত
                  </span>
                  <KaTeXMath math={cardFront} block className="text-emerald-400 text-base sm:text-lg font-bold" />
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="text-center py-4 sm:py-5 bg-emerald-950/20 rounded-xl border border-emerald-500/30 p-3 shadow-inner">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block mb-1 font-mono font-bold">
                      ✓ মূল উৎপাদ
                    </span>
                    <KaTeXMath math={cardBack} block className="text-emerald-300 text-base sm:text-lg font-bold" />
                  </div>

                  {cardMechanism && (
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0" /> মেকানিজম ও এডমিশন টিপস:
                      </span>
                      <KaTeXMath math={cardMechanism} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* কার্ড বটম ইন্টিমেশন */}
            <div className="mt-4 text-center text-xs text-slate-400 border-t border-slate-800/80 pt-3 flex items-center justify-center gap-1.5">
              <Rotate3d className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>কার্ডে স্পর্শ করে বা স্পেসবারে চাপ দিয়ে উত্তর ফ্লিপ করুন</span>
            </div>
          </div>

          {/* নেভিগেশন ও শাফলিং কন্ট্রোলস */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={filteredCards.length <= 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>আগের কার্ড</span>
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-amber-400 hover:border-amber-500/30 transition-all active:scale-95"
              title="র্যান্ডম শাফলিং"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>শাফলিং</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={filteredCards.length <= 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              <span>পরবর্তী কার্ড</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ৪. গ্রিড ভিউ মোড (All Reactions Browse Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCards.map((c, idx) => {
            const isBeaten = masteredIds.includes(c.id);
            return (
              <div
                key={c.id || idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 shadow-lg group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 truncate">
                      {c.type || "জৈব বিক্রিয়া"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleMastered(c.id)}
                      className={`text-xs ${isBeaten ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mb-2">
                    {c.name}
                  </h4>

                  <div className="space-y-1.5">
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-center">
                      <span className="text-[9px] text-slate-500 block mb-0.5 font-mono">বিক্রিয়ক:</span>
                      <KaTeXMath math={c.front} block className="text-emerald-400 text-xs font-bold" />
                    </div>

                    <div className="p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-center">
                      <span className="text-[9px] text-emerald-400 block mb-0.5 font-mono">উৎপাদ:</span>
                      <KaTeXMath math={c.back} block className="text-emerald-300 text-xs font-bold" />
                    </div>
                  </div>
                </div>

                {c.mechanism && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
                    <strong className="text-amber-400">টিপস: </strong>
                    {c.mechanism}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
