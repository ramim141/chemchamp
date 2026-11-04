import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../services/firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { AppInitialSkeleton } from "../components/common/SkeletonLoader";

const AuthContext = createContext();
const CACHE_KEY = "chemchamp_cached_profile";
const PENDING_SYNC_KEY = "chemchamp_pending_profile_sync";

export const getRpgRankInfo = (xp = 100) => {
  if (xp >= 1000) {
    return {
      level: 4,
      levelBn: "৪র্থ স্তর",
      title: "Nobel Laureate",
      nextTitle: "Max Rank 🏆",
      minXp: 1000,
      nextXp: 2000,
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      barColor: "from-purple-500 to-pink-500",
    };
  }
  if (xp >= 500) {
    return {
      level: 3,
      levelBn: "৩য় স্তর",
      title: "Reaction Master",
      nextTitle: "Nobel Laureate",
      minXp: 500,
      nextXp: 1000,
      color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      barColor: "from-amber-500 to-orange-400",
    };
  }
  if (xp >= 200) {
    return {
      level: 2,
      levelBn: "২য় স্তর",
      title: "Catalyst Trainee",
      nextTitle: "Reaction Master",
      minXp: 200,
      nextXp: 500,
      color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
      barColor: "from-teal-500 to-emerald-400",
    };
  }
  return {
    level: 1,
    levelBn: "১ম স্তর",
    title: "Test Tube Novice",
    nextTitle: "Catalyst Trainee",
    minXp: 0,
    nextXp: 200,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    barColor: "from-emerald-500 to-teal-400",
  };
};

