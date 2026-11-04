export const POPULAR_EXAM_TAGS = [
  "BUET '22",
  "BUET '21",
  "DU '23",
  "DU '22",
  "মেডিকেল '২৩",
  "মেডিকেল '২২",
  "ঢা.বো. '২৩",
  "ঢা.বো. '২২",
  "রা.বো. '২৩",
  "চ.বো. '২৩",
  "য.বো. '২৩",
  "CKRUET '২২",
  "GST '২৩",
];

export function getExamBadgeStyle(tag = "") {
  const t = String(tag).toUpperCase();
  if (
    t.includes("BUET") ||
    t.includes("CKRUET") ||
    t.includes("BUTEX") ||
    t.includes("বুয়েট") ||
    t.includes("ইঞ্জিনিয়ারিং")
  ) {
    return "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25";
  }
  if (
    t.includes("মেডিকেল") ||
    t.includes("ডেন্টাল") ||
    t.includes("MAT") ||
    t.includes("DAT")
  ) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25";
  }
  if (
    t.includes("DU") ||
    t.includes("JU") ||
    t.includes("RU") ||
    t.includes("CU") ||
    t.includes("GST") ||
    t.includes("ঢাবি") ||
    t.includes("জাবি") ||
    t.includes("ভার্সিটি")
  ) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25";
  }
  // Board exams (ঢা.বো., রা.বো., ইত্যাদি)
  return "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25";
}

