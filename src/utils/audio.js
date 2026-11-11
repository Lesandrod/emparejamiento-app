// Professional Boxing Event Sound Synthesizer using Web Audio API
class BoxingAudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Boxing Ring Bell: "DING DING DING!"
  playBell(strikes = 3) {
    try {
      this.init();
      if (!this.ctx) return;

      const t0 = this.ctx.currentTime;
      for (let i = 0; i < strikes; i++) {
        const time = t0 + i * 0.28;

        // Fundamental ring bell frequency & harmonics
        const freqs = [840, 1680, 2520, 3360];
        const gains = [0.25, 0.12, 0.06, 0.03];

        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(gains[idx], time);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.85);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(time);
          osc.stop(time + 0.9);
        });
      }
    } catch {
      // Audio safety
    }
  }

  // Heavy Punch / Glove Impact: "POW / BOOM!"
  playPunchImpact() {
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;

      // 1. Sub-bass boom
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.25);

      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.26);

      // 2. Leather glove slap (filtered white noise)
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.12);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.15);
    } catch {
      // Audio safety
    }
  }

  // Fast Whoosh / Punch in the air
  playWhoosh() {
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.18;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.exponentialRampToValueAtTime(950, t + 0.08);
      filter.frequency.exponentialRampToValueAtTime(220, t + 0.16);
      filter.Q.setValueAtTime(3.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.18);
    } catch {
      // Audio safety
    }
  }

  // Crowd cheer / Arena roar
  playArenaCheer() {
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const dur = 1.2;
      const bufferSize = this.ctx.sampleRate * dur;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, t);
      filter.Q.setValueAtTime(1.5, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + dur);
    } catch {
      // Audio safety
    }
  }

  // Tactile button click
  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }

  // Rapid Casino Deck Riffle / Chocolateo Shuffle
  playDeckShuffle() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 16; i++) {
        const time = t + i * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(320 + Math.random() * 350, time);
        osc.frequency.exponentialRampToValueAtTime(90, time + 0.038);
        gain.gain.setValueAtTime(0.14, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.038);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.04);
      }
    } catch {}
  }
}

export const boxingAudio = new BoxingAudioEngine();

// Convenience exports
export function playBoxingBell(strikes = 3) {
  boxingAudio.playBell(strikes);
}
export function playPunchImpact() {
  boxingAudio.playPunchImpact();
}
export function playWhoosh() {
  boxingAudio.playWhoosh();
}
export function playArenaCheer() {
  boxingAudio.playArenaCheer();
}
export function playClickSound() {
  boxingAudio.playTick();
}
export function playShuffleSound() {
  boxingAudio.playDeckShuffle();
}
export function playCardFlipSound() {
  boxingAudio.playWhoosh();
}
export function playWinSound() {
  boxingAudio.playBell(3);
  setTimeout(() => boxingAudio.playArenaCheer(), 350);
}
