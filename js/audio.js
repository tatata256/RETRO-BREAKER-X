/* ============================================================
   audio.js — 8ビット風チップチューンサウンドエンジン（Web Audio API）
   ============================================================ */
'use strict';

class AudioEngine {
  constructor() {
    this.ctx         = null;     // Web Audio APIのコンテキスト
    this.initialized = false;    // 初期化済みフラグ
    this.bgmPlaying  = false;    // BGM再生中フラグ
    this.bgmNodes    = [];       // BGM用のオーディオノード
    this.masterGain  = null;     // マスター音量ノード
    this.muted       = false;    // ミュート状態
  }

  /** オーディオコンテキストを初期化する（ユーザー操作時に呼ばれる） */
  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;   // マスター音量を30%に設定
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) { /* オーディオが利用できない環境 */ }
  }

  /**
   * 指定した周波数・長さで単音を鳴らす
   * @param {number} freq      - 周波数（Hz）
   * @param {number} duration  - 持続時間（秒）
   * @param {string} type      - 波形タイプ（square/triangle/sawtooth）
   * @param {number} vol       - 音量（0〜1）
   */
  playTone(freq, duration, type = 'square', vol = 0.15) {
    if (!this.initialized || this.muted) return;
    const osc  = this.ctx.createOscillator();      // オシレーター（音波生成）
    const gain = this.ctx.createGain();             // ゲインノード（音量制御）
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    // 音をフェードアウトさせる
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  /* --- 効果音 --- */
  sfxHit()    { this.playTone(440, 0.05, 'square', 0.12); }           // ブロックにダメージを与えた音
  sfxBreak()  { this.playTone(660, 0.08, 'square', 0.15); this.playTone(880, 0.1, 'square', 0.1); }  // ブロック破壊音
  sfxPaddle() { this.playTone(220, 0.04, 'triangle', 0.1); }          // パドル反射音
  sfxItem()   { this.playTone(880, 0.06, 'square', 0.12); this.playTone(1100, 0.08, 'square', 0.1); } // アイテム取得音
  sfxMiss()   { this.playTone(150, 0.3, 'sawtooth', 0.15); this.playTone(100, 0.4, 'sawtooth', 0.1); } // ミス（ライフ減少）音
  sfxBoss()   { this.playTone(110, 0.15, 'sawtooth', 0.12); }         // ボスにダメージを与えた音

  /** 爆発のノイズ音を生成して再生する */
  sfxExplosion() {
    if (!this.initialized || this.muted) return;
    const bufferSize = this.ctx.sampleRate * 0.2;   // 0.2秒分のバッファ
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data   = buffer.getChannelData(0);
    // ホワイトノイズを生成し、時間と共に減衰させる
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

  /* --- BGM（バックグラウンドミュージック） --- */
  /**
   * BGMをループ再生する
   * @param {boolean} isBoss - ボスステージ用BGMを流すかどうか
   */
  startBGM(isBoss = false) {
    this.stopBGM();
    if (!this.initialized || this.muted) return;
    this.bgmPlaying = true;
    // ボスと通常ステージで異なる音階パターンを定義
    const notes = isBoss
      ? [130.81, 155.56, 164.81, 196.00, 220.00, 196.00, 164.81, 155.56]   // ボス用（低音で不穏）
      : [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 196.00];  // 通常用（明るい）
    const tempo = isBoss ? 0.15 : 0.2;   // テンポ（秒/音符）
    let idx = 0;
    // 音符を順番に再生して疑似的にBGMを構成する
    const playNext = () => {
      if (!this.bgmPlaying || !this.initialized) return;
      this.playTone(notes[idx % notes.length], tempo * 0.8, isBoss ? 'sawtooth' : 'square', 0.06);
      idx++;
      this.bgmTimeout = setTimeout(playNext, tempo * 1000);  // 次の音符を予約
    };
    playNext();
  }

  /** BGMを停止する */
  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimeout) clearTimeout(this.bgmTimeout);
  }

  /** ミュートの切り替え（ON/OFF）。ミュート時はBGMも停止 */
  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopBGM();
    return this.muted;
  }
}

// グローバルに1つだけ作成するオーディオエンジンのインスタンス
const audio = new AudioEngine();
