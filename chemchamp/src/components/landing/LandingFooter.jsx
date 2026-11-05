import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Heart,
  Sparkles,
  ShieldCheck,
  Zap,
  BookOpen,
  GraduationCap,
  Users,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function LandingFooter() {
  const { user } = useAuth();
  return (
    <footer className="border-t border-slate-900 bg-slate-950 text-slate-400 pt-16 pb-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-emerald-500/5 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-12">
          
          {/* Column 1: Brand & Mission (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
                🧪
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-white">ChemChamp</span>
                  <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">HSC ও এডমিশন কেমিস্ট্রির পূর্ণাঙ্গ স্মার্ট প্ল্যাটফর্ম</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              বাংলাদেশের শিক্ষার্থীদের রসায়নের ভীতি দূর করে আত্মবিশ্বাসী করে তোলার জন্য নির্মিত একটি আধুনিক, ডেটা-ড্রাইভেন ও গেমিফাইড লার্নিং প্ল্যাটফর্ম। এনসিটিবি অনুমোদিত শীর্ষ শিক্ষকদের দাগানো বই ও বিগত ২০ বছরের বুয়েট/মেডিকেল ট্রেন্ড অনুসারে প্রস্তুত।
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10.5px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-emerald-400">
                ✓ 100% Free
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-teal-400">
                ✓ Offline Cached
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-400">
                ✓ KaTeX LaTeX
              </span>
            </div>
          </div>

          {/* Column 2: Platform Modules / Public Content (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{user ? "প্ল্যাটফর্ম মডিউল" : "কেমিস্ট্রি অধ্যায় ও নোটস"}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to={user ? "/dashboard" : "/chemistry"}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>{user ? "ড্যাশবোর্ড ও ডেইলি মিশন" : "সকল কেমিস্ট্রি অধ্যায় (সিলেবাস)"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to={user ? "/study" : "/chemistry/qualitative-chemistry"}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>{user ? "সিলেবাস ও স্টাডি হাব" : "গুণগত রসায়ন (১ম পত্র)"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to={user ? "/exams" : "/chemistry/organic-chemistry"}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>{user ? "এক্সাম রুম ও প্রশ্নব্যাংক" : "জৈব রসায়ন ও সমীকরণ (২য় পত্র)"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to={user ? "/vault" : "/chemistry/chemical-changes"}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>{user ? "কেমিস্ট্রি ফর্মুলা ভল্ট" : "রাসায়নিক পরিবর্তন ও বাফার"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to={user ? "/leaderboard" : "/chemistry/environmental-chemistry"}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>{user ? "অল-বাংলাদেশ লিডারবোর্ড" : "পরিবেশ রসায়ন ও গ্যাস সূত্র"}</span>
                </Link>
              </li>
              <li>
                <Link
                  to={user ? "/profile" : "/login"}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>{user ? "মিস্টেক খাতা (Leitner Box)" : "ফ্রি একাউন্ট / লগইন করুন"}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Admission & Target Tracks (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
              <span>টার্গেট ট্র্যাক</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#syllabus" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>ইঞ্জিনিয়ারিং রসায়ন (BUET / CKREUT)</span>
                </a>
              </li>
              <li>
                <a href="#syllabus" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>মেডিকেল রসায়ন (DMC / MATS)</span>
                </a>
              </li>
              <li>
                <a href="#syllabus" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>ভার্সিটি 'ক' ও গুচ্ছ (DU KA / GST)</span>
                </a>
              </li>
              <li>
                <a href="#syllabus" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>HSC '২৬ ও '২৭ বোর্ড স্পেশাল</span>
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>হাজারী-নাগ ও সঞ্জিত স্যারের দাগানো লাইন</span>
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>জৈব রসায়ন ৫০+ ফ্লিপকার্ড ডেক</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust, Safety & Community (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>সহায়তা ও যোগাযোগ</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#faq" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>সাধারণ প্রশ্নোত্তর (FAQ)</span>
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>শিক্ষার্থী লগইন</span>
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@chemchamp.app"
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>হেল্প ও ফিডব্যাক ডেস্ক</span>
                </a>
              </li>
              <li>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>প্রাইভেসি পলিসি</span>
                </span>
              </li>
              <li>
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                  <span>ব্যবহারের নিয়মাবলি</span>
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Server Status & Dev Love */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11.5px]">
            <p>© {new Date().getFullYear()} ChemChamp. সর্বস্বত্ব সংরক্ষিত।</p>
            <span className="hidden sm:inline text-slate-700">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">সার্ভিস স্ট্যাটাস: সকল সিস্টেম সচল</span>
            </div>
          </div>

          <p className="text-[11.5px] text-slate-400 flex items-center gap-1">
            <span>বাংলাদেশের শিক্ষার্থীদের জন্য ভালোবাসায় নির্মিত</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
