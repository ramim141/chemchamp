import React from "react";
import { X, Trophy, History, CheckCircle2, XCircle, Clock, Trash2, Award } from "lucide-react";

export default function ExamHistoryModal({
  isOpen,
  history = [],
  stats = {},
  onClose,
  onClearHistory,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">পরীক্ষার ইতিহাস ও রেকর্ড</h3>
              <p className="text-xs text-slate-400">
                আপনার সম্পন্ন করা পূর্ববর্তী মক টেস্ট ও পরীক্ষার ফলাফল
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aggregate Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3.5 shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">মোট পরীক্ষা</span>
            <span className="text-base font-black text-white font-mono mt-0.5 block">
              {stats.totalExams || 0}টি
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">গড় নির্ভুলতা</span>
            <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
              {stats.averageAccuracy || 0}%
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">সর্বোচ্চ স্কোর</span>
            <span className="text-base font-black text-amber-400 font-mono mt-0.5 block">
              {stats.highestScore || 0}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 block">মোট এক্সাম XP</span>
            <span className="text-base font-black text-teal-400 font-mono mt-0.5 block">
              +{stats.totalXpEarned || 0}
            </span>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p className="font-semibold text-slate-400">এখনো কোনো পরীক্ষা সম্পন্ন করা হয়নি।</p>
              <p className="text-[11px] text-slate-500">
                মক টেস্ট বা কাস্টম টেস্ট দিয়ে আপনার প্রস্তুতি শুরু করুন!
              </p>
            </div>
          ) : (
            history.map((att) => {
              const accColor =
                att.accuracy >= 80
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  : att.accuracy >= 60
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                  : "text-rose-400 bg-rose-500/10 border-rose-500/30";

              return (
                <div
                  key={att.id}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white truncate block">
                        {att.examTitle}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full border bg-slate-900 border-slate-800 text-slate-400 shrink-0 font-mono">
                        {att.targetTag || "মক টেস্ট"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
                      <span>📚 {att.chapter}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {att.dateFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-900">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-bold" title="সঠিক">
                        ✓ {att.correctCount}
                      </span>
                      <span className="text-rose-400 font-bold" title="ভুল">
                        ✗ {att.wrongCount}
                      </span>
                      {att.skippedCount > 0 && (
                        <span className="text-slate-500" title="উপেক্ষিত">
                          - {att.skippedCount}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white block">
                        স্কোর: {att.finalScore} / {att.totalQuestions}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-md border inline-block mt-0.5 ${accColor}`}
                      >
                        {att.accuracy}% নির্ভুল
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
            <span className="text-slate-500 text-[11px]">
              সর্বশেষ {history.length}টি পরীক্ষার ফলাফল প্রদর্শিত
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("আপনি কি নিশ্চিতভাবে সব পরীক্ষার রেকর্ড মুছে ফেলতে চান?")) {
                  onClearHistory();
                }
              }}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold text-[11px] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>রেকর্ড মুছুন</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

