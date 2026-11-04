import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const SETTINGS_COLLECTION = "system_settings";
const SETTINGS_DOC = "landing_config";
const LOCAL_STORAGE_KEY = "chemchamp_landing_config_cache";

export const DEFAULT_SECTION_TOGGLES = {
  showFeatures: true,
  showTracks: true,
  showDemo: true,
  showTestimonials: false, // Default is disabled (Coming Soon/On Demand) as requested by user
  showFAQ: true,
  showSyllabus: true,
};

export const DEFAULT_FEATURES = [
  {
    id: "focus_hub",
    title: "২০ মিনিট অ্যান্টি-চিট ফোকাস হাব",
    description: "পড়ার সময়ে ফেসবুক, মেসেঞ্জার বা অন্য ট্যাবে চলে গেলে স্বয়ংক্রিয়ভাবে টাইমার পজ হয়ে যাবে এবং স্ক্রিনে সতর্কবার্তা আসবে।",
    badge: "Anti-Cheat Lock",
    badgeBg: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    icon: "Clock",
    isLarge: true,
    enabled: true,
  },
  {
    id: "organic_flipcards",
    title: "জৈব রসায়ন সোয়াইপ ফ্লিপকার্ড",
    description: "বিক্রিয়ক ও প্রভাবক দেখে উৎপাদ ও মেকানিজম মনে রাখার ৫০+ ইন্টারঅ্যাক্টিভ ফ্লিপকার্ড।",
    badge: "Organic Vault",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "Layers",
    isLarge: false,
    enabled: true,
  },
  {
    id: "leitner_repetition",
    title: "Leitner স্পেসড রিপিটেশন",
    description: "ভুল হওয়া প্রশ্নগুলো ১, ৩, ৭ ও ২১ দিন পর পর স্বয়ংক্রিয়ভাবে সামনে আসবে স্থায়ী মেমোরির জন্য।",
    badge: "Mistake Box",
    badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    icon: "AlertCircle",
    isLarge: false,
    enabled: true,
  },
  {
    id: "textbook_highlights",
    title: "শীর্ষ শিক্ষকদের দাগানো বই",
    description: "হাজারী ও নাগ, সঞ্জিত কুমার গুহ এবং ড. মহসিন স্যারের পাঠ্যবইয়ের পরীক্ষায় আসা লাইন ও ব্যতিক্রমসমূহ।",
    badge: "Textbook Highlights",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    icon: "BookMarked",
    isLarge: false,
    enabled: true,
  },
  {
    id: "non_calc_math",
    title: "নন-ক্যালকুলেটর ম্যাথ হ্যাকস",
    description: "ঢাবি ও গুচ্ছ ভর্তি পরীক্ষায় ক্যালকুলেটর ছাড়া দ্রুত লগ, পিএইচ ও মোলারিটি হিসাবের শর্টকাট।",
    badge: "Admission Edge",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    icon: "Calculator",
    isLarge: false,
    enabled: true,
  },
];

