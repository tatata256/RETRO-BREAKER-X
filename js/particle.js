/* ============================================================
   particle.js — パーティクル（演出用の小さな粒子）エフェクトシステム
   ============================================================ */
'use strict';

/** パーティクル1粒を表すクラス */
class Particle {
  /**
   * @param {number} x     - 出現X座標
   * @param {number} y     - 出現Y座標
   * @param {string} color - パーティクルの色
   */
  constructor(x, y, color) {
    this.x     = x;
    this.y     = y;
    this.vx    = (Math.random() - 0.5) * 6;            // X方向の速度（ランダム）
    this.vy    = (Math.random() - 0.5) * 6;            // Y方向の速度（ランダム）
    this.life  = 1.0;                                   // 残りライフ（1.0→0.0で消滅）
    this.decay = 0.02 + Math.random() * 0.03;          // 毎フレームの減衰量
    this.size  = 2 + Math.random() * 3;                // 粒子サイズ（px）
    this.color = color;
  }

  /** 位置と寿命を更新する */
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;          // 重力で下方向に加速
    this.life -= this.decay;
  }

  /** 半透明の矩形として描画する */
  draw(ctx) {
    ctx.globalAlpha = this.life;    // 寿命に応じてフェードアウト
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;            // 透明度をリセット
  }
}

/** 画面上に存在するパーティクルの配列 */
let particles = [];

/**
 * 指定座標にパーティクルを生成する
 * @param {number} x      - 発生地点のX座標
 * @param {number} y      - 発生地点のY座標
 * @param {string} color  - パーティクルの色
 * @param {number} count  - 生成する数（デフォルト8）
 */
function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}
