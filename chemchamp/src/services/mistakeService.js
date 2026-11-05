import { db } from "./firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, writeBatch, limit, query, serverTimestamp } from "firebase/firestore";

export const ERROR_CATEGORIES = [
  { id: "থিওরি ল্যাক", label: "থিওরি ল্যাক", color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  { id: "ক্যালকুলেশন ভুল", label: "ক্যালকুলেশন ভুল", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  { id: "সিলি মিস্টেক", label: "সিলি মিস্টেক", color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  { id: "টাইম ম্যানেজমেন্ট", label: "টাইম ম্যানেজমেন্ট", color: "text-teal-400 bg-teal-500/10 border-teal-500/30" },
];

const getStorageKey = (uid) => `chemchamp_mistakes_${uid || "guest"}`;

export const mistakeService = {
  getLocalMistakes(uid) {
    try {
      const raw = localStorage.getItem(getStorageKey(uid));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  saveLocalMistakes(uid, list) {
    try {
      localStorage.setItem(getStorageKey(uid), JSON.stringify(list));
    } catch {
      // ignore
    }
  },

  async fetchMistakes(uid) {
    const localList = this.getLocalMistakes(uid);
    if (!uid) return localList;

    try {
      const snap = await getDocs(query(collection(db, "users", uid, "mistakeBox"), limit(50)));
      if (!snap.empty) {
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Merge remote + local by id
        const map = new Map();
        [...localList, ...remoteList].forEach((item) => map.set(item.id, item));
        const merged = Array.from(map.values());
        this.saveLocalMistakes(uid, merged);
        return merged;
      }
    } catch (err) {
      console.warn("Could not fetch Firestore mistakeBox, using local cache:", err);
    }
    return localList;
  },

  async addMistakes(uid, mistakesArray) {
    if (!Array.isArray(mistakesArray) || mistakesArray.length === 0) return;

    const current = this.getLocalMistakes(uid);
    const map = new Map();
    current.forEach((m) => map.set(m.title || m.id, m));

    const newEntries = mistakesArray.map((m, idx) => {
      const id = m.id || `m_${Date.now()}_${idx}`;
      const level = m.level || 1;
      const daysToAdd = level === 4 ? 21 : level === 3 ? 7 : level === 2 ? 3 : 1;
      return {
        id,
        questionId: m.questionId || id,
        title: m.title,
        wrongOption: m.wrongOption,
        correctOption: m.correctOption,
        errorType: m.errorType || "থিওরি ল্যাক",
        level,
        reviewInterval: m.reviewInterval || "১ দিন পর রিভিশন",
        tag: m.tag || "রসায়ন প্র্যাকটিস",
        nextReviewDate: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString(),
      };
    });

    newEntries.forEach((m) => map.set(m.title || m.id, m));
    const updated = Array.from(map.values());
    this.saveLocalMistakes(uid, updated);

    if (uid && newEntries.length > 0) {
      try {
        const batch = writeBatch(db);
        // Firestore batch max 500 ops
        newEntries.slice(0, 50).forEach((entry) => {
          const mRef = doc(db, "users", uid, "mistakeBox", entry.id);
          batch.set(mRef, { ...entry, timestamp: serverTimestamp() }, { merge: true });
        });
        await batch.commit();
      } catch (err) {
        console.warn("Batch sync mistake to Firestore warning:", err);
      }
    }
    return updated;
  },

  async updateMistake(uid, updatedItem) {
    const current = this.getLocalMistakes(uid);
    const updatedList = current.map((item) =>
      item.id === updatedItem.id ? { ...item, ...updatedItem } : item
    );
    this.saveLocalMistakes(uid, updatedList);

    if (uid && updatedItem?.id) {
      try {
        await setDoc(
          doc(db, "users", uid, "mistakeBox", updatedItem.id),
          {
            ...updatedItem,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Could not update mistake in Firestore:", err);
      }
    }
    return updatedList;
  },

  async removeMistake(uid, mistakeId) {
    const current = this.getLocalMistakes(uid);
    const updatedList = current.filter((item) => item.id !== mistakeId);
    this.saveLocalMistakes(uid, updatedList);

    if (uid && mistakeId) {
      try {
        await deleteDoc(doc(db, "users", uid, "mistakeBox", mistakeId));
      } catch (err) {
        console.warn("Could not delete mistake from Firestore:", err);
      }
    }
    return updatedList;
  },
};

export async function addMistakeQuestion(uid, item = {}) {
  return mistakeService.addMistakes(uid, [
    {
      id: item.id,
      questionId: item.id,
      title: item.question || item.title || "",
      wrongOption: item.userWrongAnswer || item.wrongOption || "",
      correctOption: item.correctAnswer || item.correctOption || "",
      errorType: item.errorType || "থিওরি ল্যাক",
      tag: item.topic || item.tag || "রসায়ন প্র্যাকটিস",
      level: 1,
    },
  ]);
}