export const DEFAULT_TRACKS = [
  {
    id: "engineering",
    title: "ইঞ্জিনিয়ারিং রসায়ন",
    subtitle: "BUET, CKREUT, MIST ও আইআইটি স্ট্যান্ডার্ড",
    badge: "কনসেপচুয়াল ও রিটেন",
    accentColor: "from-amber-500 to-orange-400",
    borderGlow: "border-amber-500/30 hover:border-amber-500/60",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    features: [
      "বিগত ২০ বছরের বুয়েট প্রিলিমিনারি ও লিখিত (Written) প্রশ্ন সমাধান",
      "জৈব রসায়নের মাল্টি-স্টেপ সংশ্লেষণ ও কনভার্সন মেকানিজম",
      "থার্মোডাইনামিক্স, বাফার ও তড়িৎ রসায়নের অ্যাডভান্সড ম্যাথ",
      "টাইমার-বেজড স্পিড ও অ্যাকুরেসি বুস্টার প্র্যাকটিস",
    ],
    highlight: "বুয়েটে কেমিস্ট্রিতে ৬০-এ ৫০+ নিশ্চিত করার স্ট্র্যাটেজি",
    enabled: true,
  },
  {
    id: "medical",
    title: "মেডিকেল রসায়ন",
    subtitle: "DMC ও সরকারি মেডিকেল কলেজ ভর্তি স্পেশাল",
    badge: "দাগানো বই ও লাইন টু লাইন",
    accentColor: "from-emerald-500 to-teal-400",
    borderGlow: "border-emerald-500/30 hover:border-emerald-500/60",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    features: [
      "হাজারী ও নাগ, সঞ্জিত গুহ এবং ড. মহসিন স্যারের দাগানো লাইন",
      "পাঠ্যবইয়ের প্রতিটি ছক, ব্যবহার ও ব্যতিক্রম কনসেপ্ট এক নজরে",
      "০.২৫ নেগেটিভ মার্কিংসহ মেডিকেল স্ট্যান্ডার্ড টাইমার মক টেস্ট",
      "Leitner স্পেসড রিপিটেশন দিয়ে ইনফো মনে রাখার স্থায়ী উপায়",
    ],
    highlight: "মেডিকেলে রসায়নের ২৫-এ ২৪+ পাওয়ার নির্ভুল প্রস্তুতি",
    enabled: true,
  },
  {
    id: "varsity",
    title: "ভার্সিটি 'ক' ও গুচ্ছ",
    subtitle: "ঢাকা বিশ্ববিদ্যালয় (DU A-Unit), RU, JU ও GST",
    badge: "ক্যালকুলেটরবিহীন শর্টকাট",
    accentColor: "from-cyan-500 to-blue-400",
    borderGlow: "border-cyan-500/30 hover:border-cyan-500/60",
    badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    features: [
      "ক্যালকুলেটর ছাড়া দ্রুত pH, log, দ্রাব্যতা ও মোলারিটি হিসাবের ট্রিকস",
      "ঢাবির বিগত ২০ বছরের ট্রিকি ও কনসেপচুয়াল MCQ সমাধান",
      "শর্টকাট ফর্মুলা ভল্ট ও অপশন এলিমিনেশন টেকনিক",
      "টাইম ম্যানেজমেন্ট ও স্পিড অ্যাকুরেসি ড্রিল",
    ],
    highlight: "ঢাবিতে রসায়নের পূর্ণ নম্বর অর্জনের টেকনিক",
    enabled: true,
  },
  {
    id: "board",
    title: "HSC বোর্ড পরীক্ষা ফোকাস",
    subtitle: "এইচএসসি '২৬ ও '২৭ ব্যাচ (বিজ্ঞান বিভাগ)",
    badge: "CQ + MCQ ফুল সিলেবাস",
    accentColor: "from-purple-500 to-indigo-400",
    borderGlow: "border-purple-500/30 hover:border-purple-500/60",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    features: [
      "সকল শিক্ষা বোর্ডের বিগত ৫ বছরের CQ সৃজনশীল আদর্শ উত্তর",
      "অধ্যায়ভিত্তিক সিলেবাস রোডম্যাপ ও টপিক টেস্ট",
      "জ্ঞান ও অনুধাবনমূলক (ক ও খ) প্রশ্নের এক্সক্লুসিভ শিট",
      "বোর্ড পরীক্ষায় A+ নিশ্চিত করার টপিক গাইডেন্স",
    ],
    highlight: "রসায়ন ১ম ও ২য় পত্রে জিপিএ ৫.০০ এর সহজ প্রস্তুতি",
    enabled: true,
  },
];

export const DEFAULT_DEMO_CONFIG = {
  title: "হ্যান্ডস-অন লাইভ ল্যাব",
  subtitle: "এইচএসসি ও ভর্তি পরীক্ষার সবচেয়ে গুরুত্বপূর্ণ গাণিতিক ও কনসেপচুয়াল পাওয়ার সিমুলেটর",
  toolsEnabled: {
    bufferSimulator: true,
    nernstVoltageLab: true,
    precipitationPredictor: true,
    organicSynthesisPathway: true,
  },
};

