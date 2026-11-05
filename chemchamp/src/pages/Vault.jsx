import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Atom, FileSpreadsheet, RefreshCw, Sparkles, Clock, Printer } from "lucide-react";
import ReactionFlipCard from "../components/vault/ReactionFlipCard";
import MiniPeriodicTable from "../components/vault/MiniPeriodicTable";
import FormulaCard from "../components/vault/FormulaCard";
import CustomCheatSheetModal from "../components/vault/CustomCheatSheetModal";
import { db } from "../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { cacheService } from "../services/cacheService";
import { useAuth } from "../context/AuthContext";

export default function Vault() {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "reactions";
  const [activeTab, setActiveTab] = useState(initialTab); // reactions | periodic | formulas
  const [selectedFormulaCategory, setSelectedFormulaCategory] = useState("all");
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const cachedCards = cacheService.getSync("vault_flashcards") || [];
  const cachedElems = cacheService.getSync("vault_periodic_elements") || [];
  const cachedForms = cacheService.getSync("vault_formulas") || [];
  const hasVaultCache = cachedCards.length > 0 || cachedElems.length > 0 || cachedForms.length > 0;

  const [flashcards, setFlashcards] = useState(cachedCards);
  const [elements, setElements] = useState(cachedElems);
  const [formulas, setFormulas] = useState(cachedForms);
  const [loading, setLoading] = useState(!hasVaultCache);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["reactions", "periodic", "formulas"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchVaultData = async () => {
    // 1. Instant Cache-First load for 0ms delay
    const [cCards, cElems, cForms] = await Promise.all([
      cacheService.get("vault_flashcards"),
      cacheService.get("vault_periodic_elements"),
      cacheService.get("vault_formulas"),
    ]);

    if (cCards && cElems && cForms) {
      setFlashcards(cCards);
      setElements(cElems);
      setFormulas(cForms);
      setLoading(false);
    } else if (flashcards.length === 0 && elements.length === 0) {
      setLoading(true);
    }

    try {
      // 1. Flashcards from Firestore
      const remoteCards = await cacheService.getOrFetch("vault_flashcards", async () => {
        const cardsSnap = await getDocs(collection(db, "flashcards"));
        return cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }, 60 * 60 * 1000, []);
      setFlashcards(remoteCards || []);

      // 2. Periodic Elements from Firestore
      const remoteElems = await cacheService.getOrFetch("vault_periodic_elements", async () => {
        const elemSnap = await getDocs(collection(db, "periodicElements"));
        const list = elemSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (Number(a.z) || 0) - (Number(b.z) || 0));
        return list;
      }, 24 * 60 * 60 * 1000, []);
      setElements(remoteElems || []);

      // 3. Formulas from Firestore
      const remoteForms = await cacheService.getOrFetch("vault_formulas", async () => {
        const formSnap = await getDocs(collection(db, "formulas"));
        return formSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }, 24 * 60 * 60 * 1000, []);
      setFormulas(remoteForms || []);
    } catch (err) {
      console.warn("Vault fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredFormulas = formulas.filter((f) =>
    selectedFormulaCategory === "all" ? true : f.category === selectedFormulaCategory
  );

  return (
    <div className="text-slate-100 pb-28 md:pb-12 pt-3 md:pt-5 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* হেডার ও ট্যাব সুইচ */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>কেমিস্ট্রি স্পেশাল ভল্ট</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pro
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              জৈব রসায়ন ফ্লিপকার্ড, ব্যতিক্রমী পর্যায় সারণি ও গাণিতিক ফর্মুলা ব্যাংক
            </p>
          </div>
        </div>

        {/* Tabs (Responsive 3-Button Segmented Control) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl text-xs font-bold flex-1 sm:flex-initial shadow-sm">
            <button
              type="button"
              onClick={() => handleTabChange("reactions")}
              className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all text-center truncate active:scale-95 ${
                activeTab === "reactions"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              ফ্লিপকার্ড ({flashcards.length})
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("periodic")}
              className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate active:scale-95 ${
                activeTab === "periodic"
                  ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Atom className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">পর্যায় সারণি ({elements.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("formulas")}
              className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 truncate active:scale-95 ${
                activeTab === "formulas"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 hidden xs:inline" />
              <span className="truncate">ফর্মুলা ({formulas.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCheatSheet(true)}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all shrink-0 active:scale-95"
            title="কাস্টমাইজড A4 চিটশিট তৈরি ও প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">চিটশিট প্রিন্ট 🖨️</span>
          </button>

          <button
            type="button"
            onClick={fetchVaultData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shrink-0 active:scale-95"
            title="রিফ্রেশ ভল্ট ডেটা"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </header>

      {/* লোডিং স্কেলিটন */}
      {loading && flashcards.length === 0 && elements.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-3 animate-pulse"
            >
              <div className="w-1/3 h-4 bg-slate-800 rounded-lg" />
              <div className="w-full h-12 bg-slate-800/60 rounded-xl" />
              <div className="w-2/3 h-3 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ট্যাব ১: ফ্লিপকার্ড */}
          {activeTab === "reactions" && (
            <motion.div
              key="reactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {flashcards.length === 0 ? (
                <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 space-y-4 max-w-xl mx-auto shadow-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      শীঘ্রই আসছে
                    </span>
                    <h3 className="text-lg font-black text-white pt-1">জৈব রসায়ন ফ্লিপকার্ড শীঘ্রই আসছে...</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      কেমিস্ট্রি স্পেশাল ভল্টের এই বিভাগে এক্সক্লুসিভ নেম রিঅ্যাকশন ও ফ্লিপকার্ড যুক্ত করার কাজ চলছে। অ্যাডমিন প্যানেল থেকে আপলোড করার সাথে সাথেই এখানে লাইভ দেখতে পাবেন!
                    </p>
                  </div>
                </div>
              ) : (
                <ReactionFlipCard cards={flashcards} />
              )}
            </motion.div>
          )}

          {/* ট্যাব ২: পর্যায় সারণি */}
          {activeTab === "periodic" && (
            <motion.div
              key="periodic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {elements.length === 0 ? (
                <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 space-y-4 max-w-xl mx-auto shadow-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto text-teal-400 shadow-inner">
                    <Atom className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      শীঘ্রই আসছে
                    </span>
                    <h3 className="text-lg font-black text-white pt-1">ব্যতিক্রমী পর্যায় সারণি শীঘ্রই আসছে...</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      পর্যায় সারণির গুরুত্বপূর্ণ ব্যতিক্রমী মৌল ও বিশেষ ইলেকট্রন বিন্যাস খুব শীঘ্রই এই বিভাগে উন্মুক্ত করা হবে!
                    </p>
                  </div>
                </div>
              ) : (
                <MiniPeriodicTable elements={elements} />
              )}
            </motion.div>
          )}

          {/* ট্যাব ৩: ফর্মুলা ব্যাংক */}
          {activeTab === "formulas" && (
            <motion.div
              key="formulas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {formulas.length === 0 ? (
                <div className="py-20 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 p-8 space-y-4 max-w-xl mx-auto shadow-2xl backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                    <FileSpreadsheet className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      শীঘ্রই আসছে
                    </span>
                    <h3 className="text-lg font-black text-white pt-1">গাণিতিক ফর্মুলা ব্যাংক শীঘ্রই আসছে...</h3>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      এইচএসসি ও ভর্তি পরীক্ষার গুরুত্বপূর্ণ গাণিতিক সূত্র ও শর্টকাট হ্যাকস শীঘ্রই এখানে উন্মুক্ত করা হবে!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Formula Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
                    {[
                      { id: "all", label: "সকল সূত্র" },
                      { id: "buffer", label: "বাফার ও সাম্যাবস্থা" },
                      { id: "electro", label: "তড়িৎ রসায়ন" },
                      { id: "gas", label: "গ্যাসীয় রসায়ন" },
                      { id: "kinetics", label: "ভৌত রসায়ন" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedFormulaCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                          selectedFormulaCategory === cat.id
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <FormulaCard formulas={filteredFormulas} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Customizable A4 Printable CheatSheet Builder */}
      <CustomCheatSheetModal
        isOpen={showCheatSheet}
        onClose={() => setShowCheatSheet(false)}
        flashcards={flashcards}
        elements={elements}
        formulas={formulas}
        studentName={user?.displayName || profile?.name || "কেমিস্ট্রি চ্যাম্পিয়ন"}
      />
    </div>
  );
}
