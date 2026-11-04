import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Plus,
  Trash2,
  Save,
  Calculator,
  ShieldAlert,
  Sparkles,
  Layers,
  Edit2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import KaTeXMath from "../common/KaTeXMath";
import { soundService } from "../../services/soundService";

const DEFAULT_MATRIX = [
  {
    topic: "জৈব রসায়ন: নামীয় বিক্রিয়া ও শনাক্তকারী পরীক্ষা",
    buet: "৯৮% (প্রতি বছর ২-৩টি)",
    medical: "৯৫% (৩-৪টি MCQ)",
    du: "৯৬% (২-৩টি MCQ + লিখিত)",
    priority: "হট টপিক 🔥",
  },
  {
    topic: "রাসায়নিক পরিবর্তন: বাফার দ্রবণ, pH ও Kp/Kc",
    buet: "৯৫% (ম্যাথ প্রবলেম)",
    medical: "৯০% (রক্তের pH ও প্রভাবক)",
    du: "৯৪% (নন-ক্যালকুলেটর pH)",
    priority: "হট টপিক 🔥",
  },
  {
    topic: "গুণগত রসায়ন: কোয়ান্টাম সংখ্যা, বর্ণালী ও Ksp",
    buet: "৯২% (রিডবার্গ ও Ksp ম্যাথ)",
    medical: "৯৪% (শিখা পরীক্ষা ও কোয়ান্টাম)",
    du: "৯০% (অরবিটাল ও দ্রাব্যতা)",
    priority: "হট টপিক 🔥",
  },
  {
    topic: "মৌলের পর্যায়বৃত্ত ধর্ম: আয়নীকরণ শক্তি ও সংকরায়ণ",
    buet: "৮৫% (আকৃতি ও বন্ধন কোণ)",
    medical: "৯২% (ব্যতিক্রম ও অক্সাইড ধর্ম)",
    du: "৮৮% (সংকরায়ণ ও পোলারায়ন)",
    priority: "উচ্চ গুরুত্ব ⚡",
  },
];

const DEFAULT_HACKS = [
  {
    title: "লগারিদম মান মুখস্থ ও pH শর্টকাট (ঢাবি ও গুচ্ছ)",
    formula: "\\text{যদি } [\\text{H}^+] = a \\times 10^{-b} \\text{ হয়, তবে } \\text{pH} = b - \\log_{10}(a)",
    values: "\\log 2 = 0.30, \\; \\log 3 = 0.48, \\; \\log 5 = 0.70, \\; \\log 7 = 0.85",
    example: "উদাহরণ: $[\\text{H}^+] = 2 \\times 10^{-4}\\text{ M} \\implies \\text{pH} = 4 - \\log 2 = 4 - 0.30 = 3.70$ (ক্যালকুলেটর ছাড়াই ২ সেকেন্ডে!)",
  },
  {
    title: "দশমিক বর্গমূল ও Ksp থেকে দ্রাব্যতা নির্ণয় হ্যাক",
    formula: "\\text{AB}_2 \\text{ লবণের ক্ষেত্রে } K_{sp} = 4S^3 \\implies S = \\sqrt[3]{\\frac{K_{sp}}{4}}",
    values: "4 \\times 10^{-12} \\implies S = \\sqrt[3]{10^{-12}} = 10^{-4}\\text{ M}",
    example: "ভর্তি পরীক্ষায় সর্বদা সূচক ৩ বা ২ দ্বারা বিভাজ্য থাকে, শুধু পাওয়ারকে ভাগ করলেই উত্তর মিলে যায়!",
  },
];