export const DEFAULT_TESTIMONIALS = [
  {
    id: "t1",
    name: "তানভীর হাসান",
    college: "নটর ডেম কলেজ",
    target: "বুয়েট '২৪ (EEE)",
    quote: "জৈব রসায়নের কনভার্সন আর উর্টজ বিক্রিয়া নিয়ে সারাক্ষণ আতঙ্কে ভুগতাম। ChemChamp এর সোয়াইপ ফ্লিপকার্ড আর রিটেন প্র্যাকটিস আমার ভয় দূর করে দিয়েছে।",
    rating: 5,
    avatar: "ত",
    enabled: true,
  },
  {
    id: "t2",
    name: "নুসরাত জাহান",
    college: "ভিকারুননিসা নূন কলেজ",
    target: "ডিএমসি '২৪ (K-81)",
    quote: "মেডিকেলের জন্য হাজারী স্যারের বইয়ের তথ্যগুলো মনে রাখা কঠিন ছিল। এখানে দাগানো বইয়ের লাইন আর মিস্টেক বক্সের Leitner সিস্টেমের কারণে বারবার রিভিশন দেওয়া গেছে।",
    rating: 5,
    avatar: "ন",
    enabled: true,
  },
  {
    id: "t3",
    name: "রাকিবুল ইসলাম",
    college: "রাজশাহী কলেজ",
    target: "ঢাকা বিশ্ববিদ্যালয় '২৪ (ফলিত রসায়ন)",
    quote: "ঢাবির ভর্তি পরীক্ষায় ক্যালকুলেটর থাকে না। ChemChamp-এর নন-ক্যালকুলেটর pH ও log হিসাবের শর্টকাটগুলো পরীক্ষায় অনেক সময় বাঁচিয়ে দিয়েছিল।",
    rating: 5,
    avatar: "র",
    enabled: true,
  },
  {
    id: "t4",
    name: "মাহতাব উদ্দিন",
    college: "রাজউক উত্তরা মডেল কলেজ",
    target: "HSC '২৫ (GPA 5.00)",
    quote: "২০ মিনিটের অ্যান্টি-চিট ফোকাস মোড সত্যিই কার্যকরী! পড়ার সময় ফেসবুক মেসেঞ্জারে চলে গেলে টাইমার থেমে যেত, ফলে মনোযোগ দিয়ে পড়ার দারুণ অভ্যাস তৈরি হয়েছে।",
    rating: 5,
    avatar: "ম",
    enabled: true,
  },
];

export const DEFAULT_FAQS = [
  {
    id: "f1",
    q: "ChemChamp কি শিক্ষার্থীদের জন্য ফ্রি?",
    a: "হ্যাঁ, ChemChamp সম্পূর্ণ সার্ভারলেস ও লাইটওয়েট প্রযুক্তিতে নির্মিত। এর মূল ফিচারসমূহ শিক্ষার্থীদের সেলফ-স্টাডির জন্য সম্পূর্ণ ফ্রি।",
    category: "general",
    enabled: true,
  },
  {
    id: "f2",
    q: "অফলাইনে বা দুর্বল ইন্টারনেটে কি প্র্যাকটিস করা যাবে?",
    a: "অবশ্যই! আমাদের ক্যাশ-ফার্স্ট আর্কিটেকচার এবং IndexedDB লোকাল স্টোরেজের কারণে চ্যাপ্টার ও কুইজগুলো একবার লোড হলে ইন্টারনেট কানেকশন ছাড়াও পড়া ও প্র্যাকটিস করা যায়।",
    category: "general",
    enabled: true,
  },
  {
    id: "f3",
    q: "অ্যান্টি-চিট ২০ মিনিট ফোকাস মোড কীভাবে কাজ করে?",
    a: "পড়ার সময় কোনো শিক্ষার্থী অন্য ট্যাবে চলে গেলে বা ব্রাউজার মিনিমাইজ করলে Page Visibility API সেটি ডিটেক্ট করে টাইমার পজ করে দেয় এবং স্ক্রিনে ওয়ার্নিং দেখায়, যাতে পড়াশোনায় পূর্ণ মনোযোগ থাকে।",
    category: "features",
    enabled: true,
  },
  {
    id: "f4",
    q: "Leitner Spaced Repetition মিস্টেক বক্সের সুবিধা কী?",
    a: "মক টেস্টে আপনি যে প্রশ্নগুলো ভুল করবেন, সেগুলো স্বয়ংক্রিয়ভাবে আলাদা হয়ে ১ দিন, ৩ দিন, ৭ দিন এবং ২১ দিন পর পর আপনার সামনে রিভিশনের জন্য আসবে। এতে পরীক্ষার হলে একই ভুল দ্বিতীয়বার হবে না।",
    category: "features",
    enabled: true,
  },
  {
    id: "f5",
    q: "কোন কোন পাঠ্যবইয়ের কনসেপ্ট এখানে কাভার করা হয়েছে?",
    a: "এনসিটিবি অনুমোদিত শীর্ষ তিনটি বই—হাজারী ও নাগ, সঞ্জিত কুমার গুহ এবং ড. মহসিন স্যারের বইয়ের গুরুত্বপূর্ণ লাইন ও ব্যতিক্রমী কনসেপ্টগুলো এখানে সমন্বয় করা হয়েছে।",
    category: "curriculum",
    enabled: true,
  },
];

export const DEFAULT_LANDING_CONFIG = {
  sectionToggles: DEFAULT_SECTION_TOGGLES,
  features: DEFAULT_FEATURES,
  tracks: DEFAULT_TRACKS,
  demoConfig: DEFAULT_DEMO_CONFIG,
  testimonials: DEFAULT_TESTIMONIALS,
  faqs: DEFAULT_FAQS,
  updatedAt: new Date().toISOString(),
};

