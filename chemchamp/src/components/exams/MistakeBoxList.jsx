import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Award,
  X,
  Tag,
  Trash2,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import { ERROR_CATEGORIES } from "../../services/mistakeService";

export default function MistakeBoxList({
  questions = [],
  onUpdateMistake,
  onClearMistake,
}) {
  const [activeBoxFilter, setActiveBoxFilter] = useState("all"); // all | 1 | 2 | 3 | 4
  const [activeErrorFilter, setActiveErrorFilter] = useState("all"); // all | errorType
  const [activeReTest, setActiveReTest] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [reTestFeedback, setReTestFeedback] = useState(null);

  const boxLabels = {
    all: "সকল বক্স",
    1: "Box 1 (১ দিন পর)",
    2: "Box 2 (৩ দিন পর)",
    3: "Box 3 (৭ দিন পর)",
    4: "Mastered (২১ দিন পর)",
  };

  const filteredQuestions = questions.filter((q) => {
    const level = q.level || 1;
    const matchesBox =
      activeBoxFilter === "all" ? true : level === Number(activeBoxFilter);
    const matchesErr =
      activeErrorFilter === "all"
        ? true
        : (q.errorType || "থিওরি ল্যাক") === activeErrorFilter;
    return matchesBox && matchesErr;
  });

  const handleStartReTest = (q) => {
    setActiveReTest(q);
    setSelectedOption(null);
    setReTestFeedback(null);
  };

  const handleChangeErrorCategory = (q, newErrorType) => {
    if (onUpdateMistake) {
      onUpdateMistake({
        ...q,
        errorType: newErrorType,
      });
    }
  };

  const handleVerifyAnswer = (optionChosen) => {
    setSelectedOption(optionChosen);
    const isCorrect = optionChosen === activeReTest.correctOption;
    setReTestFeedback({ isCorrect });

    if (onUpdateMistake) {
      const currentLevel = activeReTest.level || 1;
      const nextLevel = isCorrect ? Math.min(4, currentLevel + 1) : 1;
      const nextInterval =
        nextLevel === 4
          ? "২১ দিন পর (Mastered) 🏆"
          : nextLevel === 3
          ? "৭ দিন পর রিভিশন"
          : nextLevel === 2
          ? "৩ দিন পর রিভিশন"
          : "১ দিন পর রিভিশন";

      setTimeout(() => {
        onUpdateMistake({
          ...activeReTest,
          level: nextLevel,
          reviewInterval: nextInterval,
        });
      }, 900);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
        <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-400 animate-pulse" />
        <h4 className="text-sm font-bold text-white mb-1">
          অসাধারণ! মিস্টেক বক্স সম্পূর্ণ ফাঁকা
        </h4>
        <p className="text-xs text-slate-400">
          পরীক্ষায় বা ক্যাপসুলে ভুল হওয়া প্রশ্নগুলো স্বয়ংক্রিয়ভাবে এখানে এসে জমা হবে।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Leitner Spaced Repetition & Error Categorization Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-rose-950/30 border border-rose-500/20 rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Leitner Spaced Repetition ও এরর ক্যাটাগরাইজেশন
              </h3>
              <p className="text-[11px] text-slate-400">
                ভুল প্রশ্ন ১ দিন ➔ ৩ দিন ➔ ৭ দিন ➔ ২১ দিন পর পর রিভিশন কিউতে পুশ হয়
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-rose-400 font-bold bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 rounded-lg">
            {questions.length}টি প্রশ্ন ট্র্যাকিংয়ে
          </span>
        </div>

        {/* Leitner Box Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
          {["all", "1", "2", "3", "4"].map((boxKey) => (
            <button
              key={boxKey}
              type="button"
              onClick={() => setActiveBoxFilter(boxKey)}
              className={`px-3 py-1 rounded-lg font-bold whitespace-nowrap transition-all ${
                activeBoxFilter === boxKey
                  ? "bg-rose-500 text-white shadow-sm"
                  : "bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {boxLabels[boxKey]}
            </button>
          ))}
        </div>

        {/* Error Categorization Filter Bar (PRD Module 5) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] pt-1 border-t border-slate-800/70">
          <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-400" /> ভুলের ধরন:
          </span>
          <button
            type="button"
            onClick={() => setActiveErrorFilter("all")}
            className={`px-2.5 py-0.5 rounded-md font-bold whitespace-nowrap transition-all ${
              activeErrorFilter === "all"
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            সব কারণ
          </button>
          {ERROR_CATEGORIES.map((cat) => {
            const count = questions.filter(
              (q) => (q.errorType || "থিওরি ল্যাক") === cat.id
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveErrorFilter(cat.id)}
                className={`px-2.5 py-0.5 rounded-md font-semibold border whitespace-nowrap transition-all ${
                  activeErrorFilter === cat.id
                    ? cat.color
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions list */}
      {filteredQuestions.length === 0 ? (
        <div className="p-6 text-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
          <p className="text-xs">এই ফিল্টারে বর্তমানে কোনো ভুল প্রশ্ন নেই।</p>
        </div>
      ) : (
        filteredQuestions.map((q) => {
          const level = q.level || 1;
          const isMastered = level >= 4;
          const currentErrorType = q.errorType || "থিওরি ল্যাক";

          return (
            <div
              key={q.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isMastered
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-slate-900/80 border-rose-500/20 hover:border-rose-500/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                      isMastered
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 flex items-center gap-1"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    }`}
                  >
                    {isMastered ? (
                      <>
                        <Award className="w-3 h-3 text-emerald-400" /> Mastered (Box 4 • ২১ দিন)
                      </>
                    ) : (
                      `Box ${level} (${q.reviewInterval || "১ দিন পর রিভিশন"})`
                    )}
                  </span>

                  {q.tag && (
                    <span className="text-[10px] text-amber-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      [{q.tag}]
                    </span>
                  )}
                </div>

                {onClearMistake && (
                  <button
                    type="button"
                    onClick={() => onClearMistake(q.id)}
                    title="তালিকা থেকে মুছুন"
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                <KaTeXMath math={q.title} />
              </h4>

              <div className="space-y-1.5 text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <p className="text-rose-400 flex items-start gap-1.5">
                  <span className="shrink-0 font-bold">❌ আপনার ভুল:</span>
                  <span>
                    <KaTeXMath math={String(q.wrongOption)} />
                  </span>
                </p>
                <p className="text-emerald-400 flex items-start gap-1.5">
                  <span className="shrink-0 font-bold">✓ সঠিক উত্তর:</span>
                  <span>
                    <KaTeXMath math={String(q.correctOption)} />
                  </span>
                </p>
              </div>

              {/* PRD Module 5: Error Categorization Selector + Re-test button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1 border-t border-slate-800/70">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 mr-1 font-medium">
                    ভুলের কারণ মার্ক করুন:
                  </span>
                  {ERROR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleChangeErrorCategory(q, cat.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                        currentErrorType === cat.id
                          ? cat.color
                          : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleStartReTest(q)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>পুনরায় সমাধান করুন</span>
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Interactive Re-Test Modal */}
      {activeReTest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm p-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveReTest(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Leitner স্পেসড রিপিটেশন ড্রিল
            </span>

            <h3 className="text-xs font-bold text-white mt-2 mb-3 leading-relaxed">
              <KaTeXMath math={activeReTest.title} />
            </h3>

            <p className="text-[11px] text-slate-400 mb-2">সঠিক অপশনটি বেছে নিন:</p>

            <div className="space-y-2">
              {[activeReTest.wrongOption, activeReTest.correctOption]
                .sort()
                .map((opt, i) => {
                  const isChosen = selectedOption === opt;
                  const isCorrectAnswer = opt === activeReTest.correctOption;

                  let optStyle =
                    "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700";
                  if (reTestFeedback) {
                    if (isCorrectAnswer) {
                      optStyle =
                        "bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold";
                    } else if (isChosen && !isCorrectAnswer) {
                      optStyle = "bg-rose-950/60 border-rose-500 text-rose-300";
                    }
                  }

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={reTestFeedback !== null}
                      onClick={() => handleVerifyAnswer(opt)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>
                        <KaTeXMath math={String(opt)} />
                      </span>
                      {reTestFeedback && isCorrectAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                      )}
                      {reTestFeedback && isChosen && !isCorrectAnswer && (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
            </div>

            {reTestFeedback && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                  reTestFeedback.isCorrect
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {reTestFeedback.isCorrect ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>অভিনন্দন! প্রশ্নটি পরবর্তী Leitner বক্সে উন্নীত হয়েছে।</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>ভুল উত্তর! প্রশ্নটি পুনরায় Box 1 (১ দিন পর)-এ পাঠানো হয়েছে।</span>
                  </>
                )}
              </div>
            )}

            {reTestFeedback && (
              <button
                type="button"
                onClick={() => setActiveReTest(null)}
                className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all"
              >
                বন্ধ করুন
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
