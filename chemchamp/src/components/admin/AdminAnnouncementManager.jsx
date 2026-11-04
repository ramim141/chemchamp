import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Gift,
  ExternalLink,
  Eye,
  Pin,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { db } from "../../services/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { soundService } from "../../services/soundService";

const NOTICE_TYPES = [
  { id: "info", label: "সাধারণ তথ্য", icon: Info, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "alert", label: "জরুরি সতর্কতা / নোটিশ", icon: AlertTriangle, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { id: "event", label: "লাইভ ক্লাস / মেগা এক্সাম", icon: Sparkles, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "offer", label: "স্পেশাল অফার / ডিসকাউন্ট", icon: Gift, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
];

const TARGET_AUDIENCES = [
  { id: "all", label: "সকল শিক্ষার্থী" },
  { id: "hsc25", label: "HSC 2025 ব্যাচ" },
  { id: "hsc26", label: "HSC 2026 ব্যাচ" },
  { id: "pro_only", label: "শুধুমাত্র PRO মেম্বার" },
  { id: "free_only", label: "ফ্রি ইউজারদের জন্য" },
];

export default function AdminAnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    target: "all",
    actionLink: "",
    actionLabel: "বিস্তারিত দেখুন",
    isSticky: false,
    isActive: true,
  });

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // 1. Fetch announcements from Firestore
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "announcements"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort sticky first, then latest
      list.sort((a, b) => {
        if (a.isSticky && !b.isSticky) return -1;
        if (!a.isSticky && b.isSticky) return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });

      setAnnouncements(list);
      try {
        localStorage.setItem("chemchamp_cached_announcements", JSON.stringify(list));
      } catch {}
    } catch (err) {
      console.warn("Could not fetch announcements:", err);
      // Fallback local cached announcements
      try {
        const cached = localStorage.getItem("chemchamp_cached_announcements");
        if (cached) setAnnouncements(JSON.parse(cached));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: "",
      message: "",
      type: "info",
      target: "all",
      actionLink: "",
      actionLabel: "বিস্তারিত দেখুন",
      isSticky: false,
      isActive: true,
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEdit = (item) => {
    soundService.playClick();
    setFormData({
      title: item.title || "",
      message: item.message || "",
      type: item.type || "info",
      target: item.target || "all",
      actionLink: item.actionLink || "",
      actionLabel: item.actionLabel || "বিস্তারিত দেখুন",
      isSticky: Boolean(item.isSticky),
      isActive: item.isActive !== false,
    });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  // 2. Save Announcement (Create / Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("অনুগ্রহ করে নোটিশের শিরোনাম ও বিস্তারিত বার্তা লিখুন!");
      return;
    }

    soundService.playClick();
    const targetId = editingId || `notice_${Date.now()}`;
    const payload = {
      ...formData,
      id: targetId,
      updatedAt: serverTimestamp(),
      createdAt: editingId
        ? announcements.find((a) => a.id === editingId)?.createdAt || serverTimestamp()
        : serverTimestamp(),
    };

    // Optimistic Update
    setAnnouncements((prev) => {
      const existing = prev.filter((a) => a.id !== targetId);
      const updated = [payload, ...existing];
      try {
        localStorage.setItem("chemchamp_cached_announcements", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showNotification(
      editingId ? "নোটিশ সফলভাবে আপডেট করা হয়েছে!" : "নতুন নোটিশ সফলভাবে প্রকাশ করা হয়েছে!"
    );
    resetForm();

    try {
      await setDoc(doc(db, "announcements", targetId), payload);
    } catch (err) {
      console.warn("Could not save announcement to Firestore:", err);
    }
  };

  // 3. Toggle Active Status
  const handleToggleActive = async (item) => {
    soundService.playClick();
    const newActive = !item.isActive;

    setAnnouncements((prev) => {
      const updated = prev.map((a) =>
        a.id === item.id ? { ...a, isActive: newActive } : a
      );
      try {
        localStorage.setItem("chemchamp_cached_announcements", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showNotification(`নোটিশটি ${newActive ? "সক্রিয় (লাইভ)" : "নিষ্ক্রিয়"} করা হয়েছে!`);

    try {
      await setDoc(
        doc(db, "announcements", item.id),
        { isActive: newActive },
        { merge: true }
      );
    } catch (err) {
      console.warn("Could not update notice status:", err);
    }
  };

  // 4. Delete Announcement
  const handleDelete = async (item) => {
    soundService.playClick();
    if (!window.confirm(`আপনি কি "${item.title}" নোটিশটি মুছে ফেলতে চান?`)) return;

    setAnnouncements((prev) => {
      const updated = prev.filter((a) => a.id !== item.id);
      try {
        localStorage.setItem("chemchamp_cached_announcements", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    showNotification("নোটিশটি মুছে ফেলা হয়েছে!");

    try {
      await deleteDoc(doc(db, "announcements", item.id));
    } catch (err) {
      console.warn("Could not delete announcement:", err);
    }
  };

  const activeCount = announcements.filter((a) => a.isActive).length;
  const stickyCount = announcements.filter((a) => a.isSticky).length;

  return (
    <div className="space-y-6">
      {/* ১. হেডার */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              গ্লোবাল নোটিশ ও ব্রডকাস্ট এনাউন্সমেন্ট
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {activeCount}টি সক্রিয়
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              সকল শিক্ষার্থীর হোমপেজ, ড্যাশবোর্ড ও এক্সাম রুমে পিন নোটিশ ও অ্যালার্ট প্রদর্শন করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAnnouncements}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundService.playClick();
              if (isFormOpen) resetForm();
              else setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isFormOpen ? "ফর্ম বন্ধ করুন" : "নতুন নোটিশ যোগ করুন"}</span>
          </button>
        </div>
      </div>

      {/* নোটিফিকেশন অ্যালার্ট */}
      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* স্ট্যাটস কার্ড */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">মোট নোটিশ</span>
            <span className="text-lg font-black text-white font-mono">{announcements.length}টি</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">বর্তমানে লাইভ</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{activeCount}টি</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Pin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">টপ পিন করা</span>
            <span className="text-lg font-black text-amber-400 font-mono">{stickyCount}টি</span>
          </div>
        </div>
      </div>

      {/* ২. নতুন নোটিশ তৈরি বা এডিট ফর্ম */}
      {isFormOpen && (
        <form
          onSubmit={handleSave}
          className="p-5 md:p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{editingId ? "নোটিশ সম্পাদন করুন" : "নতুন গ্লোবাল নোটিশ প্রস্তুত করুন"}</span>
            </h2>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              বাতিল ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* শিরোনাম */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-300 font-bold block">
                নোটিশ শিরোনাম <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="যেমন: 🎉 আগামী শুক্রবার বুয়েট স্পেশাল লাইভ মেগা মক টেস্ট অনুষ্ঠিত হবে!"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* বার্তা */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-300 font-bold block">
                বিস্তারিত বার্তা <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="সকল পরীক্ষার্থীকে রাত ৮টায় এক্সাম রুমে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            {/* ধরন (Type) */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">নোটিশের ধরন</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:border-purple-500"
              >
                {NOTICE_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* টার্গেট অডিয়েন্স */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">কাদের দেখানো হবে?</label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:border-purple-500"
              >
                {TARGET_AUDIENCES.map((tg) => (
                  <option key={tg.id} value={tg.id}>
                    {tg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* লিংক / অ্যাকশন URL */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">বাটন লিংক (ঐচ্ছিক)</label>
              <input
                type="text"
                value={formData.actionLink}
                onChange={(e) => setFormData({ ...formData, actionLink: e.target.value })}
                placeholder="যেমন: /exams অথবা https://..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* বাটন লেবেল */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">বাটন টেক্সট</label>
              <input
                type="text"
                value={formData.actionLabel}
                onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                placeholder="যেমন: এখনই অংশ নিন ➔"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* টগল অপশনস */}
            <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                <input
                  type="checkbox"
                  checked={formData.isSticky}
                  onChange={(e) => setFormData({ ...formData, isSticky: e.target.checked })}
                  className="rounded border-slate-800 text-purple-500 focus:ring-0 w-4 h-4 bg-slate-950"
                />
                <span>📌 সবার উপরে পিন রাখুন (Sticky)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-bold">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-950"
                />
                <span>🟢 এখনই লাইভ করুন (Active)</span>
              </label>
            </div>
          </div>

          {/* লাইভ প্রিভিউ */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              লাইভ প্রিভিউ (শিক্ষার্থীরা যেভাবে দেখবে):
            </span>
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/60 to-slate-900 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Megaphone className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">
                    {formData.title || "নোটিশ শিরোনাম..."}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {formData.message || "বিস্তারিত বার্তা..."}
                  </div>
                </div>
              </div>
              {formData.actionLink && (
                <span className="px-3 py-1 rounded-lg bg-purple-500 text-slate-950 font-black shrink-0 text-[11px]">
                  {formData.actionLabel || "বিস্তারিত"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-purple-500/20"
            >
              {editingId ? "আপডেট সংরক্ষণ করুন" : "নোটিশ প্রকাশ করুন"}
            </button>
          </div>
        </form>
      )}

      {/* ৩. নোটিশ তালিকা টেবিল */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">নোটিশ</th>
                <th className="py-3 px-4">ধরন</th>
                <th className="py-3 px-4">টার্গেট</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4">পিন</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    বর্তমানে কোনো নোটিশ নেই। উপরে "নতুন নোটিশ যোগ করুন" বাটনে ক্লিক করে প্রকাশ করুন।
                  </td>
                </tr>
              ) : (
                announcements.map((item) => {
                  const typeObj =
                    NOTICE_TYPES.find((t) => t.id === item.type) || NOTICE_TYPES[0];
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-850 transition-colors ${
                        !item.isActive ? "opacity-60 bg-slate-950/40" : ""
                      }`}
                    >
                      {/* শিরোনাম ও মেসেজ */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="min-w-0">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            {item.isSticky && (
                              <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                            )}
                            <span className="truncate">{item.title}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {item.message}
                          </span>
                        </div>
                      </td>

                      {/* টাইপ */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeObj.color}`}
                        >
                          {typeObj.label}
                        </span>
                      </td>

                      {/* টার্গেট */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium">
                          {TARGET_AUDIENCES.find((tg) => tg.id === item.target)?.label ||
                            "সকল শিক্ষার্থী"}
                        </span>
                      </td>

                      {/* স্ট্যাটাস টগল বাটন */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            item.isActive
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          {item.isActive ? "লাইভ আছে" : "নিষ্ক্রিয়"}
                        </button>
                      </td>

                      {/* পিন */}
                      <td className="py-3.5 px-4">
                        {item.isSticky ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3 fill-amber-400" /> পিন করা
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* অ্যাকশনস */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

