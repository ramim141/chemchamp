import React from "react";
import { Star, Quote, Award, CheckCircle2 } from "lucide-react";
import { DEFAULT_TESTIMONIALS } from "../../services/landingConfigService";

export default function TestimonialsSection({ testimonials = DEFAULT_TESTIMONIALS }) {
  const activeTestimonials = (testimonials || DEFAULT_TESTIMONIALS).filter((t) => t.enabled !== false);

  if (activeTestimonials.length === 0) return null;

  return (
    <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto relative">
      <div className="text-center mb-12 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          শিক্ষার্থীদের অভিজ্ঞতা
        </span>
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3">
          চ্যাম্পিয়নদের পথচলা ও সাফল্য
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
          দেশসেরা কলেজ ও বিভিন্ন ভর্তি পরীক্ষায় শীর্ষে থাকা শিক্ষার্থীরা কীভাবে ChemChamp ব্যবহার করে রসায়নে সর্বোচ্চ প্রস্তুতি নিয়েছে।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {activeTestimonials.map((t, idx) => (
          <div
            key={t.id || idx}
            className="p-6 sm:p-7 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between group shadow-lg"
          >
            <div>
              {/* Top Star Rating & Quote Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-slate-700 group-hover:text-amber-500/40 transition-colors" />
              </div>

              {/* Student Quote */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-6">
                "{t.quote}"
              </p>
            </div>

            {/* Student Profile Info */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shrink-0">
                  {t.avatar || t.name?.[0] || "চ্যা"}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {t.name}
                  </h4>
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {t.college || t.institution}
                  </span>
                </div>
              </div>

              {t.target && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t.target}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