export const landingConfigService = {
  getLocalConfig() {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...DEFAULT_LANDING_CONFIG,
          ...parsed,
          sectionToggles: { ...DEFAULT_SECTION_TOGGLES, ...(parsed.sectionToggles || {}) },
          demoConfig: {
            ...DEFAULT_DEMO_CONFIG,
            ...(parsed.demoConfig || {}),
            toolsEnabled: { ...DEFAULT_DEMO_CONFIG.toolsEnabled, ...(parsed.demoConfig?.toolsEnabled || {}) },
          },
          features: Array.isArray(parsed.features) && parsed.features.length > 0 ? parsed.features : DEFAULT_FEATURES,
          tracks: Array.isArray(parsed.tracks) && parsed.tracks.length > 0 ? parsed.tracks : DEFAULT_TRACKS,
          testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : DEFAULT_TESTIMONIALS,
          faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : DEFAULT_FAQS,
        };
      }
    } catch (e) {
      console.warn("Could not read local landing config:", e);
    }
    return DEFAULT_LANDING_CONFIG;
  },

  async getConfig() {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remoteData = snap.data();
        const merged = {
          ...DEFAULT_LANDING_CONFIG,
          ...remoteData,
          sectionToggles: { ...DEFAULT_SECTION_TOGGLES, ...(remoteData.sectionToggles || {}) },
          demoConfig: {
            ...DEFAULT_DEMO_CONFIG,
            ...(remoteData.demoConfig || {}),
            toolsEnabled: { ...DEFAULT_DEMO_CONFIG.toolsEnabled, ...(remoteData.demoConfig?.toolsEnabled || {}) },
          },
          features: Array.isArray(remoteData.features) && remoteData.features.length > 0 ? remoteData.features : DEFAULT_FEATURES,
          tracks: Array.isArray(remoteData.tracks) && remoteData.tracks.length > 0 ? remoteData.tracks : DEFAULT_TRACKS,
          testimonials: Array.isArray(remoteData.testimonials) && remoteData.testimonials.length > 0 ? remoteData.testimonials : DEFAULT_TESTIMONIALS,
          faqs: Array.isArray(remoteData.faqs) && remoteData.faqs.length > 0 ? remoteData.faqs : DEFAULT_FAQS,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      } else {
        // Initialize doc in Firestore
        await setDoc(docRef, DEFAULT_LANDING_CONFIG, { merge: true });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_LANDING_CONFIG));
        return DEFAULT_LANDING_CONFIG;
      }
    } catch (err) {
      console.warn("Could not fetch remote landing config, falling back to cached/default:", err);
      return this.getLocalConfig();
    }
  },

  async saveConfig(updatedData) {
    const current = this.getLocalConfig();
    const nextConfig = {
      ...current,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };

    // Always persist to LocalStorage first so changes are immediately active across the app
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextConfig));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
      await setDoc(docRef, nextConfig, { merge: true });
      return { ...nextConfig, _syncedRemote: true };
    } catch (err) {
      console.warn("Could not sync landing config to Firestore (saved locally):", err?.message || err);
      return { ...nextConfig, _syncedRemote: false, _syncWarning: err?.message };
    }
  },

  subscribe(callback) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const remoteData = snap.data();
            const merged = {
              ...DEFAULT_LANDING_CONFIG,
              ...remoteData,
              sectionToggles: { ...DEFAULT_SECTION_TOGGLES, ...(remoteData.sectionToggles || {}) },
              demoConfig: {
                ...DEFAULT_DEMO_CONFIG,
                ...(remoteData.demoConfig || {}),
                toolsEnabled: { ...DEFAULT_DEMO_CONFIG.toolsEnabled, ...(remoteData.demoConfig?.toolsEnabled || {}) },
              },
              features: Array.isArray(remoteData.features) && remoteData.features.length > 0 ? remoteData.features : DEFAULT_FEATURES,
              tracks: Array.isArray(remoteData.tracks) && remoteData.tracks.length > 0 ? remoteData.tracks : DEFAULT_TRACKS,
              testimonials: Array.isArray(remoteData.testimonials) && remoteData.testimonials.length > 0 ? remoteData.testimonials : DEFAULT_TESTIMONIALS,
              faqs: Array.isArray(remoteData.faqs) && remoteData.faqs.length > 0 ? remoteData.faqs : DEFAULT_FAQS,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            callback(merged);
          } else {
            callback(this.getLocalConfig());
          }
        },
        (err) => {
          console.warn("Landing config snapshot error, using local fallback:", err);
          callback(this.getLocalConfig());
        }
      );
    } catch (err) {
      console.warn("Failed to subscribe to landing config:", err);
      callback(this.getLocalConfig());
      return () => {};
    }
  },
};

