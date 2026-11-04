import localforage from "localforage";

// Initialize localforage instance dedicated to ChemChamp Cache
const cacheStore = localforage.createInstance({
  name: "ChemChamp",
  storeName: "query_cache",
  description: "Client-side high performance cache to protect Firestore from read overload",
});

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours default TTL

// L1 Synchronous In-Memory RAM Cache (Instant 0ms retrieval on tab switches)
const ramCache = new Map();

export const cacheService = {
  /**
   * Synchronous L1 RAM lookup - eliminates loading states and skeleton flicker completely
   */
  getSync(key) {
    const record = ramCache.get(key);
    if (!record) return null;
    if (Date.now() - record.timestamp > record.ttl) {
      ramCache.delete(key);
      return null;
    }
    return record.data;
  },

  /**
   * Save to L1 RAM cache synchronously and persist to IndexedDB asynchronously
   */
  setSync(key, data, ttl = DEFAULT_TTL_MS) {
    ramCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    // Async background persistence
    cacheStore.setItem(key, {
      data,
      timestamp: Date.now(),
      ttl,
    }).catch(() => {});
  },

  /**
   * Get cached data by key if not expired (checks RAM first, then IndexedDB)
   */
  async get(key) {
    // 1. Check synchronous RAM cache
    const ramHit = this.getSync(key);
    if (ramHit !== null) return ramHit;

    // 2. Check IndexedDB
    try {
      const record = await cacheStore.getItem(key);
      if (!record) return null;

      const { data, timestamp, ttl } = record;
      if (Date.now() - timestamp > ttl) {
        // Expired
        return null;
      }

      // Populate RAM cache for future 0ms instant reads
      ramCache.set(key, { data, timestamp, ttl });
      return data;
    } catch (err) {
      console.warn(`[Cache] Error reading key "${key}":`, err);
      return null;
    }
  },

  /**
   * Save data to cache with specific TTL
   */
  async set(key, data, ttl = DEFAULT_TTL_MS) {
    // Update RAM cache immediately
    ramCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    try {
      await cacheStore.setItem(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    } catch (err) {
      console.warn(`[Cache] Error writing key "${key}":`, err);
    }
  },

  /**
   * Stale-while-revalidate / Cache-first fetcher:
   * 1. Returns cached value immediately if valid.
   * 2. If expired or not found, calls fetcherFn(), caches result, and returns it.
   * 3. If fetcherFn() fails (offline or quota error), returns stale cached data or fallback.
   */
  async getOrFetch(key, fetcherFn, ttl = DEFAULT_TTL_MS, fallbackData = null) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Fetch from database
      const freshData = await fetcherFn();
      if (freshData !== undefined && freshData !== null) {
        await this.set(key, freshData, ttl);
        return freshData;
      }
    } catch (err) {
      console.error(`[Cache] Fetch failed for "${key}", checking stale cache:`, err);
      // Try to get stale data if network/quota failed
      try {
        const raw = await cacheStore.getItem(key);
        if (raw?.data) return raw.data;
      } catch {
        // ignore
      }
    }

    return fallbackData;
  },

  /**
   * Invalidate specific key
   */
  async remove(key) {
    try {
      await cacheStore.removeItem(key);
    } catch (err) {
      console.warn(`[Cache] Error removing key "${key}":`, err);
    }
  },

  /**
   * Clear all cached data
   */
  async clear() {
    try {
      await cacheStore.clear();
    } catch (err) {
      console.warn("[Cache] Error clearing cache:", err);
    }
  },
};
