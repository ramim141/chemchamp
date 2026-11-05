/**
 * Dev-only Firestore Metrics Wrapper & Counter
 * Tracks reads, writes, snapshots, and batch operations per screen.
 * Active only when import.meta.env.DEV is true.
 */

const isDev = Boolean(import.meta.env?.DEV);

class FirestoreMetrics {
  constructor() {
    this.currentScreen = "unknown";
    this.readWarningThreshold = 50; // Alert if any single screen reads > 50 docs in one session
    this.totals = {
      reads: 0,
      writes: 0,
      getDocCount: 0,
      getDocsCount: 0,
      onSnapshotCount: 0,
      setDocCount: 0,
      updateDocCount: 0,
      addDocCount: 0,
      deleteDocCount: 0,
      batchOpsCount: 0,
      aggregateCount: 0,
    };
    this.screenMetrics = {};
    this.listeners = new Set();
  }

  setScreen(screenName) {
    this.currentScreen = screenName;
    if (!this.screenMetrics[screenName]) {
      this.screenMetrics[screenName] = {
        reads: 0,
        writes: 0,
        getDocCalls: 0,
        getDocsCalls: 0,
        snapshotListeners: 0,
        setDocCalls: 0,
        updateDocCalls: 0,
        addDocCalls: 0,
        deleteDocCalls: 0,
        batchOps: 0,
        aggregateCalls: 0,
        events: [],
      };
    }
    if (isDev) {
      console.log(`%c[FirestoreMetrics] Active Screen: ${screenName}`, "color: #10b981; font-weight: bold;");
    }
  }

  recordRead(type, pathOrName, docsCount = 1) {
    if (!isDev) return;
    this.totals.reads += docsCount;
    if (type === "getDoc") this.totals.getDocCount++;
    if (type === "getDocs") this.totals.getDocsCount++;
    if (type === "onSnapshot") this.totals.onSnapshotCount++;
    if (type === "getCountFromServer") this.totals.aggregateCount++;

    const screen = this.screenMetrics[this.currentScreen] || this.initScreen(this.currentScreen);
    screen.reads += docsCount;
    if (type === "getDoc") screen.getDocCalls++;
    if (type === "getDocs") screen.getDocsCalls++;
    if (type === "onSnapshot") screen.snapshotListeners++;
    if (type === "getCountFromServer") screen.aggregateCalls++;

    const event = {
      timestamp: Date.now(),
      action: "READ",
      type,
      target: pathOrName,
      docsCount,
    };
    screen.events.push(event);

    if (screen.reads > this.readWarningThreshold && !screen._warnedThreshold) {
      screen._warnedThreshold = true;
      console.warn(
        `%c⚠️ [Firestore Quota Guard] Screen "${this.currentScreen}" exceeded ${this.readWarningThreshold} document reads (${screen.reads} reads)! Check for missing limits or un-cached queries.`,
        "color: #ef4444; font-weight: bold; font-size: 13px; background: #fee2e2; padding: 4px 8px; border-radius: 4px;"
      );
    }

    console.log(
      `%c[Firestore Read] [${this.currentScreen}] ${type}(${pathOrName}) => ${docsCount} doc(s) (Screen Total Reads: ${screen.reads})`,
      "color: #38bdf8;"
    );
    this.notify();
  }

  recordWrite(type, pathOrName, opsCount = 1) {
    if (!isDev) return;
    this.totals.writes += opsCount;
    if (type === "setDoc") this.totals.setDocCount++;
    if (type === "updateDoc") this.totals.updateDocCount++;
    if (type === "addDoc") this.totals.addDocCount++;
    if (type === "deleteDoc") this.totals.deleteDocCount++;
    if (type === "writeBatch") this.totals.batchOpsCount += opsCount;

    const screen = this.screenMetrics[this.currentScreen] || this.initScreen(this.currentScreen);
    screen.writes += opsCount;
    if (type === "setDoc") screen.setDocCalls++;
    if (type === "updateDoc") screen.updateDocCalls++;
    if (type === "addDoc") screen.addDocCalls++;
    if (type === "deleteDoc") screen.deleteDocCalls++;
    if (type === "writeBatch") screen.batchOps += opsCount;

    const event = {
      timestamp: Date.now(),
      action: "WRITE",
      type,
      target: pathOrName,
      opsCount,
    };
    screen.events.push(event);

    console.log(
      `%c[Firestore Write] [${this.currentScreen}] ${type}(${pathOrName}) => ${opsCount} op(s) (Screen Total Writes: ${screen.writes})`,
      "color: #f59e0b;"
    );
    this.notify();
  }

  initScreen(screenName) {
    this.screenMetrics[screenName] = {
      reads: 0,
      writes: 0,
      getDocCalls: 0,
      getDocsCalls: 0,
      snapshotListeners: 0,
      setDocCalls: 0,
      updateDocCalls: 0,
      addDocCalls: 0,
      deleteDocCalls: 0,
      batchOps: 0,
      aggregateCalls: 0,
      events: [],
    };
    return this.screenMetrics[screenName];
  }

  getReport() {
    return {
      totals: { ...this.totals },
      screens: JSON.parse(JSON.stringify(this.screenMetrics)),
    };
  }

  reset() {
    this.readWarningThreshold = 50; // Alert if any single screen reads > 50 docs in one session
    this.totals = {
      reads: 0,
      writes: 0,
      getDocCount: 0,
      getDocsCount: 0,
      onSnapshotCount: 0,
      setDocCount: 0,
      updateDocCount: 0,
      addDocCount: 0,
      deleteDocCount: 0,
      batchOpsCount: 0,
      aggregateCount: 0,
    };
    this.screenMetrics = {};
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.getReport());
      } catch (err) {
        console.warn("Metrics listener error:", err);
      }
    }
  }
}

export const firestoreMetrics = new FirestoreMetrics();

if (typeof window !== "undefined" && isDev) {
  window.__firestoreMetrics = firestoreMetrics;
}

