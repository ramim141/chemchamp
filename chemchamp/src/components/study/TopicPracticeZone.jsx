import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import { useAuth } from "../../context/AuthContext";
import { addMistakeQuestion } from "../../services/mistakeService";

export default function TopicPracticeZone({
  questions = [],
  topicTitle = "রসায়ন অনুশীলন",
  loading = false,
  onPracticeComplete,
}) {
  const { user, profile, syncUserProfile } = useAuth();
  const [activeType, setActiveType] = useState("MCQ"); // MCQ | CQ | SQ
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedSolutions, setRevealedSolutions] = useState({});

  const normalizedQuestions = useMemo(() => {
    return (questions || []).map((q, idx) => ({
      id: q.id || `q_${idx}`,
      type: q.type || "MCQ",
      stem: q.stem || q.question || "",
      options: q.options || [],
      answerIndex:
        typeof q.answerIndex === "number"
          ? q.answerIndex
          : typeof q.correctOption === "number"
          ? q.correctOption
          : 0,
      explanation: q.explanation || "",
      tag: q.tag || q.board || "",
      imageUrl: q.imageUrl || "",
      subQuestions: q.subQuestions || [],
      subCategory: q.subCategory || "অনুধাবনমূলক",
      marks: q.marks || 2,
      answer: q.answer || q.explanation || "",
    }));
  }, [questions]);

  const mcqList = normalizedQuestions.filter((q) => (q.type || "MCQ") === "MCQ");
  const cqList = normalizedQuestions.filter((q) => q.type === "CQ");
  const sqList = normalizedQuestions.filter((q) => q.type === "SQ");

  const handleSelectMCQ = async (q, optIdx) => {
    if (selectedAnswers[q.id] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: optIdx }));

    if (optIdx === q.answerIndex) {
      if (syncUserProfile) {
        const curXp = profile?.gamification?.currentXP || 120;
        const curSolved = profile?.stats?.totalSolvedMCQ || 0;
        syncUserProfile({
          gamification: { currentXP: curXp + 5 },
          stats: { totalSolvedMCQ: curSolved + 1 },
        });
      }
    } else {
      await addMistakeQuestion(user?.uid, {
        id: q.id,
        topic: topicTitle,
        question: q.stem,
        correctAnswer: q.options?.[q.answerIndex] || "",
        userWrongAnswer: q.options?.[optIdx] || "",
        explanation: q.explanation || "",
        errorCategory: "theory_lack",
      });
    }

    if (onPracticeComplete) {
      onPracticeComplete();
    }
  };

  const toggleSolution = (qId) => {
    setRevealedSolutions((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Clean Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-bold">
          {[
            { id: "MCQ", label: `বহুনির্বাচনি (${mcqList.length})` },
            { id: "CQ", label: `সৃজনশীল (${cqList.length})` },
            { id: "SQ", label: `সংক্ষিপ্ত প্রশ্ন (${sqList.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveType(item.id)}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                activeType === item.id
                  ? "bg-teal-500 text-slate-950 font-black shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mcqList.length > 0 && (
          <span className="text-xs font-mono text-emerald-400">
            সমাধানকৃত: {Object.keys(selectedAnswers).length}/{mcqList.length} • সঠিক উত্তরে +5 XP
          </span>
        )}
      </div>

      {loading ? (
        <div className="p-4 space-y-4 animate-pulse">
          <div className="space-y-2">
            <div className="w-3/4 h-4 bg-slate-800 rounded" />
            <div className="w-1/2 h-3 bg-slate-800/60 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 rounded-xl bg-slate-900 border border-slate-800/80" />
            ))}
          </div>
        </div>
      ) : normalizedQuestions.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2 max-w-sm mx-auto">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center mx-auto text-lg font-bold">
            🧪
          </div>
          <h4 className="text-sm font-bold text-white">কোনো অনুশীলন প্রশ্ন যুক্ত নেই</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            এই টপিকের জন্য এখনো প্রশ্ন আপলোড করা হয়নি। অ্যাডমিন স্টুডিও থেকে প্রশ্ন ব্যাংক যুক্ত করতে পারেন।
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="divide-y divide-slate-800/70"
          >
          {/* ১. MCQ প্র্যাকটিস */}
          {activeType === "MCQ" && (
            mcqList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                এই টপিকে কোনো বহুনির্বাচনি (MCQ) প্রশ্ন যুক্ত নেই।
              </div>
            ) : (
              mcqList.map((q, idx) => {
                const answered = selectedAnswers[q.id] !== undefined;
                const chosenIdx = selectedAnswers[q.id];
                const isCorrect = chosenIdx === q.answerIndex;

                return (
                  <div key={q.id || idx} className="py-5 first:pt-1 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed">
                        <span className="text-teal-400 font-mono mr-2">{idx + 1}.</span>
                        <KaTeXMath math={q.stem} />
                      </h4>
                      {q.tag && (
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 shrink-0">
                          {q.tag}
                        </span>
                      )}
                    </div>

                    {q.imageUrl && (
                      <img
                        src={q.imageUrl}
                        alt="চিত্র"
                        className="max-h-36 rounded-xl object-contain"
                      />
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm pt-1">
                      {q.options?.map((opt, oIdx) => {
                        let optStyle =
                          "bg-slate-900/50 hover:bg-slate-900 border-slate-800/80 text-slate-200 hover:border-slate-700";

                        if (answered) {
                          if (oIdx === q.answerIndex) {
                            optStyle =
                              "bg-emerald-500/15 border-emerald-500/60 text-emerald-300 font-bold";
                          } else if (oIdx === chosenIdx) {
                            optStyle = "bg-rose-500/15 border-rose-500/60 text-rose-300";
                          } else {
                            optStyle = "opacity-45 border-slate-900 bg-transparent";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={answered}
                            onClick={() => handleSelectMCQ(q, oIdx)}
                            className={`px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between active:scale-98 ${optStyle}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-slate-950/80 text-[11px] font-mono text-slate-400 font-bold flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="break-words">
                                <KaTeXMath math={opt} />
                              </span>
                            </div>

                            {answered && oIdx === q.answerIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                            )}
                            {answered && oIdx === chosenIdx && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Callout */}
                    {answered && q.explanation && (
                      <div className="border-l-2 border-emerald-500 bg-emerald-500/5 pl-3.5 pr-4 py-2.5 rounded-r-lg text-xs sm:text-sm text-slate-300 animate-in fade-in">
                        <span className="text-emerald-400 font-bold mr-1.5">💡 ব্যাখ্যা:</span>
                        <KaTeXMath math={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}

          {/* ২. CQ সৃজনশীল প্র্যাকটিস */}
          {activeType === "CQ" && (
            cqList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                এই টপিকে কোনো সৃজনশীল (CQ) প্রশ্ন যুক্ত নেই।
              </div>
            ) : (
              cqList.map((q, idx) => (
                <div key={q.id || idx} className="py-5 first:pt-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      সৃজনশীল উদ্দীপক #{idx + 1}
                    </span>
                    {q.tag && (
                      <span className="text-[11px] font-mono text-slate-400">{q.tag}</span>
                    )}
                  </div>

                  <div className="border-l-2 border-amber-400/70 bg-amber-500/[0.04] pl-4 pr-4 py-2 rounded-r-lg text-sm text-slate-100 leading-relaxed">
                    <KaTeXMath math={q.stem} />
                  </div>

                  <div className="space-y-3 pt-2">
                    {q.subQuestions?.map((sub, sIdx) => {
                      const showAns = revealedSolutions[`${q.id}_${sIdx}`];
                      return (
                        <div key={sIdx} className="py-2 border-b border-slate-900 last:border-0 text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-semibold text-slate-200 leading-relaxed">
                              <strong className="text-teal-400 mr-1.5">({sub.part})</strong>
                              <KaTeXMath math={sub.question} />{" "}
                              <span className="text-slate-500 text-xs font-mono">
                                [{sub.marks || sIdx + 1} নম্বর]
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleSolution(`${q.id}_${sIdx}`)}
                              className="self-start sm:self-auto text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 shrink-0"
                            >
                              {showAns ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              <span>{showAns ? "উত্তর লুকান" : "সমাধান দেখুন"}</span>
                            </button>
                          </div>

                          {showAns && (
                            <div className="mt-2 border-l-2 border-teal-500 bg-teal-500/5 pl-3.5 pr-4 py-2 rounded-r-lg text-slate-300 leading-relaxed animate-in fade-in">
                              <KaTeXMath math={sub.answer} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          )}

          {/* ৩. SQ সংক্ষিপ্ত প্রশ্ন */}
          {activeType === "SQ" && (
            sqList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                এই টপিকে কোনো সংক্ষিপ্ত (SQ) প্রশ্ন যুক্ত নেই।
              </div>
            ) : (
              sqList.map((q, idx) => {
                const showAns = revealedSolutions[q.id];
                return (
                  <div key={q.id || idx} className="py-4 first:pt-1 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-bold text-slate-100 leading-relaxed">
                        <span className="text-amber-400 font-mono mr-1.5">{idx + 1}.</span>
                        <KaTeXMath math={q.stem} />
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleSolution(q.id)}
                        className="text-xs text-teal-400 hover:text-teal-300 font-bold shrink-0"
                      >
                        {showAns ? "উত্তর লুকান" : "উত্তর দেখুন"}
                      </button>
                    </div>

                    {showAns && (
                      <div className="border-l-2 border-emerald-500 bg-emerald-500/5 pl-3.5 pr-4 py-2 rounded-r-lg text-slate-300 leading-relaxed animate-in fade-in">
                        <KaTeXMath math={q.answer} />
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

