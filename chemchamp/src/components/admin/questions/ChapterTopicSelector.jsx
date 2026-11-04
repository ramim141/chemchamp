import React, { useState, useEffect } from "react";
import { db } from "../../../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  BookOpen,
  FolderPlus,
  Layers,
  Plus,
  FileText,
  X,
  Sparkles,
} from "lucide-react";
import ChapterModal from "../curriculum/ChapterModal";
import TopicModal from "../curriculum/TopicModal";
import { cacheService } from "../../../services/cacheService";

// কুইক সাব-টপিক অ্যাড মোডাল
function SubtopicQuickModal({
  isOpen,
  chapterTitle,
  topicTitle,
  defaultSequence,
  onClose,
  onSave,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState(defaultSequence || 1);
  const [videoUrl, setVideoUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      sequenceOrder: Number(sequenceOrder) || 1,
      videoUrl: videoUrl.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-purple-400" />
          <span>নতুন সাব-টপিক তৈরি</span>
        </h3>
        <p className="text-[11px] text-slate-400 mb-3 truncate">
          অধ্যায়: <span className="text-amber-400">{chapterTitle}</span> ➔ টপিক:{" "}
          <span className="text-teal-400">{topicTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">সাব-টপিকের শিরোনাম</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ১.১ পরমাণু মডেলের ইতিহাস"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">ক্রম নম্বর (Sequence)</label>
            <input
              type="number"
              required
              value={sequenceOrder}
              onChange={(e) => setSequenceOrder(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">
              ভিডিও লেকচার লিংক (ঐচ্ছিক)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold transition-all shadow-md active:scale-95"
            >
              সংরক্ষণ করুন ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChapterTopicSelector({
  selectedPaper,
  onChangePaper,
  selectedChapter,
  onSelectChapter,
  selectedTopic,
  onSelectTopic,
  selectedSubtopic,
  onSelectSubtopic,
}) {
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);

  // Quick Add Modal States
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddSubtopic, setShowAddSubtopic] = useState(false);

  // ১. অধ্যায় লোড করা
  const fetchChapters = async () => {
    setLoadingChapters(true);
    try {
      const q = query(
        collection(db, "chapters"),
        where("paper", "==", Number(selectedPaper))
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
      setChapters(list);

      if (list.length > 0) {
        // Keep current selected if valid, else pick first
        const currentMatch = selectedChapter ? list.find((c) => c.id === selectedChapter.id) : null;
        onSelectChapter(currentMatch || list[0]);
      } else {
        onSelectChapter(null);
        setTopics([]);
        onSelectTopic(null);
        setSubtopics([]);
        if (onSelectSubtopic) onSelectSubtopic(null);
      }
    } catch (err) {
      console.error("Chapters fetch error:", err);
    } finally {
      setLoadingChapters(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [selectedPaper]);

  // ২. নির্বাচিত অধ্যায়ের টপিক লোড করা
  const fetchTopics = async () => {
    if (!selectedChapter) {
      setTopics([]);
      onSelectTopic(null);
      setSubtopics([]);
      if (onSelectSubtopic) onSelectSubtopic(null);
      return;
    }

    setLoadingTopics(true);
    try {
      const q = query(
        collection(db, "topics"),
        where("chapterId", "==", selectedChapter.id)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
      setTopics(list);

      if (list.length > 0) {
        const currentMatch = selectedTopic ? list.find((t) => t.id === selectedTopic.id) : null;
        onSelectTopic(currentMatch || list[0]);
      } else {
        onSelectTopic(null);
        setSubtopics([]);
        if (onSelectSubtopic) onSelectSubtopic(null);
      }
    } catch (err) {
      console.error("Topics fetch error:", err);
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [selectedChapter?.id]);

  // ৩. নির্বাচিত টপিকের সাব-টপিক লোড করা
  const fetchSubtopics = async () => {
    if (!selectedTopic) {
      setSubtopics([]);
      if (onSelectSubtopic) onSelectSubtopic(null);
      return;
    }

    setLoadingSubtopics(true);
    try {
      const q = query(
        collection(db, "subtopics"),
        where("topicId", "==", selectedTopic.id)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (Number(a.sequenceOrder) || 0) - (Number(b.sequenceOrder) || 0));
      setSubtopics(list);

      if (selectedSubtopic && list.some((s) => s.id === selectedSubtopic.id)) {
        // Keep currently selected subtopic
      } else {
        // Default to all/null or null
        if (onSelectSubtopic) onSelectSubtopic(null);
      }
    } catch (err) {
      console.error("Subtopics fetch error:", err);
    } finally {
      setLoadingSubtopics(false);
    }
  };

  useEffect(() => {
    fetchSubtopics();
  }, [selectedTopic?.id]);

  // Quick Add Handlers
  const handleSaveNewChapter = async (formData) => {
    try {
      const newId = formData.id || `chap_${Date.now()}`;
      const payload = {
        title: formData.title,
        sequenceOrder: Number(formData.sequenceOrder) || 1,
        paper: Number(selectedPaper),
        description: formData.description || "",
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "chapters", newId), payload, { merge: true });
      cacheService.remove("chemchamp_all_chapters");
      setShowAddChapter(false);
      await fetchChapters();
      onSelectChapter({ id: newId, ...payload });
    } catch (err) {
      alert("অধ্যায় তৈরিতে সমস্যা: " + err.message);
    }
  };

  const handleSaveNewTopic = async (formData) => {
    if (!selectedChapter) {
      alert("আগে একটি অধ্যায় নির্বাচন করুন।");
      return;
    }
    try {
      const newId = formData.id || `top_${Date.now()}`;
      const payload = {
        chapterId: selectedChapter.id,
        title: formData.title,
        sequenceOrder: Number(formData.sequenceOrder) || 1,
        estimatedMinutes: 20,
        summary: "",
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "topics", newId), payload, { merge: true });
      cacheService.remove(`chapter_topics_${selectedChapter.id}`);
      setShowAddTopic(false);
      await fetchTopics();
      onSelectTopic({ id: newId, ...payload });
    } catch (err) {
      alert("টপিক তৈরিতে সমস্যা: " + err.message);
    }
  };

  const handleSaveNewSubtopic = async (formData) => {
    if (!selectedTopic || !selectedChapter) {
      alert("আগে একটি অধ্যায় ও টপিক নির্বাচন করুন।");
      return;
    }
    try {
      const newId = `sub_${Date.now()}`;
      const payload = {
        chapterId: selectedChapter.id,
        topicId: selectedTopic.id,
        title: formData.title,
        sequenceOrder: Number(formData.sequenceOrder) || 1,
        videoUrl: formData.videoUrl || "",
        notesMarkdown: `## ${formData.title}\nএখানে লেকচার নোট লিখুন...`,
        examTags: [],
        bookHighlights: [],
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "subtopics", newId), payload, { merge: true });
      cacheService.remove(`chapter_subtopics_${selectedChapter.id}`);
      setShowAddSubtopic(false);
      await fetchSubtopics();
      if (onSelectSubtopic) {
        onSelectSubtopic({ id: newId, ...payload });
      }
    } catch (err) {
      alert("সাব-টপিক তৈরিতে সমস্যা: " + err.message);
    }
  };

  return (
    <>
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>১. পেপার, অধ্যায়, টপিক ও সাব-টপিক নির্বাচন করুন</span>
          </span>

          {/* পেপার সুইচ বাটন */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onChangePaper(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedPaper === 1
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              রসায়ন ১ম পত্র
            </button>
            <button
              type="button"
              onClick={() => onChangePaper(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                selectedPaper === 2
                  ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              রসায়ন ২য় পত্র
            </button>
          </div>
        </div>

        {/* ৩-কলাম রেসপনসিভ সিলেক্টর গ্রিড (অধ্যায়, টপিক ও সাব-টপিক) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* ১. অধ্যায় ড্রপডাউন */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>অধ্যায় নির্বাচন</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddChapter(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 hover:underline"
                title="নতুন অধ্যায় যোগ করুন"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন অধ্যায়</span>
              </button>
            </div>
            <select
              value={selectedChapter?.id || ""}
              onChange={(e) => {
                const ch = chapters.find((c) => c.id === e.target.value);
                onSelectChapter(ch || null);
              }}
              disabled={loadingChapters || chapters.length === 0}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50"
            >
              {loadingChapters ? (
                <option>অধ্যায় লোড হচ্ছে...</option>
              ) : chapters.length === 0 ? (
                <option value="">কোনো অধ্যায় পাওয়া যায়নি</option>
              ) : (
                chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.sequenceOrder || 1}. {ch.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* ২. টপিক ড্রপডাউন */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-teal-400" />
                <span>টপিক নির্বাচন</span>
              </label>
              <button
                type="button"
                disabled={!selectedChapter}
                onClick={() => setShowAddTopic(true)}
                className="text-[11px] text-teal-400 hover:text-teal-300 disabled:text-slate-600 font-bold flex items-center gap-0.5 hover:underline"
                title="এই অধ্যায়ে নতুন টপিক যোগ করুন"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন টপিক</span>
              </button>
            </div>
            <select
              value={selectedTopic?.id || ""}
              onChange={(e) => {
                const top = topics.find((t) => t.id === e.target.value);
                onSelectTopic(top || null);
              }}
              disabled={loadingTopics || topics.length === 0}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 disabled:opacity-50"
            >
              {loadingTopics ? (
                <option>টপিক লোড হচ্ছে...</option>
              ) : topics.length === 0 ? (
                <option value="">এই অধ্যায়ে কোনো টপিক নেই</option>
              ) : (
                topics.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.sequenceOrder || 1}. {top.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* ৩. সাব-টপিক ড্রপডাউন */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>সাব-টপিক নির্বাচন</span>
              </label>
              <button
                type="button"
                disabled={!selectedTopic}
                onClick={() => setShowAddSubtopic(true)}
                className="text-[11px] text-purple-400 hover:text-purple-300 disabled:text-slate-600 font-bold flex items-center gap-0.5 hover:underline"
                title="এই টপিকে নতুন সাব-টপিক যোগ করুন"
              >
                <Plus className="w-3 h-3" />
                <span>নতুন সাব-টপিক</span>
              </button>
            </div>
            <select
              value={selectedSubtopic?.id || ""}
              onChange={(e) => {
                if (!e.target.value) {
                  if (onSelectSubtopic) onSelectSubtopic(null);
                } else {
                  const sub = subtopics.find((s) => s.id === e.target.value);
                  if (onSelectSubtopic) onSelectSubtopic(sub || null);
                }
              }}
              disabled={loadingSubtopics || !selectedTopic}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-purple-500 disabled:opacity-50"
            >
              {loadingSubtopics ? (
                <option>সাব-টপিক লোড হচ্ছে...</option>
              ) : !selectedTopic ? (
                <option value="">আগে টপিক নির্বাচন করুন</option>
              ) : subtopics.length === 0 ? (
                <option value="">সাধারণ টপিক (কোনো সাব-টপিক নেই)</option>
              ) : (
                <>
                  <option value="">-- সাধারণ / সকল সাব-টপিক --</option>
                  {subtopics.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.sequenceOrder || 1}. {sub.title}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* কুইক অ্যাড মোডালসমূহ */}
      <ChapterModal
        isOpen={showAddChapter}
        defaultSequence={chapters.length + 1}
        onClose={() => setShowAddChapter(false)}
        onSave={handleSaveNewChapter}
      />

      <TopicModal
        isOpen={showAddTopic}
        chapterTitle={selectedChapter?.title || "অধ্যায়"}
        defaultSequence={topics.length + 1}
        onClose={() => setShowAddTopic(false)}
        onSave={handleSaveNewTopic}
      />

      <SubtopicQuickModal
        isOpen={showAddSubtopic}
        chapterTitle={selectedChapter?.title || "অধ্যায়"}
        topicTitle={selectedTopic?.title || "টপিক"}
        defaultSequence={subtopics.length + 1}
        onClose={() => setShowAddSubtopic(false)}
        onSave={handleSaveNewSubtopic}
      />
    </>
  );
}
