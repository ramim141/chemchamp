import React, { useState } from "react";
import {
  Printer,
  X,
  CheckSquare,
  Square,
  Sliders,
  FileText,
  Sparkles,
  Download,
  Eye,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import { soundService } from "../../services/soundService";

export default function CustomCheatSheetModal({
  isOpen,
  onClose,
  flashcards = [],
  elements = [],
  formulas = [],
  studentName = "শিক্ষার্থী",
}) {
  const [includeReactions, setIncludeReactions] = useState(true);
  const [includePeriodic, setIncludePeriodic] = useState(true);
  const [includeFormulas, setIncludeFormulas] = useState(true);
  const [columns, setColumns] = useState(2); // 2 | 3
  const [compactMode, setCompactMode] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState("all"); // all | 1 | 2

  if (!isOpen) return null;

  const handlePrint = () => {
    soundService.playClick();
    window.print();
  };

  // Filter formulas by paper if needed
  const filteredFormulas = formulas.filter((f) => {
    if (selectedPaper === "all") return true;
    return String(f.paper) === String(selectedPaper);
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl my-6 flex flex-col max-h-[90vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black print:w-full print:m-0 print:rounded-none">
        
        {/* Header (Hidden when printing) */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                কাস্টমাইজড কেমিস্ট্রি চিটশিট বিল্ডার
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  A4 Print & PDF
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                আপনার প্রয়োজনমতো টপিক ও লেআউট বেছে নিয়ে এক ক্লিকে প্রিন্ট বা PDF হিসেবে সংরক্ষণ করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF ডাউনলোড 🖨️</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customization Options Bar (Hidden when printing) */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 shrink-0 space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Sections Select */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-400 text-[11px] uppercase">
                অন্তর্ভুক্ত সেকশন:
              </span>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-emerald-300 select-none">
                <input
                  type="checkbox"
                  checked={includeReactions}
                  onChange={(e) => setIncludeReactions(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span>জৈব রসায়ন ফ্ল্যাশকার্ড ({flashcards.length})</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-teal-300 select-none">
                <input
                  type="checkbox"
                  checked={includePeriodic}
                  onChange={(e) => setIncludePeriodic(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span>পর্যায় সারণি ব্যতিক্রম ({elements.length})</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-amber-300 select-none">
                <input
                  type="checkbox"
                  checked={includeFormulas}
                  onChange={(e) => setIncludeFormulas(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span>ফর্মুলা ব্যাংক ({formulas.length})</span>
              </label>
            </div>

            {/* Layout Options: Columns & Paper */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">লেআউট:</span>
              <button
                type="button"
                onClick={() => setColumns(2)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${
                  columns === 2
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                ২ কলাম
              </button>
              <button
                type="button"
                onClick={() => setColumns(3)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${
                  columns === 3
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                ৩ কলাম (পকেট সাইজ)
              </button>
            </div>
          </div>
        </div>

        {/* ─── Printable Document Area (High-Contrast Clean White on Paper) ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 text-slate-100 print:bg-white print:text-black print:p-0 print:overflow-visible">
          
          {/* Printable Header */}
          <div className="pb-3 mb-4 border-b-2 border-slate-800 print:border-black flex items-center justify-between">
            <div>
              <h1 className="text-base sm:text-lg font-black text-white print:text-black">
                🧪 ChemChamp কেমিস্ট্রি স্পেশাল চিটশিট (HSC & Admission)
              </h1>
              <p className="text-[11px] text-slate-400 print:text-gray-600">
                পরীক্ষার আগের রাতের চূড়ান্ত রিভিশন শিট • শিক্ষার্থী: <strong>{studentName}</strong>
              </p>
            </div>
            <div className="text-right text-[10px] text-slate-400 print:text-gray-600 font-mono">
              <span>মুদ্রণ তারিখ: {new Date().toLocaleDateString("bn-BD")}</span>
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
            } print:grid-cols-${columns}`}
          >
            {/* Section 1: Organic Reaction Flashcards */}
            {includeReactions && flashcards.length > 0 && (
              <div className="col-span-full space-y-2 mt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 print:text-black border-b border-emerald-500/30 print:border-black pb-1 flex items-center gap-1.5">
                  ⚡ ১. জৈব রসায়ন নামীয় বিক্রিয়া ও মেকানিজম নোট
                </h3>
                <div
                  className={`grid gap-2.5 ${
                    columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {flashcards.map((card, idx) => (
                    <div
                      key={card.id || idx}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 print:bg-white print:border-gray-400 text-xs space-y-1 page-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between font-bold text-emerald-300 print:text-black text-[11px]">
                        <span>{card.title}</span>
                        <span className="text-[9px] text-slate-500 print:text-gray-600 font-mono">
                          {card.category || "জৈব রসায়ন"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 print:bg-gray-100 text-center font-mono text-white print:text-black">
                        <KaTeXMath math={card.reaction || card.latex || ""} block />
                      </div>
                      {card.explanation && (
                        <p className="text-[10.5px] text-slate-300 print:text-gray-800 leading-tight">
                          <KaTeXMath math={card.explanation} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 2: Periodic Table Exceptions */}
            {includePeriodic && elements.length > 0 && (
              <div className="col-span-full space-y-2 mt-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-teal-400 print:text-black border-b border-teal-500/30 print:border-black pb-1 flex items-center gap-1.5">
                  ⚛️ ২. পর্যায় সারণির গুরুত্বপূর্ণ ব্যতিক্রম ও কারণ
                </h3>
                <div
                  className={`grid gap-2.5 ${
                    columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {elements.map((elem, idx) => (
                    <div
                      key={elem.id || idx}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 print:bg-white print:border-gray-400 text-xs space-y-1 page-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between font-bold text-teal-300 print:text-black text-[11px]">
                        <span>
                          {elem.name} ({elem.symbol} - {elem.z})
                        </span>
                        <span className="text-[9.5px] text-amber-400 print:text-black font-mono">
                          {elem.group ? `Group ${elem.group}` : ""}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-slate-950 print:bg-gray-100 font-mono text-[11px] text-center text-white print:text-black">
                        <KaTeXMath math={elem.electronicConfig || ""} />
                      </div>
                      {elem.exceptionReason && (
                        <p className="text-[10px] text-slate-300 print:text-gray-800 leading-tight">
                          <KaTeXMath math={elem.exceptionReason} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Mathematical Formula Bank */}
            {includeFormulas && filteredFormulas.length > 0 && (
              <div className="col-span-full space-y-2 mt-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 print:text-black border-b border-amber-500/30 print:border-black pb-1 flex items-center gap-1.5">
                  📐 ৩. গাণিতিক ফর্মুলা ব্যাংক ও অ্যাডমিশন শর্টকাট হ্যাকস
                </h3>
                <div
                  className={`grid gap-2.5 ${
                    columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {filteredFormulas.map((form, idx) => (
                    <div
                      key={form.id || idx}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 print:bg-white print:border-gray-400 text-xs space-y-1 page-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between font-bold text-amber-300 print:text-black text-[11px]">
                        <span>{form.title}</span>
                        <span className="text-[9px] text-slate-500 print:text-gray-600 font-mono">
                          {form.category || "ফর্মুলা"}
                        </span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-950 print:bg-gray-100 text-center font-bold text-white print:text-black">
                        <KaTeXMath math={form.latex || form.formula || ""} block />
                      </div>
                      {form.hack && (
                        <p className="text-[10px] text-emerald-300 print:text-gray-800 leading-tight">
                          <strong>হ্যাক:</strong> <KaTeXMath math={form.hack} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Printable Footer */}
          <div className="mt-6 pt-2 border-t border-slate-800 print:border-gray-400 text-center text-[10px] text-slate-500 print:text-gray-600">
            ChemChamp PRO • রসায়নে শতভাগ প্রস্তুতি • www.chemchamp.app
          </div>
        </div>
      </div>
    </div>
  );
}

