import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, ArrowRight, Home, Layers, Play, BookOpen, Target, ChevronRight } from "lucide-react";
import Seo from "../components/common/Seo";
import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import FeaturesGrid from "../components/landing/FeaturesGrid";
import TargetTracksSection from "../components/landing/TargetTracksSection";
import InteractiveDemoSection from "../components/landing/InteractiveDemoSection";
import SyllabusSection from "../components/landing/SyllabusSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import FAQSection from "../components/landing/FAQSection";
import CTASection from "../components/landing/CTASection";
import LandingFooter from "../components/landing/LandingFooter";
import { ScrollReveal } from "../components/common/MotionScroll";
import { landingConfigService } from "../services/landingConfigService";

export default function Landing() {
  const { user, profile, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Real-time synchronization with Admin Panel
  const [landingConfig, setLandingConfig] = useState(() => landingConfigService.getLocalConfig());

  useEffect(() => {
    // 1-Hour cached fetch (Zero persistent onSnapshot listeners for anonymous traffic)
    landingConfigService.getConfig().then((cfg) => {
      if (cfg) setLandingConfig(cfg);
    });
  }, []);

  const handleRegisterAction = async () => {
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

  const toggles = landingConfig.sectionToggles || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300 pb-20 md:pb-0 relative">
      <Seo
        path="/"
        title="ChemChamp | HSC ও মেডিকেল-ইঞ্জিনিয়ারিং কেমিস্ট্রি লার্নিং প্ল্যাটফর্ম"
        description="ChemChamp - HSC ও এডমিশন কেমিস্ট্রি প্রস্তুতির জন্য বাংলাদেশের প্রথম পূর্ণাঙ্গ স্মার্ট লার্নিং প্ল্যাটফর্ম। অধ্যায়ভিত্তিক সিলেবাস, রিয়েল ওএমআর মক টেস্ট, বস ফাইট ও কেমিস্ট্রি ভল্ট।"
      />
      <LandingNavbar toggles={toggles} />
      <main>
        <HeroSection />

        {/* 1. কোর ফিচার ও পাওয়ার টুলস (Admin Controlled) */}
        {toggles.showFeatures !== false && (
          <ScrollReveal delay={0.06}>
            <FeaturesGrid features={landingConfig.features} />
          </ScrollReveal>
        )}

        {/* 2. টার্গেট ভিত্তিক প্রস্তুতি (Admin Controlled CRUD) */}
        {toggles.showTracks !== false && (
          <ScrollReveal delay={0.08}>
            <TargetTracksSection tracks={landingConfig.tracks} />
          </ScrollReveal>
        )}

        {/* 3. হ্যান্ডস-অন লাইভ ল্যাব (Admin Controlled 4 Multi-Tools) */}
        {toggles.showDemo !== false && (
          <ScrollReveal delay={0.08}>
            <InteractiveDemoSection
              demoConfig={landingConfig.demoConfig}
              onRegisterClick={handleRegisterAction}
            />
          </ScrollReveal>
        )}

        {/* 4. পূর্ণাঙ্গ সিলেবাস রোডম্যাপ */}
        {toggles.showSyllabus !== false && (
          <ScrollReveal delay={0.08}>
            <SyllabusSection />
          </ScrollReveal>
        )}

        {/* 5. শিক্ষার্থীদের অভিজ্ঞতা (Admin Controlled - Default OFF as requested) */}
        {Boolean(toggles.showTestimonials) && (
          <ScrollReveal delay={0.08}>
            <TestimonialsSection testimonials={landingConfig.testimonials} />
          </ScrollReveal>
        )}

        {/* 6. সাধারণ জিজ্ঞাসা (Admin Controlled CRUD) */}
        {toggles.showFAQ !== false && (
          <ScrollReveal delay={0.08}>
            <FAQSection faqs={landingConfig.faqs} />
          </ScrollReveal>
        )}

        {/* প্রি-ফুটার কনভার্সন কল-টু-অ্যাকশন */}
        <ScrollReveal delay={0.08}>
          <CTASection onStartClick={handleRegisterAction} user={user} />
        </ScrollReveal>
      </main>

      <LandingFooter />

      {/* Mobile App Floating Bottom Action Dock */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-2 shadow-2xl shadow-black/90 flex items-center justify-between gap-2">
          {/* Quick Anchor Jumps */}
          <div className="flex items-center gap-1 pl-1">
            {toggles.showFeatures !== false && (
              <a
                href="#features"
                title="ফিচারসমূহ"
                className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 active:bg-slate-800/80 transition-all"
              >
                <Layers className="w-4 h-4" />
              </a>
            )}
            {toggles.showTracks !== false && (
              <a
                href="#tracks"
                title="টার্গেট ট্র্যাক"
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 active:bg-slate-800/80 transition-all"
              >
                <Target className="w-4 h-4" />
              </a>
            )}
            {toggles.showDemo !== false && (
              <a
                href="#demo"
                title="লাইভ ডেমো"
                className="p-2 rounded-xl text-slate-400 hover:text-teal-400 active:bg-slate-800/80 transition-all"
              >
                <Play className="w-4 h-4" />
              </a>
            )}
            {toggles.showSyllabus !== false && (
              <a
                href="#syllabus"
                title="সিলেবাস"
                className="p-2 rounded-xl text-slate-400 hover:text-amber-400 active:bg-slate-800/80 transition-all"
              >
                <BookOpen className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Primary Mobile App Action CTA */}
          <button
            onClick={handleRegisterAction}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{user ? "ড্যাশবোর্ডে যান" : "শুরু করুন (ফ্রি)"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
