import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { cacheService } from "./cacheService";

const META_COLLECTION = "meta";
const VERSION_DOC = "contentVersion";
const LOCAL_VERSION_KEY = "chemchamp_content_version_local";

export const contentVersionService = {
  /**
   * Check remote content versions (curriculum, questions, vault).
   * If remote version is greater than local cached version, invalidate relevant cache keys.
   * Costs exactly 1 document read per session.
   */
  async checkAndSyncVersion() {
    try {
      const docRef = doc(db, META_COLLECTION, VERSION_DOC);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        // Initialize if not present
        const initial = {
          curriculumVersion: 1,
          questionsVersion: 1,
          vaultVersion: 1,
          updatedAt: serverTimestamp(),
        };
        try {
          await setDoc(docRef, initial, { merge: true });
        } catch {
          // ignore
        }
        return initial;
      }

      const remote = snap.data();
      let local = {};
      try {
        const raw = localStorage.getItem(LOCAL_VERSION_KEY);
        local = raw ? JSON.parse(raw) : {};
      } catch {
        // ignore
      }

      // 1. Curriculum Check
      if (remote.curriculumVersion && remote.curriculumVersion !== local.curriculumVersion) {
        console.log(`[VersionSync] Curriculum version updated (${local.curriculumVersion} -> ${remote.curriculumVersion}). Invalidating cache...`);
        await cacheService.invalidatePattern("chapter_");
        await cacheService.invalidatePattern("chemchamp_all_chapters");
      }

      // 2. Questions Check
      if (remote.questionsVersion && remote.questionsVersion !== local.questionsVersion) {
        console.log(`[VersionSync] Questions version updated (${local.questionsVersion} -> ${remote.questionsVersion}). Invalidating cache...`);
        await cacheService.invalidatePattern("topic_questions_");
        await cacheService.invalidatePattern("chemchamp_all_questions");
        await cacheService.invalidatePattern("daily_capsule_");
      }

      // 3. Vault Check
      if (remote.vaultVersion && remote.vaultVersion !== local.vaultVersion) {
        console.log(`[VersionSync] Vault version updated (${local.vaultVersion} -> ${remote.vaultVersion}). Invalidating cache...`);
        await cacheService.invalidatePattern("vault_");
      }

      // Save latest local version
      localStorage.setItem(
        LOCAL_VERSION_KEY,
        JSON.stringify({
          curriculumVersion: remote.curriculumVersion || 1,
          questionsVersion: remote.questionsVersion || 1,
          vaultVersion: remote.vaultVersion || 1,
          timestamp: Date.now(),
        })
      );

      return remote;
    } catch (err) {
      console.warn("[VersionSync] Could not check content version (offline fallback):", err);
      return null;
    }
  },

  /**
   * Admin Write Path: Bump version for specific content domain.
   * Automatically clears local cache and informs all users on next load.
   */
  async bumpVersion(domain = "curriculum") {
    try {
      const docRef = doc(db, META_COLLECTION, VERSION_DOC);
      const snap = await getDoc(docRef);
      const current = snap.exists() ? snap.data() : {};

      const key = `${domain}Version`;
      const nextVersion = (Number(current[key]) || 1) + 1;

      const payload = {
        ...current,
        [key]: nextVersion,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload, { merge: true });

      // Invalidate local cache immediately on admin's machine
      if (domain === "curriculum") {
        await cacheService.invalidatePattern("chapter_");
        await cacheService.invalidatePattern("chemchamp_all_chapters");
      } else if (domain === "questions") {
        await cacheService.invalidatePattern("topic_questions_");
        await cacheService.invalidatePattern("chemchamp_all_questions");
        await cacheService.invalidatePattern("daily_capsule_");
      } else if (domain === "vault") {
        await cacheService.invalidatePattern("vault_");
      }

      console.log(`[VersionSync] Bumped ${key} to ${nextVersion}`);
      return nextVersion;
    } catch (err) {
      console.warn(`[VersionSync] Could not bump version for ${domain}:`, err);
    }
  },
};

