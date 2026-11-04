// Web Audio API Synthesizer & Haptic Feedback Engine
// No external MP3/WAV files required - pure zero-dependency browser synthesizer

class SoundService {
  constructor() {
    this.ctx = null;
    this.ambientOsc = null;
    this.ambientGain = null;
    this.enabled = true;

    try {
      const stored = localStorage.getItem("chemchamp_sound_enabled");
      if (stored !== null) {
        this.enabled = stored === "true";
      }
    } catch {
      // ignore
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  isSoundEnabled() {
    return this.enabled;
  }

  toggleSound() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("chemchamp_sound_enabled", String(this.enabled));
    } catch {
      // ignore
    }
    if (!this.enabled) {
      this.stopAmbientHum();
    }
    return this.enabled;
  }

  // Haptic feedback (Mobile vibration)
  triggerHaptic(type = "light") {
    if (typeof window === "undefined" || !navigator.vibrate) return;
    try {
      if (type === "light") {
        navigator.vibrate(15);
      } else if (type === "success") {
        navigator.vibrate([25, 40, 30]);
      } else if (type === "error") {
        navigator.vibrate([50, 40, 50]);
      } else if (type === "levelUp") {
        navigator.vibrate([30, 30, 40, 30, 60]);
      }
    } catch {
      // ignore
    }
  }

  // 1. Correct Answer: Pleasant high melodic chime (C6 -> E6 -> G6)
  playCorrect() {
    this.triggerHaptic("success");
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [1046.5, 1318.5, 1567.98]; // C6, E6, G6

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  // 2. Incorrect Answer: Low gentle buzz tone
  playIncorrect() {
    this.triggerHaptic("error");
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  // 3. Level-up & Streak Milestone Fanfare
  playLevelUp() {
    this.triggerHaptic("levelUp");
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Arpeggio: C5, E5, G5, B5, C6
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5];

      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === freqs.length - 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);

        const duration = idx === freqs.length - 1 ? 0.6 : 0.25;
        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + duration);
      });
    } catch (e) {
      console.warn("Sound error:", e);
    }
  }

  // 4. Subtle UI Button Click / Card Tap
  playClick() {
    this.triggerHaptic("light");
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // ignore
    }
  }

  // 5. Timer Tick (for Battle countdown & Pomodoro seconds)
  playTimerTick() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // ignore
    }
  }

  // 6. Ambient Lab White Noise / Focus Hum (for Pomodoro study session)
  startAmbientHum() {
    if (!this.enabled) return;
    try {
      this.stopAmbientHum();
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Gentle binaural theta hum (136.1 Hz om frequency + 140 Hz)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(136.1, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(142.1, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 1.5); // very soft soothing ambient

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);

      this.ambientOsc = [osc1, osc2];
      this.ambientGain = gain;
    } catch (e) {
      console.warn("Ambient hum error:", e);
    }
  }

  stopAmbientHum() {
    try {
      if (this.ambientGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      }
      setTimeout(() => {
        if (this.ambientOsc) {
          this.ambientOsc.forEach((osc) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {
              // ignore
            }
          });
          this.ambientOsc = null;
        }
      }, 550);
    } catch {
      // ignore
    }
  }
}

export const soundService = new SoundService();

