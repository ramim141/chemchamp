import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Trophy,
  Medal,
  AlertTriangle,
  Download,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";
import { soundService } from "../../services/soundService";

export default function AdminExamResultsManager() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamFilter, setSelectedExamFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cheatFilterOnly, setCheatFilterOnly] = useState(false);

  // 1. Fetch live exam attempts from Firestore
  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "examAttempts"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort by score descending, then time taken ascending
      list.sort((a, b) => {
        if ((b.finalScore || 0) !== (a.finalScore || 0)) {
          return (b.finalScore || 0) - (a.finalScore || 0);
        }
        return (a.timeTakenSeconds || 0) - (b.timeTakenSeconds || 0);
      });

      setAttempts(list);
    } catch (err) {
      console.warn("Could not fetch exam attempts from Firestore:", err);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  // Distinct Exams List for filtering
  const distinctExams = useMemo(() => {
    const map = new Map();
    attempts.forEach((a) => {
      if (a.examId && a.examTitle) {
        map.set(a.examId, a.examTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [attempts]);

  // Filtered Attempts & Merit List
  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      const matchExam =
        selectedExamFilter === "all" || a.examId === selectedExamFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (a.studentName && a.studentName.toLowerCase().includes(q)) ||
        (a.studentCollege && a.studentCollege.toLowerCase().includes(q)) ||
        (a.studentEmail && a.studentEmail.toLowerCase().includes(q));
      const matchCheat = !cheatFilterOnly || (a.tabSwitchCount || 0) >= 3;

      return matchExam && matchSearch && matchCheat;
    });
  }, [attempts, selectedExamFilter, searchQuery, cheatFilterOnly]);

  // Aggregated Stats
  const totalSubmissions = attempts.length;
  const avgAccuracy =
    totalSubmissions > 0
      ? Math.round(
          attempts.reduce((acc, a) => acc + (a.accuracy || 0), 0) / totalSubmissions
        )
      : 0;
  const suspiciousAttemptsCount = attempts.filter(
    (a) => (a.tabSwitchCount || 0) >= 3
  ).length;

  // Format seconds to mm:ss
  const formatSeconds = (sec = 0) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} মি. ${s < 10 ? "0" : ""}${s} সে.`;
  };

  // 1-Click CSV Export
  const handleExportCSV = () => {
    soundService.playClick();
    if (filteredAttempts.length === 0) {
      alert("এক্সপোর্ট করার মতো কোনো ফলাফল নেই!");
      return;
    }

    const headers = [
      "মেধা স্থান",
      "শিক্ষার্থীর নাম",
      "ইমেইল",
      "শিক্ষা প্রতিষ্ঠান",
      "এইচএসসি ব্যাচ",
      "পরীক্ষার শিরোনাম",
      "প্রাপ্ত নম্বর",
      "মোট প্রশ্ন",
      "সঠিক উত্তর",
      "ভুল উত্তর",
      "একিউরেসি (%)",
      "ট্যাব সুইচ (চিট লগ)",
      "ব্যয়িত সময় (সেকেন্ড)",
      "তারিখ",
    ];

    const rows = filteredAttempts.map((a, idx) => [
      idx + 1,
      `"${a.studentName || "শিক্ষার্থী"}"`,
      `"${a.studentEmail || ""}"`,
      `"${a.studentCollege || ""}"`,
      `"${a.hscBatch || ""}"`,
      `"${a.examTitle || ""}"`,
      a.finalScore || 0,
      a.totalQuestions || 0,
      a.correctCount || 0,
      a.wrongCount || 0,
      `${a.accuracy || 0}%`,
      a.tabSwitchCount || 0,
      a.timeTakenSeconds || 0,
      `"${a.dateFormatted || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ChemChamp_Merit_List_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ১. হেডার */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              পরীক্ষার রেজাল্ট, মেরিট লিস্ট ও অ্যানালিটিক্স
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                {filteredAttempts.length}টি অ্যাটেম্পট
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              শিক্ষার্থীদের মেধা তালিকা, লাইভ স্কোরবোর্ড ও অ্যান্টি-চিট নজরদারি লগ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAttempts}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV মেধা তালিকা ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* স্ট্যাটস কার্ডস */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">মোট অ্যাটেম্পট</span>
            <span className="text-lg font-black text-white font-mono">{totalSubmissions}টি</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">গড় নির্ভুলতা</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{avgAccuracy}%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">আয়োজিত পরীক্ষা</span>
            <span className="text-lg font-black text-amber-400 font-mono">{distinctExams.length}টি</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">সন্দেহজনক (৩+ সুইচ)</span>
            <span className="text-lg font-black text-rose-400 font-mono">
              {suspiciousAttemptsCount}টি
            </span>
          </div>
        </div>
      </div>

      {/* ২. ফিল্টার ও সার্চ বার */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        {/* সার্চ বার */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="শিক্ষার্থীর নাম, কলেজ বা ইমেইল দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* ফিল্টার কন্ট্রোলস */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* পরীক্ষা সিলেক্টর */}
          <select
            value={selectedExamFilter}
            onChange={(e) => setSelectedExamFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:border-teal-500 max-w-[220px] truncate"
          >
            <option value="all">সকল পরীক্ষা</option>
            {distinctExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          {/* চিট ওয়াচডগ ফিল্টার */}
          <button
            type="button"
            onClick={() => setCheatFilterOnly(!cheatFilterOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              cheatFilterOnly
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>চিট সন্দেহজনক কেবল</span>
          </button>
        </div>
      </div>

      {/* ৩. মেধা তালিকা ও রেজাল্ট টেবিল */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-16 text-center">স্থান</th>
                <th className="py-3 px-4">শিক্ষার্থী</th>
                <th className="py-3 px-4">পরীক্ষা</th>
                <th className="py-3 px-4 text-center">স্কোর</th>
                <th className="py-3 px-4 text-center">একিউরেসি</th>
                <th className="py-3 px-4 text-center">ব্যয়িত সময়</th>
                <th className="py-3 px-4 text-center">অ্যান্টি-চিট লগ</th>
                <th className="py-3 px-4 text-right">তারিখ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    কোনো পরীক্ষার ফলাফল পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;
                  const tabSwitches = Number(att.tabSwitchCount) || 0;
                  const isSuspicious = tabSwitches >= 3;

                  return (
                    <tr
                      key={att.id || idx}
                      className={`hover:bg-slate-850 transition-colors ${
                        isSuspicious ? "bg-rose-950/20" : ""
                      }`}
                    >
                      {/* মেধা স্থান */}
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400">#{rank}</span>
                        )}
                      </td>

                      {/* শিক্ষার্থী নাম ও কলেজ */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">
                            {att.studentName || "শিক্ষার্থী"}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate block">
                            {att.studentCollege || "কলেজ অনুল্লেখিত"} • {att.hscBatch || "HSC-25"}
                          </span>
                        </div>
                      </td>

                      {/* পরীক্ষা */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="text-slate-300 font-medium block truncate">
                          {att.examTitle || "কেমিস্ট্রি মক টেস্ট"}
                        </span>
                      </td>

                      {/* স্কোর */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-teal-400 text-sm">
                          {att.finalScore || 0}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          /{att.totalQuestions || 25}
                        </span>
                      </td>

                      {/* একিউরেসি */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                            (att.accuracy || 0) >= 80
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : (att.accuracy || 0) >= 50
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {att.accuracy || 0}%
                        </span>
                      </td>

                      {/* সময় */}
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                        {formatSeconds(att.timeTakenSeconds)}
                      </td>

                      {/* অ্যান্টি-চিট স্ট্যাটাস */}
                      <td className="py-3.5 px-4 text-center">
                        {tabSwitches === 0 ? (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ক্লিন
                          </span>
                        ) : tabSwitches < 3 ? (
                          <span className="text-[11px] text-amber-400 font-medium font-mono">
                            {tabSwitches} বার সুইচ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10.5px] font-bold flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            🚨 {tabSwitches} বার সুইচ!
                          </span>
                        )}
                      </td>

                      {/* তারিখ */}
                      <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                        {att.dateFormatted || "সম্প্রতি"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

