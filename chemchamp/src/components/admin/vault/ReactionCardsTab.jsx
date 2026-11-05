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
  Rotate3d,
  RefreshCw,
  X,
  Save,
  FileJson,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";

const REACTION_JSON_TEMPLATE = [
  {
    name: "উর্টজ বিক্রিয়া (Wurtz Reaction)",
    type: "অ্যালকেন প্রস্তুতি",
    front: "2\\text{R-X} + 2\\text{Na} \\xrightarrow{\\text{dry ether}} ?",
    back: "\\text{R-R} + 2\\text{NaX}",
    mechanism: "মুক্ত মূলক (Free Radical) মেকানিজম। উচ্চতর জোড় কার্বনবিশিষ্ট অ্যালকেন সংশ্লেষণের জন্য আদর্শ।",
  },
  {
    name: "ক্যানিজারো বিক্রিয়া (Cannizzaro Reaction)",
    type: "অ্যালডিহাইড স্বতঃ জারণ-বিজারণ",
    front: "2\\text{HCHO} + 50\\% \\text{NaOH} \\xrightarrow{\\Delta} ?",
    back: "\\text{HCOONa} + \\text{CH}_3\\text{OH}",
    mechanism: "\\alpha\\text{-H} বিহীন অ্যালডিহাইড তীব্র ক্ষারের সাথে বিক্রিয়া করে লবণ ও অ্যালকোহল দেয়।",
  },
];

