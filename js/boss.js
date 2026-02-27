/* ============================================================
   boss.js — Boss Enemies
   ============================================================ */
'use strict';

class Boss {
  constructor(type) {
    this.type       = type;
    this.x          = W / 2;
    this.y          = 80;
    this.width      = 80;
    this.height     = 30;
    this.alive      = true;
    this.phase      = 1;
    this.moveDir    = 1;
    this.timer      = 0;
    this.invulnTimer = 0;
    this.barrierTimer = 0;
    this.invisTimer = 0;
    this.visible    = true;
    this.cores      = [];

    switch (type) {
      case 'GATEKEEPER': this.maxHp = 20; this.hp = 20; this.width = 90; break;
      case 'PHANTOM':    this.maxHp = 35; this.hp = 35; this.width = 80; break;
      case 'CHAOSCORE':  this.maxHp = 60; this.hp = 60; this.width = 70; break;
    }
  }

  update() {
    if (!this.alive) return;
    this.timer++;
    switch (this.type) {
      case 'GATEKEEPER': this.updateGatekeeper(); break;
      case 'PHANTOM':    this.updatePhantom();    break;
      case 'CHAOSCORE':  this.updateChaosCore();  break;
    }
    if (this.invulnTimer > 0) this.invulnTimer--;
  }

  /* --- GATE KEEPER: moves + shoots + spawns barrier blocks --- */
  updateGatekeeper() {
    this.x += this.moveDir * 2;
    if (this.x > W - this.width / 2) { this.x = W - this.width / 2; this.moveDir = -1; }
    if (this.x < this.width / 2)     { this.x = this.width / 2;     this.moveDir =  1; }

    // Shoot aimed bullet at paddle
    if (this.timer % 120 === 0) {
      const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
      bossBullets.push(new BossBullet(
        this.x, this.y + this.height / 2,
        Math.cos(angle) * 3, Math.sin(angle) * 3,
        '#ff4444'
      ));
    }

    if (this.timer % 180 === 0 && blocks.filter(b => b.alive).length < 6) {
      const col = Math.floor(Math.random() * BLOCK_COLS);
      const row = Math.floor(Math.random() * 3) + 3;
      blocks.push(new Block(col, row, 'NORMAL'));
    }
  }

  /* --- PHANTOM: goes invisible + shoots bullets + spawns moving blocks at low HP --- */
  updatePhantom() {
    this.x += this.moveDir * 1.5;
    if (this.x > W - this.width / 2) this.moveDir = -1;
    if (this.x < this.width / 2)     this.moveDir =  1;

    this.invisTimer++;
    this.visible = this.invisTimer % 120 >= 40;

    // Shoot bullets (like GATEKEEPER)
    if (this.visible && this.timer % 90 === 0) {
      const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
      bossBullets.push(new BossBullet(
        this.x, this.y + this.height / 2,
        Math.cos(angle) * 3, Math.sin(angle) * 3,
        '#9944ff'
      ));
    }

    // Spread shot when invisible ends
    if (this.invisTimer % 120 === 40) {
      for (let i = -1; i <= 1; i++) {
        bossBullets.push(new BossBullet(
          this.x + i * 20, this.y + this.height / 2,
          i * 1.5, 3, '#cc66ff'
        ));
      }
    }

    if (this.hp < this.maxHp * 0.5 && this.timer % 150 === 0 && blocks.filter(b => b.alive).length < 5) {
      const col = Math.floor(Math.random() * BLOCK_COLS);
      const row = Math.floor(Math.random() * 4) + 3;
      blocks.push(new Block(col, row, 'MOVING'));
    }
  }

  /* --- CHAOS CORE: 3-phase boss with aggressive attacks --- */
  updateChaosCore() {
    const hpRatio = this.hp / this.maxHp;

    if (hpRatio > 0.66) {
      // Phase 1 — Fast movement + aimed shots
      this.phase = 1;
      this.x += this.moveDir * 4;
      if (this.timer % 60 === 0) {
        const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
        bossBullets.push(new BossBullet(
          this.x, this.y + this.height / 2,
          Math.cos(angle) * 4, Math.sin(angle) * 4,
          '#ff4400'
        ));
      }
    } else if (hpRatio > 0.33) {
      // Phase 2 — Gravity pull on balls + spread shots
      this.phase = 2;
      this.x += this.moveDir * 2;
      balls.forEach(b => {
        if (b.active && !b.stuck) {
          const dx = this.x - b.x, dy = this.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < 250) {
            b.vx += (dx / dist) * 0.08;
            b.vy += (dy / dist) * 0.08;
          }
        }
      });
      if (this.timer % 45 === 0) {
        for (let i = -2; i <= 2; i++) {
          bossBullets.push(new BossBullet(
            this.x, this.y + this.height / 2,
            i * 1.5, 3.5, '#ff8800'
          ));
        }
      }
    } else {
      // Phase 3 — Split into cores + rapid fire
      this.phase = 3;
      this.x += this.moveDir * 3;
      if (this.cores.length === 0) {
        this.cores = [
          { x: this.x - 40, y: this.y, dir:  1 },
          { x: this.x + 40, y: this.y, dir: -1 },
        ];
      }
      this.cores.forEach(c => {
        c.x += c.dir * 2;
        if (c.x > W - 20) c.dir = -1;
        if (c.x < 20)     c.dir =  1;
      });
      // Main body aimed shot
      if (this.timer % 50 === 0) {
        const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
        bossBullets.push(new BossBullet(
          this.x, this.y + this.height / 2,
          Math.cos(angle) * 4.5, Math.sin(angle) * 4.5,
          '#ff2200'
        ));
      }
      // Sub-cores shoot downward
      if (this.timer % 70 === 0) {
        this.cores.forEach(c => {
          bossBullets.push(new BossBullet(c.x, c.y + 10, 0, 3, '#ff6600'));
        });
      }
    }

