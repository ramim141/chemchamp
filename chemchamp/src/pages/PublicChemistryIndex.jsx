import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, Sparkles, ChevronRight, ArrowLeft, ArrowRight, Layers, GraduationCap, Flame } from "lucide-react";
import Seo from "../components/common/Seo";
import { PUBLIC_CHAPTERS } from "../data/publicChapters";

export default function PublicChemistryIndex() {
  const [selectedPaper, setSelectedPaper] = useState("all"); // "all" | "1" | "2"
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return PUBLIC_CHAPTERS.filter((ch) => {
      const matchPaper = selectedPaper === "all" || String(ch.paper) === selectedPaper;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        ch.title.toLowerCase().includes(q) ||
        ch.summary.toLowerCase().includes(q) ||
        ch.englishTitle.toLowerCase().includes(q);
      return matchPaper && matchQuery;
    });
  }, [selectedPaper, searchQuery]);

  const breadcrumbs = [
    { name: "হোম", item: "/" },
    { name: "রসায়ন পাঠসমূহ", item: "/chemistry" },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "HSC ও এডমিশন কেমিস্ট্রি অধ্যায়ভিত্তিক পাঠ ও সিলেবাস",
    "description": "HSC রসায়ন ১ম ও ২য় পত্রের অধ্যায়ভিত্তিক সম্পূর্ণ সিলেবাস, মূল ধারণাসমূহ, সূত্র ও বিগত বছরের বোর্ড-বুয়েট স্ট্যান্ডার্ড মডেল প্রশ্ন।",
    "url": "https://chemchamp.com/chemistry",
    "provider": {
      "@type": "EducationalOrganization",
      "name": "ChemChamp",
      "url": "https://chemchamp.com"
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Seo
        title="HSC কেমিস্ট্রি অধ্যায়ভিত্তিক পাঠ ও সিলেবাস"
        description="HSC রসায়ন ১ম ও ২য় পত্রের সম্পূর্ণ অধ্যায়ভিত্তিক সিলেবাস নোট, গুরুত্বপূর্ণ সূত্র এবং বিগত বছরের বোর্ড ও এডমিশন স্ট্যান্ডার্ড প্রশ্নব্যাংক।"
        path="/chemistry"
        breadcrumbs={breadcrumbs}
        jsonLd={jsonLd}
      />

      {/* Top Breadcrumb & Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/" className="text-emerald-400 hover:underline">
              হোম
            </Link>
            <span>/</span>
            <span className="text-slate-200 font-semibold">কেমিস্ট্রি পাঠসমূহ</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              লগইন / অ্যাপে যান ➔
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full space-y-8">
        {/* Header Hero */}
        <header className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>উচ্চ মাধ্যমিক ও এডমিশন কেমিস্ট্রি পাঠাগার</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
            কেমিস্ট্রি অধ্যায়ভিত্তিক সিলেবাস ও কনসেপ্ট বুক
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) অনুমোদিত পাঠ্যক্রম এবং বিগত ২০ বছরের বুয়েট, মেডিকেল ও ঢাকা বিশ্ববিদ্যালয়ের ভর্তি পরীক্ষার প্রশ্ন বিশ্লেষণ করে প্রস্তুতকৃত অধ্যায়ভিত্তিক সংক্ষিপ্ত পাঠ ও মডেল টেস্ট।
          </p>
        </header>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSelectedPaper("all")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                selectedPaper === "all"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              উভয় পত্র ({PUBLIC_CHAPTERS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPaper("1")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                selectedPaper === "1"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ১ম পত্র
            </button>
            <button
              type="button"
              onClick={() => setSelectedPaper("2")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition-all ${
                selectedPaper === "2"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ২য় পত্র
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute top-2.5 left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="অধ্যায় বা টপিক খুঁজুন..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Chapters Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filtered.map((ch) => (
            <article
              key={ch.slug}
              className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                    {ch.paperName} • অধ্যায় {ch.chapterNumber}
                  </span>
                  <span className="text-[11px] text-slate-400">{ch.readTime}</span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  <Link to={`/chemistry/${ch.slug}`} className="hover:underline">
                    {ch.title}
                  </Link>
                </h2>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {ch.summary}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ch.keyConcepts.map((kc, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono"
                    >
                      ✓ {kc.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {ch.sampleMcqs.length}টি বোর্ড ও এডমিশন MCQ
                </span>
                <Link
                  to={`/chemistry/${ch.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 group-hover:translate-x-1 transition-all"
                >
                  <span>অধ্যায় পড়ুন</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </section>

        {/* Informative Educational Prose for SEO Depth */}
        <section className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-300 space-y-3 text-xs sm:text-sm leading-relaxed">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>HSC ও এডমিশন কেমিস্ট্রি প্রস্তুতি নির্দেশিকা</span>
          </h2>
          <p>
            এইচএসসি রসায়ন প্রথম ও দ্বিতীয় পত্রে ভালো ফলাফল অর্জন এবং প্রকৌশল ও মেডিকেল ভর্তি পরীক্ষায় সফল হওয়ার জন্য মূল বইয়ের প্রতিটি ধারণার ওপর সুস্পষ্ট দখল থাকা প্রয়োজন। প্রথম পত্রের ক্ষেত্রে পর্যায়বৃত্ত ধর্ম, কোয়ান্টাম সংখ্যা এবং রাসায়নিক পরিবর্তনের সাম্যবস্থা ($K_p$ ও $K_c$) সংক্রান্ত গাণিতিক সমস্যাগুলো সর্বাধিক গুরুত্ব বহন করে। অন্যদিকে দ্বিতীয় পত্রের জৈব রসায়ন অংশে নামীয় বিক্রিয়া ও সমাণুতা এবং পরিমাণগত রসায়ন অংশে টাইট্রেশন ও জারণ-বিজারণ সমতাকরণ অপরিহার্য।
          </p>
          <p>
            ChemChamp প্ল্যাটফর্মের মাধ্যমে শিক্ষার্থীরা কেবল তাত্ত্বিক ধারণাই নয়, বরং রিয়েল ওএমআর শিটে টাইমারযুক্ত মক টেস্ট এবং ভুল প্রশ্নের খাতা (Mistake Box) ব্যবহারের মাধ্যমে তাদের প্রস্তুতিকে শতভাগ নিখুঁত করতে পারে।
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 ChemChamp. সর্বস্বত্ব সংরক্ষিত।</p>
      </footer>
    </div>
  );
}

