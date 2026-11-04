import React, { useState } from "react";
import { X, Layers } from "lucide-react";

export default function ChapterModal({ isOpen, data, defaultSequence, onClose, onSave }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(data?.title || "");
  const [sequenceOrder, setSequenceOrder] = useState(data?.sequenceOrder || defaultSequence || 1);
  const [description, setDescription] = useState(data?.description || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: data?.id,
      title: title.trim(),
      sequenceOrder: Number(sequenceOrder) || 1,
      description: description.trim(),
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

        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>{data ? "অধ্যায় এডিট করুন" : "নতুন অধ্যায় তৈরি"}</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">অধ্যায়ের নাম</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: গুণগত রসায়ন"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">ক্রম নম্বর (Sequence)</label>
            <input
              type="number"
              required
              value={sequenceOrder}
              onChange={(e) => setSequenceOrder(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="অধ্যায়ের মূল বিষয়বস্তু..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md active:scale-98"
          >
            অধ্যায় সংরক্ষণ করুন 🚀
          </button>
        </form>
      </div>
    </div>
  );
}