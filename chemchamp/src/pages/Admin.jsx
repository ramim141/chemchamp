import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ImgBBUploader from "../components/admin/ImgBBUploader";
import JsonBatchUploader from "../components/admin/JsonBatchUploader";

export default function Admin() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 pt-4 px-4 max-w-md mx-auto">
      <header className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> ড্যাশবোর্ডে ফিরুন
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              সুপার অ্যাডমিন
            </span>

            {/* অ্যাডমিন লগআউট বাটন */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg hover:bg-rose-500/20 transition-all font-semibold"
            >
              <LogOut className="w-3 h-3" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">অ্যাডমিন কনটেন্ট স্টুডিও</h1>
            <p className="text-xs text-slate-400">ImgBB ডিরেক্ট হোস্টিং ও বাল্ক প্রশ্ন আপলোড</p>
          </div>
        </div>
      </header>

      {/* Modular ImgBB Uploader */}
      <ImgBBUploader />

      {/* Modular JSON Batch Uploader */}
      <JsonBatchUploader />
    </div>
  );
}