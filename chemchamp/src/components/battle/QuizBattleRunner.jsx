import React, { useState, useEffect } from "react";
import { Swords, Timer, Trophy, X, CheckCircle2, XCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import KaTeXMath from "../common/KaTeXMath";
import { soundService } from "../../services/soundService";

export default function QuizBattleRunner({
  questions = [],
  opponentName = "তানভীর (NDC)",
  roomCode = "",
  onClose,
  onDuelFinish,
}) {
  const { user, profile, syncUserProfile } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const currentQ = questions[currentIdx] || questions[0];

  // Round Timer
  useEffect(() => {
    if (showRoundResult || isGameOver) return;

    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    if (timeLeft <= 3 && timeLeft > 0) {
      soundService.playTimerTick();
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showRoundResult, isGameOver]);

  const handleTimeUp = () => {
    handleAnswerSubmit(-1);
  };

  const handleAnswerSubmit = (chosenIdx) => {
    setSelectedOption(chosenIdx);
    setShowRoundResult(true);

    const isUserCorrect = chosenIdx === currentQ.answerIndex;
    let earnedUser = 0;
    if (isUserCorrect) {
      soundService.playCorrect();
      earnedUser = 10 + Math.max(0, timeLeft * 2); // Speed bonus
      setUserScore((prev) => prev + earnedUser);
    } else {
      soundService.playIncorrect();
    }

    // Simulate opponent answer
    const isOpponentCorrect = Math.random() < 0.72;
    let earnedOpponent = 0;
    if (isOpponentCorrect) {
      earnedOpponent = 10 + Math.floor(Math.random() * 12);
      setOpponentScore((prev) => prev + earnedOpponent);
    }

    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx((prev) => prev + 1);
        setTimeLeft(10);
        setSelectedOption(null);
        setShowRoundResult(false);
      } else {
        finishDuel(userScore + earnedUser, opponentScore + earnedOpponent);
      }
    }, 1800);
  };

  const finishDuel = async (finalUserScore, finalOpponentScore) => {
    setIsGameOver(true);
    const won = finalUserScore >= finalOpponentScore;

    if (won) {
      soundService.playLevelUp();
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      soundService.playIncorrect();
    }

    const xpGained = won ? 100 : 30;
    if (syncUserProfile) {
      const currentXP = (profile?.gamification?.currentXP || 120) + xpGained;
      const totalSolvedMCQ = (profile?.stats?.totalSolvedMCQ || 0) + questions.length;
      const battlesPlayed = (profile?.stats?.battlesPlayed || 0) + 1;
      const battlesWon = (profile?.stats?.battlesWon || 0) + (won ? 1 : 0);
      await syncUserProfile({
        gamification: { currentXP },
        stats: { totalSolvedMCQ, battlesPlayed, battlesWon },
      });
    }

    if (onDuelFinish) {
      onDuelFinish({ won, finalUserScore, finalOpponentScore, xpGained });
    }
  };

  const userName = user?.displayName || profile?.displayName || "আপনি";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl p-4 flex flex-col relative overflow-hidden">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Swords className="w-3.5 h-3.5" /> ১v১ দ্রুতগতির কুইজ ডুয়েল
            </span>
            {roomCode && (
              <span className="text-[10px] font-mono font-bold text-teal-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                রুম: {roomCode}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Scoreboard */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center">
            <span className="text-[10px] text-emerald-400 font-bold block truncate">{userName}</span>
            <span className="text-xl font-black text-white font-mono">{userScore} pts</span>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-center">
            <span className="text-[10px] text-rose-400 font-bold block truncate">{opponentName}</span>
            <span className="text-xl font-black text-white font-mono">{opponentScore} pts</span>
          </div>
        </div>

        {!isGameOver ? (
          <>
            <div className="mb-3">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>রাউন্ড {currentIdx + 1} / {questions.length}</span>
                <span className={`font-bold flex items-center gap-1 ${timeLeft <= 3 ? "text-rose-400 animate-pulse" : "text-amber-400"}`}>
                  <Timer className="w-3.5 h-3.5" /> {timeLeft}s
                </span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 3 ? "bg-rose-500" : "bg-gradient-to-r from-teal-400 to-amber-400"
                  }`}
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="min-h-[68px] flex items-center justify-center p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-3 text-center">
              <h3 className="text-xs font-bold text-white leading-relaxed">
                <KaTeXMath text={currentQ.question} />
              </h3>
            </div>

            <div className="space-y-2 mb-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedOption === i;
                const isCorrect = i === currentQ.answerIndex;

                let optClass = "bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700";
                if (showRoundResult) {
                  if (isCorrect) {
                    optClass = "bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold";
                  } else if (isSelected && !isCorrect) {
                    optClass = "bg-rose-950/80 border-rose-500 text-rose-300";
                  } else {
                    optClass = "opacity-40 border-slate-900";
                  }
                }

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={showRoundResult}
                    onClick={() => handleAnswerSubmit(i)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between active:scale-98 ${optClass}`}
                  >
                    <span>
                      <KaTeXMath text={opt} />
                    </span>
                    {showRoundResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
                    {showRoundResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {showRoundResult && currentQ.hint && (
              <div className="text-[10px] text-center text-slate-400 italic">
                <KaTeXMath text={currentQ.hint} />
              </div>
            )}
          </>
        ) : (
          <div className="py-4 text-center space-y-3">
            {userScore >= opponentScore ? (
              <div className="space-y-2">
                <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                <h3 className="text-base font-extrabold text-white">বিজয়ী! আপনি জিতেছেন! 🏆</h3>
                <p className="text-xs text-emerald-400 font-semibold">+100 XP অর্জিত হয়েছে</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Swords className="w-12 h-12 text-rose-400 mx-auto" />
                <h3 className="text-base font-extrabold text-white">হাড্ডাহাড্ডি লড়াই!</h3>
                <p className="text-xs text-slate-400">{opponentName} জয়ী হয়েছে। +30 XP অর্জিত।</p>
              </div>
            )}

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex justify-around">
              <div>
                <span className="text-[10px] text-slate-500 block">আপনার স্কোর</span>
                <span className="font-bold text-white text-sm">{userScore} pts</span>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <span className="text-[10px] text-slate-500 block">প্রতিপক্ষের স্কোর</span>
                <span className="font-bold text-slate-400 text-sm">{opponentScore} pts</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95"
            >
              ডুয়েল সমাপ্ত করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