    if (this.x > W - this.width / 2) this.moveDir = -1;
    if (this.x < this.width / 2)     this.moveDir =  1;

    // Spawn armor blocks periodically
    if (this.timer % 200 === 0 && blocks.filter(b => b.alive).length < 4) {
      const col = Math.floor(Math.random() * BLOCK_COLS);
      const row = Math.floor(Math.random() * 3) + 3;
      blocks.push(new Block(col, row, 'ARMOR'));
    }
  }

  /* --- Collision check with a ball --- */
  checkHit(ball) {
    if (!this.alive || this.invulnTimer > 0) return false;
    if (this.type === 'PHANTOM' && !this.visible) return false;

    const hitBoxes = [{ x: this.x, y: this.y, w: this.width, h: this.height }];
    if (this.type === 'CHAOSCORE' && this.phase === 3) {
      this.cores.forEach(c => hitBoxes.push({ x: c.x, y: c.y, w: 30, h: 20 }));
    }

    for (const box of hitBoxes) {
      if (ball.x + ball.radius > box.x - box.w / 2 &&
          ball.x - ball.radius < box.x + box.w / 2 &&
          ball.y + ball.radius > box.y - box.h / 2 &&
          ball.y - ball.radius < box.y + box.h / 2) {
        this.hp--;
        this.invulnTimer = 10;
        ball.vy = -ball.vy;
        score += 50;
        audio.sfxBoss();
        spawnParticles(ball.x, ball.y, '#ff0044', 6);
        if (this.hp <= 0) {
          this.alive = false;
          spawnParticles(this.x, this.y, '#ffcc00', 30);
          audio.sfxExplosion();
        }
        return true;
      }
    }
    return false;
  }

  draw(ctx) {
    if (!this.alive) return;

    let alpha = 1;
    if (this.type === 'PHANTOM' && !this.visible) alpha = 0.15;
    if (this.invulnTimer > 0 && this.invulnTimer % 4 < 2) alpha = 0.3;
    ctx.globalAlpha = alpha;

    let color;
    switch (this.type) {
      case 'GATEKEEPER': color = '#ff4444'; break;
      case 'PHANTOM':    color = '#9944ff'; break;
      case 'CHAOSCORE':  color = this.phase === 3 ? '#ff8800' : '#ff2200'; break;
    }

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    // Name
    ctx.fillStyle = '#ffffff'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
    const names = { GATEKEEPER: 'GATE KEEPER', PHANTOM: 'PHANTOM', CHAOSCORE: 'CHAOS CORE' };
    ctx.fillText(names[this.type], this.x, this.y + 2);

    // Phase 3 sub-cores
    if (this.type === 'CHAOSCORE' && this.phase === 3) {
      this.cores.forEach(c => {
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(c.x - 15, c.y - 10, 30, 20);
        ctx.strokeRect(c.x - 15, c.y - 10, 30, 20);
      });
    }
    ctx.globalAlpha = 1;

    // HP bar
    const barW = 200, barH = 8;
    const barX = W / 2 - barW / 2, barY = 30;
    ctx.fillStyle = '#333';  ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = color;   ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText(`HP ${this.hp}/${this.maxHp}`, W / 2, barY - 2);
  }
}

let boss        = null;
let isBossStage = false;
let bossBullets = [];

/* --- Boss Bullet --- */
class BossBullet {
  constructor(x, y, vx, vy, color) {
    this.x      = x;
    this.y      = y;
    this.vx     = vx;
    this.vy     = vy;
    this.radius = 4;
    this.color  = color || '#ff4444';
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
      this.active = false;
      return;
    }

    // Hit paddle → lose a life
    if (this.y + this.radius >= paddle.y &&
        this.y - this.radius <= paddle.y + paddle.height &&
        this.x >= paddle.x - paddle.drawWidth / 2 &&
        this.x <= paddle.x + paddle.drawWidth / 2) {
      this.active = false;
      spawnParticles(this.x, this.y, this.color, 10);
      loseLife();
    }

    // Hit shield
    if (shieldActive && this.vy > 0 &&
        this.y + this.radius >= shieldY &&
        this.y + this.radius <= shieldY + 6) {
      this.active = false;
      shieldActive = false;
      spawnParticles(this.x, shieldY, '#00ffff', 8);
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
