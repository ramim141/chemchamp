import React, { useState, useRef } from "react";
import {
  HelpCircle,
  Camera,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Flame,
  FileImage,
  Send,
} from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { uploadToImgBB } from "../../utils/imgbb";
import { soundService } from "../../services/soundService";

const CHAPTER_OPTIONS = [
  "গুণগত রসায়ন (১ম পত্র)",
  "মৌলের পর্যায়বৃত্ত ধর্ম ও রাসায়নিক বন্ধন (১ম পত্র)",
  "রাসায়নিক পরিবর্তন ও বাফার (১ম পত্র)",
  "পরিবেশ রসায়ন ও গ্যাস সূত্র (১ম পত্র)",
  "জৈব রসায়ন ও নামীয় বিক্রিয়া (২য় পত্র)",
  "পরিমাণগত রসায়ন ও টাইট্রেশন (২য় পত্র)",
  "তড়িৎ রসায়ন ও নের্নস্ট সূত্র (২য় পত্র)",
  "অর্থনৈতিক রসায়ন (২য় পত্র)",
  "অন্যান্য বা সাধারণ কনফিউশন",
];

export default function FloatingDoubtButton() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [chapter, setChapter] = useState(CHAPTER_OPTIONS[0]);
  const [doubtText, setDoubtText] = useState("");
  const [urgency, setUrgency] = useState("normal"); // normal | urgent
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef(null);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Sync FAB position with smart scroll hide/show of bottom nav
  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY.current;
          if (currentScrollY < 50) {
            setNavVisible(true);
          } else if (diff > 8 && currentScrollY > 70) {
            setNavVisible(false);
          } else if (diff < -8) {
            setNavVisible(true);
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

  // Listen for global custom event to open modal from anywhere
  React.useEffect(() => {
    const handleCustomOpen = () => {
      handleOpen();
    };
    window.addEventListener("open-doubt-modal", handleCustomOpen);
    return () => window.removeEventListener("open-doubt-modal", handleCustomOpen);
  }, []);

  const handleOpen = () => {
    soundService.playClick();
    setSubmittedSuccess(false);
    setErrorMessage("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("ফাইলের সাইজ সর্বোচ্চ ৫MB হতে পারবে।");
      return;
    }

    setErrorMessage("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doubtText.trim() && !selectedFile) {
      setErrorMessage("দয়া করে প্রশ্নের বিবরণ লিখুন অথবা খাতার ছবি যুক্ত করুন।");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      let imageUrl = "";

      if (selectedFile) {
        try {
          imageUrl = await uploadToImgBB(selectedFile);
        } catch (imgbbErr) {
          console.warn("ImgBB upload failed, falling back to base64 preview:", imgbbErr);
          // Fallback to data URL if ImgBB API key is missing or fails
          imageUrl = await readFileAsDataUrl(selectedFile);
        }
      }

      const doubtPayload = {
        studentUid: user?.uid || "anonymous",
        studentName: user?.displayName || profile?.displayName || profile?.name || "কেমিস্ট্রি শিক্ষার্থী",
        studentEmail: user?.email || "",
        studentCollege: profile?.college || "ChemChamp শিক্ষার্থী",
        chapterName: chapter,
        queryText: doubtText.trim(),
        imageUrl: imageUrl || null,
        urgency: urgency,
        status: "pending",
        teacherReply: "",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "doubtBox"), doubtPayload);

      soundService.playCorrect();
      setSubmittedSuccess(true);
      setDoubtText("");
      handleClearFile();

      // Auto close after 2.5 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmittedSuccess(false);
      }, 2500);
    } catch (err) {
      console.error("Doubt submission error:", err);
      setErrorMessage("ডাউট জমা দিতে সমস্যা হয়েছে। আপনার ইন্টারনেট কানেকশন চেক করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div
        className={`floating-doubt-container fixed ${
          navVisible ? "bottom-20" : "bottom-5"
        } md:bottom-7 right-4 sm:right-6 z-40 group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}
      >
        <button
          type="button"
          onClick={handleOpen}
          title="স্যারের কাছে ডাউট বক্স 🧪"
          className="flex items-center gap-2 px-3.5 py-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all border border-emerald-300/40 relative"
        >
          {/* Pulsing indicator */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-950" />

          <HelpCircle className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          <span className="text-xs tracking-tight hidden sm:inline">ডাউট জিজ্ঞাসা</span>
          <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-full font-mono">
            ১-ক্লিক
          </span>
        </button>
      </div>

      {/* Popup Form Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative my-6 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      স্যারের কাছে ওয়ান-ক্লিক ডাউট বক্স
                    </h3>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      ২৪ ঘণ্টা সাপোর্ট
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    খাতার ম্যাথ বা বিক্রিয়ার ছবি তুলে সরাসরি আপলোড করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success State */}
            {submittedSuccess ? (
              <div className="p-8 text-center space-y-3 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8 fill-emerald-500/20" />
                </div>
                <h4 className="text-base font-bold text-white">
                  আপনার ডাউট সফলভাবে জমা হয়েছে! 🎉
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  স্যার প্রশ্নটি রিভিউ করে প্রোফাইলের ডাউট সেকশনে সমাধান বা ভয়েস নোট পাঠিয়ে দেবেন।
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Chapter Selection */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                    টপিক বা অধ্যায় নির্বাচন করুন *
                  </label>
                  <select
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {CHAPTER_OPTIONS.map((ch, idx) => (
                      <option key={idx} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Description */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                    প্রশ্নের বিবরণ ও কনফিউশন *
                  </label>
                  <textarea
                    rows={3}
                    value={doubtText}
                    onChange={(e) => setDoubtText(e.target.value)}
                    placeholder="যেমন: এই বিক্রিয়ায় মেকানিজম বা বাফার দ্রবণের এই ম্যাথে কোন সূত্রে মান বসালে উত্তর মিলবে? বিস্তারিত লিখুন..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Photo Upload with Camera / File selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1.5">
                    খাতার ছবি বা স্ক্রিনশট (ঐচ্ছিক কিন্তু বাঞ্ছনীয়)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 p-2 group">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 w-full object-contain rounded-lg bg-black/40"
                      />
                      <button
                        type="button"
                        onClick={handleClearFile}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-500/90 text-white hover:bg-rose-600 transition-colors shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
                        <span className="truncate">{selectedFile?.name}</span>
                        <span className="text-emerald-400 font-bold">ছবি সংযুক্ত হয়েছে ✓</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 rounded-xl p-4 text-center cursor-pointer transition-all hover:bg-slate-950 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto mb-2 transition-colors">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        খাতার ছবি তুলুন অথবা গ্যালারি থেকে সিলেক্ট করুন
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        PNG, JPG, WebP (সর্বোচ্চ ৫ MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Urgency Selector */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    প্রায়োরিটি:
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUrgency("normal")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                        urgency === "normal"
                          ? "bg-slate-800 text-white border-slate-700"
                          : "bg-slate-950 text-slate-400 border-slate-850"
                      }`}
                    >
                      সাধারণ
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency("urgent")}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all ${
                        urgency === "urgent"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-slate-950 text-slate-400 border-slate-850"
                      }`}
                    >
                      <Flame className="w-3 h-3 text-rose-400 fill-rose-400" />
                      <span>জরুরি (পরীক্ষা আসন্ন)</span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>আপলোড ও জমা হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>ডাউট পাঠান 🚀</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
