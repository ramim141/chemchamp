import { contentVersionService } from "../../../services/contentVersionService";
import React, { useState, useEffect } from "react";
import { cacheService } from "../../../services/cacheService";
import { db } from "../../../services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import {
  Plus,
  Edit2,
  Trash2,
  Lightbulb,
  RefreshCw,
  X,
  Save,
  FileJson,
  Copy,
  Check,
  Zap,
  Eye,
  Sparkles,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";

const FORMULA_JSON_TEMPLATE = [
  {
    title: "হেন্ডারসন-হ্যাসেলবালখ সমীকরণ (বাফার)",
    category: "buffer",
    categoryLabel: "বাফার ও সাম্যাবস্থা",
    formula: "\\text{pH} = \\text{pK}_a + \\log_{10} \\left( \\frac{[\\text{লবণ}]}{[\\text{অ্যাসিড}]} \\right)",
    hack: "যদি [লবণ] = [অ্যাসিড] হয়, তবে সরাসরি pH = pKa হবে!",
  },
  {
    title: "নের্নস্ট সমীকরণ (তড়িৎ কোষ বিভব)",
    category: "electro",
    categoryLabel: "তড়িৎ রসায়ন",
    formula: "E_{cell} = E^\\circ_{cell} - \\frac{0.0592}{n} \\log_{10} \\left( \\frac{[\\text{অ্যানোড}]}{[\\text{ক্যাথোড}]} \\right)",
    hack: "২৫ ডিগ্রি সেলসিয়াসে সরাসরি 0.0592/n বসিয়ে সেকেন্ডেই হিসাব করুন।",
  },
];

