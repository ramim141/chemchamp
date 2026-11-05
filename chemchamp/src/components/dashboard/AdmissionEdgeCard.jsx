import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Sparkles,
  Clock,
  Calculator,
  ShieldAlert,
  FileText,
  ChevronRight,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { cacheService } from "../../services/cacheService";
import { db } from "../../services/firebase";
import KaTeXMath from "../common/KaTeXMath";

export default function AdmissionEdgeCard({ totalSolved = 0, accuracy = 88 }) {
  const [activeTab, setActiveTab] = useState("matrix"); // matrix | hacks | negative
  const [matrixData, setMatrixData] = useState([]);
  const [hacksData, setHacksData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEdgeData = async () => {
      setLoading(true);
      try {
        const data = await cacheService.getOrFetch(
          "admission_edge_config_cache",
          async () => {
            const snap = await getDoc(doc(db, "admissionEdge", "config"));
            return snap.exists() ? snap.data() : null;
          },
          24 * 60 * 60 * 1000, // 24h TTL
          null
        );
        if (data) {
          if (Array.isArray(data.matrix) && data.matrix.length > 0) setMatrixData(data.matrix);
          if (Array.isArray(data.hacks) && data.hacks.length > 0) setHacksData(data.hacks);
        }
      } catch (err) {
        console.warn("Could not load dynamic admission edge data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEdgeData();
  }, []);

  // Estimate negative marking impact based on student accuracy
  const wrongRate = Math.max(0, 100 - accuracy);
  const sampleTotal = Math.max(20, totalSolved || 25);
  const estCorrect = Math.round((sampleTotal * accuracy) / 100);
  const estWrong = sampleTotal - estCorrect;
  const penaltyMarks = (estWrong * 0.25).toFixed(2);
  const netScore = (estCorrect - estWrong * 0.25).toFixed(2);

  const hasPublishedContent = matrixData.length > 0 || hacksData.length > 0;

  // Fallback: If no content published by admin yet, show Coming Soon
  if (!loading && !hasPublishedContent) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  অ্যাডমিশন স্পেশাল এজ (Admission Edge)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  শীঘ্রই আসছে
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ২০ বছরের প্রশ্ন ট্রেন্ড ম্যাট্রিক্স, নন-ক্যালকুলেটর হ্যাকস ও -০.২৫ নেগেটিভ মার্কিং ট্র্যাকার
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-white">
                এডমিন দ্বারা কিউরেটেড অ্যাডমিশন কনটেন্ট শীঘ্রই উন্মুক্ত হচ্ছে
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                বুয়েট, ঢাবি ও মেডিকেল ভর্তি পরীক্ষার বিশ্লেষিত ট্রেন্ড এবং নন-ক্যালকুলেটর ম্যাথ হ্যাকস এডমিন প্যানেল থেকে কিউরেট করা হচ্ছে। খুব শীঘ্রই এটি লাইভ হবে!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                অ্যাডমিশন স্পেশাল এজ (Admission Edge)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                লাইভ ট্রেন্ডস
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ২০ বছরের প্রশ্ন ট্রেন্ড ম্যাট্রিক্স, নন-ক্যালকুলেটর হ্যাকস ও নেগেটিভ মার্কিং ট্র্যাকার
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold self-start sm:self-auto">
          {matrixData.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "matrix"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ফ্রিকোয়েন্সি ম্যাট্রিক্স
            </button>
          )}
          {hacksData.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("hacks")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeTab === "hacks"
                  ? "bg-emerald-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" /> ম্যাথ হ্যাকস
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab("negative")}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              activeTab === "negative"
                ? "bg-rose-500 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> -০.২৫ ট্র্যাকার
          </button>
        </div>
      </div>

      {/* Tab 1: Live 20-Year Topic Frequency Matrix */}
      {activeTab === "matrix" && matrixData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3 rounded-tl-xl">টপিক ও অধ্যায়</th>
                <th className="py-2.5 px-2">BUET / ইঞ্জিনিয়ারিং</th>
                <th className="py-2.5 px-2">মেডিকেল (MAT)</th>
                <th className="py-2.5 px-2">ঢাবি ও গুচ্ছ</th>
                <th className="py-2.5 px-3 rounded-tr-xl text-right">গুরুত্ব</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {matrixData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{row.topic}</td>
                  <td className="py-2.5 px-2 text-[11px] text-amber-300 font-mono">{row.buet}</td>
                  <td className="py-2.5 px-2 text-[11px] text-emerald-300 font-mono">{row.medical}</td>
                  <td className="py-2.5 px-2 text-[11px] text-teal-300 font-mono">{row.du}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                      {row.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Live Non-Calculator Math Hacks */}
      {activeTab === "hacks" && hacksData.length > 0 && (
        <div className="space-y-3">
          {hacksData.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{item.title}</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Non-Calc Hack #{idx + 1}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
                {item.formula && (
                  <KaTeXMath math={item.formula} block className="text-white font-bold" />
                )}
                {item.values && (
                  <KaTeXMath math={item.values} block className="text-amber-300 text-xs" />
                )}
              </div>

              {item.example && (
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <KaTeXMath math={item.example} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: -0.25 Negative Marking Tracker */}
      {activeTab === "negative" && (
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/25 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">
                নেগেটিভ মার্কিং ইমপ্যাক্ট ট্র্যাকার (-০.২৫ প্রতি ভুল উত্তরে)
              </h4>
              <p className="text-[11px] text-slate-400">
                ভর্তি পরীক্ষায় আন্দাজে দাগানো রোধ করতে আপনার বর্তমান নির্ভুলতার বিশ্লেষণ
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
              পেনাল্টি: -{penaltyMarks}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">সঠিক উত্তর হার</span>
              <span className="text-sm font-black text-emerald-400 font-mono">{accuracy}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">ভুল উত্তরের হার</span>
              <span className="text-sm font-black text-rose-400 font-mono">{wrongRate}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">নিট স্কোর ({sampleTotal}-এ)</span>
              <span className="text-sm font-black text-amber-400 font-mono">{netScore}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>টিপস:</strong> ৫০-৫০ কনফিউশন থাকলে দাগানো লাভজনক, কিন্তু সম্পূর্ণ অচেনা প্রশ্ন স্কিপ করলে আপনার নিট মার্কস <strong>+{penaltyMarks}</strong> বৃদ্ধি পাবে!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
