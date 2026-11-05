import React, { useState } from "react";
import { cacheService } from "../../../services/cacheService";
import { contentVersionService } from "../../../services/contentVersionService";
import { db } from "../../../services/firebase";
import {
  collection,
  writeBatch,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  FileJson,
  Send,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  HelpCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";
import SingleQuestionModal from "./SingleQuestionModal";

const TEMPLATES = {
  MCQ: [
    {
      type: "MCQ",
      stem: "একটি উপশক্তিস্তরে সর্বোচ্চ ইলেকট্রন ধারণক্ষমতার সঠিক সূত্র কোনটি?",
      imageUrl: "",
      options: ["2n^2", "2(2l + 1)", "2l + 1", "4l + 1"],
      answerIndex: 1,
      explanation: "উপশক্তিস্তরে অরবিটাল সংখ্যা $(2l + 1)$, প্রতিটিতে ২টি করে মোট $2(2l + 1)$ টি।",
      tag: "ঢাকা বোর্ড '২৪"
    }
  ],
  CQ: [
    {
      type: "CQ",
      stem: "A ও B দুটি মৌল যাদের পারমাণবিক সংখ্যা যথাক্রমে ১১ ও ১৭। মৌল দুটি একত্রিত হয়ে AB যৌগ গঠন করে।",
      imageUrl: "https://i.ibb.co/example/chemical_diagram.png",
      subQuestions: [
        {
          part: "ক",
          question: "পর্যায় সারণির জনক কে?",
          answer: "বিজ্ঞানী দিমিত্রি মেন্ডেলিফ হলেন পর্যায় সারণির জনক।",
          marks: 1
        },
        {
          part: "খ",
          question: "পলির বর্জন নীতিটি ব্যাখ্যা করো।",
          answer: "একই পরমাণুর যেকোনো দুটি ইলেকট্রনের চারটি কোয়ান্টাম সংখ্যার মান কখনোই এক হতে পারে না।",
          marks: 2
        },
        {
          part: "গ",
          question: "উদ্দীপকের AB যৌগের বন্ধন প্রকৃতি ব্যাখ্যা করো।",
          answer: "A ($Na$) ১টি ইলেকট্রন বর্জন করে এবং B ($Cl$) তা গ্রহণ করে স্থির তড়িৎ আকর্ষণে আয়নিক বন্ধন গঠন করে।",
          marks: 3
        },
        {
          part: "ঘ",
          question: "AB যৌগটির জলীয় দ্রবণ বিদ্যুৎ পরিবাহী কি না - বিশ্লেষণ করো।",
          answer: "কঠিন অবস্থায় আয়নগুলো ল্যাটিসে আবদ্ধ থাকলেও জলীয় দ্রবণে $Na^+$ ও $Cl^-$ মুক্ত আয়নে পরিণত হওয়ায় বিদ্যুৎ পরিবহন করে।",
          marks: 4
        }
      ],
      tag: "রাজশাহী বোর্ড '২৩"
    }
  ],
  SQ: [
    {
      type: "SQ",
      stem: "হুন্ডের নীতিটি বিবৃত করো।",
      imageUrl: "",
      answer: "সমশক্তি সম্পন্ন বিভিন্ন অরবিটালে ইলেকট্রন প্রবেশের সময় তারা সর্বাধিক বিজোড় অবস্থায় থাকবে এবং এদের স্পিন একমুখী হবে।",
      subCategory: "জ্ঞানমূলক",
      marks: 1,
      tag: "ঢাকা বোর্ড '২২"
    }
  ]
};

// Helper: টেক্সট নরমালাইজেশন (হোয়াইটস্পেস ও বিরামচিহ্ন এড়িয়ে সঠিক ম্যাচিং)
const normalizeText = (text) => {
  if (!text) return "";
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[।.,?!;:–—'"“”‘’()]/g, "");
};

// Helper: MCQ ও অন্যান্য প্রশ্নের অনন্য সিগনেচার তৈরি (প্রশ্ন ও অপশন উভয়ই ম্যাচ করানো হয়)
const getQuestionSignature = (q) => {
  if (!q) return "";
  const normStem = normalizeText(q.stem);
  const qType = q.type || "MCQ";

  if (qType === "MCQ" && Array.isArray(q.options)) {
    // অপশনগুলো নরমালাইজ ও সর্ট করে কম্বাইন্ড করা হয় যাতে অপশনের ক্রম মিললেও ডুপ্লিকেট শনাক্ত হয়
    const normOptions = q.options.map(normalizeText).sort().join("###");
    return `MCQ:::${normStem}:::${normOptions}`;
  }

  if (qType === "CQ" && Array.isArray(q.subQuestions)) {
    const normSubs = q.subQuestions.map((s) => normalizeText(s.question)).join("###");
    return `CQ:::${normStem}:::${normSubs}`;
  }

  if (qType === "SQ") {
    return `SQ:::${normStem}:::${normalizeText(q.answer)}`;
  }

  return `${qType}:::${normStem}`;
};

export default function JsonBatchEditor({
  selectedChapter,
  selectedTopic,
  selectedSubtopic,
  selectedPaper,
  onUploadSuccess,
}) {
  const [selectedType, setSelectedType] = useState("MCQ");
  const [jsonText, setJsonText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [removedDuplicateCount, setRemovedDuplicateCount] = useState(0);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(TEMPLATES[selectedType], null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParsePreview = (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setRemovedDuplicateCount(0);

    try {
      const parsed = JSON.parse(jsonText);
      const rawList = Array.isArray(parsed) ? parsed : [parsed];

      if (rawList.length === 0) {
        setStatus({ type: "error", message: "কোনো প্রশ্ন পাওয়া যায়নি!" });
        return;
      }

      for (let i = 0; i < rawList.length; i++) {
        const q = rawList[i];
        const qType = q.type || selectedType;

        if (!q.stem) {
          setStatus({ type: "error", message: `প্রশ্ন #${i + 1}-এ stem অনুপস্থিত!` });
          return;
        }

        if (qType === "MCQ") {
          if (!Array.isArray(q.options) || q.options.length !== 4 || q.answerIndex === undefined) {
            setStatus({ type: "error", message: `MCQ #${i + 1}-এ ৪টি অপশন ও answerIndex থাকতে হবে!` });
            return;
          }
        } else if (qType === "CQ") {
          if (!Array.isArray(q.subQuestions) || q.subQuestions.length === 0) {
            setStatus({ type: "error", message: `CQ #${i + 1}-এ subQuestions (ক, খ, গ, ঘ) থাকতে হবে!` });
            return;
          }
        } else if (qType === "SQ") {
          if (!q.answer) {
            setStatus({ type: "error", message: `SQ #${i + 1}-এ answer (উত্তর) থাকতে হবে!` });
            return;
          }
        }
      }

      // ১. ইন-ব্যাচ ডুপ্লিকেট ফিল্টারিং (প্রশ্ন ও অপশন উভয়ই ম্যাচ করলে ডুপ্লিকেট বাদ পড়বে)
      const uniqueList = [];
      const seenSignatures = new Set();
      let internalDups = 0;

      rawList.forEach((q) => {
        const sig = getQuestionSignature(q);
        if (seenSignatures.has(sig)) {
          internalDups++;
        } else {
          seenSignatures.add(sig);
          uniqueList.push(q);
        }
      });

      setParsedQuestions(uniqueList);
      setRemovedDuplicateCount(internalDups);

      if (internalDups > 0) {
        setStatus({
          type: "success",
          message: `মোট ${rawList.length}টি প্রশ্নের মধ্যে ${internalDups}টি ডুপ্লিকেট (একই প্রশ্ন ও অপশন) পাওয়ায় বাদ দেওয়া হয়েছে! বাকি ${uniqueList.length}টি ইউনিক প্রশ্ন প্রস্তুত।`,
        });
      } else {
        setStatus({
          type: "success",
          message: `সফলভাবে ${uniqueList.length}টি ${selectedType} প্রশ্ন ভ্যালিডেট হয়েছে (কোনো ডুপ্লিকেট নেই)!`,
        });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: "JSON সিনট্যাক্স ভুল! দয়া করে সঠিক কোটেশন ও কমা চেক করুন।",
      });
    }
  };

  const handleUpdatePreUploadQuestion = (updatedQ) => {
    if (editingIndex !== null) {
      const updated = [...parsedQuestions];
      updated[editingIndex] = updatedQ;
      setParsedQuestions(updated);
      setEditingIndex(null);
    }
  };

  const handleRemoveFromPreview = (idx) => {
    setParsedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCommitToFirestore = async () => {
    if (!selectedChapter || !selectedTopic) {
      alert("দয়া করে উপরে অধ্যায় ও টপিক নির্বাচন করুন।");
      return;
    }

    if (parsedQuestions.length === 0) {
      alert("আপলোড করার জন্য কোনো প্রশ্ন নেই।");
      return;
    }

    setUploading(true);
    setStatus({ type: "", message: "" });

    try {
      // ২. ডাটাবেজে ইতোমধ্যে বিদ্যমান প্রশ্নগুলোর সাথে ডুপ্লিকেট ফিল্টার
      const questionsColl = collection(db, "questions");
      const existingSnap = await getDocs(
        query(questionsColl, where("topicId", "==", selectedTopic.id))
      );

      const existingSignatures = new Set();
      existingSnap.docs.forEach((d) => {
        const data = d.data();
        existingSignatures.add(getQuestionSignature(data));
      });

      const toUpload = [];
      let dbDuplicateCount = 0;

      parsedQuestions.forEach((q) => {
        const sig = getQuestionSignature(q);
        if (existingSignatures.has(sig)) {
          dbDuplicateCount++;
        } else {
          toUpload.push(q);
          existingSignatures.add(sig); // ব্যাচের বাকিগুলোর সাথেও সিঙ্ক রাখা
        }
      });

      if (toUpload.length === 0) {
        setUploading(false);
        setStatus({
          type: "error",
          message: `আপলোডের জন্য থাকা সব প্রশ্ন (${dbDuplicateCount}টি) ইতোমধ্যে ডাটাবেজে রয়েছে! কোনো ডুপ্লিকেট সেভ করা হয়নি।`,
        });
        alert(`এই টপিকে এই প্রশ্নগুলো (${dbDuplicateCount}টি) ইতোমধ্যে ডাটাবেজে রয়েছে। কোনো ডুপ্লিকেট প্রশ্ন যোগ করা হয়নি।`);
        return;
      }

      // Firestore ব্যাচ রাইট (৪০০টি করে চাঙ্ক হিসেবে নিরাপদ এক্সিকিউশন)
      const CHUNK_SIZE = 400;
      for (let i = 0; i < toUpload.length; i += CHUNK_SIZE) {
        const chunk = toUpload.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((q) => {
          const newRef = doc(questionsColl);
          const qType = q.type || selectedType;

          const docData = {
            paper: Number(selectedPaper),
            chapterId: selectedChapter.id,
            chapterTitle: selectedChapter.title,
            topicId: selectedTopic.id,
            topicTitle: selectedTopic.title,
            subtopicId: selectedSubtopic ? selectedSubtopic.id : (q.subtopicId || ""),
            subtopicTitle: selectedSubtopic ? selectedSubtopic.title : (q.subtopicTitle || ""),
            stem: q.stem,
            imageUrl: q.imageUrl || "",
            tag: q.tag || "HSC & Admission",
            type: qType,
            createdAt: serverTimestamp(),
          };

          if (qType === "MCQ") {
            docData.options = q.options;
            docData.answerIndex = Number(q.answerIndex);
            docData.explanation = q.explanation || "";
          } else if (qType === "CQ") {
            docData.subQuestions = q.subQuestions || [];
          } else if (qType === "SQ") {
            docData.answer = q.answer || "";
            docData.subCategory = q.subCategory || "জ্ঞানমূলক";
            docData.marks = Number(q.marks) || 1;
          }

          batch.set(newRef, docData);
        });

        await batch.commit();
      }

      cacheService.remove("chemchamp_all_questions");
      contentVersionService.bumpVersion("questions");

      const successMsg = dbDuplicateCount > 0
        ? `সফলভাবে ${toUpload.length}টি নতুন ${selectedType} প্রশ্ন সেভ হয়েছে! (${dbDuplicateCount}টি পূর্বের ডুপ্লিকেট প্রশ্ন ডাটাবেজে থাকায় স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে) 🚀`
        : `সফলভাবে ${toUpload.length}টি ${selectedType} প্রশ্ন সেভ হয়েছে! 🚀`;

      setStatus({
        type: "success",
        message: successMsg,
      });
      setJsonText("");
      setParsedQuestions([]);
      setRemovedDuplicateCount(0);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error("Batch write error:", err);
      setStatus({ type: "error", message: "আপলোড ব্যর্থ: " + err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* আপলোডার ফর্ম */}
      <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-teal-400" />
              <span>JSON বাল্ক কোয়েশ্চেন আপলোডার</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">প্রশ্ন টাইপ নির্বাচন করে ফরম্যাট পেস্ট করুন</p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold self-start sm:self-auto">
            {["MCQ", "CQ", "SQ"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedType(type);
                  setParsedQuestions([]);
                  setStatus({ type: "", message: "" });
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedType === type
                    ? "bg-teal-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {type === "MCQ" ? "MCQ (বহুনির্বাচনী)" : type === "CQ" ? "CQ (সৃজনশীল)" : "SQ (সংক্ষিপ্ত প্রশ্ন)"}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleParsePreview} className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-teal-400">
              * নির্বাচিত ফরম্যাট: <strong>{selectedType}</strong> (বাংলা স্পেস ও KaTeX সমীকরণ সমর্থিত)
            </span>

            <button
              type="button"
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "কপি হয়েছে!" : `${selectedType} নমুনা ফরম্যাট কপি`}</span>
            </button>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={7}
            placeholder={`এখানে [${selectedType}] JSON অ্যারে পেস্ট করুন...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 leading-relaxed"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              ImgBB ইমেজ URL থাকলে "imageUrl" ফিল্ডে দিন
            </span>

            <button
              type="submit"
              disabled={!jsonText.trim()}
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
            >
              পার্স ও লাইভ প্রিভিউ দেখুন 👁️
            </button>
          </div>
        </form>

        {status.message && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              status.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <p className="flex-1 font-medium">{status.message}</p>
          </div>
        )}
      </div>

      {/* প্রিভিউ কার্ডস */}
      {parsedQuestions.length > 0 && (
        <div className="p-4 sm:p-5 bg-slate-900 border border-teal-500/30 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                <span>প্রিভিউ: {parsedQuestions.length}টি {selectedType} প্রশ্ন</span>
                <span className="text-[10px] bg-teal-500/10 border border-teal-500/30 text-teal-300 px-2 py-0.5 rounded font-mono">
                  {selectedTopic?.title || "টপিক নির্বাচন করুন"}
                  {selectedSubtopic?.title ? ` ➔ ${selectedSubtopic.title}` : ""}
                </span>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>ডুপ্লিকেট মুক্ত</span>
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                আপলোড করার আগেই প্রশ্ন ও ব্যাখ্যা চেক করুন
              </p>
            </div>

            <button
              type="button"
              disabled={uploading || !selectedTopic}
              onClick={handleCommitToFirestore}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{uploading ? "আপলোড হচ্ছে..." : "ফায়ারস্টোরে সেভ করুন 🚀"}</span>
            </button>
          </div>

          <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {parsedQuestions.map((q, idx) => {
              const qType = q.type || selectedType;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-teal-400 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-300">
                        {qType}
                      </span>
                      {q.tag && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.2 rounded border border-slate-800">
                          {q.tag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingIndex(idx)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="এডিট"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromPreview(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="বাদ দিন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* প্রশ্নের মূল বাক্য (স্পেস সহ সুন্দর রেন্ডারিং) */}
                  <div className="text-xs font-semibold text-white leading-relaxed">
                    <KaTeXMath math={q.stem} />
                  </div>

                  {/* ImgBB চিত্র */}
                  {q.imageUrl && (
                    <div className="my-1 text-center">
                      <img
                        src={q.imageUrl}
                        alt="চিত্র"
                        className="max-h-32 rounded-lg object-contain mx-auto border border-slate-800"
                      />
                    </div>
                  )}

                  {/* MCQ অপশনসমূহ */}
                  {qType === "MCQ" && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border flex items-center gap-2 ${
                            oIdx === q.answerIndex
                              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold"
                              : "bg-slate-900/60 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span className="font-mono text-slate-400">{String.fromCharCode(65 + oIdx)}.</span>
                          <KaTeXMath math={opt} />
                          {oIdx === q.answerIndex && <span className="ml-auto text-emerald-400 font-bold">✓</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* MCQ ব্যাখ্যা (সর্বদা দৃশ্যমান) */}
                  {qType === "MCQ" && q.explanation && (
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs leading-relaxed text-slate-300">
                      <span className="text-amber-400 font-bold block mb-1">💡 ব্যাখ্যা:</span>
                      <KaTeXMath math={q.explanation} />
                    </div>
                  )}

                  {/* CQ সৃজনশীল প্রশ্ন ও আদর্শ উত্তর */}
                  {qType === "CQ" && q.subQuestions && (
                    <div className="space-y-2 text-xs bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                      {q.subQuestions.map((sub, sIdx) => (
                        <div key={sIdx} className="border-b border-slate-800/80 pb-2 last:border-none">
                          <p className="text-teal-300 font-bold mb-1">
                            ({sub.part}) <KaTeXMath math={sub.question} /> ({sub.marks || sIdx + 1} নম্বর)
                          </p>
                          <div className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                            <strong className="text-emerald-400">উত্তরঃ </strong>
                            <KaTeXMath math={sub.answer} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SQ সংক্ষিপ্ত উত্তর */}
                  {qType === "SQ" && (
                    <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-xs">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-2 inline-block">
                        {q.subCategory || "জ্ঞানমূলক"} ({q.marks || 1} নম্বর)
                      </span>
                      <div className="text-slate-300 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        <strong className="text-emerald-400">উত্তরঃ </strong>
                        <KaTeXMath math={q.answer} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* প্রি-আপলোড এডিট মডাল */}
      {editingIndex !== null && (
        <SingleQuestionModal
          isOpen={true}
          data={parsedQuestions[editingIndex]}
          defaultType={selectedType}
          chapterTitle={selectedChapter?.title}
          topicTitle={selectedTopic?.title}
          onClose={() => setEditingIndex(null)}
          onSave={handleUpdatePreUploadQuestion}
        />
      )}
    </div>
  );
}