export default function FormulaVaultTab() {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Modal State
  const [modal, setModal] = useState({ open: false, data: null });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("buffer");
  const [formula, setFormula] = useState("");
  const [hack, setHack] = useState("");

  // Bulk JSON Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const fetchFormulas = async () => {
    setLoading(true);
    setPermissionError(false);
    try {
      const snap = await getDocs(collection(db, "formulas"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFormulas(list);
    } catch (err) {
      console.error("Fetch formulas error:", err);
      if (err?.code === "permission-denied" || String(err?.message || "").includes("permission")) {
        setPermissionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormulas();
  }, []);

  const QUICK_FORMULA_SYMBOLS = [
    { label: "ভগ্নংশ \\frac{}{}", code: "\\frac{a}{b}" },
    { label: "Δn (মোল পার্থক্য)", code: "^{\\Delta n}" },
    { label: "লগ \\log_{10}", code: "\\log_{10}" },
    { label: "Ln", code: "\\ln" },
    { label: "√ (বর্গমূল)", code: "\\sqrt{}" },
    { label: "×10^", code: " \\times 10^" },
    { label: "α (বিয়োজন মাত্রা)", code: "\\alpha" },
    { label: "λ (তরঙ্গদৈর্ঘ্য)", code: "\\lambda" },
    { label: "টেক্সট \\text{}", code: "\\text{}" },
    { label: "°C বা K", code: "\\text{ K}" },
  ];

  const handleInsertSymbol = (code) => {
    setFormula((prev) => prev + code);
  };

  const handleOpenModal = (f = null) => {
    setModal({ open: true, data: f });
    setTitle(f?.title || "");
    setCategory(f?.category || "buffer");
    setFormula(f?.formula || "\\text{pH} = -\\log_{10}[\\text{H}^+]");
    setHack(f?.hack || "");
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case "buffer":
        return "বাফার ও সাম্যাবস্থা";
      case "electro":
        return "তড়িৎ রসায়ন";
      case "gas":
        return "গ্যাসীয় রসায়ন";
      case "kinetics":
        return "ভৌত রসায়ন";
      default:
        return "সাধারণ রসায়ন";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const id = modal.data?.id || `form_${Date.now()}`;
      await setDoc(
        doc(db, "formulas", id),
        {
          title: title.trim(),
          category,
          categoryLabel: getCategoryLabel(category),
          formula: formula.trim(),
          hack: hack.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setModal({ open: false, data: null });
      cacheService.remove("vault_formulas");
      contentVersionService.bumpVersion("vault");
      fetchFormulas();
    } catch (err) {
      alert("সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ফর্মুলাটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "formulas", id));
      cacheService.remove("vault_formulas");
      contentVersionService.bumpVersion("vault");
      setFormulas((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(FORMULA_JSON_TEMPLATE, null, 2)).then(() => {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
    });
  };

  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert("দয়া করে একটি ভ্যালিড JSON অ্যারে দিন (কমপক্ষে ১টি ফর্মুলা)।");
        return;
      }

      setUploadingBulk(true);
      const batch = writeBatch(db);
      parsed.forEach((item, idx) => {
        const id = item.id || `form_${Date.now()}_${idx}`;
        const ref = doc(db, "formulas", id);
        const cat = item.category || "buffer";
        batch.set(
          ref,
          {
            title: item.title || "রসায়ন ফর্মুলা",
            category: cat,
            categoryLabel: item.categoryLabel || getCategoryLabel(cat),
            formula: item.formula || "",
            hack: item.hack || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      await batch.commit();
      cacheService.remove("vault_formulas");
      contentVersionService.bumpVersion("vault");
      alert(`সফলভাবে ${parsed.length}টি ফর্মুলা আপলোড করা হয়েছে!`);
      setIsBulkOpen(false);
      setJsonInput("");
      fetchFormulas();
    } catch (err) {
      alert("JSON পার্সিং বা আপলোড ব্যর্থ: " + err.message);
    } finally {
      setUploadingBulk(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>গাণিতিক ফর্মুলা ও শর্টকাট ব্যাংক</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {formulas.length}টি ফর্মুলা
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            এইচএসসি ও ভর্তি পরীক্ষার গুরুত্বপূর্ণ সমীকরণ ও দ্রুত সমাধানের শর্টকাট হ্যাকস
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* JSON Bulk Uploader Button */}
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 shadow-sm transition-all active:scale-95"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON বাল্ক আপলোড</span>
          </button>

          {/* Single Create Button */}
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ফর্মুলা</span>
          </button>

          <button
            type="button"
            onClick={fetchFormulas}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Firebase Permission Error Banner */}
      {permissionError && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs space-y-1.5 shadow-lg">
          <div className="font-bold flex items-center gap-2 text-amber-300 text-sm">
            <span>⚠️ Firebase Firestore পারমিশন রুলস আপডেট প্রয়োজন</span>
          </div>
          <p className="text-amber-200/90 leading-relaxed">
            আপনার Firebase Console-এ <code>formulas</code> কালেকশনের রিড/রাইট অনুমতি সক্রিয় নেই (FirebaseError: Missing or insufficient permissions)।
            দয়া করে Firebase Console ➔ <strong>Firestore Database</strong> ➔ <strong>Rules</strong> ট্যাবে গিয়ে <code>chemchamp/firebase.rules</code> ফাইলের রুলস পেস্ট করে <strong>Publish</strong> করুন।
          </p>
        </div>
      )}

      {/* Formulas Grid */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">ফর্মুলা লোড হচ্ছে...</div>
      ) : formulas.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <Zap className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-400">এখনো কোনো ফর্মুলা যুক্ত করা হয়নি।</p>
          <p className="text-[11px] text-slate-500">
            "+ নতুন ফর্মুলা" অথবা "JSON বাল্ক আপলোড" বাটনে ক্লিক করে ফর্মুলা যোগ করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {formulas.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-colors shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate">
                    {f.categoryLabel || "রসায়ন সূত্র"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(f)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="সম্পাদনা"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mb-2">{f.title}</h4>

                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800/80 text-center mb-2">
                  <KaTeXMath math={f.formula} block className="text-emerald-400 font-bold" />
                </div>
              </div>

              {f.hack && (
                <p className="text-[11px] text-slate-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 leading-relaxed">
                  <strong className="text-emerald-400">হ্যাক: </strong>
                  {f.hack}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* একক ফর্মুলা তৈরি / এডিট মোডাল উইথ লাইভ KaTeX প্রিভিউ */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModal({ open: false, data: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {modal.data ? "ফর্মুলা সম্পাদনা" : "নতুন গাণিতিক ফর্মুলা তৈরি"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* বাম পাশের কলাম: ইনপুট ফিল্ডস */}
                <div className="space-y-3.5">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">ফর্মুলার শিরোনাম *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="যেমন: হেন্ডারসন-হ্যাসেলবালখ সমীকরণ"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">ক্যাটাগরি</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="buffer">বাফার ও সাম্যাবস্থা</option>
                      <option value="electro">তড়িৎ রসায়ন</option>
                      <option value="gas">গ্যাসীয় রসায়ন</option>
                      <option value="kinetics">ভৌত রসায়ন</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">
                      গাণিতিক সূত্র (KaTeX সমীকরণ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formula}
                      onChange={(e) => setFormula(e.target.value)}
                      placeholder="K_p = K_c (RT)^{\Delta n}"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-amber-300 font-mono text-sm focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">এডমিশন শর্টকাট হ্যাক</label>
                    <textarea
                      rows={3}
                      value={hack}
                      onChange={(e) => setHack(e.target.value)}
                      placeholder="যেমন: যদি \Delta n = 0 হয়, তবে Kp = Kc হবে..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed transition-colors"
                    />
                  </div>
                </div>

                {/* ডান পাশের কলাম: KaTeX টুলবার ও লাইভ প্রিভিউ */}
                <div className="space-y-3.5 flex flex-col justify-between">
                  {/* দ্রুত ম্যাথ KaTeX ইনসার্টার টুলবার */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      KaTeX সমীকরণ শর্টকাট (ক্লিক করলে সূত্রে যোগ হবে):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_FORMULA_SYMBOLS.map((sym, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInsertSymbol(sym.code)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 text-[11px] font-mono transition-colors active:scale-95"
                          title={sym.code}
                        >
                          {sym.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* স্টুডেন্ট কার্ড লাইভ প্রিভিউ */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold">
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>স্টুডেন্ট ভিউ লাইভ প্রিভিউ:</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono">লাইভ প্রিভিউ</span>
                    </div>

                    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {getCategoryLabel(category)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white">{title || "ফর্মুলার নাম"}</h4>

                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-center my-auto">
                        <KaTeXMath math={formula || "..."} block className="text-amber-400 font-bold text-base" />
                      </div>

                      {hack && (
                        <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-200/90">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <strong className="text-amber-300 font-semibold">হ্যাক: </strong>
                            {hack}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ফুটার একশন বাটন */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModal({ open: false, data: null })}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{modal.data ? "ফর্মুলা আপডেট করুন" : "ফর্মুলা সংরক্ষণ করুন 🚀"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JSON বাল্ক আপলোড মোডাল */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-amber-400" />
                <span>ফর্মুলা ব্যাংক JSON বাল্ক আপলোড</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">
                  নিচের ফরম্যাটে এক বা একাধিক সূত্রের JSON অ্যারে পেস্ট করুন:
                </span>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedTemplate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTemplate ? "কপি হয়েছে!" : "টেমপ্লেট কপি"}</span>
                </button>
              </div>

              <textarea
                rows={9}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={JSON.stringify(FORMULA_JSON_TEMPLATE, null, 2)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-300 focus:outline-none focus:border-amber-500 leading-relaxed"
              />

              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                💡 <strong>টিপস:</strong> আপনি যেকোনো অধ্যায়ের ১০-২০টি গাণিতিক ফর্মুলা একবারে পেস্ট করে সরাসরি ফায়ারস্টোর ডেটাবেজে যুক্ত করতে পারবেন!
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                disabled={uploadingBulk || !jsonInput.trim()}
                onClick={handleBulkUpload}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                {uploadingBulk ? "আপলোড হচ্ছে..." : "একসাথে সব ফর্মুলা আপলোড করুন 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
