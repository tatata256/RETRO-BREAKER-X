/* ============================================================
   particle.js — Particle Effect System
   ============================================================ */
'use strict';

class Particle {
  constructor(x, y, color) {
    this.x     = x;
    this.y     = y;
    this.vx    = (Math.random() - 0.5) * 6;
    this.vy    = (Math.random() - 0.5) * 6;
    this.life  = 1.0;
    this.decay = 0.02 + Math.random() * 0.03;
    this.size  = 2 + Math.random() * 3;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;          // gravity
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

let particles = [];

function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}
