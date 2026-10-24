class DhakaSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private coinStreak: number = 0;
  private lastCoinTime: number = 0;
  private beatTimer: number | null = null;
  private beatStep: number = 0;
  private isPlayingBeat: boolean = false;
  private currentTempoFactor: number = 1;

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopStreetBeat();
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public unlock() {
    if (this.muted) return;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.createNoiseBuffer();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // Web Audio unavailable
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      this.unlock();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * 0.5);
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public playCoin() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastCoinTime < 1.1) {
      this.coinStreak = Math.min(this.coinStreak + 1, 10);
    } else {
      this.coinStreak = 0;
    }
    this.lastCoinTime = now;

    // Bright major pentatonic escalator
    const notes = [880, 987.77, 1108.73, 1318.51, 1479.98, 1760, 1975.53, 2217.46, 2637.02, 2959.96, 3520];
    const baseFreq = notes[this.coinStreak] || 1318.51;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.065);

    osc2.frequency.setValueAtTime(baseFreq * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.24);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
  }

  public playLaneSwitch(direction: -1 | 1) {
    const ctx = this.ensureContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2.4;
    const startFreq = direction < 0 ? 620 : 720;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(startFreq * 2.1, now + 0.09);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(now);
    src.stop(now + 0.12);
  }

  public playJump() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playSlide(fastFall: boolean = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(280, now + 0.18);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.21);
    }

    if (fastFall) {
      const slam = ctx.createOscillator();
      const slamGain = ctx.createGain();
      slam.type = "sine";
      slam.frequency.setValueAtTime(175, now);
      slam.frequency.exponentialRampToValueAtTime(52, now + 0.14);

      slamGain.gain.setValueAtTime(0.24, now);
      slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      slam.connect(slamGain);
      slamGain.connect(ctx.destination);
      slam.start(now);
      slam.stop(now + 0.17);
    }
  }

  public playRickshawBell() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Double "tring-tring!" FM metallic bell
    [0, 0.085].forEach((offset) => {
      const t = now + offset;
      const carrier = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const outGain = ctx.createGain();

      carrier.type = "sine";
      carrier.frequency.setValueAtTime(2350, t);

      mod.type = "sine";
      mod.frequency.setValueAtTime(3410, t);
      modGain.gain.setValueAtTime(650, t);
      modGain.gain.exponentialRampToValueAtTime(20, t + 0.14);

      outGain.gain.setValueAtTime(0.001, t);
      outGain.gain.linearRampToValueAtTime(0.095, t + 0.005);
      outGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.22);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(outGain);
      outGain.connect(ctx.destination);

      carrier.start(t);
      mod.start(t);
      carrier.stop(t + 0.23);
      mod.stop(t + 0.23);
    });
  }

  public playBusHorn() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Classic Dhaka dual-tone quick melodic horn ("Pom-Pom!")
    const notes = [
      { start: 0, dur: 0.1, f1: 349.23, f2: 440 },
      { start: 0.12, dur: 0.16, f1: 392.0, f2: 493.88 },
    ];

    notes.forEach((n) => {
      const t = now + n.start;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      o1.type = "sawtooth";
      o2.type = "sawtooth";
      o1.frequency.setValueAtTime(n.f1, t);
      o2.frequency.setValueAtTime(n.f2, t);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900, t);
      filter.Q.value = 1.8;

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.075, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

      o1.connect(filter);
      o2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      o1.start(t);
      o2.start(t);
      o1.stop(t + n.dur + 0.02);
      o2.stop(t + n.dur + 0.02);
    });
  }

  public playNearMiss() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    //Sparkle chord + quick Doppler pass
    [659.25, 987.77, 1318.51].forEach((freq, idx) => {
      const t = now + idx * 0.035;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playPowerup() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    arpeggio.forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  public playShieldSmash() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);

    this.playNearMiss();
  }

  public playCrash() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Low impact boom
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = "sine";
    boom.frequency.setValueAtTime(160, now);
    boom.frequency.exponentialRampToValueAtTime(36, now + 0.38);

    boomGain.gain.setValueAtTime(0.32, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.44);

    // Noise burst
    if (this.noiseBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.32);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.22, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      src.connect(filter);
      filter.connect(nGain);
      nGain.connect(ctx.destination);
      src.start(now);
      src.stop(now + 0.35);
    }

    // Sympathetic descending notes
    [392, 349.23, 293.66].forEach((freq, idx) => {
      const t = now + 0.1 + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 0.94, t + 0.14);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public setTempoFactor(factor: number) {
    this.currentTempoFactor = Math.max(0.85, Math.min(1.55, factor));
  }

  public startStreetBeat() {
    if (this.muted || this.isPlayingBeat) return;
    this.isPlayingBeat = true;
    this.beatStep = 0;
    const scheduleNext = () => {
      if (!this.isPlayingBeat || this.muted) return;
      this.triggerTablaPulse(this.beatStep);
      this.beatStep = (this.beatStep + 1) % 8;
      const intervalMs = Math.round(185 / this.currentTempoFactor);
      this.beatTimer = window.setTimeout(scheduleNext, intervalMs);
    };
    scheduleNext();
  }

  public stopStreetBeat() {
    this.isPlayingBeat = false;
    if (this.beatTimer !== null) {
      clearTimeout(this.beatTimer);
      this.beatTimer = null;
    }
  }

  private triggerTablaPulse(step: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || this.muted) return;
    const now = ctx.currentTime;

    // Gentle, infectious Dholak/Tabla groove ("Dha - Ge - Na - Ti - Na - Ka - Dhin - Na")
    if (step === 0 || step === 3 || step === 6) {
      // Warm Bayan bass drum tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const pitch = step === 0 ? 92 : step === 6 ? 108 : 84;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.72, now + 0.11);

      gain.gain.setValueAtTime(0.048, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (step === 2 || step === 4 || step === 7) {
      // Crisp Dayan woody rim tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      const pitch = step === 4 ? 440 : 330;
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.88, now + 0.055);

      gain.gain.setValueAtTime(0.025, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }
}

export const soundEngine = new DhakaSoundEngine();
