import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";
import Seo from "../components/common/Seo";
import KaTeXMath from "../components/common/KaTeXMath";
import { PUBLIC_CHAPTERS } from "../data/publicChapters";

export default function PublicChapterDetail() {
  const { chapterSlug } = useParams();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});

  const currentIndex = PUBLIC_CHAPTERS.findIndex((c) => c.slug === chapterSlug);
  const chapter = currentIndex !== -1 ? PUBLIC_CHAPTERS[currentIndex] : null;

  const prevChapter = currentIndex > 0 ? PUBLIC_CHAPTERS[currentIndex - 1] : null;
  const nextChapter =
    currentIndex !== -1 && currentIndex < PUBLIC_CHAPTERS.length - 1
      ? PUBLIC_CHAPTERS[currentIndex + 1]
      : null;

  if (!chapter) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <Seo
          title="অধ্যায়টি পাওয়া যায়নি | ChemChamp"
          description="অনুরোধকৃত রসায়ন অধ্যায়টি পাওয়া যায়নি।"
          path={`/chemistry/${chapterSlug || ""}`}
          noindex
        />
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">অধ্যায়টি পাওয়া যায়নি</h1>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          আপনি যে অধ্যায়টি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা লিঙ্কটি সঠিক নয়।
        </p>
        <Link
          to="/chemistry"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition"
        >
          <ArrowLeft className="w-4 h-4" /> সকল অধ্যায়ে ফিরে যান
        </Link>
      </div>
    );
  }

  const handleSelectOption = (mcqId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [mcqId]: optionIndex,
    }));
    setShowExplanations((prev) => ({
      ...prev,
      [mcqId]: true,
    }));
  };

  const breadcrumbs = [
    { name: "হোম", item: "/" },
    { name: "রসায়ন পাঠসমূহ", item: "/chemistry" },
    { name: chapter.title, item: `/chemistry/${chapter.slug}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": chapter.title,
    "description": chapter.metaDescription,
    "url": `https://chemchamp.com/chemistry/${chapter.slug}`,
    "educationalLevel": "Higher Secondary (HSC) & University Admission",
    "inLanguage": "bn",
    "teaches": chapter.summary,
    "learningResourceType": "Study Guide & Practice MCQs",
    "provider": {
      "@type": "EducationalOrganization",
      "name": "ChemChamp",
      "url": "https://chemchamp.com",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      <Seo
        title={chapter.metaTitle}
        description={chapter.metaDescription}
        path={`/chemistry/${chapter.slug}`}
        breadcrumbs={breadcrumbs}
        jsonLd={jsonLd}
      />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg text-slate-100 tracking-tight">ChemChamp</span>
              <span className="text-[10px] text-emerald-400 font-semibold ml-1.5 uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                SEO Library
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/chemistry"
              className="text-xs sm:text-sm text-slate-300 hover:text-emerald-400 transition flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>সকল অধ্যায়</span>
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs sm:text-sm rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition"
            >
              লগইন / প্র্যাকটিস
            </Link>
          </div>
        </div>
      </header>

      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-900 bg-slate-950/40">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-emerald-400 transition">
            হোম
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
          <Link to="/chemistry" className="hover:text-emerald-400 transition">
            রসায়ন পাঠসমূহ
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
          <span className="text-emerald-300 font-medium truncate">{chapter.title}</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Chapter Hero / Title Section */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                chapter.paper === 1
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
              }`}
            >
              {chapter.paperName}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-slate-300">
              অধ্যায় {chapter.chapterNumber}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {chapter.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight leading-snug">
            {chapter.title}
          </h1>

          <p className="text-slate-300 sm:text-base leading-relaxed text-sm bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
            {chapter.summary}
          </p>
        </header>

        {/* In-depth Overview Article (300+ words) */}
        <section aria-labelledby="chapter-overview" className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h2 id="chapter-overview" className="text-lg sm:text-xl font-bold text-slate-100">
              অধ্যায় পরিচিতি ও মূল প্রতিপাদ্য
            </h2>
          </div>

          <article className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
            {chapter.overview.split("\n\n").map((para, i) => (
              <p key={i} className="text-slate-300 leading-relaxed">
                <KaTeXMath text={para} />
              </p>
            ))}
          </article>
        </section>

        {/* Syllabus Coverage Topics */}
        {chapter.syllabusTopics && chapter.syllabusTopics.length > 0 && (
          <section aria-labelledby="syllabus-topics" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-5 h-5 text-teal-400" />
              <h2 id="syllabus-topics" className="text-lg sm:text-xl font-bold text-slate-100">
                এই অধ্যায়ের বোর্ড ও এডমিশন টপিকসমূহ
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {chapter.syllabusTopics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-sm text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Concepts with Formulas */}
        {chapter.keyConcepts && chapter.keyConcepts.length > 0 && (
          <section aria-labelledby="key-concepts" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 id="key-concepts" className="text-lg sm:text-xl font-bold text-slate-100">
                গুরুত্বপূর্ণ কনসেপ্ট ও মূল সূত্র
              </h2>
            </div>

            <div className="space-y-3.5">
              {chapter.keyConcepts.map((concept, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
                >
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {concept.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{concept.description}</p>
                  {concept.formula && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 text-amber-300 font-mono text-sm overflow-x-auto">
                      <KaTeXMath math={concept.formula} block />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Important Formulas Quick Reference Table */}
        {chapter.importantFormulas && chapter.importantFormulas.length > 0 && (
          <section aria-labelledby="important-formulas" className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <h2 id="important-formulas" className="text-lg sm:text-xl font-bold text-slate-100">
                গুরুত্বপূর্ণ সমীকরণ ও সূত্রের তালিকা
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {chapter.importantFormulas.map((f, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-200">{f.name}</h3>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 text-sm overflow-x-auto">
                      <KaTeXMath math={(f.formula || f.latex)} block />
                    </div>
                  </div>
                  {f.note && <p className="text-xs text-slate-400 italic">নোট: {f.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interactive Sample MCQs with Explanations */}
        {chapter.sampleMcqs && chapter.sampleMcqs.length > 0 && (
          <section aria-labelledby="sample-mcqs" className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                <h2 id="sample-mcqs" className="text-lg sm:text-xl font-bold text-slate-100">
                  নমুনা বোর্ড ও এডমিশন স্ট্যান্ডার্ড প্রশ্ন (MCQ)
                </h2>
              </div>
              <span className="text-xs text-slate-400">ক্লিক করে উত্তর ও ব্যাখ্যা দেখুন</span>
            </div>

            <div className="space-y-4">
              {chapter.sampleMcqs.map((mcq, idx) => {
                const userSelected = selectedAnswers[mcq.id];
                const isAnswered = userSelected !== undefined;
                const isCorrect = isAnswered && userSelected === (mcq.answerIndex ?? mcq.answer);

                return (
                  <div
                    key={mcq.id}
                    className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                        <KaTeXMath text={mcq.question} />
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {mcq.options.map((opt, optIdx) => {
                        const isChosen = userSelected === optIdx;
                        const isTheCorrectOne = isAnswered && optIdx === (mcq.answerIndex ?? mcq.answer);
                        const isTheWrongChoice = isAnswered && isChosen && optIdx !== (mcq.answerIndex ?? mcq.answer);

                        let btnStyle =
                          "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300";
                        if (isTheCorrectOne) {
                          btnStyle =
                            "bg-emerald-500/15 border-emerald-500/60 text-emerald-200 font-semibold";
                        } else if (isTheWrongChoice) {
                          btnStyle = "bg-rose-500/15 border-rose-500/60 text-rose-200 font-semibold";
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(mcq.id, optIdx)}
                            className={`p-3 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition ${btnStyle}`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-bold">
                                {["ক", "খ", "গ", "ঘ"][optIdx] || optIdx + 1}
                              </span>
                              <span>
                                <KaTeXMath text={opt} />
                              </span>
                            </span>
                            {isTheCorrectOne && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                            {isTheWrongChoice && (
                              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && (
                      <div
                        className={`p-3.5 rounded-xl text-xs sm:text-sm border transition ${
                          isCorrect
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-slate-950 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 mb-1">
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>সঠিক উত্তর হয়েছে!</span>
                            </>
                          ) : (
                            <>
                              <span className="text-amber-400">সঠিক উত্তর: </span>
                              <span className="text-slate-100">
                                {["(ক)", "(খ)", "(গ)", "(ঘ)"][(mcq.answerIndex ?? mcq.answer)]}{" "}
                                {mcq.options[(mcq.answerIndex ?? mcq.answer)]}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-slate-300 leading-relaxed mt-1">
                          <strong className="text-slate-200">ব্যাখ্যা: </strong>
                          <KaTeXMath text={mcq.explanation} />
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Call To Action (App Practice Zone) */}
        <section
          aria-labelledby="practice-cta"
          className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 text-center space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" />
            <span>ChemChamp অ্যাডাপ্টিভ প্র্যাকটিস ইঞ্জিন</span>
          </div>

          <h2 id="practice-cta" className="text-xl sm:text-2xl font-black text-slate-100">
            এই অধ্যায়ের ২০০+ রিয়েল MCQ টেস্ট দিতে চান?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            ChemChamp অ্যাপে বোর্ড প্রশ্ন, মেডিকেল-ভার্সিটি-ইঞ্জিনিয়ারিং বিগত প্রশ্নব্যাংক এবং
            লাইভ লিডারবোর্ডে বন্ধুদের সাথে লাইভ কম্পিটিশনে অংশ নিন।
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 text-sm sm:text-base flex items-center gap-2"
            >
              <Award className="w-4 h-4" /> ফ্রি প্র্যাকটিস শুরু করুন
            </Link>
            <Link
              to="/chemistry"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition"
            >
              অন্যান্য অধ্যায় দেখুন
            </Link>
          </div>
        </section>

        {/* Previous & Next Chapter Navigation Links */}
        <nav aria-label="Chapter Pagination" className="pt-6 border-t border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevChapter ? (
              <Link
                to={`/chemistry/${prevChapter.slug}`}
                className="group p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-800 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 text-slate-400 flex items-center justify-center flex-shrink-0 transition">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[11px] text-slate-400 block font-medium">পূর্ববর্তী অধ্যায়</span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition truncate block">
                    {prevChapter.title}
                  </span>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextChapter ? (
              <Link
                to={`/chemistry/${nextChapter.slug}`}
                className="group p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex items-center justify-end text-right gap-3 sm:col-start-2"
              >
                <div className="overflow-hidden">
                  <span className="text-[11px] text-slate-400 block font-medium">পরবর্তী অধ্যায়</span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition truncate block">
                    {nextChapter.title}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-800 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 text-slate-400 flex items-center justify-center flex-shrink-0 transition">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </nav>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} ChemChamp. সর্বস্বত্ব সংরক্ষিত। HSC ও এডমিশন শিক্ষার্থীদের জন্য বিশেষায়িত কেমিস্ট্রি প্ল্যাটফর্ম।</p>
          <div className="flex items-center justify-center gap-4 text-slate-400 pt-2">
            <Link to="/" className="hover:text-emerald-400 transition">
              হোম
            </Link>
            <span>•</span>
            <Link to="/chemistry" className="hover:text-emerald-400 transition">
              রসায়ন পাঠসমূহ
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-emerald-400 transition">
              লগইন
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
