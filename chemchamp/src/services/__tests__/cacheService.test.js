import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { cacheService } from "../cacheService.js";

describe("cacheService Unit Tests", () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  it("should set and get values with TTL correctly", async () => {
    const key = "test_key_1";
    const data = { title: "Organic Chemistry", score: 95 };

    await cacheService.set(key, data, 1000); // 1s TTL
    const result = await cacheService.get(key);
    assert.deepEqual(result, data);

    // Test expired item directly by setting with negative TTL
    await cacheService.set("expired_key", data, -100);
    const expiredResult = await cacheService.get("expired_key");
    assert.equal(expiredResult, null);
  });

  it("should deduplicate in-flight simultaneous requests (Promise Deduplication)", async () => {
    const key = "dedupe_key";
    let fetchCount = 0;

    const slowFetcher = async () => {
      fetchCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { count: fetchCount, payload: "unique_doc" };
    };

    // 5 concurrent calls for the same key
    const [res1, res2, res3, res4, res5] = await Promise.all([
      cacheService.getOrFetch(key, slowFetcher, 5000),
      cacheService.getOrFetch(key, slowFetcher, 5000),
      cacheService.getOrFetch(key, slowFetcher, 5000),
      cacheService.getOrFetch(key, slowFetcher, 5000),
      cacheService.getOrFetch(key, slowFetcher, 5000),
    ]);

    assert.equal(fetchCount, 1, "Fetcher should be invoked EXACTLY once across 5 concurrent calls");
    assert.deepEqual(res1, res2);
    assert.deepEqual(res1, res3);
    assert.deepEqual(res1, res4);
    assert.deepEqual(res1, res5);
    assert.equal(res1.payload, "unique_doc");
  });

  it("should support Stale-While-Revalidate (SWR)", async () => {
    const key = "swr_key";
    await cacheService.set(key, { value: "old_cached_value" }, 100);

    const freshCalls = [];
    const onFresh = (val) => freshCalls.push(val);
    const freshFetcher = async () => ({ value: "fresh_network_value" });

    // SWR should immediately return old cached value
    const immediateData = await cacheService.getOrFetchSWR(key, freshFetcher, 5000, onFresh);
    assert.deepEqual(immediateData, { value: "old_cached_value" });

    // Wait for background revalidation to resolve
    await new Promise((resolve) => setTimeout(resolve, 80));
    assert.equal(freshCalls.length, 1);
    assert.deepEqual(freshCalls[0], { value: "fresh_network_value" });

    // Next get() should have the fresh value in cache
    const updated = await cacheService.get(key);
    assert.deepEqual(updated, { value: "fresh_network_value" });
  });

  it("should invalidate keys by prefix or regex pattern", async () => {
    await cacheService.set("chapter_1", { title: "Paper 1" }, 10000);
    await cacheService.set("chapter_2", { title: "Paper 2" }, 10000);
    await cacheService.set("vault_flashcard_1", { name: "Benzene" }, 10000);

    assert.notEqual(await cacheService.get("chapter_1"), null);
    assert.notEqual(await cacheService.get("chapter_2"), null);
    assert.notEqual(await cacheService.get("vault_flashcard_1"), null);

    // Invalidate all chapter_ keys
    await cacheService.invalidatePattern("chapter_");

    assert.equal(await cacheService.get("chapter_1"), null);
    assert.equal(await cacheService.get("chapter_2"), null);
    assert.notEqual(await cacheService.get("vault_flashcard_1"), null, "Vault cache must remain untouched");
  });
});

describe("Debounced Batch Writer Unit Tests", () => {
  it("should merge multiple partial updates and flush on demand", () => {
    let memoryStore = {};
    const deepMerge = (target, source) => {
      const output = { ...target };
      for (const key of Object.keys(source)) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key]) &&
          typeof target[key] === "object"
        ) {
          output[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
      return output;
    };

    // Simulate 3 rapid user interactions (XP gain, habit check, study minutes)
    memoryStore = deepMerge(memoryStore, { gamification: { currentXP: 140 } });
    memoryStore = deepMerge(memoryStore, { stats: { totalStudyMinutes: 25 } });
    memoryStore = deepMerge(memoryStore, { gamification: { streakCount: 4 } });

    assert.deepEqual(memoryStore, {
      gamification: {
        currentXP: 140,
        streakCount: 4,
      },
      stats: {
        totalStudyMinutes: 25,
      },
    });
  });
});
