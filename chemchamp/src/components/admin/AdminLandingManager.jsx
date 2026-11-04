import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Sliders,
  Layers,
  Target,
  FlaskConical,
  MessageSquareQuote,
  HelpCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Clock,
  BookMarked,
  Calculator,
  ShieldCheck,
  Atom,
  Flame,
  Award,
  Zap,
} from "lucide-react";
import {
  landingConfigService,
  DEFAULT_LANDING_CONFIG,
  DEFAULT_SECTION_TOGGLES,
  DEFAULT_FEATURES,
  DEFAULT_TRACKS,
  DEFAULT_DEMO_CONFIG,
  DEFAULT_TESTIMONIALS,
  DEFAULT_FAQS,
} from "../../services/landingConfigService";
import { soundService } from "../../services/soundService";

const AVAILABLE_ICONS = [
  "Clock",
  "Layers",
  "AlertCircle",
  "BookMarked",
  "Calculator",
  "Zap",
  "Sparkles",
  "ShieldCheck",
  "Swords",
  "WifiOff",
  "Atom",
  "Flame",
  "Target",
  "FileSpreadsheet",
  "GraduationCap",
  "Award",
];

const ACCENT_COLORS = [
  { label: "অ্যাম্বার টু অরেঞ্জ", value: "from-amber-500 to-orange-400" },
  { label: "এমারেল্ড টু টিল", value: "from-emerald-500 to-teal-400" },
  { label: "সায়ান টু ব্লু", value: "from-cyan-500 to-blue-400" },
  { label: "পার্পল টু ইন্ডিগো", value: "from-purple-500 to-indigo-400" },
  { label: "রোজ টু পিংক", value: "from-rose-500 to-pink-400" },
];

