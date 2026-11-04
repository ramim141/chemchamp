import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Onboarding() {
  const { user, profile, setProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    target: "HSC_26",
    paper: "both",
    dailyGoalMinutes: "45",
    deadlineDays: "90",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedData = {
        ...profile,
        preferences: {
          target: formData.target,
          paper: formData.paper,
          dailyGoalMinutes: Number(formData.dailyGoalMinutes),
          deadlineDays: Number(formData.deadlineDays),
        },
        onboardingCompleted: true,
      };

      await setDoc(userRef, updatedData, { merge: true });
      setProfile(updatedData);
      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl backdrop-blur-md">
        <div className="text-center mb-6">
          <span className="text-3xl">🧪</span>
          <h2 className="text-2xl font-bold mt-2">ChemChamp-এ স্বাগতম!</h2>
          <p className="text-sm text-slate-400 mt-1">আপনার কেমিস্ট্রি জার্নি কাস্টমাইজ করুন</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">টার্গেট</label>
            <div className="grid grid-cols-3 gap-2">
              {["HSC_26", "HSC_27", "Admission"].map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setFormData({ ...formData, target: item })}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    formData.target === item
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {item.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">পেপার নির্বাচন</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "paper1", label: "১ম পত্র" },
                { id: "paper2", label: "২য় পত্র" },
                { id: "both", label: "উভয় পত্র" },
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setFormData({ ...formData, paper: p.id })}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    formData.paper === p.id
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">দৈনিক পড়ার সময়</label>
            <select
              value={formData.dailyGoalMinutes}
              onChange={(e) => setFormData({ ...formData, dailyGoalMinutes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="30">৩০ মিনিট</option>
              <option value="45">৪৫ মিনিট</option>
              <option value="60">১ ঘণ্টা</option>
              <option value="120">২ ঘণ্টা</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">সিলেবাস শেষের সময়সীমা</label>
            <select
              value={formData.deadlineDays}
              onChange={(e) => setFormData({ ...formData, deadlineDays: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="45">৪৫ দিন</option>
              <option value="60">৬০ দিন</option>
              <option value="90">৯০ দিন</option>
              <option value="120">১২০ দিন</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {submitting ? "প্রস্তুত হচ্ছে..." : "প্ল্যান তৈরি করুন 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}