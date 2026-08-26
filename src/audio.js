// High-Quality Procedural Web Audio API Sound Synthesizer with Cluck, Moo, and Cash Riffle SFX
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initAudio();
  }

  initAudio() {
    const unlock = () => {
      try {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            this.ctx = new AudioContext();
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      } catch (e) {}
    };

    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'click'].forEach(evt => {
      window.addEventListener(evt, unlock, { passive: true });
      document.addEventListener(evt, unlock, { passive: true });
    });
  }

  ensureContext() {
    try {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {}
  }

  // Crisp Banknote Riffle / Paper Page-Flip Flutter Sound ("flrrr-ip! 💵")
  playCash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const count = 7;

      for (let i = 0; i < count; i++) {
        const pulseTime = t + i * 0.024;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.018);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.35));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000 + i * 240, pulseTime);
        filter.Q.setValueAtTime(3.0, pulseTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.38 + (i / count) * 0.22, pulseTime);
        gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.022);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(pulseTime);
        noise.stop(pulseTime + 0.024);
      }

      const snapOsc = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(650, t + count * 0.024);
      snapOsc.frequency.exponentialRampToValueAtTime(180, t + count * 0.024 + 0.05);
      snapGain.gain.setValueAtTime(0.28, t + count * 0.024);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + count * 0.024 + 0.05);
      snapOsc.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snapOsc.start(t + count * 0.024);
      snapOsc.stop(t + count * 0.024 + 0.05);
    } catch (e) {}
  }

  // Snappy Pluck / Harvest Pop
  playHarvest() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(1050, t + 0.07);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {}
  }

  playPop() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

      gain.gain.setValueAtTime(0.32, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch (e) {}
  }

  // Cute Chicken Cluck ("Bawk-bawk-bawk! 🐔")
  playCluck() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const pulses = [
        { freq: 440, delay: 0.00, dur: 0.06 },
        { freq: 520, delay: 0.07, dur: 0.07 },
        { freq: 380, delay: 0.15, dur: 0.10 }
      ];

      pulses.forEach(p => {
        const pt = t + p.delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(p.freq, pt);
        osc.frequency.exponentialRampToValueAtTime(p.freq * 1.35, pt + p.dur * 0.5);
        osc.frequency.exponentialRampToValueAtTime(p.freq * 0.85, pt + p.dur);

        gain.gain.setValueAtTime(0.28, pt);
        gain.gain.exponentialRampToValueAtTime(0.001, pt + p.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(pt);
        osc.stop(pt + p.dur);
      });
    } catch (e) {}
  }

  // Deep, Friendly Cow Moo ("Moo-oo-ooh! 🐄")
  playMoo() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const formant = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, t);
      osc.frequency.linearRampToValueAtTime(160, t + 0.2);
      osc.frequency.linearRampToValueAtTime(130, t + 0.5);
      osc.frequency.linearRampToValueAtTime(105, t + 0.75);

      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(480, t);
      formant.frequency.linearRampToValueAtTime(580, t + 0.25);
      formant.frequency.linearRampToValueAtTime(360, t + 0.7);
      formant.Q.setValueAtTime(3.5, t);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.34, t + 0.12);
      gain.gain.setValueAtTime(0.32, t + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

      osc.connect(formant);
      formant.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.75);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046, t);
      osc.frequency.setValueAtTime(1396, t + 0.04);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  }

  playPlace() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.06);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) {}
  }

  playTrash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.14);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch (e) {}
  }

  playUnlock() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.32, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
      });
    } catch (e) {}
  }

  playUpgrade() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      });
    } catch (e) {}
  }

  toggle() {
    this.ensureContext();
    this.muted = !this.muted;
    return !this.muted;
  }

  toggleMute() {
    this.ensureContext();
    this.muted = !this.muted;
    return this.muted;
  }
}

// Fallback proxy to ensure missing sound method never crashes the game
const rawSounds = new SoundSystem();
const sounds = new Proxy(rawSounds, {
  get(target, prop) {
    if (prop in target) {
      return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
    }
    return () => {};
  }
});