import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { DEFAULT_FAQS } from "../../services/landingConfigService";

export default function FAQSection({ faqs = DEFAULT_FAQS }) {
  const [openIndex, setOpenIndex] = useState(0);

  const activeFaqs = (faqs || DEFAULT_FAQS).filter((f) => f.enabled !== false);

  if (activeFaqs.length === 0) return null;

  return (
    <section id="faq" className="py-20 px-4 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
          সাধারণ জিজ্ঞাসা
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3">
          প্রায়শই জিজ্ঞাসিত প্রশ্নোত্তর (FAQ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          ChemChamp সম্পর্কে শিক্ষার্থীদের মনের সাধারণ প্রশ্ন ও বিস্তারিত সমাধান।
        </p>
      </div>

      <div className="space-y-3">
        {activeFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id || idx}
              className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-all shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{faq.q}</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40 animate-in fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