export const AuthProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(auth.currentUser || null);
  const [loading, setLoading] = useState(true);

  const updateProfileState = (newProfile) => {
    setProfile(newProfile);
    try {
      if (newProfile) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(newProfile));
      } else {
        localStorage.removeItem(CACHE_KEY);
      }
    } catch (e) {
      console.warn("Could not cache profile:", e);
    }
  };

  // অফলাইনে থাকা ডেটা অনলাইনে এলে ব্যাকগ্রাউন্ডে অটো-সিঙ্ক করা (Module 6: Background Auto-Sync)
  useEffect(() => {
    const syncPendingOfflineData = async () => {
      if (!navigator.onLine || !auth.currentUser) return;
      try {
        const pendingRaw = localStorage.getItem(PENDING_SYNC_KEY);
        if (!pendingRaw) return;
        const pendingData = JSON.parse(pendingRaw);
        if (pendingData && pendingData.uid === auth.currentUser.uid) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          await setDoc(userDocRef, pendingData.payload, { merge: true });
          localStorage.removeItem(PENDING_SYNC_KEY);
        }
      } catch (err) {
        console.warn("Background auto-sync warning:", err);
      }
    };

    window.addEventListener("online", syncPendingOfflineData);
    syncPendingOfflineData();
    return () => window.removeEventListener("online", syncPendingOfflineData);
  }, [user]);

  // ইউজার প্রোফাইল লোকাল ও ফায়ারস্টোরে একসাথে সিঙ্ক করার হেল্পার
  const syncUserProfile = async (partialUpdate) => {
    const merged = {
      ...(profile || {}),
      ...partialUpdate,
      preferences: {
        ...(profile?.preferences || {}),
        ...(partialUpdate?.preferences || {}),
      },
      gamification: {
        ...(profile?.gamification || {}),
        ...(partialUpdate?.gamification || {}),
      },
      stats: {
        ...(profile?.stats || {}),
        ...(partialUpdate?.stats || {}),
      },
    };

    // RPG Level auto-update based on currentXP
    const xp = merged.gamification?.currentXP ?? 100;
    const rankInfo = getRpgRankInfo(xp);
    merged.gamification.level = rankInfo.level;
    merged.gamification.rankTitle = rankInfo.title;
    if (merged.gamification.streakCount !== undefined) {
      merged.streakCount = merged.gamification.streakCount;
    } else if (merged.streakCount !== undefined) {
      merged.gamification.streakCount = merged.streakCount;
    }

    updateProfileState(merged);

    if (user?.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, partialUpdate, { merge: true });
      } catch (err) {
        console.warn("Offline or Firestore write deferred, queued for auto-sync:", err);
        try {
          localStorage.setItem(
            PENDING_SYNC_KEY,
            JSON.stringify({ uid: user.uid, payload: merged, timestamp: Date.now() })
          );
        } catch {
          // ignore
        }
      }
    }
    return merged;
  };

  useEffect(() => {
    let isMounted = true;

    const safetyTimer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    getRedirectResult(auth).catch((err) => {
      console.warn("Redirect result check:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      if (currentUser) {
        setUser(currentUser);
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase();
        const isAdminEmail = adminEmail && currentUser.email?.toLowerCase() === adminEmail;
        const todayStr = new Date().toISOString().split("T")[0];

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (isAdminEmail && data.role !== "admin") {
              await setDoc(userDocRef, { ...data, role: "admin" }, { merge: true });
              data.role = "admin";
            }
            // Ensure schema defaults exist
            const normalized = {
              ...data,
              streakCount: data.streakCount || data.gamification?.streakCount || 1,
              gamification: {
                currentXP: 120,
                level: 1,
                streakCount: data.streakCount || 1,
                lastActiveDate: todayStr,
                ...(data.gamification || {}),
              },
              stats: {
                totalSolvedMCQ: 0,
                accuracyRate: 88,
                totalStudyMinutes: 20,
                ...(data.stats || {}),
              },
              preferences: {
                target: "HSC_26",
                paper: "both",
                dailyGoalMinutes: 45,
                deadlineDays: 90,
                lowBandwidthMode: false,
                ...(data.preferences || {}),
              },
            };
            if (isMounted) updateProfileState(normalized);
          } else {
            const newRole = isAdminEmail ? "admin" : "student";
            const initialProfile = {
              uid: currentUser.uid,
              name:
                currentUser.displayName ||
                (newRole === "admin" ? "অ্যাডমিনিস্ট্রেটর" : "কেমিস্ট্রি শিক্ষার্থী"),
              email: currentUser.email,
              photoURL: currentUser.photoURL || "",
              role: newRole,
              onboardingCompleted: newRole === "admin" ? true : false,
              streakCount: 1,
              gamification: {
                currentXP: 120,
                level: 1,
                streakCount: 1,
                lastActiveDate: todayStr,
              },
              stats: {
                totalSolvedMCQ: 0,
                accuracyRate: 88,
                totalStudyMinutes: 20,
              },
              preferences: {
                target: "HSC_26",
                paper: "both",
                dailyGoalMinutes: 45,
                deadlineDays: 90,
                lowBandwidthMode: false,
              },
              createdAt: serverTimestamp(),
              lastActiveDate: todayStr,
            };
            await setDoc(userDocRef, initialProfile, { merge: true });
            if (isMounted) updateProfileState(initialProfile);
          }
        } catch (err) {
          console.warn("Firestore profile sync error:", err);
          const fallback = {
            uid: currentUser.uid,
            name: currentUser.displayName || "ব্যবহারকারী",
            email: currentUser.email,
            role: isAdminEmail ? "admin" : "student",
            onboardingCompleted: true,
            streakCount: 1,
            gamification: { currentXP: 120, level: 1, streakCount: 1 },
            stats: { totalSolvedMCQ: 0, accuracyRate: 88, totalStudyMinutes: 20 },
            preferences: {
              target: "HSC_26",
              paper: "both",
              dailyGoalMinutes: 45,
              deadlineDays: 90,
              lowBandwidthMode: false,
            },
          };
          if (isMounted) updateProfileState(fallback);
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem(CACHE_KEY);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (preferRedirect = false) => {
    try {
      if (preferRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return { success: true };
      }

      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      console.warn("Popup blocked or COOP issue, falling back to Redirect:", error);

      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-closed-by-user" ||
        error.message?.includes("Cross-Origin-Opener-Policy")
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { success: true };
        } catch (redirErr) {
          console.error("Redirect fallback error:", redirErr);
        }
      }

      let userFriendlyMessage = "লগইন সম্পন্ন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।";
      if (error.code === "auth/unauthorized-domain") {
        userFriendlyMessage = "এই ডোমেইনটি Firebase Console-এ অথরাইজড করা নেই।";
      }
      return { success: false, error, message: userFriendlyMessage };
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      let message = "ইমেইল বা পাসওয়ার্ড ভুল হয়েছে।";
      if (error.code === "auth/user-not-found") message = "এই ইমেইলে কোনো একাউন্ট পাওয়া যায়নি।";
      if (error.code === "auth/wrong-password") message = "ভুল পাসওয়ার্ড দিয়েছেন।";
      if (error.code === "auth/invalid-credential") message = "লগইন তথ্য সঠিক নয়।";
      return { success: false, message };
    }
  };

  const signupWithEmail = async (name, email, password) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateAuthProfile(result.user, { displayName: name });
      return { success: true, user: result.user };
    } catch (error) {
      let message = "রেজিস্ট্রেশন ব্যর্থ হয়েছে।";
      if (error.code === "auth/email-already-in-use")
        message = "এই ইমেইল দিয়ে ইতিপূর্বে একাউন্ট খোলা হয়েছে।";
      if (error.code === "auth/weak-password") message = "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      localStorage.removeItem(CACHE_KEY);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        setProfile: updateProfileState,
        syncUserProfile,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
      }}
    >
      {loading ? (
        <AppInitialSkeleton />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
