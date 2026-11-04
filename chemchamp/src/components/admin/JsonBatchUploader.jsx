import React, { useState } from "react";
import ChapterTopicSelector from "./questions/ChapterTopicSelector";
import JsonBatchEditor from "./questions/JsonBatchEditor";
import QuestionBankList from "./questions/QuestionBankList";
import { FileJson, ListFilter } from "lucide-react";

export default function JsonBatchUploader() {
  const [selectedPaper, setSelectedPaper] = useState(1);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState(null);

  // সাব-ট্যাব: "batch" = JSON আপলোড | "bank" = বিদ্যমান প্রশ্ন ব্যাংক CRUD
  const [activeTab, setActiveTab] = useState("batch");

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* ১. অধ্যায়, টপিক ও সাব-টপিক ক্যাসকেডিং নির্বাচক */}
      <ChapterTopicSelector
        selectedPaper={selectedPaper}
        onChangePaper={setSelectedPaper}
        selectedChapter={selectedChapter}
        onSelectChapter={setSelectedChapter}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        selectedSubtopic={selectedSubtopic}
        onSelectSubtopic={setSelectedSubtopic}
      />

      {/* ২. সাব-ট্যাব সুইচ (JSON বাল্ক বনাম প্রশ্ন ব্যাংক) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("batch")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "batch"
              ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
              : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>JSON বাল্ক আপলোড ও প্রিভিউ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "bank"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>বিদ্যমান প্রশ্ন ব্যাংক ও ফুল CRUD</span>
        </button>
      </div>

      {/* ৩. সক্রিয় ট্যাবের কনটেন্ট */}
      {activeTab === "batch" ? (
        <JsonBatchEditor
          selectedChapter={selectedChapter}
          selectedTopic={selectedTopic}
          selectedSubtopic={selectedSubtopic}
          selectedPaper={selectedPaper}
          onUploadSuccess={() => setActiveTab("bank")}
        />
      ) : (
        <QuestionBankList
          selectedChapter={selectedChapter}
          selectedTopic={selectedTopic}
          selectedSubtopic={selectedSubtopic}
          selectedPaper={selectedPaper}
        />
      )}
    </div>
  );
}