import React, { useState } from "react";
import { Zap, Rotate3d, Atom, Sparkles } from "lucide-react";
import FormulaVaultTab from "./vault/FormulaVaultTab";
import ReactionCardsTab from "./vault/ReactionCardsTab";
import PeriodicExceptionsTab from "./vault/PeriodicExceptionsTab";

export default function AdminVaultStudio() {
  const [activeTab, setActiveTab] = useState("formulas"); // formulas | reactions | periodic

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* শীর্ষ হেডার বার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              কেমিস্ট্রি শর্টকাট ও ফর্মুলা ভল্ট স্টুডিও
            </h2>
            <p className="text-xs text-slate-400">
              ফর্মুলা হ্যাকস, জৈব ফ্লিপকার্ড ও পর্যায় সারণির ব্যতিক্রমী ডেটাবেজ ম্যানেজমেন্ট
            </p>
          </div>
        </div>

        {/* ৩টি ট্যাব সুইচ */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("formulas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "formulas"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>ফর্মুলা ও হ্যাকস</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reactions")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "reactions"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>জৈব ফ্লিপকার্ড</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("periodic")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "periodic"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Atom className="w-3.5 h-3.5" />
            <span>পর্যায় সারণি</span>
          </button>
        </div>
      </div>

      {/* সক্রিয় ট্যাবের কনটেন্ট */}
      {activeTab === "formulas" && <FormulaVaultTab />}
      {activeTab === "reactions" && <ReactionCardsTab />}
      {activeTab === "periodic" && <PeriodicExceptionsTab />}
    </div>
  );
}