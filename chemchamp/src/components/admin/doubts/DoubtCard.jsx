import React, { useState, useRef, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Trash2,
  Image as ImageIcon,
  HelpCircle,
  Eye,
  Code,
  X,
  ExternalLink,
  Mic,
  Square,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import KaTeXMath from "../../common/KaTeXMath";
import { soundService } from "../../../services/soundService";

export default function DoubtCard({ doubt, onResolve, onDelete }) {
  const [replyText, setReplyText] = useState(doubt.teacherReply || "");
  const [voiceUrl, setVoiceUrl] = useState(doubt.teacherVoiceUrl || "");
  const [isReplying, setIsReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(false);
  const [tab, setTab] = useState("write"); // write | preview

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const isResolved = doubt.status === "resolved";

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Start Audio Recording
  const startRecording = async () => {
    soundService.playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setVoiceUrl(reader.result);
        };
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("মাইক্রোফোন অ্যাক্সেস করতে সমস্যা হয়েছে! ব্রাউজারে পারমিশন চেক করুন।");
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    soundService.playClick();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

  const deleteRecording = () => {
    soundService.playClick();
    setVoiceUrl("");
    setIsPlayingPreview(false);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() && !voiceUrl) {
      alert("দয়া করে সমাধান টেক্সট লিখুন অথবা ভয়েস নোট রেকর্ড করুন।");
      return;
    }

    setSubmitting(true);
    await onResolve(doubt.id, replyText.trim(), voiceUrl);
    setSubmitting(false);
    setIsReplying(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "কিছুক্ষণ আগে";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const formatSecs = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isResolved
          ? "bg-slate-900/80 border-slate-800"
          : "bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900 border-rose-500/30 shadow-lg"
      }`}
    >
      {/* ১. শিক্ষার্থীর তথ্য ও স্ট্যাটাস হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {doubt.studentPhoto ? (
            <img
              src={doubt.studentPhoto}
              alt={doubt.studentName}
              className="w-9 h-9 rounded-xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center">
              🧪
            </div>
          )}

          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>{doubt.studentName || "শিক্ষার্থী"}</span>
              <span className="text-[10px] text-teal-400 font-normal font-mono">
                {doubt.studentCollege || doubt.chapterName}
              </span>
            </h4>
            <p className="text-[10.5px] text-slate-400">{formatDate(doubt.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isResolved ? (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>সমাধানকৃত</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>উত্তরের অপেক্ষায়</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => onDelete(doubt.id)}
            title="মুছে ফেলুন"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ২. শিক্ষার্থীর প্রশ্ন ও বিবরণ */}
      <div className="py-3.5 space-y-3">
        <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans">
          <KaTeXMath math={doubt.queryText || ""} />
        </div>

        {/* শিক্ষার্থীর সংযুক্ত খাতার ছবি */}
        {doubt.imageUrl && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setPreviewImage(true)}
              className="inline-flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-500/40 text-teal-300 text-xs transition-all group"
            >
              <img
                src={doubt.imageUrl}
                alt="খাতার প্রিভিউ"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="w-12 h-12 rounded-lg object-cover bg-black"
              />
              <div className="text-left">
                <span className="font-bold flex items-center gap-1 group-hover:text-white">
                  <span>খাতার ছবি বড় করে দেখুন</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
                <span className="text-[10px] text-slate-500 block">ক্লিক করুন</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ৩. সমাধান প্রদর্শনী (যদি ইতোমধ্যেই সমাধান করা থাকে) */}
      {isResolved && !isReplying && (
        <div className="mt-2 p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>আপনার সমাধান (শিক্ষক):</span>
            </span>

            <button
              type="button"
              onClick={() => setIsReplying(true)}
              className="text-[11px] text-slate-400 hover:text-emerald-400 underline"
            >
              সম্পাদনা করুন
            </button>
          </div>

          {doubt.teacherReply && (
            <div className="text-xs text-slate-200 leading-relaxed">
              <KaTeXMath math={doubt.teacherReply} />
            </div>
          )}

          {/* Teacher's Voice Note Audio Player */}
          {doubt.teacherVoiceUrl && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <audio controls src={doubt.teacherVoiceUrl} className="h-8 flex-1 max-w-sm" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold">ভয়েস নোট 🎙️</span>
            </div>
          )}
        </div>
      )}

      {/* ৪. শিক্ষকের উত্তর ফর্ম (যদি অমীমাংসিত থাকে বা এডিটে চাপ দেওয়া হয়) */}
      {(!isResolved || isReplying) && (
        <form onSubmit={handleSendReply} className="mt-3 space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>শিক্ষকের সমাধান / উত্তর:</span>
            </label>

            {/* Tab: Write vs KaTeX Preview */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setTab("write")}
                className={`px-2 py-0.5 rounded ${
                  tab === "write" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
                }`}
              >
                লিখুন
              </button>
              <button
                type="button"
                onClick={() => setTab("preview")}
                className={`px-2 py-0.5 rounded ${
                  tab === "preview" ? "bg-slate-800 text-white font-bold" : "text-slate-400"
                }`}
              >
                প্রিভিউ
              </button>
            </div>
          </div>

          {tab === "write" ? (
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="যেমন: বিক্রিয়াটির সঠিক মেকানিজম হলো: $2CH_3Br + 2Na \xrightarrow{\text{dry ether}} CH_3-CH_3$..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />
          ) : (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl min-h-[70px] text-xs text-slate-200 leading-relaxed">
              <KaTeXMath math={replyText || "কিছু লিখলে এখানে প্রিভিউ দেখা যাবে..."} />
            </div>
          )}

          {/* 🎙️ Voice Note Recording Engine */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                <span>স্যারের অডিও ভয়েস নোট (ভয়েস দিয়ে বুঝিয়ে দিন)</span>
              </span>

              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>রেকর্ডিং থামান ({formatSecs(recordingSeconds)})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-rose-400 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{voiceUrl ? "পুনরায় ভয়েস রেকর্ড" : "ভয়েস রেকর্ড শুরু করুন"}</span>
                </button>
              )}
            </div>

            {/* Voice Preview Player */}
            {voiceUrl && (
              <div className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
                  >
                    {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                  </button>
                  <audio
                    ref={audioPlayerRef}
                    src={voiceUrl}
                    onEnded={() => setIsPlayingPreview(false)}
                    className="hidden"
                  />
                  <span className="text-xs text-emerald-400 font-bold">
                    ভয়েস নোট প্রস্তুত ✓ (শুনতে ক্লিক করুন)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={deleteRecording}
                  className="p-1 rounded text-slate-500 hover:text-rose-400"
                  title="ভয়েস ডিলিট"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              ইনলাইন সমীকরণের জন্য $formula$ ব্যবহার করুন
            </span>

            <div className="flex items-center gap-2">
              {isReplying && (
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  বাতিল
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "পাঠানো হচ্ছে..." : "সমাধান পাঠান 🚀"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ৫. ইমেজ লাইটবক্স মডাল (বড় করে দেখার জন্য) */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImage(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <h4 className="text-xs font-bold text-white mb-3">সংযুক্ত খাতা / প্রশ্নের ছবি</h4>
            <div className="bg-slate-950 p-2 rounded-xl text-center">
              <img
                src={doubt.imageUrl}
                alt="শিক্ষার্থীর খাতার ছবি"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="max-h-[70vh] rounded-lg object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
