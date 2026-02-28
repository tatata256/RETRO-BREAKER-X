/* ============================================================
   paddle.js — プレイヤーが操作するパドル
   ============================================================ */
'use strict';

const paddle = {
  x: W / 2,              // パドル中心のX座標（初期値は画面中央）
  y: H - 50,             // パドルのY座標（画面下部から50px上）
  width: 80,             // 現在の描画幅（updateで更新）
  baseWidth: 80,         // 基本の幅（アイテム効果の基準値）
  height: 20,            // パドルの高さ（px）
  speed: 8,              // キーボード操作時の移動速度（px/フレーム）
  widthMultiplier: 1,    // 幅の倍率（拡大/縮小アイテムで変化）
  shrinkTimers: [],      // 縮小効果のタイマー配列
  expandTimers: [],      // 拡大効果のタイマー配列

  /** 現在の描画幅を計算する（基本幅×倍率） */
  get drawWidth() { return this.baseWidth * this.widthMultiplier; },

  /** パドルの状態を毎フレーム更新する */
  update() {
    this.width = this.drawWidth;
    // 画面左端を超えないように制限
    if (this.x - this.width / 2 < 0) this.x = this.width / 2;
    // 画面右端を超えないように制限
    if (this.x + this.width / 2 > W) this.x = W - this.width / 2;

    // 拡大タイマーを更新（時間切れで倍率を元に戻す）
    this.expandTimers = this.expandTimers.filter(t => {
      t.time -= 16.67;
      if (t.time <= 0) { this.widthMultiplier /= 1.8; return false; }
      return true;
    });
    // 縮小タイマーを更新（時間切れで倍率を元に戻す）
    this.shrinkTimers = this.shrinkTimers.filter(t => {
      t.time -= 16.67;
      if (t.time <= 0) { this.widthMultiplier /= 0.6; return false; }
      return true;
    });
  },

  /** パドルをグラデーションで描画する */
  draw(ctx) {
    const w = this.drawWidth;
    // 左右が暗く中央が明るい緑のグラデーション
    const grad = ctx.createLinearGradient(this.x - w / 2, this.y, this.x + w / 2, this.y);
    grad.addColorStop(0, '#00cc66');
    grad.addColorStop(0.5, '#00ff88');
    grad.addColorStop(1, '#00cc66');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - w / 2, this.y, w, this.height);
    // 枠線を描画
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - w / 2, this.y, w, this.height);
  },

  /** パドルを初期状態にリセットする */
  reset() {
    this.x = W / 2;
    this.widthMultiplier = 1;
    this.shrinkTimers = [];
    this.expandTimers = [];
  }
};