export default function AdminAdmissionEdgeManager() {
  const [activeTab, setActiveTab] = useState("matrix"); // matrix | hacks
  const [matrixList, setMatrixList] = useState(DEFAULT_MATRIX);
  const [hacksList, setHacksList] = useState(DEFAULT_HACKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // KaTeX formula shortcuts toolbar
  const KATEX_TOOLBAR = [
    { label: "ভগ্নাংশ", code: "\\frac{a}{b}" },
    { label: "Δn", code: "\\Delta n" },
    { label: "log₁₀", code: "\\log_{10}" },
    { label: "বর্গমূল", code: "\\sqrt{x}" },
    { label: "ঘনমূল", code: "\\sqrt[3]{x}" },
    { label: "×10ⁿ", code: "\\times 10^{-b}" },
    { label: "টেক্সট", code: "\\text{pH}" },
  ];

  // Fetch published data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "admissionEdge", "config");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.matrix) && data.matrix.length > 0) {
            setMatrixList(data.matrix);
          }
          if (Array.isArray(data.hacks) && data.hacks.length > 0) {
            setHacksList(data.hacks);
          }
        }
      } catch (err) {
        console.warn("Could not load admission edge config from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveAll = async () => {
    soundService.playClick();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, "admissionEdge", "config");
      await setDoc(docRef, {
        matrix: matrixList,
        hacks: hacksList,
        updatedAt: serverTimestamp(),
      });

      soundService.playCorrect();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save admission edge error:", err);
      alert("সংরক্ষণ ব্যর্থ হয়েছে! ইন্টারনেট সংযোগ চেক করুন।");
    } finally {
      setSaving(false);
    }
  };

  // Matrix item operations
  const addMatrixRow = () => {
    setMatrixList((prev) => [
      ...prev,
      {
        topic: "নতুন চ্যাপ্টার বা টপিক",
        buet: "৯০%",
        medical: "৮৫%",
        du: "৯৫%",
        priority: "হট টপিক 🔥",
      },
    ]);
  };

  const updateMatrixRow = (index, field, value) => {
    setMatrixList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeMatrixRow = (index) => {
    setMatrixList((prev) => prev.filter((_, i) => i !== index));
  };

  // Hacks item operations
  const addHackItem = () => {
    setHacksList((prev) => [
      ...prev,
      {
        title: "নতুন ম্যাথ হ্যাক শিরোনাম",
        formula: "\\text{pH} = -\\log_{10}[\\text{H}^+]",
        values: "\\log 2 = 0.30",
        example: "সংক্ষিপ্ত বিবরণ ও কৌশল",
      },
    ]);
  };

  const updateHackItem = (index, field, value) => {
    setHacksList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeHackItem = (index) => {
    setHacksList((prev) => prev.filter((_, i) => i !== index));
  };

  const insertKaTeX = (index, field, snippet) => {
    const current = hacksList[index]?.[field] || "";
    updateHackItem(index, field, `${current} ${snippet}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              অ্যাডমিশন স্পেশাল এজ কিউরেটর
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Live Studio
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              ২০ বছরের প্রশ্ন ট্রেন্ড ও নন-ক্যালকুলেটর ম্যাথ হ্যাকস কিউরেট ও পাবলিশ করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> সংরক্ষিত হয়েছে!
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "পাবলিশ হচ্ছে..." : "পাবলিশ করুন 🚀"}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "matrix"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>২০ বছরের ফ্রিকোয়েন্সি ম্যাট্রিক্স ({matrixList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("hacks")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "hacks"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>নন-ক্যালকুলেটর ম্যাথ হ্যাকস ({hacksList.length})</span>
        </button>
      </div>

      {/* Tab 1: Frequency Matrix Editor */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {matrixList.map((row, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 font-mono">
                    টপিক #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMatrixRow(idx)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      টপিক ও অধ্যায় নাম
                    </label>
                    <input
                      type="text"
                      value={row.topic}
                      onChange={(e) => updateMatrixRow(idx, "topic", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      BUET ট্রেন্ড
                    </label>
                    <input
                      type="text"
                      value={row.buet}
                      onChange={(e) => updateMatrixRow(idx, "buet", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      মেডিকেল (MAT)
                    </label>
                    <input
                      type="text"
                      value={row.medical}
                      onChange={(e) => updateMatrixRow(idx, "medical", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      ঢাবি ও গুচ্ছ
                    </label>
                    <input
                      type="text"
                      value={row.du}
                      onChange={(e) => updateMatrixRow(idx, "du", e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">গুরুত্ব লেবেল:</span>
                  {["হট টপিক 🔥", "উচ্চ গুরুত্ব ⚡", "মাঝারি গুরুত্ব", "নন-ক্যালকুলেটর স্পেশাল"].map(
                    (p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => updateMatrixRow(idx, "priority", p)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                          row.priority === p
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                            : "bg-slate-950 text-slate-500 border-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMatrixRow}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-amber-400 hover:border-amber-500/50 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> নতুন প্রশ্ন ট্রেন্ড যোগ করুন
          </button>
        </div>
      )}

      {/* Tab 2: Non-Calculator Hacks Editor */}
      {activeTab === "hacks" && (
        <div className="space-y-4">
          <div className="space-y-4">
            {hacksList.map((hack, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">
                    ম্যাথ হ্যাক #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHackItem(idx)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    হ্যাক শিরোনাম
                  </label>
                  <input
                    type="text"
                    value={hack.title}
                    onChange={(e) => updateHackItem(idx, "title", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* KaTeX Formula toolbar */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[9px] text-slate-500 font-mono">KaTeX শর্টকাট:</span>
                  {KATEX_TOOLBAR.map((tool, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => insertKaTeX(idx, "formula", tool.code)}
                      className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-300"
                    >
                      {tool.label}
                    </button>
                  ))}
                </div>

                {/* Mathematical Formula (KaTeX) */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    গাণিতিক সূত্র (KaTeX সমীকরণ)
                  </label>
                  <input
                    type="text"
                    value={hack.formula}
                    onChange={(e) => updateHackItem(idx, "formula", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Values & Constants */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    মান ও কনস্ট্যান্ট হ্যাক
                  </label>
                  <input
                    type="text"
                    value={hack.values}
                    onChange={(e) => updateHackItem(idx, "values", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-teal-300 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Example / Explanation */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    উদাহরণ ও শর্টকাট প্রয়োগ
                  </label>
                  <textarea
                    rows={2}
                    value={hack.example}
                    onChange={(e) => updateHackItem(idx, "example", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Live Student Preview Box */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[9.5px] font-bold text-emerald-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> লাইভ স্টুডেন্ট কার্ড প্রিভিউ:
                  </span>
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
                    <KaTeXMath math={hack.formula || ""} block className="text-white font-bold" />
                    <KaTeXMath math={hack.values || ""} block className="text-amber-300 text-xs" />
                  </div>
                  <div className="text-[11px] text-slate-300">
                    <KaTeXMath math={hack.example || ""} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addHackItem}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> নতুন নন-ক্যালকুলেটর হ্যাক যোগ করুন
          </button>
        </div>
      )}
    </div>
  );
}

