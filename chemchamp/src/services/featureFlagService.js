import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const SETTINGS_DOC = "features";
const SETTINGS_COLLECTION = "system_settings";
const LOCAL_KEY = "chemchamp_feature_flags";

export const DEFAULT_FLAGS = {
  audioRecapEnabled: false, // Default is disabled (Coming Soon) as requested by user
};

export const featureFlagService = {
  getFlagsSync() {
    try {
      const cached = localStorage.getItem(LOCAL_KEY);
      if (cached) {
        return { ...DEFAULT_FLAGS, ...JSON.parse(cached) };
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_FLAGS;
  },

  async getFlags() {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const merged = { ...DEFAULT_FLAGS, ...data };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
        return merged;
      } else {
        await setDoc(docRef, DEFAULT_FLAGS, { merge: true });
        localStorage.setItem(LOCAL_KEY, JSON.stringify(DEFAULT_FLAGS));
        return DEFAULT_FLAGS;
      }
    } catch (err) {
      console.warn("Could not fetch remote feature flags:", err);
      return this.getFlagsSync();
    }
  },

  async updateFlag(key, value) {
    try {
      const current = this.getFlagsSync();
      const updated = { ...current, [key]: value };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));

      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
      await setDoc(docRef, { [key]: value }, { merge: true });
      return updated;
    } catch (err) {
      console.error("Error updating feature flag:", err);
      throw err;
    }
  },

  subscribe(callback) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const merged = { ...DEFAULT_FLAGS, ...data };
            localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
            callback(merged);
          } else {
            callback(DEFAULT_FLAGS);
          }
        },
        (err) => {
          console.warn("Feature flags snapshot error:", err);
          callback(this.getFlagsSync());
        }
      );
    } catch (e) {
      callback(this.getFlagsSync());
      return () => {};
    }
  },
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState(() => featureFlagService.getFlagsSync());

  useEffect(() => {
    setFlags(featureFlagService.getFlagsSync());
    const unsubscribe = featureFlagService.subscribe((updatedFlags) => {
      setFlags(updatedFlags);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return flags;
}

