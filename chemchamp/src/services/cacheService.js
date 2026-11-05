import localforage from "localforage";

// Dedicated localforage store for ChemChamp Query Cache
const cacheStore = localforage.createInstance({
  name: "ChemChamp",
  storeName: "query_cache",
  description: "Client-side high performance cache to protect Firestore from read overload",
});

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours default TTL

// L1 Synchronous In-Memory RAM Cache (Instant 0ms retrieval on tab switches)
const ramCache = new Map();

// In-flight Promise deduplication registry: prevents duplicate simultaneous queries
const inFlightRequests = new Map();

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
    const record = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    ramCache.set(key, record);
    cacheStore.setItem(key, record).catch(() => {});
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
    const record = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    ramCache.set(key, record);

    try {
      await cacheStore.setItem(key, record);
    } catch (err) {
      console.warn(`[Cache] Error writing key "${key}":`, err);
    }
  },

  /**
   * Execute fetcherFn with in-flight deduplication and update cache.
   */
  async forceFetch(key, fetcherFn, ttl = DEFAULT_TTL_MS, fallbackData = null) {
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    const fetchPromise = (async () => {
      try {
        const freshData = await fetcherFn();
        if (freshData !== undefined && freshData !== null) {
          await this.set(key, freshData, ttl);
          return freshData;
        }
      } catch (err) {
        console.error(`[Cache] Fetch failed for "${key}", checking stale cache:`, err);
        try {
          const raw = await cacheStore.getItem(key);
          if (raw?.data) return raw.data;
        } catch {
          // ignore
        }
      } finally {
        inFlightRequests.delete(key);
      }
      return fallbackData;
    })();

    inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  },

  /**
   * In-Flight Request Deduplicated Cache-First Fetcher:
   * 1. Returns cached value immediately if valid.
   * 2. If a request for this exact key is already in flight, reuses the active Promise.
   * 3. Fetches from database, caches result, and resolves all callers.
   * 4. If fetch fails, falls back to stale cache or fallbackData.
   */
  async getOrFetch(key, fetcherFn, ttl = DEFAULT_TTL_MS, fallbackData = null) {
    // 1. Check existing cache
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
    } catch {
      // ignore
    }

    // 2. Fetch with in-flight promise deduplication
    return this.forceFetch(key, fetcherFn, ttl, fallbackData);
  },

  /**
   * Stale-While-Revalidate (SWR):
   * 1. If cached data exists (even expired/stale), returns it immediately for 0ms latency.
   * 2. In background, revalidates data using fetcherFn and updates cache.
   * 3. Calls onFreshData callback when fresh data is ready.
   */
  async getOrFetchSWR(key, fetcherFn, ttl = DEFAULT_TTL_MS, onFreshData = null) {
    // 1. Check synchronous RAM cache or IndexedDB
    let cached = this.getSync(key);
    if (!cached) {
      try {
        const raw = await cacheStore.getItem(key);
        if (raw?.data) cached = raw.data;
      } catch {
        // ignore
      }
    }

    // 2. Background Revalidation (Deduplicated, forceFetch to get fresh value)
    const revalidatePromise = this.forceFetch(key, fetcherFn, ttl).then((freshData) => {
      if (freshData && typeof onFreshData === "function") {
        onFreshData(freshData);
      }
      return freshData;
    });

    if (cached) {
      return cached;
    }

    return revalidatePromise;
  },

  /**
   * Pattern Invalidation: Invalidate all cache keys matching a prefix or regex pattern
   * E.g. invalidatePattern("chapter_") or invalidatePattern(/questions_/)
   */
  async invalidatePattern(pattern) {
    const isRegex = pattern instanceof RegExp;
    const isString = typeof pattern === "string";

    // 1. Clear matching keys from RAM cache
    for (const key of ramCache.keys()) {
      const match = isRegex ? pattern.test(key) : isString && key.startsWith(pattern);
      if (match) {
        ramCache.delete(key);
      }
    }

    // 2. Clear matching keys from IndexedDB
    try {
      const keys = await cacheStore.keys();
      const removalPromises = keys
        .filter((k) => (isRegex ? pattern.test(k) : isString && k.startsWith(pattern)))
        .map((k) => cacheStore.removeItem(k));
      await Promise.all(removalPromises);
    } catch (err) {
      console.warn("[Cache] Error invalidating pattern:", err);
    }
  },

  /**
   * Invalidate specific keys list
   */
  async invalidateKeys(keysList) {
    if (!Array.isArray(keysList)) return;
    for (const key of keysList) {
      ramCache.delete(key);
    }
    await Promise.all(keysList.map((k) => cacheStore.removeItem(k).catch(() => {})));
  },

  /**
   * Invalidate specific key
   */
  async remove(key) {
    ramCache.delete(key);
    try {
      await cacheStore.removeItem(key);
    } catch (err) {
      console.warn(`[Cache] Error removing key "${key}":`, err);
    }
  },

  /**
   * Alias for remove
   */
  async delete(key) {
    return this.remove(key);
  },

  /**
   * Clear all cached data
   */
  async clear() {
    ramCache.clear();
    inFlightRequests.clear();
    try {
      await cacheStore.clear();
    } catch (err) {
      console.warn("[Cache] Error clearing cache:", err);
    }
  },
};
