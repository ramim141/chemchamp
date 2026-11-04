import React, { useState } from "react";
import { X, FolderPlus } from "lucide-react";

export default function TopicModal({ isOpen, data, chapterTitle, defaultSequence, onClose, onSave }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(data?.title || "");
  const [sequenceOrder, setSequenceOrder] = useState(data?.sequenceOrder || defaultSequence || 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: data?.id,
      title: title.trim(),
      sequenceOrder: Number(sequenceOrder) || 1,
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
          <FolderPlus className="w-4 h-4 text-teal-400" />
          <span>{data ? "টপিক এডিট করুন" : "নতুন টপিক তৈরি"}</span>
        </h3>
        <p className="text-[11px] text-amber-400 mb-3">অধ্যায়: {chapterTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">টপিকের শিরোনাম</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: পরমাণুর কণিকা"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">ক্রম নম্বর (Sequence)</label>
            <input
              type="number"
              required
              value={sequenceOrder}
              onChange={(e) => setSequenceOrder(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-98"
          >
            টপিক সংরক্ষণ করুন 🚀
          </button>
        </form>
      </div>
    </div>
  );
}