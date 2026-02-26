/* ============================================================
   ball.js — Ball Physics
   ============================================================ */
'use strict';

class Ball {
  constructor(x, y, vx, vy) {
    this.x       = x;
    this.y       = y;
    this.vx      = vx;
    this.vy      = vy;
    this.radius  = 5;
    this.active  = true;
    this.stuck   = false;
    this.offsetX = 0;
  }

  get speed() { return Math.sqrt(this.vx * this.vx + this.vy * this.vy); }

  update() {
    if (this.stuck) {
      this.x = paddle.x + this.offsetX;
      this.y = paddle.y - this.radius;
      return;
    }

    const speedMult = slowTimer > 0 ? 0.5 : 1;
    this.x += this.vx * speedMult;
    this.y += this.vy * speedMult;

    // Wall collisions
    if (this.x - this.radius < 0) { this.x = this.radius;     this.vx = Math.abs(this.vx); }
    if (this.x + this.radius > W) { this.x = W - this.radius;  this.vx = -Math.abs(this.vx); }
    if (this.y - this.radius < STATUS_BAR_H) { this.y = STATUS_BAR_H + this.radius; this.vy = Math.abs(this.vy); }

    // Shield collision
    if (shieldActive && this.vy > 0 &&
        this.y + this.radius >= shieldY &&
        this.y + this.radius <= shieldY + 6) {
      this.vy = -Math.abs(this.vy);
      shieldActive = false;
      spawnParticles(this.x, shieldY, '#00ffff', 12);
      audio.sfxPaddle();
    }

    // Bottom — miss
    if (this.y - this.radius > H) {
      this.active = false;
    }

    // Paddle collision
    if (this.vy > 0 &&
        this.y + this.radius >= paddle.y &&
        this.y + this.radius <= paddle.y + paddle.height + 4 &&
        this.x >= paddle.x - paddle.drawWidth / 2 - this.radius &&
        this.x <= paddle.x + paddle.drawWidth / 2 + this.radius) {
      const relX  = (this.x - paddle.x) / (paddle.drawWidth / 2);
      const angle = relX * (70 * Math.PI / 180);
      const spd   = Math.min(this.speed, 12);
      this.vx = spd * Math.sin(angle);
      this.vy = -spd * Math.cos(angle);
      this.y  = paddle.y - this.radius;
      combo      = 0;
      comboTimer = 0;
      audio.sfxPaddle();
    }

    // Clamp speed
    const currentSpeed = this.speed;
    if (currentSpeed > 12) {
      const scale = 12 / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (fireballTimer > 0) {
      ctx.fillStyle   = '#ff4400';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur  = 10;
    } else {
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur  = 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

let balls = [];

function launchBall() {
  balls.forEach(b => {
    if (b.stuck) {
      const baseSpeed = Math.min(5 + (stage - 1) * 0.3, 9);
      b.vx    = (Math.random() - 0.5) * 3;
      b.vy    = -baseSpeed;
      b.stuck = false;
    }
  });
}

function resetBall() {
  balls = [new Ball(paddle.x, paddle.y - 6, 0, 0)];
  balls[0].stuck   = true;
  balls[0].offsetX = 0;
}
