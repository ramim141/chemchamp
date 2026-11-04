import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, ShieldCheck, AlertCircle, Loader2, GraduationCap, Lock, Mail, User } from "lucide-react";

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("student"); // "student" | "admin"
  const [isSignUp, setIsSignUp] = useState(false); // শুধুমাত্র স্টুডেন্টের জন্য

  // ফর্ম স্টেট
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // অটো-রিডাইরেকশন লজিক
  useEffect(() => {
    if (user && profile) {
      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (!profile.onboardingCompleted) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, profile, navigate]);

  // গুগল লগইন হ্যান্ডলার
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    const res = await loginWithGoogle();
    if (!res?.success) {
      setErrorMessage(res?.message || "গুগল লগইন ব্যর্থ হয়েছে।");
    }
    setIsSubmitting(false);
  };

  // ইমেইল/পাসওয়ার্ড ফর্ম সাবমিশন
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("দয়া করে ইমেইল ও পাসওয়ার্ড প্রদান করুন।");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    if (activeTab === "student" && isSignUp) {
      if (!name.trim()) {
        setErrorMessage("দয়া করে আপনার নাম লিখুন।");
        setIsSubmitting(false);
        return;
      }
      const res = await signupWithEmail(name, email, password);
      if (!res.success) setErrorMessage(res.message);
    } else {
      const res = await loginWithEmail(email, password);
      if (!res.success) setErrorMessage(res.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-500/10 blur-[140px] pointer-events-none -z-10" />

      {/* ব্যাক বাটন */}
      <div className="w-full max-w-sm mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>হোম পেজে ফিরে যান</span>
        </Link>
      </div>

      <div className="max-w-sm w-full bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* লোগো ও ব্র্যান্ড */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-slate-950 text-2xl mx-auto mb-2 shadow-lg shadow-emerald-500/20">
            🧪
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">ChemChamp</h1>
          <p className="text-xs text-slate-400 mt-0.5">স্মার্ট এইচএসসি ও এডমিশন কেমিস্ট্রি প্ল্যাটফর্ম</p>
        </div>

        {/* পোর্টাল সিলেকশন ট্যাব (Student vs Admin) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("student");
              setErrorMessage("");
              setIsSignUp(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "student"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>শিক্ষার্থী পোর্টাল</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setErrorMessage("");
              setIsSignUp(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === "admin"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>অ্যাডমিন স্টুডিও</span>
          </button>
        </div>

        {/* গুগল SSO বাটন */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting || loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-60 text-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>
              {activeTab === "admin" ? "অ্যাডমিন গুগল একাউন্ট দিয়ে প্রবেশ" : "Continue with Google"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] text-slate-500 uppercase font-mono">অথবা ইমেইল দিয়ে</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* এরর মেসেজ অ্যালার্ট */}
        {errorMessage && (
          <div className="p-2.5 mb-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        {/* ফর্ম */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {activeTab === "student" && isSignUp && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">আপনার নাম</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="পূর্ণ নাম লিখুন"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">ইমেইল ঠিকানা</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTab === "admin" ? "admin@chemchamp.app" : "name@example.com"}
                className={`w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none ${
                  activeTab === "admin" ? "focus:border-amber-500" : "focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">পাসওয়ার্ড</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none ${
                  activeTab === "admin" ? "focus:border-amber-500" : "focus:border-emerald-500"
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 ${
              activeTab === "admin"
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : activeTab === "admin" ? (
              <span>অ্যাডমিন স্টুডিওতে প্রবেশ 🔒</span>
            ) : isSignUp ? (
              <span>রেজিস্ট্রেশন সম্পন্ন করুন 🚀</span>
            ) : (
              <span>শিক্ষার্থী লগইন 🚀</span>
            )}
          </button>
        </form>

        {/* শিক্ষার্থী হলে সাইন-ইন / সাইন-আপ টগল */}
        {activeTab === "student" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage("");
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? "পূর্বেই একাউন্ট আছে? লগইন করুন" : "নতুন শিক্ষার্থী? একাউন্ট তৈরি করুন"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}