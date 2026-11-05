import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, X, Sparkles, ChevronRight, LogIn } from "lucide-react";

export default function LandingNavbar({ toggles = {} }) {
  const { user, profile, loginWithGoogle } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = async () => {
    if (user) {
      if (profile?.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } else {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.error("Login failed:", err);
      }
    }
  };

  const navLinks = [
    { name: "কেমিস্ট্রি পাঠ", href: "/chemistry", isRouterLink: true },
    toggles.showFeatures !== false && { name: "ফিচারসমূহ", href: "#features" },
    toggles.showTracks !== false && { name: "টার্গেট ট্র্যাক", href: "#tracks" },
    toggles.showDemo !== false && { name: "লাইভ ডেমো", href: "#demo" },
    toggles.showSyllabus !== false && { name: "সিলেবাস", href: "#syllabus" },
    Boolean(toggles.showTestimonials) && { name: "সাফল্যের গল্প", href: "#testimonials" },
    toggles.showFAQ !== false && { name: "প্রশ্নোত্তর", href: "#faq" },
  ].filter(Boolean);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all pt-2 sm:pt-3 px-3 sm:px-6">
      <div className="max-w-6xl mx-auto bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-xl shadow-black/40">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base sm:text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            🧪
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                ChemChamp
              </span>
              <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-1 font-medium hidden sm:block">
              HSC & Admission Platform
            </span>
          </div>
        </Link>

        {/* Desktop Links (Smart SaaS layout) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {navLinks.map((link) =>
            link.isRouterLink ? (
              <Link
                key={link.name}
                to={link.href}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60 px-3.5 py-1.5 rounded-lg transition-all"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="text-xs font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 px-3.5 py-1.5 rounded-lg transition-all"
              >
                {link.name}
              </a>
            )
          )}
        </div>

        {/* Right CTA / Auth Button */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={handleAction}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold py-2 px-4 rounded-lg shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>ড্যাশবোর্ডে প্রবেশ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleAction}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold py-2 px-4 rounded-lg shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন / শুরু করুন</span>
            </button>
          )}
        </div>

        {/* Mobile quick action + drawer toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={handleAction}
            className="text-[11px] font-bold bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-lg shadow-sm shadow-emerald-500/20 flex items-center gap-1 active:scale-95"
          >
            <span>{user ? "ড্যাশবোর্ড" : "শুরু করুন"}</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 active:scale-95"
            aria-label="মেনু"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 bg-slate-900/95 border border-slate-800/90 rounded-xl p-3.5 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navLinks.map((link) =>
              link.isRouterLink ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs font-semibold text-emerald-400 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-xs font-medium text-slate-300 hover:text-emerald-400 py-2 px-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-emerald-500/30 transition-all"
                >
                  {link.name}
                </a>
              )
            )}
          </div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleAction();
            }}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-slate-950 font-bold py-2 rounded-lg text-xs shadow-md shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{user ? "ড্যাশবোর্ডে প্রবেশ করুন" : "গুগল দিয়ে শুরু করুন (১০০% ফ্রি)"}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
