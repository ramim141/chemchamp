import React, { useState } from "react";
import { Image, Upload, Check, Copy } from "lucide-react";
import { uploadToImgBB } from "../../services/imgbb";

export default function ImgBBUploader() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const url = await uploadToImgBB(selectedFile);
      setUploadedUrl(url);
    } catch (err) {
      alert("ছবি আপলোড ব্যর্থ হয়েছে। দয়া করে আপনার VITE_IMGBB_API_KEY চেক করুন।");
    } finally {
      setUploading(false);
    }
  };

  const handleCopyMarkdown = () => {
    const markdown = `![উদ্দীপক চিত্র](${uploadedUrl})`;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Image className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-bold text-white">ImgBB ডিরেক্ট ইমেজ আপলোডার</h3>
      </div>
      <p className="text-[11px] text-slate-400 mb-3">
        সৃজনশীল উদ্দীপক বা রাসায়নিক গঠন আপলোড করে সরাসরি Markdown KaTeX ট্যাগ কপি করুন।
      </p>

      <form onSubmit={handleImageUpload} className="space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
          className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
        />

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? "আপলোড হচ্ছে..." : "ImgBB-তে আপলোড করুন"}</span>
        </button>
      </form>

      {uploadedUrl && (
        <div className="mt-3 p-3 bg-slate-950 border border-emerald-500/30 rounded-lg space-y-2">
          <span className="text-[10px] text-emerald-400 font-bold block">✓ সফলভাবে আপলোড সম্পন্ন:</span>
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-md border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="truncate max-w-[200px]">{uploadedUrl}</span>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold ml-2"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "কপি হয়েছে" : "ট্যাগ কপি"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
