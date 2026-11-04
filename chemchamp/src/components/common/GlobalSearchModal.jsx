import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Zap,
  Atom,
  FileSpreadsheet,
  AlertCircle,
  Swords,
  Trophy,
  ArrowRight,
  X,
  CornerDownLeft,
} from "lucide-react";
import { soundService } from "../../services/soundService";

const SEARCH_DATABASE = [
  // 1. Chapters & Key Topics
  {
    id: "topic_quant",
    category: "টপিক ও অধ্যায়",
    title: "কোয়ান্টাম সংখ্যা ও অরবিটাল ধারণক্ষমতা",
    subtitle: "গুণগত রসায়ন (১ম পত্র) • n, l, m, s নীতি",
    type: "study",
    link: "/study?chapter=গুণগত রসায়ন",
    icon: BookOpen,
    badge: "১ম পত্র",
  },
  {
    id: "topic_buffer",
    category: "টপিক ও অধ্যায়",
    title: "বাফার দ্রবণ ও হেন্ডারসন-হ্যাসেলবালখ সমীকরণ",
    subtitle: "রাসায়নিক পরিবর্তন • pH গণনা ও অম্লীয়-ক্ষারীয় বাফার",
    type: "study",
    link: "/study?chapter=রাসায়নিক পরিবর্তন",
    icon: BookOpen,
    badge: "১ম পত্র",
  },
  {
    id: "topic_hybrid",
    category: "টপিক ও অধ্যায়",
    title: "সংকরায়ণ (Hybridization) ও অণুর আকৃতি",
    subtitle: "পর্যায়বৃত্ত ধর্ম • sp3, sp2, sp, sp3d মুক্তজোড় ইলেকট্রন",
    type: "study",
    link: "/study?chapter=মৌলের পর্যায়বৃত্ত ধর্ম",
    icon: BookOpen,
    badge: "১ম পত্র",
  },
  {
    id: "topic_gas",
    category: "টপিক ও অধ্যায়",
    title: "আদর্শ গ্যাস সমীকরণ ও গ্রাহামের ব্যাপন সূত্র",
    subtitle: "পরিবেশ রসায়ন • PV=nRT ও ডাল্টনের আংশিক চাপ সূত্র",
    type: "study",
    link: "/study?chapter=পরিবেশ রসায়ন",
    icon: BookOpen,
    badge: "১ম পত্র",
  },
  {
    id: "topic_organic",
    category: "টপিক ও অধ্যায়",
    title: "জৈব রসায়ন: নামীয় বিক্রিয়া ও মেকানিজম",
    subtitle: "জৈব রসায়ন (২য় পত্র) • উর্টজ, ক্যানিজারো, অ্যালডল ঘনীভবন",
    type: "study",
    link: "/study?chapter=জৈব রসায়ন",
    icon: BookOpen,
    badge: "২য় পত্র",
  },
  {
    id: "topic_electro",
    category: "টপিক ও অধ্যায়",
    title: "নের্নস্ট সমীকরণ ও কোষ বিভব (Ecell)",
    subtitle: "তড়িৎ রসায়ন • ফ্যারাডের সূত্র ও তড়িৎ রাসায়নিক সারি",
    type: "study",
    link: "/study?chapter=তড়িৎ রসায়ন",
    icon: BookOpen,
    badge: "২য় পত্র",
  },

  // 2. Named Reactions & Flashcards
  {
    id: "rxn_wurtz",
    category: "বিক্রিয়া ফ্ল্যাশকার্ড",
    title: "উর্টজ বিক্রিয়া (Wurtz Reaction)",
    subtitle: "অ্যালকাইল হ্যালাইড + শুষ্ক ইথার + Na ➔ উচ্চতর অ্যালকেন",
    type: "vault",
    link: "/vault?tab=reactions",
    icon: Zap,
    badge: "ফ্লিপকার্ড",
  },
  {
    id: "rxn_cannizzaro",
    category: "বিক্রিয়া ফ্ল্যাশকার্ড",
    title: "ক্যানিজারো বিক্রিয়া (Cannizzaro Reaction)",
    subtitle: "আলফা-হাইড্রোজেনবিহীন অ্যালডিহাইডের স্বতঃ জারণ-বিজারণ",
    type: "vault",
    link: "/vault?tab=reactions",
    icon: Zap,
    badge: "ফ্লিপকার্ড",
  },
  {
    id: "rxn_aldol",
    category: "বিক্রিয়া ফ্ল্যাশকার্ড",
    title: "অ্যালডল ঘনীভবন বিক্রিয়া (Aldol Condensation)",
    subtitle: "আলফা-হাইড্রোজেনযুক্ত কার্বনিল যৌগের ক্ষারীয় ঘনীভবন",
    type: "vault",
    link: "/vault?tab=reactions",
    icon: Zap,
    badge: "ফ্লিপকার্ড",
  },
  {
    id: "rxn_grignard",
    category: "বিক্রিয়া ফ্ল্যাশকার্ড",
    title: "গ্রিগনার্ড বিকারক (R-Mg-X) প্রস্তুতি ও বিক্রিয়া",
    subtitle: "১°, ২°, ৩° অ্যালকোহল ও কার্বক্সিলিক অ্যাসিড প্রস্তুতি",
    type: "vault",
    link: "/vault?tab=reactions",
    icon: Zap,
    badge: "ফ্লিপকার্ড",
  },

  // 3. Periodic Table Exceptions
  {
    id: "pt_cr_cu",
    category: "পর্যায় সারণি ব্যতিক্রম",
    title: "ক্রোমিয়াম (Cr) ও কপার (Cu) ইলেকট্রন বিন্যাস",
    subtitle: "d5 ও d10 অর্ধপূর্ণ ও পূর্ণ অরবিটালের অধিক স্থিতিশীলতা",
    type: "vault",
    link: "/vault?tab=periodic",
    icon: Atom,
    badge: "ব্যতিক্রম",
  },
  {
    id: "pt_no_ie",
    category: "পর্যায় সারণি ব্যতিক্রম",
    title: "নাইট্রোজেন (N) বনাম অক্সিজেন (O) আয়নীকরণ শক্তি",
    subtitle: "নাইট্রোজেনের 2p3 অর্ধপূর্ণ অরবিটালের জন্য IE1 অক্সিজেনের চেয়ে বেশি",
    type: "vault",
    link: "/vault?tab=periodic",
    icon: Atom,
    badge: "ব্যতিক্রম",
  },

  // 4. Mathematical Formula Bank
  {
    id: "form_henderson",
    category: "ফর্মুলা ভল্ট",
    title: "হেন্ডারসন-হ্যাসেলবালখ সমীকরণ (pH ও pOH)",
    subtitle: "pH = pKa + log([লবণ]/[অ্যাসিড])",
    type: "vault",
    link: "/vault?tab=formulas",
    icon: FileSpreadsheet,
    badge: "ফর্মুলা",
  },
  {
    id: "form_nernst",
    category: "ফর্মুলা ভল্ট",
    title: "নের্নস্ট সমীকরণ (Nernst Equation)",
    subtitle: "Ecell = E°cell - (0.0592/n) * log(Q)",
    type: "vault",
    link: "/vault?tab=formulas",
    icon: FileSpreadsheet,
    badge: "ফর্মুলা",
  },
  {
    id: "form_faraday",
    category: "ফর্মুলা ভল্ট",
    title: "ফ্যারাডের তড়িৎ বিশ্লেষণের ১ম সূত্র (W = ZIt)",
    subtitle: "W = (M * I * t) / (e * 96500)",
    type: "vault",
    link: "/vault?tab=formulas",
    icon: FileSpreadsheet,
    badge: "ফর্মুলা",
  },

  // 5. Exam & Practice Tools
  {
    id: "tool_mistakes",
    category: "এক্সাম ও প্র্যাকটিস",
    title: "স্মার্ট মিস্টেক বক্স (Leitner 4-Box)",
    subtitle: "ভুল হওয়া MCQ ১, ৩, ৭ ও ২১ দিনের ব্যবধানে রিভিশন",
    type: "exam",
    link: "/exams?tab=mistakes",
    icon: AlertCircle,
    badge: "রিভিশন",
  },
  {
    id: "tool_battle",
    category: "এক্সাম ও প্র্যাকটিস",
    title: "১v১ কুইজ ডুয়েল এরিনা (Friend Battle)",
    subtitle: "রুম কোড দিয়ে বন্ধুদের সাথে রিয়েল-টাইম কুইজ যুদ্ধ",
    type: "exam",
    link: "/leaderboard?tab=duel",
    icon: Swords,
    badge: "লাইভ ব্যাটল",
  },
  {
    id: "tool_leaderboard",
    category: "এক্সাম ও প্র্যাকটিস",
    title: "সাপ্তাহিক লিডারবোর্ড ও কলেজ র‍্যাংকিং",
    subtitle: "NDC, HC, RCC সহ বাংলাদেশের কলেজগুলোর প্রতিযোগিতা",
    type: "exam",
    link: "/leaderboard",
    icon: Trophy,
    badge: "র‍্যাংকিং",
  },
];

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Filter items based on Bengali / English search query
  const filtered = SEARCH_DATABASE.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item) => {
    soundService.playClick();
    onClose();
    navigate(item.link);
  };

  // Keyboard navigation (Arrow keys + Enter + Escape)
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? filtered.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-12 sm:pt-20 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="যেকোনো চ্যাপ্টার, বিক্রিয়া, মৌল বা সূত্র সার্চ করুন... (যেমন: বাফার, উর্টজ, Cr)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Search className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500">
                অন্য কোনো বিক্রিয়া, অধ্যায় বা সূত্রের নাম দিয়ে চেষ্টা করুন।
              </p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-white"
                      : "hover:bg-slate-800/60 text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl border shrink-0 transition-colors ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100">
                    <span className="hidden sm:inline">যান</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 px-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px]">↓</kbd>
              <span>ন্যাভিগেশন</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] flex items-center">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
              <span>ওপেন</span>
            </span>
          </div>

          <span className="text-slate-500 font-mono text-[10px]">
            {filtered.length}টি রেজাল্ট
          </span>
        </div>
      </div>
    </div>
  );
}

