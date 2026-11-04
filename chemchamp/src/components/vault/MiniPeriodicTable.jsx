import React, { useState } from "react";
import { AlertTriangle, Search, Atom, Sparkles } from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";

export default function MiniPeriodicTable({ elements = [] }) {
  const [selectedElement, setSelectedElement] = useState(
    elements.find((e) => e.isException) || elements[0]
  );
  const [search, setSearch] = useState("");
  const [onlyExceptions, setOnlyExceptions] = useState(false);

  if (!elements || elements.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6 space-y-2">
        <Atom className="w-8 h-8 text-teal-500/70 mx-auto animate-pulse" />
        <h4 className="text-sm font-bold text-white">শীঘ্রই আসছে...</h4>
        <p className="text-xs text-slate-400">অ্যাডমিন স্টুডিও থেকে ব্যতিক্রমী মৌল যুক্ত করা হলে এখানে প্রদর্শিত হবে।</p>
      </div>
    );
  }

  const filtered = elements.filter((el) => {
    if (onlyExceptions && !el.isException) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const inSym = String(el.symbol || "").toLowerCase().includes(q);
    const inName = String(el.name || "").toLowerCase().includes(q);
    const inZ = String(el.z || "").includes(q);
    return inSym || inName || inZ;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute top-3 left-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="প্রতীক, নাম বা পারমাণবিক সংখ্যা খুঁজুন..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyExceptions(!onlyExceptions)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              onlyExceptions
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>শুধু ব্যতিক্রমী মৌল ({elements.filter((e) => e.isException).length})</span>
          </button>
        </div>
      </div>

      {/* Main Grid + Selected Element Inspector Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Elements Grid (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-2">
          <span className="text-xs text-slate-400 font-bold block px-1">
            মৌল তালিকা ({filtered.length}টি মৌল) — ক্লিক করে বিস্তারিত দেখুন:
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[460px] overflow-y-auto pr-1">
            {filtered.map((el) => {
              const isSelected = selectedElement?.symbol === el.symbol;
              return (
                <button
                  key={el.symbol}
                  type="button"
                  onClick={() => setSelectedElement(el)}
                  className={`p-2.5 rounded-xl border text-center transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-teal-500/20 border-teal-400 shadow-md shadow-teal-500/10 scale-102"
                      : el.isException
                      ? "bg-amber-500/10 border-amber-500/30 hover:border-amber-400 text-amber-300"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>{el.z}</span>
                    {el.isException && <span className="text-amber-400 font-bold">★</span>}
                  </div>
                  <span
                    className={`text-xl font-black block font-mono ${
                      el.isException ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {el.symbol}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5">{el.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Element Detail Inspector (1 Col on lg) */}
        <div className="lg:col-span-1">
          {selectedElement && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 sticky top-20">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-3xl text-teal-400 shadow-inner">
                    {selectedElement.symbol}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedElement.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      পারমাণবিক সংখ্যা: Z = {selectedElement.z}
                    </span>
                  </div>
                </div>

                {selectedElement.isException && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    ব্যতিক্রমী
                  </span>
                )}
              </div>

              {/* পর্যায় ও গ্রুপ ইনফো */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">পর্যায় (Period)</span>
                  <span className="font-mono font-bold text-slate-200">{selectedElement.period}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">গ্রুপ (Group)</span>
                  <span className="font-mono font-bold text-slate-200">{selectedElement.group}</span>
                </div>
              </div>

              {/* ইলেকট্রন বিন্যাস */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1 font-mono font-bold">
                  ইলেকট্রন বিন্যাস
                </span>
                <KaTeXMath math={selectedElement.config} block className="text-emerald-400 font-bold text-sm" />
              </div>

              {/* ব্যতিক্রমী নোট বা এডমিশন টিপস */}
              {selectedElement.note && (
                <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-xs text-amber-200 leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong className="text-amber-400 block mb-0.5">পরীক্ষার স্পেশাল নোট:</strong>
                    <span>{selectedElement.note}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
