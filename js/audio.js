/* ============================================================
   audio.js — 8-bit Chiptune Sound Engine (Web Audio API)
   ============================================================ */
'use strict';

class AudioEngine {
  constructor() {
    this.ctx         = null;
    this.initialized = false;
    this.bgmPlaying  = false;
    this.bgmNodes    = [];
    this.masterGain  = null;
    this.muted       = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) { /* Audio not available */ }
  }

  playTone(freq, duration, type = 'square', vol = 0.15) {
    if (!this.initialized || this.muted) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  /* --- Sound Effects --- */
  sfxHit()    { this.playTone(440, 0.05, 'square', 0.12); }
  sfxBreak()  { this.playTone(660, 0.08, 'square', 0.15); this.playTone(880, 0.1, 'square', 0.1); }
  sfxPaddle() { this.playTone(220, 0.04, 'triangle', 0.1); }
  sfxItem()   { this.playTone(880, 0.06, 'square', 0.12); this.playTone(1100, 0.08, 'square', 0.1); }
  sfxMiss()   { this.playTone(150, 0.3, 'sawtooth', 0.15); this.playTone(100, 0.4, 'sawtooth', 0.1); }
  sfxBoss()   { this.playTone(110, 0.15, 'sawtooth', 0.12); }

  sfxExplosion() {
    if (!this.initialized || this.muted) return;
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src  = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  /* --- BGM --- */
  startBGM(isBoss = false) {
    this.stopBGM();
    if (!this.initialized || this.muted) return;
    this.bgmPlaying = true;
    const notes = isBoss
      ? [130.81, 155.56, 164.81, 196.00, 220.00, 196.00, 164.81, 155.56]
      : [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 196.00];
    const tempo = isBoss ? 0.15 : 0.2;
    let idx = 0;
    const playNext = () => {
      if (!this.bgmPlaying || !this.initialized) return;
      this.playTone(notes[idx % notes.length], tempo * 0.8, isBoss ? 'sawtooth' : 'square', 0.06);
      idx++;
      this.bgmTimeout = setTimeout(playNext, tempo * 1000);
    };
    playNext();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopBGM();
    return this.muted;
  }
}

// Global instance
const audio = new AudioEngine();
