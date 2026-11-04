import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Crown,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle2,
  XCircle,
  Flame,
  Zap,
  GraduationCap,
  Mail,
  School,
  Clock,
  MoreVertical,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { db } from "../../services/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { soundService } from "../../services/soundService";

export default function AdminUserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("all"); // all | HSC-25 | HSC-26 | other
  const [proFilter, setProFilter] = useState("all"); // all | pro | free
  const [roleFilter, setRoleFilter] = useState("all"); // all | student | moderator | admin
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const showNotification = (msg) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(""), 3500);
  };

  // 1. Fetch Users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort by creation / last active descending
      list.sort((a, b) => {
        const tA = a.createdAt?.seconds || a.lastLoginAt?.seconds || 0;
        const tB = b.createdAt?.seconds || b.lastLoginAt?.seconds || 0;
        return tB - tA;
      });

      setUsers(list);
    } catch (err) {
      console.warn("Could not fetch users:", err);
      // Fallback demo users if Firestore users collection is empty or initial
      setUsers([
        {
          id: "u_demo_1",
          name: "তানভীর হাসান",
          email: "tanvir.buet@gmail.com",
          college: "নটর ডেম কলেজ, ঢাকা",
          hscBatch: "HSC-25",
          target: "বুয়েট ইঞ্জিনিয়ারিং",
          role: "student",
          isPro: true,
          isBanned: false,
          gamification: { currentXP: 1420, currentStreak: 7 },
          stats: { totalSolvedMCQ: 145, accuracyRate: 92 },
          createdAt: { seconds: Date.now() / 1000 - 86400 * 5 },
        },
        {
          id: "u_demo_2",
          name: "আয়েশা সিদ্দিকা",
          email: "ayesha.dmc@gmail.com",
          college: "ভিকারুননিসা নূন স্কুল অ্যান্ড কলেজ",
          hscBatch: "HSC-25",
          target: "মেডিকেল (DMC)",
          role: "student",
          isPro: false,
          isBanned: false,
          gamification: { currentXP: 850, currentStreak: 3 },
          stats: { totalSolvedMCQ: 80, accuracyRate: 85 },
          createdAt: { seconds: Date.now() / 1000 - 86400 * 2 },
        },
        {
          id: "u_demo_3",
          name: "রাকিবুল ইসলাম",
          email: "rakib.chemchamp@gmail.com",
          college: "ঢাকা কলেজ",
          hscBatch: "HSC-26",
          target: "ঢাবি ক ইউনিট",
          role: "moderator",
          isPro: true,
          isBanned: false,
          gamification: { currentXP: 2300, currentStreak: 14 },
          stats: { totalSolvedMCQ: 320, accuracyRate: 94 },
          createdAt: { seconds: Date.now() / 1000 - 86400 * 15 },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Toggle PRO Status
  const handleTogglePro = async (userObj) => {
    soundService.playClick();
    const newPro = !userObj.isPro;
    // Optimistic UI
    setUsers((prev) =>
      prev.map((u) => (u.id === userObj.id ? { ...u, isPro: newPro } : u))
    );
    showNotification(`${userObj.name || userObj.email}-এর PRO স্ট্যাটাস ${newPro ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে!`);

    try {
      await updateDoc(doc(db, "users", userObj.id), {
        isPro: newPro,
        proUpdatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Could not update PRO status:", err);
    }
  };

  // 3. Change Role (student / moderator / admin)
  const handleChangeRole = async (userId, newRole) => {
    soundService.playClick();
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    showNotification(`ব্যবহারকারীর রোল পরিবর্তন করে "${newRole}" করা হয়েছে!`);

    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole,
        roleUpdatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Could not update role:", err);
    }
  };

  // 4. Toggle Ban/Suspend
  const handleToggleBan = async (userObj) => {
    soundService.playClick();
    const newBanned = !userObj.isBanned;
    const confirmText = newBanned
      ? `আপনি কি নিশ্চিত যে ${userObj.name || userObj.email}-কে সাময়িক ব্যান করতে চান?`
      : `আপনি কি ${userObj.name || userObj.email}-এর ব্যান প্রত্যাহার করতে চান?`;

    if (!window.confirm(confirmText)) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === userObj.id ? { ...u, isBanned: newBanned } : u))
    );
    showNotification(`শিক্ষার্থী ${newBanned ? "ব্যান" : "আন-ব্যান"} করা হয়েছে!`);

    try {
      await updateDoc(doc(db, "users", userObj.id), {
        isBanned: newBanned,
        bannedAt: newBanned ? serverTimestamp() : null,
      });
    } catch (err) {
      console.warn("Could not update ban status:", err);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.college && u.college.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q));

      const matchBatch =
        batchFilter === "all" ||
        (u.hscBatch && u.hscBatch.toLowerCase() === batchFilter.toLowerCase());

      const matchPro =
        proFilter === "all" ||
        (proFilter === "pro" ? Boolean(u.isPro) : !u.isPro);

      const matchRole =
        roleFilter === "all" || (u.role || "student") === roleFilter;

      return matchSearch && matchBatch && matchPro && matchRole;
    });
  }, [users, searchQuery, batchFilter, proFilter, roleFilter]);

  // Aggregate Stats
  const totalStudents = users.length;
  const proStudents = users.filter((u) => u.isPro).length;
  const bannedCount = users.filter((u) => u.isBanned).length;

  return (
    <div className="space-y-6">
      {/* ১. পেজ হেডার ও ওভারভিউ স্ট্যাটস */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white flex items-center gap-2">
                শিক্ষার্থী ও ইউজার ম্যানেজমেন্ট (CRM)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {totalStudents} জন শিক্ষার্থী
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                শিক্ষার্থীদের স্টাডি অগ্রগতি, সাবস্ক্রিপশন স্ট্যাটাস ও অ্যাডমিন রোল কন্ট্রোল
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>রিলোড ডেটা</span>
        </button>
      </div>

      {/* অ্যাকশন নোটিফিকেশন ব্যানার */}
      {actionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* স্ট্যাটস কার্ডস */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">মোট নিবন্ধিত</span>
            <span className="text-lg font-black text-white font-mono">{totalStudents}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">PRO সাবস্ক্রাইবার</span>
            <span className="text-lg font-black text-amber-400 font-mono">{proStudents} জন</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">ফ্রি স্টুডেন্ট</span>
            <span className="text-lg font-black text-blue-400 font-mono">
              {totalStudents - proStudents} জন
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">স্থগিত/ব্যানড ইউজার</span>
            <span className="text-lg font-black text-rose-400 font-mono">{bannedCount} জন</span>
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
            placeholder="নাম, ইমেইল, কলেজ বা UID দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* ফিল্টার কন্ট্রোলস */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* ব্যাচ ফিল্টার */}
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">সকল ব্যাচ</option>
            <option value="HSC-25">HSC-25</option>
            <option value="HSC-26">HSC-26</option>
          </select>

          {/* PRO স্ট্যাটাস ফিল্টার */}
          <select
            value={proFilter}
            onChange={(e) => setProFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">সকল সদস্যপদ</option>
            <option value="pro">⭐ কেবল PRO সদস্য</option>
            <option value="free">ফ্রি ব্যবহারকারী</option>
          </select>

          {/* রোল ফিল্টার */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="all">সকল রোল</option>
            <option value="student">Student</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* ৩. শিক্ষার্থী তালিকা টেবিল */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">শিক্ষার্থী</th>
                <th className="py-3 px-4">কলেজ ও ব্যাচ</th>
                <th className="py-3 px-4">টার্গেট</th>
                <th className="py-3 px-4">অগ্রগতি (XP / Streak)</th>
                <th className="py-3 px-4">PRO স্ট্যাটাস</th>
                <th className="py-3 px-4">রোল</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    কোনো শিক্ষার্থী পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserBanned = Boolean(u.isBanned);
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-850 transition-colors ${
                        isUserBanned ? "bg-rose-950/20 opacity-70" : ""
                      }`}
                    >
                      {/* নাম ও ইমেইল */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-teal-500 text-slate-950 font-black flex items-center justify-center shrink-0 uppercase text-xs shadow-sm">
                            {u.name ? u.name.charAt(0) : "S"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-white truncate">
                              <span>{u.name || "নামহীন শিক্ষার্থী"}</span>
                              {u.isPro && (
                                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                              )}
                              {isUserBanned && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  ব্যানড
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 truncate block">
                              {u.email || "No email"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* কলেজ ও ব্যাচ */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="text-slate-300 font-medium block truncate max-w-[180px]">
                            {u.college || "কলেজ যুক্ত নেই"}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                            {u.hscBatch || "HSC-25"}
                          </span>
                        </div>
                      </td>

                      {/* টার্গেট */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {u.target || "সাধারণ এইচএসসি"}
                        </span>
                      </td>

                      {/* প্রগ্রেস */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-bold flex items-center gap-0.5">
                            <Zap className="w-3 h-3" />
                            {u.gamification?.currentXP || 0} XP
                          </span>
                          <span className="text-rose-400 font-bold flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />
                            {u.gamification?.currentStreak || 0} দিন
                          </span>
                        </div>
                      </td>

                      {/* PRO Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleTogglePro(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                            u.isPro
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                              : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>{u.isPro ? "PRO Active" : "Free User"}</span>
                        </button>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role || "student"}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="student">Student</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* অ্যাকশন বাটন */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* ব্যুরো/ডিটেইলস বাটন */}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="বিস্তারিত প্রোফাইল দেখুন"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* ব্যান বা আন-ব্যান বাটন */}
                          <button
                            type="button"
                            onClick={() => handleToggleBan(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isUserBanned
                                ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            }`}
                            title={isUserBanned ? "ব্যান প্রত্যাহার করুন" : "সাসপেন্ড বা ব্যান করুন"}
                          >
                            {isUserBanned ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
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

      {/* ৪. ইউজার ডিটেইলস মডাল */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm">
                  {selectedUser.name ? selectedUser.name.charAt(0) : "U"}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    {selectedUser.name || "নামহীন শিক্ষার্থী"}
                    {selectedUser.isPro && (
                      <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    )}
                  </h3>
                  <span className="text-xs text-slate-400">{selectedUser.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* ইনফো গ্রিড */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 block mb-1">শিক্ষা প্রতিষ্ঠান</span>
                <span className="text-white font-bold">{selectedUser.college || "অনুল্লেখিত"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 block mb-1">ব্যাচ ও টার্গেট</span>
                <span className="text-white font-bold">
                  {selectedUser.hscBatch || "HSC-25"} • {selectedUser.target || "HSC"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 block mb-1">মোট অর্জিত XP</span>
                <span className="text-amber-400 font-bold font-mono">
                  +{selectedUser.gamification?.currentXP || 0} XP
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 block mb-1">চলতি স্ট্রিক</span>
                <span className="text-rose-400 font-bold font-mono">
                  🔥 {selectedUser.gamification?.currentStreak || 0} দিন
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 block mb-1">সমাধানকৃত MCQ</span>
                <span className="text-teal-300 font-bold font-mono">
                  {selectedUser.stats?.totalSolvedMCQ || 0} টি
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-500 block mb-1">গড় নির্ভুলতা</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {selectedUser.stats?.accuracyRate || 0}%
                </span>
              </div>
            </div>

            {/* UID ও সিস্টেম মেটা */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-500 space-y-1">
              <div>UID: {selectedUser.id}</div>
              <div>রোল: {selectedUser.role || "student"}</div>
              <div>
                স্ট্যাটাস:{" "}
                <span className={selectedUser.isBanned ? "text-rose-400" : "text-emerald-400"}>
                  {selectedUser.isBanned ? "সাসপেন্ডেড" : "অ্যাক্টিভ"}
                </span>
              </div>
            </div>

            {/* ক্লোজ বাটন */}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

