import { contentVersionService } from "../../../services/contentVersionService";
import React, { useState, useEffect } from "react";
import { cacheService } from "../../../services/cacheService";
import { db } from "../../../services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Plus, Edit2, Trash2, AlertTriangle, RefreshCw, X, Save } from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";

export default function PeriodicExceptionsTab() {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });

  const fetchElements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "periodicElements"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (Number(a.z) || 0) - (Number(b.z) || 0));
      setElements(list);
    } catch (err) {
      console.error("Fetch elements error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElements();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const form = e.target;
    const symbol = form.symbol.value.trim();
    const name = form.name.value.trim();
    const z = Number(form.z.value);
    const group = form.group.value.trim();
    const period = Number(form.period.value);
    const config = form.config.value.trim();
    const isException = form.isException.checked;
    const note = form.note.value.trim();

    try {
      const id = modal.data?.id || `elem_${z}`;
      await setDoc(
        doc(db, "periodicElements", id),
        {
          symbol,
          name,
          z,
          group,
          period,
          config,
          isException,
          note,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setModal({ open: false, data: null });
      cacheService.remove("vault_periodic_elements");
      contentVersionService.bumpVersion("vault");
      fetchElements();
    } catch (err) {
      alert("সংরক্ষণ ব্যর্থ: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই মৌলটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "periodicElements", id));
      cacheService.remove("vault_periodic_elements");
      contentVersionService.bumpVersion("vault");
      setElements((prev) => prev.filter((el) => el.id !== id));
    } catch (err) {
      alert("ডিলিট ব্যর্থ: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">পর্যায় সারণি ও ব্যতিক্রমী মৌলসমূহ ({elements.length}টি)</h3>
          <p className="text-xs text-slate-400">ব্যতিক্রমী ইলেকট্রন বিন্যাস ও বিশেষ অ্যালার্ট ট্যাগ</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModal({ open: true, data: null })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন মৌল যোগ</span>
          </button>
          <button
            type="button"
            onClick={fetchElements}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">মৌলসমূহ লোড হচ্ছে...</div>
      ) : elements.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
          কোনো মৌল যোগ করা হয়নি। "+ নতুন মৌল যোগ" বাটনে ক্লিক করুন।
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {elements.map((el) => (
            <div
              key={el.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2 transition-colors ${
                el.isException
                  ? "bg-amber-950/20 border-amber-500/40"
                  : "bg-slate-950/80 border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[10px] font-mono text-slate-500">Z={el.z}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, data: el })}
                      className="p-0.5 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(el.id)}
                      className="p-0.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xl font-black font-mono ${el.isException ? "text-amber-400" : "text-white"}`}>
                    {el.symbol}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{el.name}</h4>
                    <span className="text-[10px] text-slate-400">
                      গ্রুপ: {el.group} | পর্যায়: {el.period}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center mb-1.5">
                  <KaTeXMath math={el.config} block className="text-emerald-400 text-xs font-mono font-bold" />
                </div>
              </div>

              {el.isException && el.note && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg text-[10px] text-amber-300 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                  <span>{el.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* মোডাল */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModal({ open: false, data: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-bold text-white mb-3">
              {modal.data ? "মৌল এডিট করুন" : "নতুন মৌল যোগ করুন"}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">প্রতীক (Symbol)</label>
                  <input
                    type="text"
                    name="symbol"
                    required
                    defaultValue={modal.data?.symbol || ""}
                    placeholder="যেমন: Cr"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">মৌলের নাম</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={modal.data?.name || ""}
                    placeholder="যেমন: ক্রোমিয়াম"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">পারমাণবিক সংখ্যা (Z)</label>
                  <input
                    type="number"
                    name="z"
                    required
                    defaultValue={modal.data?.z || 24}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">গ্রুপ</label>
                  <input
                    type="text"
                    name="group"
                    required
                    defaultValue={modal.data?.group || "VIB"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">পর্যায়</label>
                  <input
                    type="number"
                    name="period"
                    required
                    defaultValue={modal.data?.period || 4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">ইলেকট্রন বিন্যাস (KaTeX)</label>
                <input
                  type="text"
                  name="config"
                  required
                  defaultValue={modal.data?.config || "[\\text{Ar}] 3d^5 4s^1"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-emerald-300 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="isException"
                  name="isException"
                  defaultChecked={modal.data?.isException ?? true}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <label htmlFor="isException" className="text-amber-400 font-semibold cursor-pointer">
                  এটি ব্যতিক্রমী মৌল (হলুদ অ্যালার্ট শো করবে)
                </label>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">ব্যতিক্রমের কারণ / নোট</label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={modal.data?.note || ""}
                  placeholder="যেমন: d-অরবিটাল অর্ধপূর্ণ স্থিতিশীলতার জন্য..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}