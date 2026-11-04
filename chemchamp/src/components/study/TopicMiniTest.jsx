import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, RotateCcw, CheckCircle2 } from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { addMistakeQuestion } from "../../services/mistakeService";

export default function TopicMiniTest({
  questions = [],
  topicTitle = "রসায়ন টপিক টেস্ট",
  onPassTest,
  onNextTopic,
}) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isFinished, setIsFinished] = useState(false);

  const quizList = useMemo(() => {
    return (questions || [])
      .filter(
        (q) =>
          (q.type || "MCQ") === "MCQ" &&
          Array.isArray(q.options) &&
          q.options.length >= 2
      )
      .map((q, idx) => ({
        id: q.id || `tq_${idx}`,
        stem: q.stem || q.question || "",
        options: q.options,
        answerIndex:
          typeof q.answerIndex === "number"
            ? q.answerIndex
            : typeof q.correctOption === "number"
            ? q.correctOption
            : 0,
        explanation: q.explanation || "",
        imageUrl: q.imageUrl || "",
      }))
      .slice(0, 5);
  }, [questions]);

  const currentQ = quizList[currentIndex];

  const handleSelect = (optIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIdx }));
  };

  const handleFinish = async () => {
    let correctCount = 0;
    for (let idx = 0; idx < quizList.length; idx++) {
      const q = quizList[idx];
      const chosen = selectedAnswers[idx];
      if (chosen === q.answerIndex) {
        correctCount++;
      } else if (chosen !== undefined) {
        await addMistakeQuestion(user?.uid, {
          id: q.id,
          topic: topicTitle,
          question: q.stem,
          correctAnswer: q.options?.[q.answerIndex] || "",
          userWrongAnswer: q.options?.[chosen] || "",
          explanation: q.explanation || "",
          errorCategory: "theory_lack",
        });
      }
    }

    const scorePercent = Math.round((correctCount / quizList.length) * 100);
    const passed = scorePercent >= 60;

    setIsFinished(true);

    if (passed) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
      if (onPassTest) {
        onPassTest({ correctCount, scorePercent });
      }
    }
  };

  // If no test questions are linked to this topic in Firestore
  if (quizList.length === 0) {
    return (
      <div className="py-10 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center mx-auto text-xl font-bold">
          📝
        </div>
        <div>
          <h4 className="text-base font-bold text-white">
            এই টপিকে কোনো টেস্ট প্রশ্ন যুক্ত নেই
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            নোট ও হাইলাইটস পড়ে থাকলে আপনি সরাসরি এই টপিকটি সম্পন্ন করে পরবর্তী টপিকে যেতে পারেন।
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onPassTest) {
              onPassTest({ correctCount: 1, scorePercent: 100 });
            }
            if (onNextTopic) {
              onNextTopic();
            }
          }}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>টপিক সম্পন্ন হিসেবে চিহ্নিত করুন ➔</span>
        </button>
      </div>
    );
  }

  if (isFinished) {
    let correctCount = 0;
    quizList.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answerIndex) correctCount++;
    });
    const scorePercent = Math.round((correctCount / quizList.length) * 100);
    const passed = scorePercent >= 60;

    return (
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 max-w-md mx-auto animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-3xl mx-auto shadow-lg shadow-emerald-500/20">
          {passed ? "🏆" : "⚡"}
        </div>

        <div>
          <h3 className="text-base font-bold text-white">
            {passed
              ? "টপিক মাস্টারি সম্পন্ন! পরবর্তী টপিক আনলকড 🔓"
              : "আরেকটু অনুশীলন প্রয়োজন!"}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            আপনার স্কোর:{" "}
            <strong className="text-emerald-400">
              {correctCount} / {quizList.length}
            </strong>{" "}
            ({scorePercent}%)
          </p>
        </div>

        {passed ? (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>টপিকটি সম্পন্ন হয়েছে ও +৫০ XP অর্জিত হয়েছে!</span>
            </div>

            {onNextTopic && (
              <button
                type="button"
                onClick={onNextTopic}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>পরবর্তী টপিকে যান</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsFinished(false);
              setCurrentIndex(0);
              setSelectedAnswers({});
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>আবার পরীক্ষা দিন</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <span className="font-bold text-amber-400">
          টপিক মাস্টারি টেস্ট ({currentIndex + 1} / {quizList.length})
        </span>
        <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          পাস মার্ক: ৬০%
        </span>
      </div>

      {/* Question Progress Dots */}
      <div className="flex items-center gap-1.5">
        {quizList.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i === currentIndex
                ? "bg-amber-400"
                : selectedAnswers[i] !== undefined
                ? "bg-teal-500"
                : "bg-slate-800"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <h4 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
            <span className="text-amber-400 font-mono mr-1.5">#{currentIndex + 1}.</span>
            <KaTeXMath math={currentQ.stem} />
          </h4>

          {currentQ.imageUrl && (
            <div className="text-center my-2">
              <img
                src={currentQ.imageUrl}
                alt="চিত্র"
                className="max-h-32 rounded-lg object-contain mx-auto border border-slate-800"
              />
            </div>
          )}

          <div className="space-y-2 text-xs">
            {currentQ.options?.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentIndex] === oIdx;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelect(oIdx)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all active:scale-98 ${
                    isSelected
                      ? "bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm"
                      : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="font-mono text-xs font-bold shrink-0">
                    {String.fromCharCode(65 + oIdx)}.
                  </span>
                  <span className="break-words">
                    <KaTeXMath math={opt} />
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40"
        >
          আগেরটি
        </button>

        {currentIndex < quizList.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            পরেরটি ➔
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
          >
            সাবমিট করুন 🏆
          </button>
        )}
      </div>
    </div>
  );
}
