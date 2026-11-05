import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// ChemChamp Exam History & Performance Tracker Service
const STORAGE_PREFIX = "chemchamp_exam_history_";
const submittedAttemptsGuard = new Set();

export const examHistoryService = {
  /**
   * Get all past exam attempts for a user
   */
  getHistory(userId = "guest") {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },

  /**
   * Save a completed exam attempt
   */
  saveAttempt(userId = "guest", attemptData) {
    try {
      const history = this.getHistory(userId);
      const newEntry = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        dateFormatted: new Intl.DateTimeFormat("bn-BD", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date()),
        examId: attemptData.examId || "mock_exam",
        examTitle: attemptData.examTitle || "কেমিস্ট্রি মক টেস্ট",
        chapter: attemptData.chapter || "সাধারণ রসায়ন",
        paper: attemptData.paper || 1,
        totalQuestions: Number(attemptData.totalQuestions) || 0,
        correctCount: Number(attemptData.correctCount) || 0,
        wrongCount: Number(attemptData.wrongCount) || 0,
        skippedCount: Number(attemptData.skippedCount) || 0,
        finalScore: Number(attemptData.finalScore) || 0,
        accuracy: Number(attemptData.accuracy) || 0,
        gainedXp: Number(attemptData.gainedXp) || 0,
        targetTag: attemptData.targetTag || "মক টেস্ট",
        studentName: attemptData.studentName || "শিক্ষার্থী",
        studentEmail: attemptData.studentEmail || "",
        studentCollege: attemptData.studentCollege || "কলেজ অনুল্লেখিত",
        hscBatch: attemptData.hscBatch || "HSC-25",
        tabSwitchCount: Number(attemptData.tabSwitchCount) || 0,
        timeTakenSeconds: Number(attemptData.timeTakenSeconds) || 0,
      };

      const updated = [newEntry, ...history].slice(0, 50); // Keep last 50 attempts
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));

      // Asynchronously sync to Firestore examAttempts once (guarded against duplicate retries)
      if (!submittedAttemptsGuard.has(newEntry.id) && userId && userId !== "guest") {
        submittedAttemptsGuard.add(newEntry.id);
        try {
          setDoc(doc(db, "examAttempts", newEntry.id), {
            id: newEntry.id,
            examId: newEntry.examId,
            examTitle: newEntry.examTitle,
            chapter: newEntry.chapter,
            paper: newEntry.paper,
            totalQuestions: newEntry.totalQuestions,
            correctCount: newEntry.correctCount,
            wrongCount: newEntry.wrongCount,
            finalScore: newEntry.finalScore,
            accuracy: newEntry.accuracy,
            gainedXp: newEntry.gainedXp,
            studentName: newEntry.studentName,
            studentCollege: newEntry.studentCollege,
            hscBatch: newEntry.hscBatch,
            timeTakenSeconds: newEntry.timeTakenSeconds,
            userId,
            createdAt: serverTimestamp(),
          }).catch((e) => {
            console.warn("Background exam attempt sync warning:", e);
          });
        } catch {
          // Failure should not break student flow
        }
      }

      return updated;
    } catch (err) {
      console.warn("Could not save exam attempt:", err);
      return [];
    }
  },

  /**
   * Calculate aggregated performance stats
   */
  getStats(userId = "guest") {
    const history = this.getHistory(userId);
    if (history.length === 0) {
      return {
        totalExams: 0,
        totalQuestionsAnswered: 0,
        totalCorrect: 0,
        averageAccuracy: 0,
        highestScore: 0,
        totalXpEarned: 0,
      };
    }

    const totalExams = history.length;
    const totalQuestionsAnswered = history.reduce((acc, h) => acc + (h.correctCount + h.wrongCount), 0);
    const totalCorrect = history.reduce((acc, h) => acc + h.correctCount, 0);
    const totalXpEarned = history.reduce((acc, h) => acc + (h.gainedXp || 0), 0);
    const highestScore = Math.max(...history.map((h) => h.finalScore || 0));

    const totalAccSum = history.reduce((acc, h) => acc + (h.accuracy || 0), 0);
    const averageAccuracy = Math.round(totalAccSum / totalExams);

    return {
      totalExams,
      totalQuestionsAnswered,
      totalCorrect,
      averageAccuracy,
      highestScore,
      totalXpEarned,
    };
  },

  /**
   * Clear history
   */
  clearHistory(userId = "guest") {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
      return [];
    } catch {
      return [];
    }
  },
};