export default function AdminLandingManager() {
  const [config, setConfig] = useState(() => landingConfigService.getLocalConfig());
  const [activeTab, setActiveTab] = useState("toggles"); // toggles | features | tracks | demo | testimonials | faqs
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Edit modals / inline states
  const [editingFeature, setEditingFeature] = useState(null);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);

  useEffect(() => {
    landingConfigService.getConfig().then((data) => {
      setConfig(data);
      setLoading(false);
    });

    const unsub = landingConfigService.subscribe((updated) => {
      setConfig(updated);
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleSaveConfig = (newConfigData, showNotification = true) => {
    // ১. তাৎক্ষণিক (০ মিলিসেকেন্ড) অপটিমিস্টিক স্টেট আপডেট — কোনো নেটওয়ার্ক ল্যাগ বা অপেক্ষা ছাড়া
    setConfig(newConfigData);
    try {
      soundService.playClick();
    } catch {
      // ignore
    }

    // ২. লোকাল স্টোরেজে সিনক্রোনাস ব্যাকআপ
    try {
      localStorage.setItem("chemchamp_landing_config_cache", JSON.stringify(newConfigData));
    } catch (e) {
      console.warn("Could not write cache:", e);
    }

    // ৩. ব্যাকগ্রাউন্ডে নন-ব্লকিং ক্লাউড সিঙ্ক
    setSaving(true);
    landingConfigService
      .saveConfig(newConfigData)
      .then((res) => {
        if (showNotification) {
          if (res?._syncWarning) {
            showToast("হোম পেজের সেটিংস সেভ হয়েছে! (লোকাল ক্যাশে সক্রিয় ✓)");
          } else {
            showToast("হোম পেজের সেটিংস সফলভাবে সেভ হয়েছে! ✓");
          }
        }
      })
      .catch((err) => {
        console.warn("Save config warning:", err);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Section Toggles Handler
  const handleToggleSection = (sectionKey) => {
    const currentToggles = config.sectionToggles || DEFAULT_SECTION_TOGGLES;
    const updatedToggles = {
      ...currentToggles,
      [sectionKey]: !currentToggles[sectionKey],
    };
    handleSaveConfig({
      ...config,
      sectionToggles: updatedToggles,
    });
  };

  // Reset to Defaults with confirmation
  const handleResetDefaults = () => {
    if (window.confirm("আপনি কি নিশ্চিতভাবে হোম পেজের সমস্ত কনটেন্ট ও টগল ফ্যাক্টরি ডিফল্টে রিসেট করতে চান?")) {
      handleSaveConfig(DEFAULT_LANDING_CONFIG);
      showToast("হোম পেজ সফলভাবে ডিফল্ট সেটিংসে রিসেট হয়েছে!");
    }
  };

  /* ------------------- Features Management ------------------- */
  const handleSaveFeature = (featureData) => {
    const currentList = [...(config.features || DEFAULT_FEATURES)];
    const existingIndex = currentList.findIndex((f) => f.id === featureData.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = featureData;
    } else {
      currentList.push({
        ...featureData,
        id: featureData.id || `feat_${Date.now()}`,
      });
    }

    handleSaveConfig({ ...config, features: currentList });
    setEditingFeature(null);
  };

  const handleDeleteFeature = (id) => {
    if (window.confirm("এই ফিচার কার্ডটি মুছে ফেলতে চান?")) {
      const filtered = (config.features || []).filter((f) => f.id !== id);
      handleSaveConfig({ ...config, features: filtered });
    }
  };

  const handleToggleFeature = (id) => {
    const updated = (config.features || []).map((f) =>
      f.id === id ? { ...f, enabled: f.enabled === false ? true : false } : f
    );
    handleSaveConfig({ ...config, features: updated });
  };

  /* ------------------- Tracks Management ------------------- */
  const handleSaveTrack = (trackData) => {
    const currentList = [...(config.tracks || DEFAULT_TRACKS)];
    const existingIndex = currentList.findIndex((t) => t.id === trackData.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = trackData;
    } else {
      currentList.push({
        ...trackData,
        id: trackData.id || `track_${Date.now()}`,
      });
    }

    handleSaveConfig({ ...config, tracks: currentList });
    setEditingTrack(null);
  };

  const handleDeleteTrack = (id) => {
    if (window.confirm("এই টার্গেট ট্র্যাকটি মুছে ফেলতে চান?")) {
      const filtered = (config.tracks || []).filter((t) => t.id !== id);
      handleSaveConfig({ ...config, tracks: filtered });
    }
  };

  const handleToggleTrack = (id) => {
    const updated = (config.tracks || []).map((t) =>
      t.id === id ? { ...t, enabled: t.enabled === false ? true : false } : t
    );
    handleSaveConfig({ ...config, tracks: updated });
  };

  /* ------------------- Interactive Demo Tool Toggles ------------------- */
  const handleToggleDemoTool = (toolKey) => {
    const currentTools = config.demoConfig?.toolsEnabled || DEFAULT_DEMO_CONFIG.toolsEnabled;
    const updatedDemo = {
      ...config.demoConfig,
      toolsEnabled: {
        ...currentTools,
        [toolKey]: !currentTools[toolKey],
      },
    };
    handleSaveConfig({ ...config, demoConfig: updatedDemo });
  };

  const handleUpdateDemoTitles = (title, subtitle) => {
    const updatedDemo = {
      ...config.demoConfig,
      title,
      subtitle,
    };
    handleSaveConfig({ ...config, demoConfig: updatedDemo });
  };

  /* ------------------- Testimonials Management ------------------- */
  const handleSaveTestimonial = (testiData) => {
    const currentList = [...(config.testimonials || DEFAULT_TESTIMONIALS)];
    const existingIndex = currentList.findIndex((t) => t.id === testiData.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = testiData;
    } else {
      currentList.push({
        ...testiData,
        id: testiData.id || `testi_${Date.now()}`,
      });
    }

    handleSaveConfig({ ...config, testimonials: currentList });
    setEditingTestimonial(null);
  };

  const handleDeleteTestimonial = (id) => {
    if (window.confirm("এই শিক্ষার্থীর রিভিউটি মুছে ফেলতে চান?")) {
      const filtered = (config.testimonials || []).filter((t) => t.id !== id);
      handleSaveConfig({ ...config, testimonials: filtered });
    }
  };

  const handleToggleTestimonial = (id) => {
    const updated = (config.testimonials || []).map((t) =>
      t.id === id ? { ...t, enabled: t.enabled === false ? true : false } : t
    );
    handleSaveConfig({ ...config, testimonials: updated });
  };

  /* ------------------- FAQs Management ------------------- */
  const handleSaveFaq = (faqData) => {
    const currentList = [...(config.faqs || DEFAULT_FAQS)];
    const existingIndex = currentList.findIndex((f) => f.id === faqData.id);

    if (existingIndex >= 0) {
      currentList[existingIndex] = faqData;
    } else {
      currentList.push({
        ...faqData,
        id: faqData.id || `faq_${Date.now()}`,
      });
    }

    handleSaveConfig({ ...config, faqs: currentList });
    setEditingFaq(null);
  };

  const handleDeleteFaq = (id) => {
    if (window.confirm("এই প্রশ্নোত্তরটি মুছে ফেলতে চান?")) {
      const filtered = (config.faqs || []).filter((f) => f.id !== id);
      handleSaveConfig({ ...config, faqs: filtered });
    }
  };

  const handleToggleFaq = (id) => {
    const updated = (config.faqs || []).map((f) =>
      f.id === id ? { ...f, enabled: f.enabled === false ? true : false } : f
    );
    handleSaveConfig({ ...config, faqs: updated });
  };

  const toggles = config.sectionToggles || DEFAULT_SECTION_TOGGLES;
  const demoTools = config.demoConfig?.toolsEnabled || DEFAULT_DEMO_CONFIG.toolsEnabled;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm animate-in fade-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white">হোম পেজ ও ল্যান্ডিং কন্ট্রোল স্টুডিও</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              হোম পেজের কোর ফিচার, টার্গেট ট্র্যাক, লাইভ ল্যাব টুলস এবং প্রশ্নোত্তর সরাসরি নিয়ন্ত্রণ করুন।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span>হোম পেজ দেখুন</span>
          </a>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="ফ্যাক্টরি ডিফল্টে ফিরিয়ে নিন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Module Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-bold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("toggles")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "toggles"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>সেকশন টগলস ({Object.values(toggles).filter(Boolean).length}/6)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("features")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "features"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>কোর ফিচারসমূহ ({config.features?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tracks")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "tracks"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>টার্গেট ট্র্যাকস ({config.tracks?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("demo")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "demo"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>হ্যান্ডস-অন লাইভ ল্যাব (৪টি টুল)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("testimonials")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "testimonials"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>শিক্ষার্থীদের অভিজ্ঞতা {!toggles.showTestimonials && "(বন্ধ)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("faqs")}
          className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "faqs"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>সাধারণ জিজ্ঞাসা ({config.faqs?.length || 0})</span>
        </button>
      </div>

      {/* ----------------- TAB 1: SECTION TOGGLES ----------------- */}
      {activeTab === "toggles" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-1">হোম পেজের সেকশন অন / অফ কন্ট্রোল</h3>
            <p className="text-xs text-slate-400">
              যেকোনো সেকশন টগল অফ করলে তা সাথে সাথে হোম পেজ এবং মোবাইল অ্যাকশন বার থেকে অদৃশ্য হয়ে যাবে।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "showFeatures",
                title: "কোর ফিচার ও পাওয়ার টুলস",
                desc: "২০ মিনিট অ্যান্টি-চিট, জৈব ফ্লিপকার্ড, লেইটনার বক্স, দাগানো বই ও নন-ক্যালকুলেটর ম্যাথ হ্যাকস।",
                icon: Layers,
                color: "text-emerald-400 bg-emerald-500/10",
              },
              {
                key: "showTracks",
                title: "টার্গেট ভিত্তিক প্রস্তুতি",
                desc: "বুয়েট ইঞ্জিনিয়ারিং, মেডিকেল, ঢাবি 'ক' এবং এইচএসসি বোর্ড প্রস্তুতি ট্র্যাক।",
                icon: Target,
                color: "text-cyan-400 bg-cyan-500/10",
              },
              {
                key: "showDemo",
                title: "হ্যান্ডস-অন লাইভ ল্যাব",
                desc: "লগইন ছাড়াই রিঅ্যাকশন ফ্লিপ, ব্যতিক্রমী মৌল, pH সলভার ও বোর মডেল সিমুলেটর পরখ করার ইন্টারঅ্যাক্টিভ ল্যাব।",
                icon: FlaskConical,
                color: "text-teal-400 bg-teal-500/10",
              },
              {
                key: "showSyllabus",
                title: "পূর্ণাঙ্গ সিলেবাস ও রোডম্যাপ",
                desc: "রসায়ন ১ম পত্র ও ২য় পত্রের অধ্যায়ভিত্তিক গুরুত্ব, ওয়েইটেজ ও টপিক লিস্ট।",
                icon: BookMarked,
                color: "text-purple-400 bg-purple-500/10",
              },
              {
                key: "showTestimonials",
                title: "শিক্ষার্থীদের অভিজ্ঞতা (Testimonials)",
                desc: "নটর ডেম, ভিকারুননিসা ও বুয়েট/মেডিকেল টপারদের রিভিউ ও সফলতার গল্প। (বর্তমানে ডিফল্ট বন্ধ রাখা হয়েছে)",
                icon: MessageSquareQuote,
                color: "text-amber-400 bg-amber-500/10",
                note: !toggles.showTestimonials ? "বর্তমানে নিষ্ক্রিয় (অফ)" : "সক্রিয় (অন)",
              },
              {
                key: "showFAQ",
                title: "সাধারণ জিজ্ঞাসা (FAQ)",
                desc: "শিক্ষার্থীদের সচরাচর করা প্রশ্ন ও বিস্তারিত উত্তর।",
                icon: HelpCircle,
                color: "text-blue-400 bg-blue-500/10",
              },
            ].map((sec) => {
              const isEnabled = Boolean(toggles[sec.key]);
              const SecIcon = sec.icon;

              return (
                <div
                  key={sec.key}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isEnabled
                      ? "bg-slate-900 border-slate-700/80 shadow-md"
                      : "bg-slate-950/70 border-slate-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${sec.color} shrink-0 mt-0.5`}>
                      <SecIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{sec.title}</h4>
                        {sec.note && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                              isEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {sec.note}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sec.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSection(sec.key)}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ease-in-out relative cursor-pointer shrink-0 mt-1 focus:outline-none ${
                      isEnabled
                        ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 ease-in-out ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: FEATURES CRUD ----------------- */}
      {activeTab === "features" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">কোর ফিচার ও পাওয়ার টুলস কাস্টমাইজেশন</h3>
              <p className="text-xs text-slate-400">
                হোম পেজের বেন্টো গ্রিডে দেখানো ফিচারসমূহ এডিট, অন/অফ বা নতুন ফিচার যুক্ত করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingFeature({
                  id: `feat_${Date.now()}`,
                  title: "",
                  description: "",
                  badge: "নতুন ফিচার",
                  badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  icon: "Sparkles",
                  isLarge: false,
                  enabled: true,
                })
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ফিচার যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(config.features || DEFAULT_FEATURES).map((f) => {
              const isEnabled = f.enabled !== false;
              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isEnabled ? "bg-slate-900 border-slate-800" : "bg-slate-950/60 border-slate-800/60 opacity-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                          {f.icon || "Sparkles"}
                        </span>
                        <h4 className="text-sm font-bold text-white">{f.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {f.badge || "ব্যাজ"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{f.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                        isEnabled
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isEnabled ? "সক্রিয়" : "লুকানো"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingFeature({ ...f })}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        title="এডিট করুন"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(f.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feature Edit / Create Modal */}
      {editingFeature && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">ফিচার কার্ড এডিটর</h3>
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">ফিচার শিরোনাম</label>
                <input
                  type="text"
                  value={editingFeature.title}
                  onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                  placeholder="যেমন: ২০ মিনিট অ্যান্টি-চিট ফোকাস হাব"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">বিস্তারিত বিবরণ</label>
                <textarea
                  rows={3}
                  value={editingFeature.description}
                  onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                  placeholder="ফিচারটির মূল উপযোগিতা সংক্ষেপে লিখুন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">টপ ব্যাজ টেক্সট</label>
                  <input
                    type="text"
                    value={editingFeature.badge || ""}
                    onChange={(e) => setEditingFeature({ ...editingFeature, badge: e.target.value })}
                    placeholder="যেমন: Anti-Cheat Lock"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">আইকন</label>
                  <select
                    value={editingFeature.icon || "Sparkles"}
                    onChange={(e) => setEditingFeature({ ...editingFeature, icon: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {AVAILABLE_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingFeature.isLarge)}
                    onChange={(e) => setEditingFeature({ ...editingFeature, isLarge: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>বড় কার্ড ভিউ (২-কলাম স্প্যান)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingFeature.enabled !== false}
                    onChange={(e) => setEditingFeature({ ...editingFeature, enabled: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>সক্রিয় রাখুন (হোম পেজে দেখান)</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFeature(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveFeature(editingFeature)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: TARGET TRACKS CRUD ----------------- */}
      {activeTab === "tracks" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">টার্গেট ভিত্তিক প্রস্তুতি প্যাকেজ</h3>
              <p className="text-xs text-slate-400">
                বুয়েট, মেডিকেল, ঢাবি 'ক' বা বোর্ড প্যাকেজের কনটেন্ট, হাইলাইট ও চেকলিস্ট পরিচালনা করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingTrack({
                  id: `track_${Date.now()}`,
                  title: "",
                  subtitle: "",
                  badge: "স্পেশাল",
                  accentColor: "from-emerald-500 to-teal-400",
                  highlight: "৯০%+ সফলতা নিশ্চিত করার উপায়",
                  features: ["বিগত বছরের প্রশ্ন সমাধান", "অধ্যায়ভিত্তিক মডেল টেস্ট"],
                  enabled: true,
                })
              }
              className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ট্র্যাক যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {(config.tracks || DEFAULT_TRACKS).map((t) => {
              const isEnabled = t.enabled !== false;
              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isEnabled ? "bg-slate-900 border-slate-800" : "bg-slate-950/60 border-slate-800/60 opacity-50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${
                          t.accentColor || "from-emerald-500 to-teal-400"
                        } flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shrink-0`}
                      >
                        {t.title?.[0] || "ট্রা"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{t.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{t.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleToggleTrack(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                          isEnabled
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isEnabled ? "সক্রিয়" : "লুকানো"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingTrack({ ...t })}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(t.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights & Features List Preview */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs space-y-2">
                    {t.highlight && (
                      <span className="text-amber-400 font-bold block flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> {t.highlight}
                      </span>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 text-[11px]">
                      {Array.isArray(t.features) &&
                        t.features.map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track Edit / Create Modal */}
      {editingTrack && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">টার্গেট ট্র্যাক এডিটর</h3>
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">ট্র্যাকের নাম / শিরোনাম</label>
                <input
                  type="text"
                  value={editingTrack.title}
                  onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                  placeholder="যেমন: ইঞ্জিনিয়ারিং রসায়ন"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">সাবটাইটেল / লক্ষ্য প্রতিষ্ঠান</label>
                <input
                  type="text"
                  value={editingTrack.subtitle}
                  onChange={(e) => setEditingTrack({ ...editingTrack, subtitle: e.target.value })}
                  placeholder="যেমন: BUET, CKREUT, MIST ও আইআইটি স্ট্যান্ডার্ড"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ব্যাজ টেক্সট</label>
                  <input
                    type="text"
                    value={editingTrack.badge || ""}
                    onChange={(e) => setEditingTrack({ ...editingTrack, badge: e.target.value })}
                    placeholder="যেমন: কনসেপচুয়াল ও রিটেন"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">কালার থিম</label>
                  <select
                    value={editingTrack.accentColor || ACCENT_COLORS[0].value}
                    onChange={(e) => setEditingTrack({ ...editingTrack, accentColor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {ACCENT_COLORS.map((col) => (
                      <option key={col.value} value={col.value}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">গোল্ডেন স্ট্র্যাটেজি / হাইলাইট</label>
                <input
                  type="text"
                  value={editingTrack.highlight || ""}
                  onChange={(e) => setEditingTrack({ ...editingTrack, highlight: e.target.value })}
                  placeholder="যেমন: বুয়েটে কেমিস্ট্রিতে ৬০-এ ৫০+ নিশ্চিত করার স্ট্র্যাটেজি"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  চেকলিস্ট ফিচারসমূহ (প্রতি লাইনে একটি করে)
                </label>
                <textarea
                  rows={4}
                  value={Array.isArray(editingTrack.features) ? editingTrack.features.join("\n") : ""}
                  onChange={(e) =>
                    setEditingTrack({
                      ...editingTrack,
                      features: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="বিগত ২০ বছরের প্রশ্ন সমাধান&#10;জৈব রসায়নের মাল্টি-স্টেপ মেকানিজম..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingTrack.enabled !== false}
                  onChange={(e) => setEditingTrack({ ...editingTrack, enabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500"
                />
                <span>সক্রিয় রাখুন (হোম পেজে দেখান)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveTrack(editingTrack)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: INTERACTIVE DEMO MULTI-TOOLS ----------------- */}
      {activeTab === "demo" && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white">হ্যান্ডস-অন লাইভ ল্যাব টুল কন্ট্রোল</h3>
              <p className="text-xs text-slate-400">
                হোম পেজে ৪টি শক্তিশালী লাইভ টুল রয়েছে। আপনি চাইলে যেকোনো টুল অন বা অফ রাখতে পারেন।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">ল্যাব সেকশন শিরোনাম</label>
                <input
                  type="text"
                  value={config.demoConfig?.title || "হ্যান্ডস-অন লাইভ ল্যাব"}
                  onChange={(e) =>
                    handleUpdateDemoTitles(e.target.value, config.demoConfig?.subtitle || "")
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">সাবটাইটেল</label>
                <input
                  type="text"
                  value={config.demoConfig?.subtitle || "প্ল্যাটফর্মের মূল পাওয়ার ফিচারগুলো এখনই ট্রাই করো"}
                  onChange={(e) =>
                    handleUpdateDemoTitles(config.demoConfig?.title || "", e.target.value)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* 4 Interactive Tools Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "bufferSimulator",
                title: "১. বাফার দ্রবণ ও হ্যান্ডারসন-হ্যাসেলবালখ সিমুলেটর",
                desc: "অ্যাসিড ও লবণের অনুপাত স্লাইডার, pH নির্ণয় এবং সবল অ্যাসিড/ক্ষার যোগে লাইভ বাফার রেজিস্ট্যান্স ও পানির সাথে তুলনা।",
                icon: FlaskConical,
                color: "text-emerald-400 bg-emerald-500/10",
              },
              {
                key: "nernstVoltageLab",
                title: "২. গ্যালভানিক কোষ ও নার্নস্ট সমীকরণ লাইভ ভোল্টমিটার",
                desc: "ড্যানিয়েল সেল ও বিভিন্ন তড়িৎদ্বারে অ্যানোড-ক্যাথোড আয়ন ঘনমাত্রা পরিবর্তন, ই-সেল ভোল্টেজ ও স্বতঃস্ফূর্ততা ক্যালকুলেটর।",
                icon: Zap,
                color: "text-amber-400 bg-amber-500/10",
              },
              {
                key: "precipitationPredictor",
                title: "৩. দ্রাব্যতা ও আয়নিক গুণফল (Ksp vs Qsp) অধঃক্ষেপণ প্রেডিক্টর",
                desc: "পাত্র ১ ও পাত্র ২ মিশ্রণের পর দ্রাব্যতা গুণফল (Ksp) ও আয়ন গুণফল (Qsp) তুলনা করে পাত্রে তলানি পড়বে কি না পূর্বাভাস।",
                icon: Calculator,
                color: "text-teal-400 bg-teal-500/10",
              },
              {
                key: "organicSynthesisPathway",
                title: "৪. জৈব রসায়ন মাল্টি-স্টেপ সংশ্লেষণ রোডম্যাপ",
                desc: "টলুইন থেকে টিএনটি, বেনজিন থেকে অ্যাসপিরিন ও ৩° অ্যালকোহল তৈরির স্টেপ-বাই-স্টেপ বিক্রিয়া, বিকারক ও মেকানিজম নোট।",
                icon: Layers,
                color: "text-cyan-400 bg-cyan-500/10",
              },
            ].map((tool) => {
              const isEnabled = Boolean(demoTools[tool.key]);
              const ToolIcon = tool.icon;

              return (
                <div
                  key={tool.key}
                  className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    isEnabled ? "bg-slate-900 border-slate-700/80 shadow-md" : "bg-slate-950/60 border-slate-800 opacity-55"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${tool.color} shrink-0 mt-0.5`}>
                      <ToolIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{tool.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tool.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleDemoTool(tool.key)}
                    className={`w-12 h-6 rounded-full transition-all duration-200 ease-in-out relative cursor-pointer shrink-0 mt-1 focus:outline-none ${
                      isEnabled
                        ? "bg-teal-500 shadow-md shadow-teal-500/30"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 ease-in-out ${
                        isEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- TAB 5: TESTIMONIALS CRUD & MASTER TOGGLE ----------------- */}
      {activeTab === "testimonials" && (
        <div className="space-y-4">
          {/* Master Toggle Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">শিক্ষার্থীদের অভিজ্ঞতা সেকশন টগল</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                  {toggles.showTestimonials ? "অন (সক্রিয়)" : "অফ (লুকানো)"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                আপনার নির্দেশনা অনুযায়ী এই সেকশনটি বর্তমানে অফ করে রাখা হয়েছে। প্রয়োজন হলে এখান থেকেই অন করতে পারবেন।
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-300 hidden sm:inline">
                {toggles.showTestimonials ? "সেকশন সক্রিয়" : "সেকশন নিষ্ক্রিয়"}
              </span>
              <button
                type="button"
                onClick={() => handleToggleSection("showTestimonials")}
                className={`w-14 h-7 rounded-full transition-all duration-200 ease-in-out relative cursor-pointer shrink-0 focus:outline-none ${
                  toggles.showTestimonials
                    ? "bg-amber-500 shadow-lg shadow-amber-500/30"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-slate-950 shadow-md transform transition-transform duration-200 ease-in-out mt-1 ${
                    toggles.showTestimonials ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">রিভিউ ও সফলতার গল্প ম্যানেজমেন্ট</h3>
            <button
              type="button"
              onClick={() =>
                setEditingTestimonial({
                  id: `testi_${Date.now()}`,
                  name: "",
                  college: "",
                  target: "",
                  quote: "",
                  rating: 5,
                  avatar: "চ্যা",
                  enabled: true,
                })
              }
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন রিভিউ যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(config.testimonials || DEFAULT_TESTIMONIALS).map((t) => {
              const isEnabled = t.enabled !== false;
              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isEnabled ? "bg-slate-900 border-slate-800" : "bg-slate-950/60 border-slate-800/60 opacity-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                          {t.avatar || t.name?.[0] || "চ্যা"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{t.name}</h4>
                          <span className="text-[10px] text-slate-400 block">{t.college}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {t.target}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 italic leading-relaxed mb-3">"{t.quote}"</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleTestimonial(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                        isEnabled ? "bg-amber-500/15 text-amber-300" : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isEnabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isEnabled ? "সক্রিয়" : "লুকানো"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTestimonial({ ...t })}
                        className="p-1.5 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(t.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Testimonial Edit / Create Modal */}
      {editingTestimonial && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">শিক্ষার্থীর রিভিউ এডিটর</h3>
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">শিক্ষার্থীর নাম</label>
                <input
                  type="text"
                  value={editingTestimonial.name}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">কলেজ / প্রতিষ্ঠান</label>
                  <input
                    type="text"
                    value={editingTestimonial.college || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, college: e.target.value })}
                    placeholder="যেমন: নটর ডেম কলেজ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">অর্জন / টার্গেট</label>
                  <input
                    type="text"
                    value={editingTestimonial.target || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, target: e.target.value })}
                    placeholder="যেমন: বুয়েট '২৪ (EEE)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">শিক্ষার্থীর মন্তব্য / রিভিউ</label>
                <textarea
                  rows={3}
                  value={editingTestimonial.quote}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })}
                  placeholder="ChemChamp নিয়ে শিক্ষার্থীর অভিজ্ঞতা..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingTestimonial.enabled !== false}
                  onChange={(e) => setEditingTestimonial({ ...editingTestimonial, enabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500"
                />
                <span>সক্রিয় রাখুন (হোম পেজে দেখান)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTestimonial(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveTestimonial(editingTestimonial)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 6: FAQS CRUD ----------------- */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">সাধারণ জিজ্ঞাসা (FAQ) ম্যানেজমেন্ট</h3>
              <p className="text-xs text-slate-400">
                হোম পেজের প্রশ্নোত্তর সেকশনে নতুন প্রশ্ন যোগ, এডিট, অন/অফ বা ডিলিট করুন।
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingFaq({
                  id: `faq_${Date.now()}`,
                  q: "",
                  a: "",
                  category: "general",
                  enabled: true,
                })
              }
              className="px-3.5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্রশ্ন যোগ করুন</span>
            </button>
          </div>

          <div className="space-y-3">
            {(config.faqs || DEFAULT_FAQS).map((f) => {
              const isEnabled = f.enabled !== false;
              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isEnabled ? "bg-slate-900 border-slate-800" : "bg-slate-950/60 border-slate-800/60 opacity-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>{f.q}</span>
                    </h4>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFaq(f.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isEnabled ? "bg-teal-500/20 text-teal-300" : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {isEnabled ? "সক্রিয়" : "লুকানো"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingFaq({ ...f })}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(f.id)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 pl-6 leading-relaxed">{f.a}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ Edit / Create Modal */}
      {editingFaq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">প্রশ্নোত্তর এডিটর</h3>
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">প্রশ্ন</label>
                <input
                  type="text"
                  value={editingFaq.q}
                  onChange={(e) => setEditingFaq({ ...editingFaq, q: e.target.value })}
                  placeholder="যেমন: ChemChamp কি শিক্ষার্থীদের জন্য ফ্রি?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">বিস্তারিত উত্তর</label>
                <textarea
                  rows={4}
                  value={editingFaq.a}
                  onChange={(e) => setEditingFaq({ ...editingFaq, a: e.target.value })}
                  placeholder="প্রশ্নের সুস্পষ্ট উত্তর লিখুন..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingFaq.enabled !== false}
                  onChange={(e) => setEditingFaq({ ...editingFaq, enabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-teal-500"
                />
                <span>সক্রিয় রাখুন (হোম পেজে দেখান)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveFaq(editingFaq)}
                className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

