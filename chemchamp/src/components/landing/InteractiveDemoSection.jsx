import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  FlaskConical,
  Activity,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Beaker,
  Gauge,
  Flame,
} from "lucide-react";
import KaTeXMath from "../common/KaTeXMath";
import confetti from "canvas-confetti";
import { DEFAULT_DEMO_CONFIG } from "../../services/landingConfigService";

export default function InteractiveDemoSection({ demoConfig = DEFAULT_DEMO_CONFIG, onRegisterClick }) {
  const toolsEnabled = demoConfig?.toolsEnabled || DEFAULT_DEMO_CONFIG.toolsEnabled;

  // Available Tools
  const availableToolKeys = [
    (toolsEnabled.bufferSimulator ?? true) && "bufferSimulator",
    (toolsEnabled.nernstVoltageLab ?? true) && "nernstVoltageLab",
    (toolsEnabled.precipitationPredictor ?? true) && "precipitationPredictor",
    (toolsEnabled.organicSynthesisPathway ?? true) && "organicSynthesisPathway",
  ].filter(Boolean);

  const [activeToolTab, setActiveToolTab] = useState(availableToolKeys[0] || "bufferSimulator");

  /* ==============================================================
     TOOL 1: বাফার দ্রবণ ও হ্যান্ডারসন-হ্যাসেলবালখ সিমুলেটর
  ============================================================== */
  const [bufferAcidConc, setBufferAcidConc] = useState(0.1); // M
  const [bufferSaltConc, setBufferSaltConc] = useState(0.1); // M
  const [addedStress, setAddedStress] = useState(null); // 'acid' | 'base' | null
  const PKA = 4.74; // Acetic acid pKa

  // Buffer pH calculation
  const calculateBufferPH = () => {
    let effectiveSalt = bufferSaltConc;
    let effectiveAcid = bufferAcidConc;

    if (addedStress === "acid") {
      effectiveSalt = Math.max(0.001, bufferSaltConc - 0.02);
      effectiveAcid = bufferAcidConc + 0.02;
    } else if (addedStress === "base") {
      effectiveSalt = bufferSaltConc + 0.02;
      effectiveAcid = Math.max(0.001, bufferAcidConc - 0.02);
    }

    const ratio = effectiveSalt / effectiveAcid;
    const ph = PKA + Math.log10(ratio);
    return Math.max(0, Math.min(14, ph)).toFixed(2);
  };

  const initialBufferPH = (PKA + Math.log10(bufferSaltConc / bufferAcidConc)).toFixed(2);
  const currentBufferPH = calculateBufferPH();

  // Water pH comparison when stress is added
  const getWaterPH = () => {
    if (addedStress === "acid") return "1.70 (বিশাল ৫.৩ ড্রপ!)";
    if (addedStress === "base") return "12.30 (বিশাল ৫.৩ স্পাইক!)";
    return "7.00 (নিরপেক্ষ)";
  };

  /* ==============================================================
     TOOL 2: গ্যালভানিক কোষ ও নার্নস্ট সমীকরণ ভোল্টমিটার
  ============================================================== */
  const GALVANIC_CELLS = [
    {
      id: "danielle",
      name: "ড্যানিয়েল সেল (Zn - Cu)",
      anode: "Zn",
      cathode: "Cu",
      e0: 1.10,
      n: 2,
      anodeHalf: "\\text{Zn(s)} \\rightarrow \\text{Zn}^{2+}(aq) + 2e^-",
      cathodeHalf: "\\text{Cu}^{2+}(aq) + 2e^- \\rightarrow \\text{Cu(s)}",
      cellNotation: "\\text{Zn(s)} | \\text{Zn}^{2+}(aq) \\parallel \\text{Cu}^{2+}(aq) | \\text{Cu(s)}",
    },
    {
      id: "fe_cu",
      name: "আয়রন - কপার সেল (Fe - Cu)",
      anode: "Fe",
      cathode: "Cu",
      e0: 0.78,
      n: 2,
      anodeHalf: "\\text{Fe(s)} \\rightarrow \\text{Fe}^{2+}(aq) + 2e^-",
      cathodeHalf: "\\text{Cu}^{2+}(aq) + 2e^- \\rightarrow \\text{Cu(s)}",
      cellNotation: "\\text{Fe(s)} | \\text{Fe}^{2+}(aq) \\parallel \\text{Cu}^{2+}(aq) | \\text{Cu(s)}",
    },
    {
      id: "mg_cu",
      name: "ম্যাগনেসিয়াম - কপার সেল (Mg - Cu)",
      anode: "Mg",
      cathode: "Cu",
      e0: 2.71,
      n: 2,
      anodeHalf: "\\text{Mg(s)} \\rightarrow \\text{Mg}^{2+}(aq) + 2e^-",
      cathodeHalf: "\\text{Cu}^{2+}(aq) + 2e^- \\rightarrow \\text{Cu(s)}",
      cellNotation: "\\text{Mg(s)} | \\text{Mg}^{2+}(aq) \\parallel \\text{Cu}^{2+}(aq) | \\text{Cu(s)}",
    },
    {
      id: "zn_ag",
      name: "জিংক - সিলভার সেল (Zn - Ag)",
      anode: "Zn",
      cathode: "Ag",
      e0: 1.56,
      n: 2,
      anodeHalf: "\\text{Zn(s)} \\rightarrow \\text{Zn}^{2+}(aq) + 2e^-",
      cathodeHalf: "2\\text{Ag}^+(aq) + 2e^- \\rightarrow 2\\text{Ag(s)}",
      cellNotation: "\\text{Zn(s)} | \\text{Zn}^{2+}(aq) \\parallel \\text{Ag}^+(aq) | \\text{Ag(s)}",
    },
  ];

  const [selectedCellId, setSelectedCellId] = useState("danielle");
  const [anodeConc, setAnodeConc] = useState(0.01);
  const [cathodeConc, setCathodeConc] = useState(1.0);

  const currentCell = GALVANIC_CELLS.find((c) => c.id === selectedCellId) || GALVANIC_CELLS[0];

  // Nernst Equation: E = E0 - (0.0591 / n) * log10( [Anode] / [Cathode] )
  const calculateNernst = () => {
    let q = anodeConc / cathodeConc;
    if (currentCell.id === "zn_ag") {
      q = anodeConc / Math.pow(cathodeConc, 2);
    }
    const logQ = Math.log10(q);
    const deltaE = (0.0591 / currentCell.n) * logQ;
    const eCell = currentCell.e0 - deltaE;
    return {
      eCell: eCell.toFixed(3),
      q: q.toFixed(3),
      logQ: logQ.toFixed(2),
      isSpontaneous: eCell > 0,
    };
  };

  const nernstData = calculateNernst();

  /* ==============================================================
     TOOL 3: দ্রাব্যতা ও অধঃক্ষেপণ প্রেডিক্টর (Ksp vs Qsp)
  ============================================================== */
  const PPT_PRESETS = [
    {
      id: "agcl",
      title: "AgCl অধঃক্ষেপণ পরীক্ষা",
      sol1: "AgNO₃ দ্রবণ",
      sol2: "NaCl দ্রবণ",
      salt: "AgCl",
      ksp: 1.8e-10,
      kspFormatted: "1.8 \\times 10^{-10}",
      color: "সাদা (White)",
    },
    {
      id: "caso4",
      title: "CaSO₄ অধঃক্ষেপণ পরীক্ষা",
      sol1: "CaCl₂ দ্রবণ",
      sol2: "Na₂SO₄ দ্রবণ",
      salt: "CaSO₄",
      ksp: 9.1e-6,
      kspFormatted: "9.1 \\times 10^{-6}",
      color: "ধূসর সাদা",
    },
    {
      id: "pbi2",
      title: "PbI₂ গোল্ডেন অধঃক্ষেপ",
      sol1: "Pb(NO₃)₂ দ্রবণ",
      sol2: "KI দ্রবণ",
      salt: "PbI₂",
      ksp: 7.1e-9,
      kspFormatted: "7.1 \\times 10^{-9}",
      color: "উজ্জ্বল সোনালী হলুদ (Golden Yellow)",
    },
  ];

  const [pptPresetId, setPptPresetId] = useState("agcl");
  const [vol1, setVol1] = useState(25); // mL
  const [conc1, setConc1] = useState(0.001); // M
  const [vol2, setVol2] = useState(25); // mL
  const [conc2, setConc2] = useState(0.001); // M

  const currentPpt = PPT_PRESETS.find((p) => p.id === pptPresetId) || PPT_PRESETS[0];

  // Calculate Precipitation Condition
  const calculatePpt = () => {
    const vTotal = vol1 + vol2;
    const c1New = (vol1 * conc1) / vTotal;
    const c2New = (vol2 * conc2) / vTotal;

    let qsp = c1New * c2New;
    if (currentPpt.id === "pbi2") {
      qsp = c1New * Math.pow(c2New, 2);
    }

    const willPrecipitate = qsp > currentPpt.ksp;
    return {
      vTotal,
      c1New: c1New.toExponential(2),
      c2New: c2New.toExponential(2),
      qsp: qsp.toExponential(2),
      willPrecipitate,
    };
  };

  const pptResult = calculatePpt();

  /* ==============================================================
     TOOL 4: জৈব রসায়ন মাল্টি-স্টেপ সিন্থেসিস রোডম্যাপ
  ============================================================== */
  const SYNTHESIS_ROUTES = [
    {
      id: "tnt",
      title: "টলুইন থেকে টিএনটি (TNT) প্রস্তুতকরণ",
      target: "2,4,6-ট্রাইনাইট্রোটলুইন (উচ্চ বিস্ফোরক)",
      exam: "BUET, DU & HSC CQ",
      steps: [
        {
          step: 1,
          name: "মনোনাইট্রেশন (Mononitration)",
          reactant: "\\text{C}_6\\text{H}_5\\text{CH}_3 + \\text{HNO}_3",
          reagent: "\\text{conc. } \\text{H}_2\\text{SO}_4 \\text{ (30°C)}",
          product: "\\text{o/p-নাইট্রোটলুইন}",
          mech: "বেনজিন বলয়ে -CH₃ মূলকের অর্থো-প্যারা নির্দেশক প্রভাব",
        },
        {
          step: 2,
          name: "ডাইনাইট্রেশন (Dinitration)",
          reactant: "\\text{o/p-নাইট্রোটলুইন} + \\text{HNO}_3",
          reagent: "\\text{conc. } \\text{H}_2\\text{SO}_4 \\text{ (60°C)}",
          product: "\\text{2,4-ডাইনাইট্রোটলুইন (DNT)}",
          mech: "তাপমাত্রা বৃদ্ধি করে ২য় -NO₂ মূলক প্রবেশ করানো হয়",
        },
        {
          step: 3,
          name: "সম্পূর্ণ নাইট্রেশন (TNT Formation)",
          reactant: "\\text{2,4-DNT} + \\text{HNO}_3",
          reagent: "\\text{fuming } \\text{H}_2\\text{SO}_4 \\text{ (100°C)}",
          product: "\\text{2,4,6-ট্রাইনাইট্রোটলুইন (TNT)}",
          mech: "সর্বোচ্চ তীব্র অবস্থায় ৩য় -NO₂ প্রবেশ করে প্রতিসাম্য TNT গঠন করে",
        },
      ],
    },
    {
      id: "aspirin",
      title: "বেনজিন থেকে জীবনরক্ষাকারী অ্যাসপিরিন প্রস্তুতি",
      target: "অ্যাসিটাইল স্যালিসাইলিক এসিড (ব্যথানাশক ড্রাগ)",
      exam: "Medical & BUET",
      steps: [
        {
          step: 1,
          name: "ডাউ পদ্ধতি (Dow Process)",
          reactant: "\\text{C}_6\\text{H}_5\\text{Cl} + \\text{NaOH}",
          reagent: "350^\\circ \\text{C, } 150 \\text{ atm} \\rightarrow \\text{HCl}",
          product: "\\text{C}_6\\text{H}_5\\text{OH} \\text{ (ফেনল)}",
          mech: "উচ্চ তাপ ও চাপে ক্লোরোবেনজিন থেকে ফেনল সংশ্লেষণ",
        },
        {
          step: 2,
          name: "কোলবে-স্মিট বিক্রিয়া (Kolbe-Schmitt)",
          reactant: "\\text{Sodium Phenolate} + \\text{CO}_2",
          reagent: "125^\\circ \\text{C, } 4-7 \\text{ atm} \\rightarrow \\text{H}^+",
          product: "\\text{স্যালিসাইলিক এসিড}",
          mech: "ফেনোক্সাইড আয়নের অর্থো অবস্থানে কার্বক্সিলেশন",
        },
        {
          step: 3,
          name: "অ্যাসিটাইলেশন (Acetylation)",
          reactant: "\\text{স্যালিসাইলিক এসিড} + (\\text{CH}_3\\text{CO})_2\\text{O}",
          reagent: "\\text{conc. } \\text{H}_2\\text{SO}_4",
          product: "\\text{অ্যাসপিরিন (ব্যথানাশক ও হৃদরোগের ওষুধ)}",
          mech: "ফেনোলিক -OH মূলকের সাথে এসিটিক অ্যানহাইড্রাইডের এস্টারিফিকেশন",
        },
      ],
    },
    {
      id: "grignard_3deg",
      title: "গ্রিগনার্ড বিকারক হতে ৩° অ্যালকোহল সংশ্লেষণ",
      target: "২-মিথাইল-২-প্রোপানল (টারশিয়ারি অ্যালকোহল)",
      exam: "DU KA & Engineering",
      steps: [
        {
          step: 1,
          name: "গ্রিগনার্ড নিউক্লিওফিলিক সংযোজন",
          reactant: "\\text{CH}_3\\text{MgBr} + \\text{CH}_3\\text{COCH}_3",
          reagent: "\\text{শুষ্ক ইথার (Dry Ether)}",
          product: "\\text{জটিল ম্যাগনেসিয়াম মধ্যবর্তী লবণ}",
          mech: "কার্বনিল কার্বনে মিথাইল কার্বানায়ন (CH₃⁻) এর আক্রমণ",
        },
        {
          step: 2,
          name: "আর্দ্রবিশ্লেষণ (Acid Hydrolysis)",
          reactant: "\\text{লবণ} + \\text{H}_3\\text{O}^+",
          reagent: "\\text{লঘু } \\text{HCl}",
          product: "(\\text{CH}_3)_3\\text{C-OH} + \\text{Mg(OH)Br}",
          mech: "প্রোটোনেশনের মাধ্যমে বিশুদ্ধ ৩° টারশিয়ারি অ্যালকোহল প্রাপ্তি",
        },
      ],
    },
  ];

  const [synthesisId, setSynthesisId] = useState("tnt");
  const [synthesisStep, setSynthesisStep] = useState(1);

  const currentRoute = SYNTHESIS_ROUTES.find((r) => r.id === synthesisId) || SYNTHESIS_ROUTES[0];
  const currentStepData = currentRoute.steps.find((s) => s.step === synthesisStep) || currentRoute.steps[0];

  if (availableToolKeys.length === 0) return null;

  return (
    <section id="demo" className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-900/40 border-y border-slate-900 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full">
            {demoConfig?.title || "হ্যান্ডস-অন লাইভ ল্যাব"}
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3">
            {demoConfig?.subtitle || "এইচএসসি ও ভর্তি পরীক্ষার সবচেয়ে গুরুত্বপূর্ণ গাণিতিক ও কনসেপচুয়াল পাওয়ার সিমুলেটর"}
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
            যে কনসেপ্টগুলো থেকে প্রতি বছর বুয়েট, মেডিকেল ও বোর্ড পরীক্ষায় সৃজনশীল এবং লিখিত প্রশ্ন নিশ্চিত আসে—নিজে ট্রাই করে কনসেপ্ট ঝালাই করে নিন।
          </p>
        </div>

        {/* Multi-Tool Switcher Pills */}
        <div className="flex justify-center mb-8">
          <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-1.5 flex-wrap shadow-2xl">
            {toolsEnabled.bufferSimulator !== false && (
              <button
                type="button"
                onClick={() => setActiveToolTab("bufferSimulator")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeToolTab === "bufferSimulator"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Beaker className="w-4 h-4" />
                <span>বাফার ও pH সিমুলেটর</span>
              </button>
            )}

            {toolsEnabled.nernstVoltageLab !== false && (
              <button
                type="button"
                onClick={() => setActiveToolTab("nernstVoltageLab")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeToolTab === "nernstVoltageLab"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-400 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Gauge className="w-4 h-4" />
                <span>নার্নস্ট ভোল্টেজ ল্যাব</span>
              </button>
            )}

            {toolsEnabled.precipitationPredictor !== false && (
              <button
                type="button"
                onClick={() => setActiveToolTab("precipitationPredictor")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeToolTab === "precipitationPredictor"
                    ? "bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>Ksp অধঃক্ষেপণ প্রেডিক্টর</span>
              </button>
            )}

            {toolsEnabled.organicSynthesisPathway !== false && (
              <button
                type="button"
                onClick={() => setActiveToolTab("organicSynthesisPathway")}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeToolTab === "organicSynthesisPathway"
                    ? "bg-gradient-to-r from-purple-500 to-indigo-400 text-slate-950 font-black shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>জৈব মাল্টি-স্টেপ সিন্থেসিস</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Interactive Tool Workspace */}
        <AnimatePresence mode="wait">
          {/* ==============================================================
              TOOL 1: BUFFER & pH RESISTANCE SIMULATOR
          ============================================================== */}
          {activeToolTab === "bufferSimulator" && (
            <motion.div
              key="bufferSimulator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-6"
            >
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Beaker className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      বাফার দ্রবণ ও হ্যান্ডারসন-হ্যাসেলবালখ লাইভ সিমুলেটর
                    </h3>
                    <p className="text-xs text-slate-400">
                      CH₃COOH ও CH₃COONa অম্লীয় বাফার (pKa = 4.74)
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 self-start sm:self-center">
                  HSC ৪র্থ অধ্যায় CQ নিশ্চিত
                </span>
              </div>

              {/* Sliders for Acid & Salt Concentration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">এসিড ঘনমাত্রা [HA]:</span>
                    <span className="text-emerald-400 font-mono">{bufferAcidConc.toFixed(2)} M</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={bufferAcidConc}
                    onChange={(e) => {
                      setBufferAcidConc(parseFloat(e.target.value));
                      setAddedStress(null);
                    }}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">CH₃COOH (অ্যাসিটিক এসিড)</span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-300">লবণ ঘনমাত্রা [A⁻]:</span>
                    <span className="text-teal-400 font-mono">{bufferSaltConc.toFixed(2)} M</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={bufferSaltConc}
                    onChange={(e) => {
                      setBufferSaltConc(parseFloat(e.target.value));
                      setAddedStress(null);
                    }}
                    className="w-full accent-teal-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500">CH₃COONa (সোডিয়াম অ্যাসিটেট)</span>
                </div>
              </div>

              {/* Stress Buttons (Add Strong Acid / Base) */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  🧪 বাহ্যিক এসিড বা ক্ষার যোগ করে বাফার ক্ষমতা পরীক্ষা করুন:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddedStress("acid")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      addedStress === "acid"
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 font-black shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    + ০.০২ M HCl (তীব্র এসিড)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddedStress("base")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      addedStress === "base"
                        ? "bg-teal-500/20 border-teal-500 text-teal-300 font-black shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    + ০.০২ M NaOH (তীব্র ক্ষার)
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddedStress(null)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>রিসেট বাফার</span>
                  </button>
                </div>
              </div>

              {/* Live Output & Shocking Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Buffer Vessel */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/40 relative overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    বাফার দ্রবণ pH মান
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-black text-emerald-300">
                      pH = {currentBufferPH}
                    </span>
                    {addedStress && (
                      <span className="text-xs text-slate-400 font-mono">
                        (পূর্বে ছিল {initialBufferPH})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    {addedStress
                      ? `✓ বাফারের প্রতিরোধ ক্ষমতা সক্রিয়! তীব্র এসিড/ক্ষার যোগ করার পরও pH পরিবর্তন হয়েছে মাত্র ${Math.abs(currentBufferPH - initialBufferPH).toFixed(2)} ইউনিট।`
                      : "হ্যান্ডারসন সমীকরণ: pH = 4.74 + log([লবণ]/[এসিড])"}
                  </p>
                </div>

                {/* Pure Water Vessel (The Shock Factor!) */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    সাধারণ পানি (Pure Water) বনাম বাফার
                  </span>
                  <div className="text-xl sm:text-2xl font-mono font-black text-slate-200">
                    pH = {getWaterPH()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    বিশুদ্ধ পানিতে কোনো বাফার ক্ষমতা নেই। তাই একই পরিমাণ এসিড যোগ করলে তাৎক্ষণিক এসিড বার্ন তৈরি হয়।
                  </p>
                </div>
              </div>

              {/* KaTeX Step Breakdown */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center text-xs">
                <span className="text-[10px] text-slate-400 block mb-1">প্রযুক্ত সমীকরণ:</span>
                <KaTeXMath
                  math={`\\text{pH} = \\text{pK}_a + \\log_{10}\\left(\\frac{[\\text{CH}_3\\text{COONa}]}{[\\text{CH}_3\\text{COOH}]}\\right) = 4.74 + \\log_{10}\\left(\\frac{${bufferSaltConc}}{${bufferAcidConc}}\\right) = ${initialBufferPH}`}
                  block
                  className="text-xs sm:text-sm text-emerald-300 font-bold"
                />
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              TOOL 2: NERNST EQUATION & GALVANIC CELL VOLTAGE
          ============================================================== */}
          {activeToolTab === "nernstVoltageLab" && (
            <motion.div
              key="nernstVoltageLab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      গ্যালভানিক কোষ ও নার্নস্ট সমীকরণ লাইভ ভোল্টমিটার
                    </h3>
                    <p className="text-xs text-slate-400">
                      ইলেকট্রোড ও আয়ন ঘনমাত্রা পরিবর্তনের সাথে কোষ বিভবের রিয়েল-টাইম ক্যালকুলেটর
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 self-start sm:self-center">
                  HSC ২য় পত্র ৪র্থ অধ্যায়
                </span>
              </div>

              {/* Cell Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GALVANIC_CELLS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCellId(c.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedCellId === c.id
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-black shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold block">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      E° = {c.e0.toFixed(2)} V
                    </span>
                  </button>
                ))}
              </div>

              {/* Concentration Adjusters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    অ্যানোড দ্রবণ [{currentCell.anode}²⁺] ঘনমাত্রা:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0.001, 0.01, 0.1, 1.0, 2.0].map((conc) => (
                      <button
                        key={conc}
                        type="button"
                        onClick={() => setAnodeConc(conc)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          anodeConc === conc
                            ? "bg-cyan-500 text-slate-950 border-cyan-400"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {conc}M
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    ক্যাথোড দ্রবণ [{currentCell.cathode}²⁺] ঘনমাত্রা:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[0.001, 0.01, 0.1, 1.0, 2.0].map((conc) => (
                      <button
                        key={conc}
                        type="button"
                        onClick={() => setCathodeConc(conc)}
                        className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          cathodeConc === conc
                            ? "bg-teal-400 text-slate-950 border-teal-300"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {conc}M
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Digital Voltmeter & Analysis */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="text-center sm:text-left">
                  <span className="text-xs text-slate-400 block font-semibold mb-1">
                    নার্নস্ট সমীকরণ অনুযায়ী বর্তমান কোষ বিভব (E_cell):
                  </span>
                  <div className="flex items-baseline justify-center sm:justify-start gap-2">
                    <span className="text-4xl font-mono font-black text-cyan-400">
                      {nernstData.eCell} V
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      (প্রমাণ বিভব E° = {currentCell.e0.toFixed(2)} V)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400 font-bold">
                      {nernstData.isSpontaneous
                        ? "বিক্রিয়াটি স্বতঃস্ফূর্ত (Spontaneous: ΔG < 0)"
                        : "বিক্রিয়াটি স্বতঃস্ফূর্ত নয় (ΔG > 0)"}
                    </span>
                  </div>
                </div>

                {/* Cell Notation Badge */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center shrink-0">
                  <span className="text-[10px] text-slate-400 block mb-1">IUPAC কোষ সংকেত:</span>
                  <KaTeXMath math={currentCell.cellNotation} className="text-xs text-cyan-300 font-bold" />
                </div>
              </div>

              {/* Formula & Calculation Box */}
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center text-xs">
                <KaTeXMath
                  math={`E_{\\text{cell}} = E^\\circ - \\frac{0.0591}{${currentCell.n}} \\log_{10}\\left(\\frac{${anodeConc}}{${cathodeConc}}\\right) = ${currentCell.e0} - \\left(\\frac{0.0591}{${currentCell.n}}\\right)(${nernstData.logQ}) = ${nernstData.eCell} \\text{ V}`}
                  block
                  className="text-xs sm:text-sm text-cyan-300 font-bold"
                />
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              TOOL 3: Ksp vs Qsp PRECIPITATION PREDICTOR
          ============================================================== */}
          {activeToolTab === "precipitationPredictor" && (
            <motion.div
              key="precipitationPredictor"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      দ্রাব্যতা ও আয়নিক গুণফল (Ksp vs Qsp) অধঃক্ষেপণ প্রেডিক্টর
                    </h3>
                    <p className="text-xs text-slate-400">
                      "পাত্র A ও পাত্র B মিশ্রিত করলে অধঃক্ষেপ পড়বে কি?" — ক্লাসিক পরীক্ষার প্রশ্ন
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 self-start sm:self-center">
                  বুয়েট ও মেডিকেল হটস্পট
                </span>
              </div>

              {/* Salt Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PPT_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPptPresetId(p.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      pptPresetId === p.id
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold block">{p.title}</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      Ksp = <KaTeXMath math={p.kspFormatted} />
                    </span>
                  </button>
                ))}
              </div>

              {/* Volume & Concentration Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                {/* Vessel A */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-amber-400 block border-b border-slate-800 pb-1">
                    পাত্র ১ ({currentPpt.sol1}):
                  </span>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">আয়তন (V₁):</span>
                      <span className="text-amber-300 font-mono font-bold">{vol1} mL</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={vol1}
                      onChange={(e) => setVol1(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">ঘনমাত্রা (M₁):</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.0001, 0.001, 0.01, 0.1].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setConc1(c)}
                          className={`py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                            conc1 === c
                              ? "bg-amber-500 text-slate-950 border-amber-400"
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {c}M
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vessel B */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-teal-400 block border-b border-slate-800 pb-1">
                    পাত্র ২ ({currentPpt.sol2}):
                  </span>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">আয়তন (V₂):</span>
                      <span className="text-teal-300 font-mono font-bold">{vol2} mL</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={vol2}
                      onChange={(e) => setVol2(parseInt(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">ঘনমাত্রা (M₂):</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.0001, 0.001, 0.01, 0.1].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setConc2(c)}
                          className={`py-1 rounded text-[10px] font-mono font-bold border transition-all ${
                            conc2 === c
                              ? "bg-teal-400 text-slate-950 border-teal-300"
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                        >
                          {c}M
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Precipitation Prediction Banner */}
              <div
                className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
                  pptResult.willPrecipitate
                    ? "bg-gradient-to-r from-amber-500/15 via-slate-900 to-orange-500/15 border-amber-500/50 shadow-xl"
                    : "bg-slate-900 border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm sm:text-base font-black ${
                        pptResult.willPrecipitate ? "text-amber-400" : "text-slate-300"
                      }`}
                    >
                      {pptResult.willPrecipitate
                        ? `✓ অধঃক্ষেপ পড়বে! (${currentPpt.salt} Precipitate Formed)`
                        : "✕ অধঃক্ষেপ পড়বে না (দ্রবণটি অসম্পৃক্ত)"}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      (Qsp {pptResult.willPrecipitate ? ">" : "<"} Ksp)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    আয়ন গুণফল Q_sp = {pptResult.qsp} বনাম দ্রাব্যতা গুণফল K_sp = {currentPpt.ksp}।
                    {pptResult.willPrecipitate && ` অধঃক্ষেপের বর্ণ: ${currentPpt.color}।`}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center shrink-0">
                  <span className="text-[10px] text-slate-400 block">মোট আয়তন (V_total):</span>
                  <span className="text-sm font-mono font-bold text-white">{pptResult.vTotal} mL</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==============================================================
              TOOL 4: ORGANIC MULTI-STEP SYNTHESIS NAVIGATOR
          ============================================================== */}
          {activeToolTab === "organicSynthesisPathway" && (
            <motion.div
              key="organicSynthesisPathway"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      জৈব যৌগের মাল্টি-স্টেপ সংশ্লেষণ রোডম্যাপ
                    </h3>
                    <p className="text-xs text-slate-400">
                      ভর্তি পরীক্ষার সবচেয়ে ভীতিকর বহু-ধাপ রূপান্তর বিক্রিয়াসমূহ এক নজরে
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20 self-start sm:self-center">
                  বুয়েট রিটেন ও ঢাবি 'ক'
                </span>
              </div>

              {/* Target Synthesis Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SYNTHESIS_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      setSynthesisId(route.id);
                      setSynthesisStep(1);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      synthesisId === route.id
                        ? "bg-purple-500/20 border-purple-400 text-purple-200 font-bold shadow-md"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold block">{route.title}</span>
                    <span className="text-[10px] text-slate-400 block mt-1 truncate">
                      🎯 {route.target}
                    </span>
                  </button>
                ))}
              </div>

              {/* Step Flow Indicator */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {currentRoute.steps.map((st) => (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setSynthesisStep(st.step)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      synthesisStep === st.step
                        ? "bg-purple-500 text-slate-950 font-black shadow-md"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>ধাপ {st.step}:</span>
                    <span>{st.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Step Detailed Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400 font-mono font-bold">
                    ধাপ {currentStepData.step} / {currentRoute.steps.length} • {currentStepData.name}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {currentRoute.exam}
                  </span>
                </div>

                {/* Equation Box */}
                <div className="py-4 px-3 bg-slate-950 rounded-xl border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-500 block mb-1">বিক্রিয়া সমীকরণ:</span>
                  <KaTeXMath
                    math={`${currentStepData.reactant} \\xrightarrow{${currentStepData.reagent}} ${currentStepData.product}`}
                    block
                    className="text-xs sm:text-sm text-purple-300 font-bold"
                  />
                </div>

                {/* Conditions & Mechanism Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] mb-0.5">বিকারক ও প্রভাবক:</span>
                    <span className="text-slate-200 font-bold font-mono">
                      <KaTeXMath math={currentStepData.reagent} />
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px] mb-0.5">বিক্রিয়ার মেকানিজম নোট:</span>
                    <span className="text-slate-300 font-medium">
                      {currentStepData.mech}
                    </span>
                  </div>
                </div>

                {/* Next Step / Complete CTA */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    চূড়ান্ত উৎপাদ: <strong className="text-emerald-400">{currentRoute.target}</strong>
                  </span>
                  {synthesisStep < currentRoute.steps.length ? (
                    <button
                      type="button"
                      onClick={() => setSynthesisStep((prev) => prev + 1)}
                      className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      পরবর্তী ধাপ দেখুন <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> সম্পূর্ণ রূপান্তর সম্পন্ন!
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={onRegisterClick}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>সম্পূর্ণ প্রশ্নব্যাংক ও প্র্যাকটিস ল্যাব আনলক করুন (১০০% ফ্রি)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
