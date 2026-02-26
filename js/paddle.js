/* ============================================================
   paddle.js — Player Paddle
   ============================================================ */
'use strict';

const paddle = {
  x: W / 2,
  y: H - 90,
  width: 80,
  baseWidth: 80,
  height: 12,
  speed: 8,
  widthMultiplier: 1,
  shrinkTimers: [],
  expandTimers: [],

  get drawWidth() { return this.baseWidth * this.widthMultiplier; },

  update() {
    this.width = this.drawWidth;
    if (this.x - this.width / 2 < 0) this.x = this.width / 2;
    if (this.x + this.width / 2 > W) this.x = W - this.width / 2;

    // Update expand timers
    this.expandTimers = this.expandTimers.filter(t => {
      t.time -= 16.67;
      if (t.time <= 0) { this.widthMultiplier /= 1.8; return false; }
      return true;
    });
    // Update shrink timers
    this.shrinkTimers = this.shrinkTimers.filter(t => {
      t.time -= 16.67;
      if (t.time <= 0) { this.widthMultiplier /= 0.6; return false; }
      return true;
    });
  },

  draw(ctx) {
    const w = this.drawWidth;
    const grad = ctx.createLinearGradient(this.x - w / 2, this.y, this.x + w / 2, this.y);
    grad.addColorStop(0, '#00cc66');
    grad.addColorStop(0.5, '#00ff88');
    grad.addColorStop(1, '#00cc66');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x - w / 2, this.y, w, this.height);
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - w / 2, this.y, w, this.height);
  },

  reset() {
    this.x = W / 2;
    this.widthMultiplier = 1;
    this.shrinkTimers = [];
    this.expandTimers = [];
  }
};