export default function ReactionCardsTab() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Modal State
  const [modal, setModal] = useState({ open: false, data: null });
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [mechanism, setMechanism] = useState("");
  const [activeInput, setActiveInput] = useState("front"); // 'front' | 'back'
  const [previewFlipped, setPreviewFlipped] = useState(false);

  // Bulk JSON Modal State
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "flashcards"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCards(list);
    } catch (err) {
      console.error("Fetch flashcards error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const QUICK_SYMBOLS = [
    { label: "⟶ (তীর)", code: " \\rightarrow " },
    { label: "⇄ (উভমুখী)", code: " \\rightleftharpoons " },
    { label: "xrightarrow (শর্ত)", code: " \\xrightarrow{\\text{dry ether}} " },
    { label: "Δ (তাপ)", code: "\\Delta" },
    { label: "টেক্সট \\text{}", code: "\\text{}" },
    { label: "H₂O", code: "\\text{H}_2\\text{O}" },
    { label: "H⁺", code: "\\text{H}^+" },
    { label: "OH⁻", code: "\\text{OH}^-" },
    { label: "alc. KOH", code: "\\xrightarrow{\\text{alc. KOH}} " },
    { label: "↑ (গ্যাস)", code: " \\uparrow " },
    { label: "↓ (অধঃক্ষেপ)", code: " \\downarrow " },
    { label: "α (আলফা)", code: "\\alpha" },
    { label: "β (বিটা)", code: "\\beta" },
  ];

  const handleInsertSymbol = (code) => {
    if (activeInput === "front") {
      setFront((prev) => prev + code);
    } else {
      setBack((prev) => prev + code);
    }
  };

  const handleOpenModal = (card = null) => {
    setModal({ open: true, data: card });
    setName(card?.name || "");
    setType(card?.type || "অ্যালকেন প্রস্তুতি");
    setFront(card?.front || "2\\text{R-X} + 2\\text{Na} \\xrightarrow{\\text{dry ether}} ?");
    setBack(card?.back || "\\text{R-R} + 2\\text{NaX}");
    setMechanism(card?.mechanism || "");
    setPreviewFlipped(false);
    setActiveInput("front");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const id = modal.data?.id || `card_${Date.now()}`;
      await setDoc(
        doc(db, "flashcards", id),
        {
          name: name.trim(),
          type: type.trim(),
          front: front.trim(),
          back: back.trim(),
          mechanism: mechanism.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setModal({ open: false, data: null });
      cacheService.remove("vault_flashcards");
      contentVersionService.bumpVersion("vault");
      fetchCards();
    } catch (err) {
      alert("সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ফ্লিপকার্ডটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "flashcards", id));
      cacheService.remove("vault_flashcards");
      contentVersionService.bumpVersion("vault");
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(REACTION_JSON_TEMPLATE, null, 2)).then(() => {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
    });
  };

  const handleBulkUpload = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert("দয়া করে একটি ভ্যালিড JSON অ্যারে দিন (কমপক্ষে ১টি রিঅ্যাকশন কার্ড)।");
        return;
      }

      setUploadingBulk(true);
      const batch = writeBatch(db);
      parsed.forEach((item, idx) => {
        const id = item.id || `card_${Date.now()}_${idx}`;
        const ref = doc(db, "flashcards", id);
        batch.set(
          ref,
          {
            name: item.name || "জৈব বিক্রিয়া",
            type: item.type || "জৈব রসায়ন",
            front: item.front || "",
            back: item.back || "",
            mechanism: item.mechanism || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });

      await batch.commit();
      cacheService.remove("vault_flashcards");
      contentVersionService.bumpVersion("vault");
      alert(`সফলভাবে ${parsed.length}টি ফ্লিপকার্ড আপলোড করা হয়েছে!`);
      setIsBulkOpen(false);
      setJsonInput("");
      fetchCards();
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
            <span>জৈব রসায়ন রিঅ্যাকশন ফ্লিপকার্ড</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {cards.length}টি কার্ড
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            সামনে বিক্রিয়ক/শর্ত ও পেছনে উৎপাদ/মেকানিজম সম্বলিত ইন্টারঅ্যাক্টিভ ফ্লিপকার্ড
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* JSON Bulk Uploader Button */}
          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs rounded-xl border border-teal-500/30 shadow-sm transition-all active:scale-95"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON বাল্ক আপলোড</span>
          </button>

          {/* Single Create Button */}
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন ফ্লিপকার্ড</span>
          </button>

          <button
            type="button"
            onClick={fetchCards}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Cards List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">ফ্লিপকার্ড লোড হচ্ছে...</div>
      ) : cards.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
          <Rotate3d className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-400">এখনো কোনো ফ্লিপকার্ড আপলোড করা হয়নি।</p>
          <p className="text-[11px] text-slate-500">
            "+ নতুন ফ্লিপকার্ড" অথবা "JSON বাল্ক আপলোড" বাটনে ক্লিক করে কার্ড যুক্ত করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between gap-2.5 hover:border-slate-700 transition-colors shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 truncate">
                    {card.type || "জৈব বিক্রিয়া"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(card)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="সম্পাদনা"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(card.id)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mb-2">{card.name}</h4>

                {/* ফ্রন্ট বিক্রিয়ক */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-center mb-1.5">
                  <span className="text-[9px] text-slate-500 block mb-0.5">সামনে (বিক্রিয়ক):</span>
                  <KaTeXMath math={card.front} block className="text-emerald-400 font-bold" />
                </div>

                {/* ব্যাক উৎপাদ */}
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-center">
                  <span className="text-[9px] text-slate-500 block mb-0.5">পেছনে (উৎপাদ):</span>
                  <KaTeXMath math={card.back} block className="text-teal-300 font-bold" />
                </div>
              </div>

              {card.mechanism && (
                <p className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60 leading-relaxed">
                  <strong className="text-amber-400">মেকানিজম: </strong>
                  {card.mechanism}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* একক ফ্লিপকার্ড তৈরি / এডিট মোডাল উইথ লাইভ KaTeX প্রিভিউ */}
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
              <Rotate3d className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {modal.data ? "ফ্লিপকার্ড সম্পাদনা" : "নতুন জৈব বিক্রিয়া ফ্লিপকার্ড তৈরি"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* বাম পাশের কলাম: ইনপুট ফিল্ডস */}
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">বিক্রিয়ার নাম *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="যেমন: উর্টজ বিক্রিয়া"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1 font-semibold">টাইপ / ক্যাটাগরি *</label>
                      <input
                        type="text"
                        required
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        placeholder="যেমন: অ্যালকেন প্রস্তুতি"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* ফ্রন্ট বিক্রিয়ক */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">
                        সামনে: বিক্রিয়ক ও শর্ত (KaTeX সমীকরণ) *
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">Front Side</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={front}
                      onFocus={() => setActiveInput("front")}
                      onChange={(e) => setFront(e.target.value)}
                      placeholder="2\text{R-X} + 2\text{Na} \xrightarrow{\text{dry ether}} ?"
                      className={`w-full bg-slate-950 border rounded-xl p-2.5 text-emerald-300 font-mono text-sm focus:outline-none transition-colors ${
                        activeInput === "front" ? "border-emerald-500 shadow-sm shadow-emerald-500/20" : "border-slate-800"
                      }`}
                    />
                  </div>

                  {/* ব্যাক উৎপাদ */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">
                        পেছনে: প্রধান উৎপাদ (KaTeX সমীকরণ) *
                      </label>
                      <span className="text-[10px] text-teal-300 font-mono">Back Side</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={back}
                      onFocus={() => setActiveInput("back")}
                      onChange={(e) => setBack(e.target.value)}
                      placeholder="\text{R-R} + 2\text{NaX}"
                      className={`w-full bg-slate-950 border rounded-xl p-2.5 text-teal-300 font-mono text-sm focus:outline-none transition-colors ${
                        activeInput === "back" ? "border-teal-500 shadow-sm shadow-teal-500/20" : "border-slate-800"
                      }`}
                    />
                  </div>

                  {/* মেকানিজম নোট */}
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">মেকানিজম ও এডমিশন টিপস</label>
                    <textarea
                      rows={3}
                      value={mechanism}
                      onChange={(e) => setMechanism(e.target.value)}
                      placeholder="যেমন: মুক্ত মূলক (Free radical) মেকানিজম। উচ্চতর জোড় কার্বন অ্যালকেনের জন্য প্রযোজ্য..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 leading-relaxed transition-colors"
                    />
                  </div>
                </div>

                {/* ডান পাশের কলাম: KaTeX টুলবার ও স্টুডেন্ট লাইভ ৩ডি প্রিভিউ */}
                <div className="space-y-3.5 flex flex-col justify-between">
                  {/* দ্রুত KaTeX প্রতীক ইনসার্টার টুলবার */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">
                        KaTeX প্রতীক শর্টকাট (ক্লিক করলে ইনপুট হবে):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">টার্গেট:</span>
                        <button
                          type="button"
                          onClick={() => setActiveInput("front")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            activeInput === "front"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          সামনে
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveInput("back")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            activeInput === "back"
                              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          পেছনে
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SYMBOLS.map((sym, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleInsertSymbol(sym.code)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 text-[11px] font-mono transition-colors active:scale-95"
                          title={sym.code}
                        >
                          {sym.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* স্টুডেন্ট কার্ড লাইভ ইন্টারেক্টিভ প্রিভিউ */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold">
                        <Eye className="w-3.5 h-3.5 text-teal-400" />
                        <span>লাইভ ৩ডি প্রিভিউ (ক্লিক করে ফ্লিপ টেস্ট করুন):</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewFlipped((prev) => !prev)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold transition-colors"
                      >
                        <Rotate3d className="w-3 h-3" />
                        <span>{previewFlipped ? "সামনে দেখুন (Front)" : "পেছনে দেখুন (Back)"}</span>
                      </button>
                    </div>

                    <div
                      onClick={() => setPreviewFlipped((prev) => !prev)}
                      className="cursor-pointer select-none rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 min-h-[160px] flex flex-col justify-between transition-all duration-300 my-auto shadow-inner"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold">
                          {type || "ক্যাটাগরি"}
                        </span>
                        <span className="text-slate-500">
                          {previewFlipped ? "পেছন সাইড (Answer)" : "সামনে সাইড (Question)"}
                        </span>
                      </div>

                      <div className="text-center py-2">
                        <p className="text-xs sm:text-sm font-bold text-white mb-2">{name || "বিক্রিয়ার নাম"}</p>
                        {previewFlipped ? (
                          <div className="animate-in fade-in zoom-in-95">
                            <span className="text-[10px] text-teal-400 block mb-0.5 font-semibold">প্রধান উৎপাদ:</span>
                            <KaTeXMath math={back || "..."} block className="text-teal-300 font-bold text-base" />
                          </div>
                        ) : (
                          <div className="animate-in fade-in zoom-in-95">
                            <span className="text-[10px] text-emerald-400 block mb-0.5 font-semibold">বিক্রিয়ক ও শর্ত:</span>
                            <KaTeXMath math={front || "..."} block className="text-emerald-400 font-bold text-base" />
                          </div>
                        )}
                      </div>

                      {previewFlipped && mechanism ? (
                        <p className="text-[11px] text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed mt-1">
                          <strong className="text-amber-400">টিপস: </strong>
                          {mechanism}
                        </p>
                      ) : (
                        <p className="text-[10.5px] text-slate-500 text-center">
                          👆 কার্ডে ক্লিক করে উত্তর ও মেকানিজম দেখুন
                        </p>
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
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{modal.data ? "ফ্লিপকার্ড আপডেট করুন" : "ফ্লিপকার্ড সংরক্ষণ করুন 🚀"}</span>
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
                <FileJson className="w-4 h-4 text-teal-400" />
                <span>ফ্লিপকার্ড JSON বাল্ক আপলোড</span>
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
                  নিচের ফরম্যাটে এক বা একাধিক কার্ডের JSON অ্যারে পেস্ট করুন:
                </span>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  {copiedTemplate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedTemplate ? "কপি হয়েছে!" : "টেমপ্লেট কপি"}</span>
                </button>
              </div>

              <textarea
                rows={9}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={JSON.stringify(REACTION_JSON_TEMPLATE, null, 2)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-teal-300 focus:outline-none focus:border-teal-500 leading-relaxed"
              />

              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300">
                💡 <strong>টিপস:</strong> আপনি ChatGPT বা নোটপ্যাডে ৫০টি বিক্রিয়া তৈরি করে একবারে এখানে পেস্ট করে কয়েক সেকেন্ডেই ডেটাবেজে আপলোড করতে পারবেন!
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                disabled={uploadingBulk || !jsonInput.trim()}
                onClick={handleBulkUpload}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                {uploadingBulk ? "আপলোড হচ্ছে..." : "একসাথে সব কার্ড আপলোড করুন 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
