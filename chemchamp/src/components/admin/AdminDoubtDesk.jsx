import React, { useState, useEffect } from "react";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  HelpCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
} from "lucide-react";
import DoubtCard from "./doubts/DoubtCard";

export default function AdminDoubtDesk() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // pending | resolved | all
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDoubts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "doubtBox"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // তারিখ অনুযায়ী সর্ট (নতুন ডাউট আগে)
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setDoubts(list);
    } catch (err) {
      console.error("Fetch doubts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  // সমাধান সাবমিট করা (টেক্সট + ভয়েস নোট অডিও)
  const handleResolve = async (doubtId, replyText, voiceUrl = "") => {
    try {
      const doubtRef = doc(db, "doubtBox", doubtId);
      await setDoc(
        doubtRef,
        {
          status: "resolved",
          teacherReply: replyText,
          teacherVoiceUrl: voiceUrl || null,
          teacherName: user?.displayName || "কেমিস্ট্রি শিক্ষক",
          resolvedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // লোকাল স্টেট আপডেট
      setDoubts((prev) =>
        prev.map((d) =>
          d.id === doubtId
            ? {
                ...d,
                status: "resolved",
                teacherReply: replyText,
                teacherVoiceUrl: voiceUrl || null,
                teacherName: user?.displayName || "কেমিস্ট্রি শিক্ষক",
              }
            : d
        )
      );
    } catch (err) {
      alert("সমাধান পাঠাতে সমস্যা হয়েছে: " + err.message);
    }
  };

  // ডাউট মুছে ফেলা
  const handleDelete = async (doubtId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই ডাউটটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "doubtBox", doubtId));
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  // অ্যাডমিনের টেস্টিং সুবিধার জন্য ডেমো ডাউট তৈরি করার বাটন
  const handleCreateSampleDoubt = async () => {
    try {
      const id = `doubt_${Date.now()}`;
      const sample = {
        studentUid: "student_demo_1",
        studentName: "তানভীর হাসান (নটর ডেম কলেজ)",
        studentEmail: "tanvir.demo@gmail.com",
        queryText:
          "স্যার, নাইট্রোজেনের প্রথম আয়নীকরণ শক্তি অক্সিজেনের চেয়ে বেশি কেন? ইলেকট্রন বিন্যাস $1s^2 2s^2 2p^3$ দ্বারা কীভাবে এটি সহজে মনে রাখব?",
        imageUrl: "",
        status: "pending",
        tag: "গুণগত রসায়ন",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "doubtBox", id), sample);
      fetchDoubts();
    } catch (err) {
      alert("ডেমো ডাউট তৈরি ব্যর্থ: " + err.message);
    }
  };

  // ফিল্টারিং গণনা
  const pendingCount = doubts.filter((d) => d.status !== "resolved").length;
  const resolvedCount = doubts.filter((d) => d.status === "resolved").length;

  const filteredDoubts = doubts.filter((d) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "pending"
        ? d.status !== "resolved"
        : d.status === "resolved";

    const matchesSearch =
      d.queryText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.studentName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* ১. শীর্ষ হেডার বার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              শিক্ষার্থী ডাউট সলভ ডেস্ক
            </h2>
            <p className="text-xs text-slate-400">
              শিক্ষার্থীদের পাঠানো সমস্যা ও খাতার ছবির সমাধান পাঠান (টেক্সট ও ভয়েস নোট)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* টেস্ট ডাউট বাটন */}
          <button
            type="button"
            onClick={handleCreateSampleDoubt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-all active:scale-95"
            title="পরীক্ষার জন্য একটি ডেমো ডাউট যোগ করুন"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ টেস্ট ডাউট</span>
          </button>

          <button
            type="button"
            onClick={fetchDoubts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ২. ফিল্টার ও সার্চ বার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-2xl">
        {/* স্ট্যাটাস ট্যাব */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filter === "pending"
                ? "bg-rose-500 text-white shadow-md font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>অমীমাংসিত ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("resolved")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filter === "resolved"
                ? "bg-emerald-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>সমাধানকৃত ({resolvedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            সকল ({doubts.length})
          </button>
        </div>

        {/* সার্চ বক্স */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="শিক্ষার্থী বা প্রশ্ন সার্চ..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* ৩. ডাউট তালিকা */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
          ডাউট বক্স লোড হচ্ছে...
        </div>
      ) : filteredDoubts.length === 0 ? (
        <div className="py-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 p-4">
          <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-white mb-1">
            {filter === "pending"
              ? "অসাধারণ! কোনো অমীমাংসিত ডাউট নেই"
              : "কোনো ডাউট পাওয়া যায়নি"}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            শিক্ষার্থীরা অ্যাপের প্রোফাইল থেকে ছবি বা প্রশ্ন পাঠালে এখানে সরাসরি প্রদর্শিত হবে।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDoubts.map((doubt) => (
            <DoubtCard
              key={doubt.id}
              doubt={doubt}
              onResolve={handleResolve}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
