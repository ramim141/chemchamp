import React, { useState } from "react";
import { Lightbulb, Copy, Check, Search, Sparkles } from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";

export default function FormulaCard({ formulas = [] }) {
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");

  if (!formulas || formulas.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6 space-y-2">
        <Sparkles className="w-8 h-8 text-emerald-500/70 mx-auto animate-pulse" />
        <h4 className="text-sm font-bold text-white">শীঘ্রই আসছে...</h4>
        <p className="text-xs text-slate-400">অ্যাডমিন স্টুডিও থেকে নতুন ফর্মুলা যুক্ত করা হলে এখানে প্রদর্শিত হবে।</p>
      </div>
    );
  }

  const filtered = formulas.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const inTitle = String(item.title || "").toLowerCase().includes(q);
    const inHack = String(item.hack || "").toLowerCase().includes(q);
    const inCat = String(item.categoryLabel || "").toLowerCase().includes(q);
    return inTitle || inHack || inCat;
  });

  const handleCopy = (formula, id) => {
    navigator.clipboard.writeText(formula).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute top-3 left-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ফর্মুলা বা কীওয়ার্ড খুঁজুন..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => {
          const fid = item.id || `f_${idx}`;
          const isCopied = copiedId === fid;

          return (
            <div
              key={fid}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate">
                    {item.categoryLabel || "রসায়ন সূত্র"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.formula, fid)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
                    title="ফর্মুলা টেক্সট কপি করুন"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="hidden xs:inline">কপি</span>
                      </>
                    )}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors mb-2.5 leading-snug">
                  {item.title}
                </h4>

                <div className="bg-slate-950/90 py-4 px-3 rounded-xl border border-slate-800/80 text-center mb-3 shadow-inner">
                  <KaTeXMath math={item.formula} block className="text-emerald-400 text-sm font-bold" />
                </div>
              </div>

              {item.hack && (
                <div className="bg-emerald-950/20 border border-emerald-500/25 p-3 rounded-xl text-xs text-emerald-200 leading-relaxed">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>এডমিশন শর্টকাট হ্যাক:</span>
                  </div>
                  <KaTeXMath math={item.hack} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
