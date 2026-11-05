import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, GraduationCap, Flame, Trophy, User } from "lucide-react";
import { soundService } from "../../services/soundService";

export default function BottomNav() {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 8; // Minimum scroll delta in px to trigger hide/show

  // 1. Always reveal bottom nav on tab / route navigation
  useEffect(() => {
    setVisible(true);
    lastScrollY.current = window.scrollY;
  }, [location.pathname]);

  // 2. Hide on scroll down, show on scroll up (High-Performance 60/120fps RAF Listener)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY.current;

          // Always visible at the very top of the page
          if (currentScrollY < 50) {
            setVisible(true);
          } else if (diff > scrollThreshold && currentScrollY > 70) {
            // Scrolling down -> hide smoothly
            setVisible(false);
          } else if (diff < -scrollThreshold) {
            // Scrolling up -> reveal smoothly
            setVisible(true);
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { to: "/dashboard", label: "হোম", icon: Home },
    { to: "/study", label: "স্টাডি", icon: BookOpen },
    { to: "/exams", label: "এক্সাম", icon: GraduationCap },
    { to: "/vault", label: "ভল্ট", icon: Flame },
    { to: "/leaderboard", label: "লিডারবোর্ড", icon: Trophy },
    { to: "/profile", label: "প্রোফাইল", icon: User },
  ];

  return (
    <div
      className={`bottom-nav-container md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] pt-1 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-24 opacity-0 pointer-events-none"
      }`}
    >
      <nav className="max-w-md mx-auto pointer-events-auto bg-slate-950/85 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 shadow-[0_-10px_35px_rgba(0,0,0,0.9),0_0_20px_rgba(16,185,129,0.08)] grid grid-cols-6 items-center ring-1 ring-white/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => soundService.playClick()}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 relative active:scale-[0.86] select-none ${
                  isActive
                    ? "text-emerald-300 font-black"
                    : "text-slate-400 hover:text-slate-200 font-medium"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? "bg-gradient-to-tr from-emerald-500/25 to-teal-500/20 text-emerald-300 shadow-md shadow-emerald-500/25 ring-1 ring-emerald-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                        isActive ? "stroke-[2.5] scale-110" : "stroke-[1.8]"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[9.5px] mt-0.5 tracking-tight truncate max-w-full transition-colors duration-200 ${
                      isActive ? "text-emerald-300 font-extrabold" : "text-slate-400 font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
