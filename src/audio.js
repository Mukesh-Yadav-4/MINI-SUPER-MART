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
        this.initBGM();
        if (!this.bgmMuted && !this.bgmTimer) {
          this.startBGM();
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

  // ============================================
  // PROCEDURAL BACKGROUND MUSIC (BGM) ENGINE
  // ============================================
  initBGM() {
    if (this.bgmInitialized) return;
    this.bgmInitialized = true;
    this.bgmMuted = false;
    try {
      const saved = localStorage.getItem('ofm_bgm_muted');
      if (saved !== null) this.bgmMuted = (saved === 'true');
    } catch (e) {}

    this.bgmVolume = 0.07;
    this.bgmStep = 0;
    this.bgmTimer = null;
    this.bgmTempo = 112; // BPM
    this.bgmStepDuration = (60 / this.bgmTempo) / 2; // 8th note duration (~0.268s)

    // Warm Pentatonic & Major scale frequencies
    // C Major Chord progression: C - G - Am - F (4 bars x 8 steps = 32 steps)
    this.bgmChords = [
      { bass: 130.81, notes: [261.63, 329.63, 392.00, 523.25] }, // C4, E4, G4, C5
      { bass: 98.00,  notes: [246.94, 293.66, 392.00, 493.88] }, // B3, D4, G4, B4
      { bass: 110.00, notes: [220.00, 261.63, 329.63, 440.00] }, // A3, C4, E4, A4
      { bass: 87.31,  notes: [220.00, 261.63, 349.23, 440.00] }, // A3, C4, F4, A4
      { bass: 130.81, notes: [261.63, 329.63, 392.00, 523.25] }, // C4, E4, G4, C5
      { bass: 98.00,  notes: [246.94, 293.66, 392.00, 493.88] }, // B3, D4, G4, B4
      { bass: 87.31,  notes: [220.00, 261.63, 349.23, 440.00] }, // A3, C4, F4, A4
      { bass: 98.00,  notes: [246.94, 293.66, 392.00, 587.33] }  // G3, D4, G4, D5
    ];

    // Cheerful Marimba Melody Pattern (8 steps per bar x 8 bars = 64 steps)
    this.bgmMelody = [
      523.25, 0, 659.25, 523.25, 783.99, 0, 659.25, 0,    // Bar 1 (C)
      587.33, 0, 493.88, 0,      783.99, 659.25, 587.33, 0, // Bar 2 (G)
      440.00, 0, 523.25, 0,      659.25, 0, 523.25, 440.00, // Bar 3 (Am)
      349.23, 0, 440.00, 523.25, 659.25, 0, 587.33, 0,    // Bar 4 (F)
      523.25, 659.25, 783.99, 0, 880.00, 783.99, 659.25, 0,// Bar 5 (C)
      783.99, 0, 587.33, 0,      659.25, 587.33, 493.88, 0, // Bar 6 (G)
      523.25, 0, 659.25, 0,      587.33, 0, 523.25, 0,      // Bar 7 (F)
      587.33, 659.25, 783.99, 0, 587.33, 0, 493.88, 0     // Bar 8 (G)
    ];
  }

  startBGM() {
    this.initBGM();
    if (this.bgmTimer) return;
    this.ensureContext();

    this.bgmTimer = setInterval(() => {
      this.tickBGM();
    }, this.bgmStepDuration * 1000);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  toggleBGM() {
    this.initBGM();
    this.bgmMuted = !this.bgmMuted;
    try {
      localStorage.setItem('ofm_bgm_muted', this.bgmMuted.toString());
    } catch (e) {}

    if (!this.bgmMuted && !this.bgmTimer) {
      this.startBGM();
    }
    return !this.bgmMuted;
  }

  tickBGM() {
    if (this.bgmMuted || this.muted) return;
    this.ensureContext();
    if (!this.ctx || this.ctx.state === 'suspended') return;

    try {
      const now = this.ctx.currentTime;
      const step = this.bgmStep;
      const bar = Math.floor(step / 8) % this.bgmChords.length;
      const stepInBar = step % 8;
      const chord = this.bgmChords[bar];

      // 1. Acoustic Bouncy Bass (Plays on beats 0, 4, and syncopated 6)
      if (stepInBar === 0 || stepInBar === 4 || stepInBar === 6) {
        const bassFreq = (stepInBar === 4) ? chord.bass * 1.5 : chord.bass;
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bassFreq, now);

        const bVol = this.bgmVolume * 1.2;
        bGain.gain.setValueAtTime(bVol, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + this.bgmStepDuration * 1.8);

        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);
        bOsc.start(now);
        bOsc.stop(now + this.bgmStepDuration * 1.8);
      }

      // 2. Soft Marimba / Kalimba Melody Note
      const melodyFreq = this.bgmMelody[step % this.bgmMelody.length];
      if (melodyFreq > 0) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(melodyFreq, now);

        const mVol = this.bgmVolume * 0.95;
        mGain.gain.setValueAtTime(mVol, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + this.bgmStepDuration * 1.4);

        mOsc.connect(mGain);
        mGain.connect(this.ctx.destination);
        mOsc.start(now);
        mOsc.stop(now + this.bgmStepDuration * 1.4);
      }

      // 3. Warm Harmonic Chord Pad (Soft arpeggio / plucked harmony on 8th notes)
      if (stepInBar === 1 || stepInBar === 3 || stepInBar === 5 || stepInBar === 7) {
        const noteIdx = Math.floor(stepInBar / 2) % chord.notes.length;
        const harmFreq = chord.notes[noteIdx];
        const hOsc = this.ctx.createOscillator();
        const hGain = this.ctx.createGain();
        hOsc.type = 'triangle';
        hOsc.frequency.setValueAtTime(harmFreq, now);

        const hVol = this.bgmVolume * 0.45;
        hGain.gain.setValueAtTime(hVol, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + this.bgmStepDuration * 0.9);

        hOsc.connect(hGain);
        hGain.connect(this.ctx.destination);
        hOsc.start(now);
        hOsc.stop(now + this.bgmStepDuration * 0.9);
      }

      // 4. Subtle Shaker / Off-beat Rhythm
      if (stepInBar % 2 === 1) {
        const bufLen = Math.floor(this.ctx.sampleRate * 0.025);
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let j = 0; j < bufLen; j++) data[j] = (Math.random() * 2 - 1) * 0.08;
        const sSource = this.ctx.createBufferSource();
        sSource.buffer = buf;
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.setValueAtTime(6000, now);
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(this.bgmVolume * 0.4, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        sSource.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.ctx.destination);
        sSource.start(now);
        sSource.stop(now + 0.025);
      }

      this.bgmStep = (this.bgmStep + 1) % 64;
    } catch (e) {}
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