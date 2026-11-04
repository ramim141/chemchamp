import React, { useState, useEffect, useMemo } from "react";
import {
  Timer,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Shuffle,
  FileCheck2,
  ListOrdered,
  RotateCcw,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { mistakeService, ERROR_CATEGORIES } from "../../services/mistakeService";
import { examHistoryService } from "../../services/examHistoryService";
import { soundService } from "../../services/soundService";

export default function ExamRunnerModal({ examData, onClose, onFinish }) {
  const { user, profile, syncUserProfile } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [examViewMode, setExamViewMode] = useState("standard"); // "standard" | "omr"
  const [secondsRemaining, setSecondsRemaining] = useState(
    (examData.durationMinutes || 15) * 60
  );
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [errorCategoriesMap, setErrorCategoriesMap] = useState({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Anti-Cheat: Tab/Window switch monitoring
  useEffect(() => {
    if (isFinished) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFinished]);

  // PRD Module 8: র্যান্ডম শাফলিং (Random Question Shuffling)
  const questions = useMemo(() => {
    const raw = examData.questions || [];
    if (examData.shuffleQuestions === false) return raw;
    return [...raw].sort(() => Math.random() - 0.5);
  }, [examData]);

  const currentQ = questions[currentIndex] || questions[0];

  // 1. Live Countdown Timer
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, selectedAnswers]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSelectOption = (optIndex, qIdx = currentIndex) => {
    soundService.playClick();
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optIndex,
    }));
  };

  const handleClearAnswer = (qIdx = currentIndex) => {
    soundService.playClick();
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
  };

  // 2. Submit Exam & Grade with -0.25 Negative Marking
  const handleSubmitExam = async () => {
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    const mistakesToSave = [];

    questions.forEach((q, idx) => {
      const studentAns = selectedAnswers[idx];
      if (studentAns === undefined) {
        skippedCount++;
      } else if (studentAns === Number(q.answerIndex)) {
        correctCount++;
      } else {
        wrongCount++;
        mistakesToSave.push({
          id: `m_${Date.now()}_${idx}`,
          questionId: q.id || `q_${idx}`,
          title: q.stem,
          wrongOption: q.options[studentAns],
          correctOption: q.options[q.answerIndex],
          errorType: "থিওরি ল্যাক",
          reviewInterval: "১ দিন পর রিভিশন (Box 1)",
          level: 1,
          tag: q.tag || "মক টেস্ট",
        });
      }
    });

    const totalQuestions = questions.length;
    const negFactor = Number(examData.negativeMarking) || 0.25;
    const finalScore = Math.max(
      0,
      Number((correctCount * 1 - wrongCount * negFactor).toFixed(2))
    );
    const accuracy =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const gainedXp = correctCount * 30 + (accuracy >= 80 ? 50 : 10);

    const resultSummary = {
      examId: examData.id || "mock_exam",
      examTitle: examData.title || "কেমিস্ট্রি মক টেস্ট",
      chapter: examData.chapter || examData.chapterTitle || "সাধারণ রসায়ন",
      paper: examData.paper || 1,
      targetTag: examData.tag || "মক টেস্ট",
      totalQuestions,
      correctCount,
      wrongCount,
      skippedCount,
      finalScore,
      accuracy,
      gainedXp,
      mistakes: mistakesToSave,
      studentName: profile?.name || user?.displayName || "শিক্ষার্থী",
      studentEmail: user?.email || "",
      studentCollege: profile?.college || "কলেজ অনুল্লেখিত",
      hscBatch: profile?.hscBatch || "HSC-25",
      tabSwitchCount,
      timeTakenSeconds: Math.max(1, (examData.durationMinutes || 15) * 60 - secondsRemaining),
    };

    setResults(resultSummary);
    setIsFinished(true);

    // Auto-save to Exam History Tracker
    examHistoryService.saveAttempt(user?.uid, resultSummary);

    if (accuracy >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Auto-populate Smart Mistake Box (PRD Module 8)
    if (mistakesToSave.length > 0) {
      await mistakeService.addMistakes(user?.uid, mistakesToSave);
    }

    // Update student gamification and stats
    if (syncUserProfile) {
      const currentXP = (profile?.gamification?.currentXP || 120) + gainedXp;
      const totalSolved = (profile?.stats?.totalSolvedMCQ || 0) + correctCount;
      const prevAcc = profile?.stats?.accuracyRate || 88;
      const newAcc = Math.round((prevAcc + accuracy) / 2);

      await syncUserProfile({
        gamification: { currentXP },
        stats: {
          totalSolvedMCQ: totalSolved,
          accuracyRate: newAcc,
        },
      });
    }

    if (onFinish) {
      onFinish(resultSummary);
    }
  };

  const handleTagMistakeReason = async (mistakeId, reason) => {
    setErrorCategoriesMap((prev) => ({ ...prev, [mistakeId]: reason }));
    const target = results?.mistakes?.find((m) => m.id === mistakeId);
    if (target) {
      await mistakeService.updateMistake(user?.uid, {
        ...target,
        errorType: reason,
      });
    }
  };

  if (!currentQ) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {examData.chapter || "কেমিস্ট্রি পরীক্ষা"}
              </span>
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                <Shuffle className="w-2.5 h-2.5" /> শাফলড
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-white mt-1 truncate max-w-[200px] sm:max-w-xs">
              {examData.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Standard vs OMR */}
            {!isFinished && (
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setExamViewMode("standard")}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    examViewMode === "standard"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ListOrdered className="w-3 h-3" />
                  <span className="hidden sm:inline">স্ট্যান্ডার্ড</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExamViewMode("omr")}
                  className={`px-2 py-1 rounded transition-all flex items-center gap-1 ${
                    examViewMode === "omr"
                      ? "bg-emerald-500 text-slate-950 font-bold"
                      : "text-slate-400 hover:text-emerald-400"
                  }`}
                >
                  <FileCheck2 className="w-3 h-3" />
                  <span>ওএমআর মোড 🎯</span>
                </button>
              </div>
            )}

            {!isFinished && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${
                  secondsRemaining < 120
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse"
                    : "bg-slate-900 border-slate-800 text-teal-400"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isFinished ? (
            /* ACTIVE EXAM RUNNER */
            examViewMode === "omr" ? (
              /* ─── REAL OMR BUBBLE SHEET VIEW ─── */
              <div className="space-y-4">
                {/* OMR Banner Header */}
                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        রিয়েল ওএমআর শিট (BUET & Medical Pattern)
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          {Object.keys(selectedAnswers).length}/{questions.length} পূরণকৃত
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        বৃত্তে স্পর্শ করে দাগান। ভুল উত্তরের নেগেটিভ পেনাল্টি: -{examData.negativeMarking || 0.25}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                    বাকি: {questions.length - Object.keys(selectedAnswers).length}টি
                  </span>
                </div>

                {/* Grid Layout: Active Question Reference (Left) + OMR Bubble Sheet (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Active Question Box */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-emerald-400">
                          প্রশ্ন #{currentIndex + 1}
                        </span>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                          [{currentQ.tag || "কেমিস্ট্রি"}]
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                        <KaTeXMath math={currentQ.stem} />
                      </div>
                      {currentQ.imageUrl && (
                        <img
                          src={currentQ.imageUrl}
                          alt="উদ্দীপক"
                          className="max-h-28 rounded-lg mx-auto object-contain border border-slate-800"
                        />
                      )}
                    </div>

                    {/* Options list for reading */}
                    <div className="space-y-1.5">
                      {currentQ.options.map((opt, optIdx) => {
                        const optionLetters = ["ক", "খ", "গ", "ঘ"];
                        const isSelected = selectedAnswers[currentIndex] === optIdx;
                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx, currentIndex)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                              isSelected
                                ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold"
                                : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border ${
                                  isSelected
                                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                                    : "bg-slate-900 border-slate-700 text-slate-400"
                                }`}
                              >
                                {optionLetters[optIdx]}
                              </span>
                              <span>
                                <KaTeXMath math={String(opt)} />
                              </span>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* OMR Bubble Grid (Right) */}
                  <div className="lg:col-span-6 bg-slate-950/90 rounded-2xl border border-slate-800 p-3.5 sm:p-4 space-y-2 max-h-[460px] overflow-y-auto">
                    <div className="text-center pb-2 border-b border-slate-800">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                        উত্তরপত্র (OMR ANSWER SHEET)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {questions.map((q, qIdx) => {
                        const isCur = qIdx === currentIndex;
                        const studentChoice = selectedAnswers[qIdx];
                        const optionLetters = ["ক", "খ", "গ", "ঘ"];

                        return (
                          <div
                            key={qIdx}
                            onClick={() => setCurrentIndex(qIdx)}
                            className={`py-2 px-2 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                              isCur
                                ? "bg-emerald-500/10 border border-emerald-500/30"
                                : "hover:bg-slate-900/60 border border-transparent"
                            }`}
                          >
                            <span className="w-8 text-[11px] font-mono font-bold text-slate-400">
                              #{qIdx + 1}
                            </span>

                            {/* Circular Bubbles */}
                            <div className="flex items-center gap-2.5 sm:gap-3">
                              {[0, 1, 2, 3].map((optIndex) => {
                                const isFilled = studentChoice === optIndex;
                                return (
                                  <button
                                    key={optIndex}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectOption(optIndex, qIdx);
                                      setCurrentIndex(qIdx);
                                    }}
                                    title={`প্রশ্ন ${qIdx + 1}: অপশন ${optionLetters[optIndex]}`}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center font-bold text-[11px] transition-all transform active:scale-90 ${
                                      isFilled
                                        ? "bg-slate-950 border-emerald-400 text-emerald-400 shadow-[inset_0_0_8px_rgba(16,185,129,0.8)] scale-105"
                                        : "bg-slate-900/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                                    }`}
                                  >
                                    {isFilled ? "●" : optionLetters[optIndex]}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Clear option button */}
                            {studentChoice !== undefined ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearAnswer(qIdx);
                                }}
                                title="দাগানো বাতিল"
                                className="p-1 text-slate-500 hover:text-rose-400 text-[10px]"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            ) : (
                              <div className="w-5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── STANDARD QUESTION CARD VIEW ─── */
              <div>
              {/* Progress & Tag */}
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-slate-400 font-medium">
                  প্রশ্ন {currentIndex + 1} / {questions.length} • নেগেটিভ মার্কিং: -{examData.negativeMarking || 0.25}
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  [{currentQ.tag || "HSC & Admission"}]
                </span>
              </div>

              {/* Question Stem */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 mb-4 space-y-2">
                <div className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                  <KaTeXMath math={currentQ.stem} />
                </div>
                {currentQ.imageUrl && (
                  <img
                    src={currentQ.imageUrl}
                    alt="উদ্দীপক"
                    className="max-h-32 rounded-lg mx-auto object-contain border border-slate-800"
                  />
                )}
              </div>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {currentQ.options.map((option, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const optionLetters = ["ক", "খ", "গ", "ঘ"];
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3 rounded-lg border text-left text-xs transition-all flex items-center justify-between group ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-sm"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-900 border border-slate-700 text-slate-400 group-hover:text-white"
                          }`}
                        >
                          {optionLetters[optIdx]}
                        </span>
                        <span>
                          <KaTeXMath math={String(option)} />
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Option Action (Clear) */}
              {selectedAnswers[currentIndex] !== undefined && (
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={handleClearAnswer}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline transition-colors"
                  >
                    উত্তর ক্লিয়ার করুন (নেগেটিভ মার্ক এড়াতে)
                  </button>
                </div>
              )}

              {/* Question Palette Navigation Bubbles */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                  প্রশ্ন প্যালেট
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {questions.map((_, idx) => {
                    const answered = selectedAnswers[idx] !== undefined;
                    const isCur = idx === currentIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-7 h-7 rounded-md font-mono text-xs font-bold transition-all ${
                          isCur
                            ? "ring-2 ring-emerald-400 bg-emerald-500 text-slate-950 font-black"
                            : answered
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        ) : (
            /* EXAM RESULT SHEET */
            <div className="space-y-4 animate-in fade-in">
              <div className="text-center p-4 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-2xl mx-auto mb-2 shadow-lg shadow-emerald-500/20">
                  🏆
                </div>
                <h3 className="text-base font-bold text-white">ইনস্ট্যান্ট রেজাল্ট শিট</h3>
                <p className="text-xs text-slate-400 mt-0.5">{examData.title}</p>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">প্রাপ্ত মার্কস</span>
                    <span className="text-sm font-black text-emerald-400">
                      {results.finalScore} / {results.totalQuestions}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">এক্যুরেসি</span>
                    <span className="text-sm font-black text-teal-400">{results.accuracy}%</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">অর্জিত XP</span>
                    <span className="text-sm font-black text-amber-400">+{results.gainedXp} XP</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-900">
                  <span className="text-emerald-400">✓ সঠিক: {results.correctCount}টি</span>
                  <span className="text-rose-400">❌ ভুল: {results.wrongCount}টি</span>
                  <span className="text-slate-500">⚪ বাদ: {results.skippedCount}টি</span>
                </div>
              </div>

              {/* Detailed Solutions Review & Error Categorization */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  প্রশ্নোত্তর বিশ্লেষণ, ব্যাখ্যা ও এরর ক্যাটাগরাইজেশন
                </h4>
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                    const studentAns = selectedAnswers[idx];
                    const isCorrect = studentAns === Number(q.answerIndex);
                    const isSkipped = studentAns === undefined;
                    const correspondingMistake = results.mistakes?.find(
                      (m) => m.title === q.stem
                    );
                    const chosenReason =
                      (correspondingMistake &&
                        errorCategoriesMap[correspondingMistake.id]) ||
                      "থিওরি ল্যাক";

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border text-xs ${
                          isCorrect
                            ? "bg-slate-950/70 border-emerald-500/30"
                            : isSkipped
                            ? "bg-slate-950/50 border-slate-800"
                            : "bg-slate-950/70 border-rose-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-white">প্রশ্ন {idx + 1}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isCorrect
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isSkipped
                                ? "bg-slate-800 text-slate-400"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {isCorrect
                              ? "✓ সঠিক (+1)"
                              : isSkipped
                              ? "বাদ দেওয়া (0)"
                              : `❌ ভুল (-${examData.negativeMarking || 0.25})`}
                          </span>
                        </div>

                        <div className="font-medium text-slate-200 mb-2">
                          <KaTeXMath math={q.stem} />
                        </div>

                        <div className="space-y-1 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                          <p className="text-emerald-400">
                            ✓ সঠিক উত্তর: <KaTeXMath math={String(q.options[q.answerIndex])} />
                          </p>
                          {!isCorrect && !isSkipped && (
                            <p className="text-rose-400">
                              ❌ আপনার উত্তর: <KaTeXMath math={String(q.options[studentAns])} />
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-slate-300 pt-1 border-t border-slate-800/80 font-sans mt-1">
                              <strong>ব্যাখ্যা: </strong>
                              <KaTeXMath math={q.explanation} />
                            </p>
                          )}
                        </div>

                        {/* Error Categorization on Wrong Answer (PRD Module 5) */}
                        {!isCorrect && !isSkipped && correspondingMistake && (
                          <div className="mt-2 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-rose-300 block mb-1 font-semibold">
                              স্মার্ট মিস্টেক বক্সে যুক্ত হয়েছে • ভুলের কারণ মার্ক করুন:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {ERROR_CATEGORIES.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() =>
                                    handleTagMistakeReason(correspondingMistake.id, cat.id)
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                    chosenReason === cat.id
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
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          {!isFinished ? (
            <>
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 hover:bg-slate-850"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>আগেরটি</span>
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all shadow-md shadow-emerald-500/20"
                >
                  <span>পরের প্রশ্ন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/25 animate-bounce"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>পরীক্ষা সাবমিট করুন</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all text-center"
            >
              সম্পন্ন ও বন্ধ করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
