import React, { useState, useEffect } from "react";
import {
  Zap,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookmarkPlus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import { useAuth } from "../../context/AuthContext";
import { mistakeService, ERROR_CATEGORIES } from "../../services/mistakeService";
import { db } from "../../services/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

const DEFAULT_CAPSULE_QUESTIONS = [
  {
    id: "capsule_1",
    tag: "ঢাকা বোর্ড '২৪",
    topic: "গুণগত রসায়ন",
    stem: "একটি উপশক্তিস্তরে সর্বোচ্চ ইলেকট্রন ধারণক্ষমতার সঠিক সূত্র কোনটি?",
    mathStem: "",
    options: [
      { text: "2n^2", isMath: true },
      { text: "2(2l + 1)", isMath: true },
      { text: "(2l + 1)", isMath: true },
      { text: "4l + 1", isMath: true },
    ],
    answerIndex: 1,
    explanation:
      "একটি উপশক্তিস্তরে অরবিটাল সংখ্যা $(2l + 1)$। প্রতিটি অরবিটালে সর্বোচ্চ ২টি বিপরীত স্পিনের ইলেকট্রন থাকতে পারে। সুতরাং মোট ইলেকট্রন সংখ্যা = $2(2l + 1)$ বা $(4l + 2)$।",
  },
  {
    id: "capsule_2",
    tag: "BUET '২৩",
    topic: "জৈব রসায়ন",
    stem: "শুষ্ক ইথারে ধাতব সোডিয়ামের উপস্থিতিতে মিথাইল ব্রোমাইড বিক্রিয়া করে কী উৎপন্ন করে?",
    mathStem: "\\text{CH}_3\\text{Br} + \\text{Na} \\xrightarrow{\\text{dry ether}} ?",
    options: [
      { text: "\\text{CH}_4", isMath: true },
      { text: "\\text{C}_2\\text{H}_6", isMath: true },
      { text: "\\text{C}_3\\text{H}_8", isMath: true },
      { text: "\\text{CH}_3\\text{OCH}_3", isMath: true },
    ],
    answerIndex: 1,
    explanation:
      "এটি উর্জ (Wurtz) বিক্রিয়া: $2\\text{CH}_3\\text{Br} + 2\\text{Na} \\xrightarrow{\\text{dry ether}} \\text{CH}_3\\text{-}\\text{CH}_3 (\\text{Ethane}) + 2\\text{NaBr}$।",
  },
  {
    id: "capsule_3",
    tag: "মেডিকেল '২৩",
    topic: "রাসায়নিক পরিবর্তন",
    stem: "মানুষের রক্তের স্বাভাবিক pH পরিসীমা কত?",
    mathStem: "",
    options: [
      { text: "7.00 - 7.15", isMath: false },
      { text: "7.35 - 7.45", isMath: false },
      { text: "7.80 - 8.00", isMath: false },
      { text: "6.80 - 6.95", isMath: false },
    ],
    answerIndex: 1,
    explanation:
      "মানুষের রক্তের স্বাভাবিক pH পরিসীমা হলো $7.35 - 7.45$ (গড় $7.40$)। রক্তে কার্বনিক অ্যাসিড-বাইকার্বনেট বাফার সিস্টেম এই pH নিয়ন্ত্রণ করে।",
  },
];

export default function MorningCapsuleCard() {
  const { user, profile, syncUserProfile } = useAuth();
  const [questions, setQuestions] = useState(DEFAULT_CAPSULE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [savedToMistakes, setSavedToMistakes] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState("থিওরি ল্যাক");

  // ফায়ারস্টোর থেকে নতুন MCQ থাকলে ৩টি ক্যাপসুল প্রশ্ন লোড করা
  useEffect(() => {
    let mounted = true;
    const loadDailyCapsule = async () => {
      try {
        const snap = await getDocs(query(collection(db, "questions"), limit(15)));
        if (!snap.empty && mounted) {
          const mcqDocs = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((q) => (q.type || "MCQ") === "MCQ" && Array.isArray(q.options) && q.options.length === 4);

          if (mcqDocs.length >= 3) {
            const formatted = mcqDocs.slice(0, 3).map((q) => ({
              id: q.id,
              tag: q.tag || "বোর্ড ও এডমিশন",
              topic: q.topicTitle || q.chapterTitle || "রসায়ন স্পেশাল",
              stem: q.stem,
              mathStem: "",
              options: q.options.map((opt) => ({
                text: String(opt),
                isMath: String(opt).includes("\\") || String(opt).includes("^") || String(opt).includes("_"),
              })),
              answerIndex: Number(q.answerIndex) || 0,
              explanation: q.explanation || "সঠিক উত্তরটি বোর্ড স্ট্যান্ডার্ড অনুযায়ী যাচাইকৃত।",
            }));
            setQuestions(formatted);
          }
        }
      } catch {
        // fallback to DEFAULT_CAPSULE_QUESTIONS
      }
    };
    loadDailyCapsule();
    return () => {
      mounted = false;
    };
  }, []);

  const question = questions[currentIndex] || DEFAULT_CAPSULE_QUESTIONS[0];

  const handleSelect = async (idx) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(true);

    const correct = idx === question.answerIndex;
    if (correct && syncUserProfile) {
      const currentXP = profile?.gamification?.currentXP || 120;
      const totalSolved = (profile?.stats?.totalSolvedMCQ || 0) + 1;
      await syncUserProfile({
        gamification: { currentXP: currentXP + 15 },
        stats: { totalSolvedMCQ: totalSolved },
      });
    }
  };

  const handleSaveToMistakeBox = async (errorCat = selectedErrorType) => {
    if (savedToMistakes) return;
    setSavedToMistakes(true);

    const wrongText =
      selectedOption !== null && question.options[selectedOption]
        ? question.options[selectedOption].text
        : "উত্তর দেওয়া হয়নি";
    const correctText = question.options[question.answerIndex]?.text || "";

    await mistakeService.addMistakes(user?.uid, [
      {
        id: `cap_${question.id}_${Date.now()}`,
        questionId: question.id,
        title: question.stem,
        wrongOption: wrongText,
        correctOption: correctText,
        errorType: errorCat,
        reviewInterval: "১ দিন পর রিভিশন (Box 1)",
        level: 1,
        tag: question.tag,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setSavedToMistakes(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setSavedToMistakes(false);
  };

  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === question.answerIndex;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Zap className="w-4 h-4 fill-teal-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              মর্নিং কেমিস্ট্রি ক্যাপসুল
            </h3>
            <p className="text-[11px] text-slate-400">প্রতিদিন ৩টি বিগত বছরের স্পেশাল প্রশ্ন</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
            প্রশ্ন {currentIndex + 1}/{questions.length}
          </span>
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-amber-300 px-2 py-0.5 rounded-md font-medium">
            {question.tag}
          </span>
        </div>
      </div>

      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 mb-3">
        <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider block mb-1">
          {question.topic}
        </span>
        <div className="text-xs font-medium text-slate-100 leading-relaxed">
          <KaTeXMath math={question.stem} />
        </div>

        {question.mathStem && (
          <div className="mt-2 text-center py-1.5 px-3 bg-slate-900 rounded-md border border-slate-800">
            <KaTeXMath math={question.mathStem} block />
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 mt-3">
          {question.options.map((opt, idx) => {
            let optionStyles =
              "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850";

            if (isAnswered) {
              if (idx === question.answerIndex) {
                optionStyles =
                  "bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold";
              } else if (idx === selectedOption) {
                optionStyles = "bg-rose-950/40 border-rose-500 text-rose-300";
              } else {
                optionStyles = "bg-slate-900/50 border-slate-850 text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${optionStyles}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>
                    {opt.isMath ? <KaTeXMath math={opt.text} /> : <KaTeXMath math={opt.text} />}
                  </span>
                </div>

                {isAnswered && idx === question.answerIndex && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isAnswered && idx === selectedOption && idx !== question.answerIndex && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showExplanation && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-3 space-y-2.5 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>স্মার্ট ব্যাখ্যা:</span>
            </div>

            {isCorrect ? (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> +15 XP অর্জিত!
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveToMistakeBox(selectedErrorType)}
                disabled={savedToMistakes}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-md border transition-all font-semibold ${
                  savedToMistakes
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
                }`}
              >
                <BookmarkPlus className="w-3 h-3" />
                {savedToMistakes ? "মিস্টেক বক্সে যুক্ত ✓" : "মিস্টেক বক্সে রাখুন"}
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-300 leading-relaxed">
            <KaTeXMath math={question.explanation} />
          </div>

          {/* PRD Module 5: Error Categorization when wrong */}
          {!isCorrect && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400 block mb-1.5">
                ভুলের কারণ চিহ্নিত করুন (Error Categorization):
              </span>
              <div className="flex flex-wrap gap-1">
                {ERROR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedErrorType(cat.id);
                      handleSaveToMistakeBox(cat.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                      selectedErrorType === cat.id
                        ? cat.color
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isAnswered && (
        <div className="flex justify-end">
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-emerald-400 transition-all"
            >
              <span>পরবর্তী প্রশ্ন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-bold bg-slate-800 text-slate-200 hover:text-white px-3.5 py-1.5 rounded-lg border border-slate-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>আবার প্র্যাকটিস</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
