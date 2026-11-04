import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Video,
  Headphones,
  Play,
  Pause,
  Award,
  Zap,
  HelpCircle,
  FileText,
  Lock,
} from "lucide-react";
import ChemistryMarkdownViewer from "../common/ChemistryMarkdownViewer";
import TopicPracticeZone from "./TopicPracticeZone";
import TopicMiniTest from "./TopicMiniTest";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function LessonReaderModal({
  chapter = {},
  topics = [],
  subtopicsMap = {},
  onClose,
  onProgressUpdate,
}) {
  const { user, profile, setProfile } = useAuth();

  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [activeSubtopicIndex, setActiveSubtopicIndex] = useState(0);

  // স্টাডি লুপ ট্যাব: note (লেকচার) | practice (অনুশীলন) | test (মাস্টারি টেস্ট)
  const [studyTab, setStudyTab] = useState("note");

  // অডিও প্লেয়ার স্টেট
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // অগ্রগতি ও আনলক স্টেট
  const [completedTopicIds, setCompletedTopicIds] = useState([]);
  const [practiceDone, setPracticeDone] = useState(false);

  const currentTopic = topics[activeTopicIndex] || null;
  const currentSubtopics = currentTopic ? subtopicsMap[currentTopic.id] || [] : [];
  const currentSubtopic = currentSubtopics[activeSubtopicIndex] || null;

  const isCurrentCompleted = currentTopic ? completedTopicIds.includes(currentTopic.id) : false;

  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1]?.split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      if (url.includes("watch?v=")) {
        const id = url.split("watch?v=")[1]?.split("&")[0];
        return `https://www.youtube.com/embed/${id}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // টপিক টেস্ট পাস করলে টপিক ১০০% সম্পন্ন ও পরের টপিক আনলক
  const handleTestPassed = async ({ correctCount }) => {
    if (!currentTopic || isCurrentCompleted) return;

    setCompletedTopicIds((prev) => [...prev, currentTopic.id]);

    const xpGained = 50;
    if (user && profile) {
      try {
        const userRef = doc(db, "users", user.uid);
        const currentXP = (profile.gamification?.currentXP || 100) + xpGained;
        const updatedProfile = {
          ...profile,
          gamification: { ...profile.gamification, currentXP },
        };
        setProfile(updatedProfile);
        await setDoc(userRef, { gamification: { currentXP } }, { merge: true });
      } catch (err) {
        console.warn("Could not sync test XP:", err);
      }
    }

    if (onProgressUpdate) {
      onProgressUpdate(currentTopic.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[95vh] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* ১. শীর্ষ হেডার বার */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg shrink-0">
              রসায়ন {chapter.paper === 1 ? "১ম" : "২য়"} পত্র
            </span>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                {chapter.title}
              </h2>
              {currentTopic && (
                <span className="text-[11px] text-teal-400 truncate block">
                  টপিক: {currentTopic.title}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ২. টপিক নেভিগেশন ট্যাব (সিকোয়েন্সিয়াল আনলক ইন্ডিকেটর সহ) */}
        {topics.length > 0 && (
          <div className="px-3.5 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold shrink-0">
              টপিকসমূহ:
            </span>
            {topics.map((t, idx) => {
              const isDone = completedTopicIds.includes(t.id);
              // আগের টপিক সম্পন্ন না হলে পরেরটি লক (প্রথম টপিক সর্বদা আনলক)
              const isLocked = idx > 0 && !completedTopicIds.includes(topics[idx - 1].id);

              return (
                <button
                  key={t.id || idx}
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    setActiveTopicIndex(idx);
                    setActiveSubtopicIndex(0);
                    setStudyTab("note");
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                    idx === activeTopicIndex
                      ? "bg-teal-500 text-slate-950 font-bold shadow-md"
                      : isLocked
                      ? "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed"
                      : isDone
                      ? "bg-slate-900 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                  }`}
                >
                  {isLocked && <Lock className="w-3 h-3 text-slate-600" />}
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  <span>{idx + 1}. {t.title}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ৩. স্টাডি লুপ ধাপসমূহ (Step Navigation Bar) */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStudyTab("note")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                studyTab === "note"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>১. লেকচার নোট ও ভিডিও</span>
            </button>

            <button
              type="button"
              onClick={() => setStudyTab("practice")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                studyTab === "practice"
                  ? "bg-teal-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>২. প্র্যাকটিস জোন (MCQ, CQ, SQ)</span>
            </button>

            <button
              type="button"
              onClick={() => setStudyTab("test")}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                studyTab === "test"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>৩. টপিক টেস্ট ও আনলক 🏆</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {isCurrentCompleted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> টপিক ১০০% সম্পন্ন!
              </span>
            ) : (
              "টেস্ট পাস করলেই পরের টপিক খুলবে"
            )}
          </span>
        </div>

        {/* ৪. মূল স্টাডি স্ক্রিন এরিয়া */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* ট্যাব ১: লেকচার নোট, অডিও ও ভিডিও */}
          {studyTab === "note" && (
            <div className="max-w-3xl mx-auto space-y-4">
              
              {/* সাব-টপিক লিস্ট থাকলে চয়েস বার */}
              {currentSubtopics.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">পাঠ:</span>
                  {currentSubtopics.map((sub, sIdx) => (
                    <button
                      key={sub.id || sIdx}
                      type="button"
                      onClick={() => {
                        setActiveSubtopicIndex(sIdx);
                        setShowVideo(false);
                      }}
                      className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                        sIdx === activeSubtopicIndex
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                          : "bg-slate-950 border border-slate-800 text-slate-300"
                      }`}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              )}

              {/* অডিও রিক্যাপ প্লেয়ার (বাস জার্নি মোড) */}
              <div className="p-3 bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-500/20 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="p-2.5 rounded-full bg-teal-500 text-slate-950 font-bold shadow-md hover:bg-teal-400 active:scale-95 transition-all"
                  >
                    {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <span className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5" /> বাস জার্নি মোড (অডিও রিক্যাপ)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isPlayingAudio ? "অডিও প্লে হচ্ছে..." : "যাতায়াতের সময় পড়ার জন্য অডিও শুনুন"}
                    </span>
                  </div>
                </div>

                {currentSubtopic?.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(!showVideo)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{showVideo ? "ভিডিও বন্ধ" : "ভিডিও লেকচার"}</span>
                  </button>
                )}
              </div>

              {/* ইউটিউব ভিডিও প্লেয়ার এম্বেড */}
              {showVideo && currentSubtopic?.videoUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video shadow-2xl animate-in fade-in">
                  <iframe
                    src={getEmbedUrl(currentSubtopic.videoUrl)}
                    title={currentSubtopic.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* সম্পূর্ণ মার্কডাউন লেকচার নোট */}
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
                <ChemistryMarkdownViewer
                  content={
                    currentSubtopic?.notesMarkdown ||
                    currentTopic?.notesMarkdown ||
                    "এই টপিকের অধীনে এখনো কোনো লেকচার নোট লেখা হয়নি।"
                  }
                />
              </div>

              {/* পরবর্তী ধাপে যাওয়ার অ্যাকশন বাটন */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStudyTab("practice")}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all"
                >
                  <span>নোট পড়া শেষ ➔ প্র্যাকটিসে যান</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ট্যাব ২: প্র্যাকটিস জোন (MCQ, CQ, SQ) */}
          {studyTab === "practice" && (
            <div className="max-w-3xl mx-auto space-y-4">
              <TopicPracticeZone
                topicId={currentTopic?.id}
                chapterId={chapter.id}
                onPracticeComplete={() => setPracticeDone(true)}
              />

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStudyTab("note")}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  লেভেল ১: নোটে ফিরে যান
                </button>

                <button
                  type="button"
                  onClick={() => setStudyTab("test")}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>টপিক টেস্ট দিয়ে সম্পন্ন করুন 🏆</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ট্যাব ৩: টপিক টেস্ট ও ১০০% সম্পন্নকরণ */}
          {studyTab === "test" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <TopicMiniTest
                questions={subtopicsMap[currentTopic?.id] || []}
                onPassTest={handleTestPassed}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}