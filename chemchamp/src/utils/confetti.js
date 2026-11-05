/**
 * Lazy-loaded confetti helper to eliminate canvas-confetti from critical initial bundles
 */
export const fireConfetti = async (options) => {
  try {
    const confettiModule = await import("canvas-confetti");
    const confetti = confettiModule.default || confettiModule;
    return confetti(options);
  } catch (err) {
    console.warn("Confetti dynamic load failed:", err);
  }
};
