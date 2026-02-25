/* ============================================================
   item.js — Power-up Items
   ============================================================ */
'use strict';

const ITEM_TYPES = {
  EXPAND:    { label: '▶◀', color: '#00ff00', desc: 'EXPAND' },
  SHRINK:    { label: '◀▶', color: '#ff00ff', desc: 'SHRINK' },
  MULTIBALL: { label: '●●●', color: '#00ccff', desc: 'MULTI' },
  FIREBALL:  { label: '🔥',  color: '#ff4400', desc: 'FIRE' },
  SHIELD:    { label: '━━', color: '#00ffff', desc: 'SHIELD' },
  SCORE2X:   { label: '×2',  color: '#ffff00', desc: 'SCOREx2' },
};

class Item {
  constructor(x, y, type) {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.vy     = 2;
    this.active = true;
    this.width  = 30;
    this.height = 16;
  }

  update() {
    this.y += this.vy;
    if (this.y > H) this.active = false;

    // Paddle catch
    if (this.y + this.height >= paddle.y && this.y <= paddle.y + paddle.height &&
        this.x + this.width / 2 >= paddle.x - paddle.drawWidth / 2 &&
        this.x - this.width / 2 <= paddle.x + paddle.drawWidth / 2) {
      this.active = false;
      applyItem(this.type);
      audio.sfxItem();
    }
  }

  draw(ctx) {
    const info = ITEM_TYPES[this.type];
    ctx.fillStyle   = info.color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    ctx.fillStyle    = '#ffffff';
    ctx.font         = '7px "Press Start 2P"';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.label, this.x, this.y + 1);
    ctx.globalAlpha = 1;
  }
}

let items         = [];
let activeEffects = [];

/* --- Apply item effect to the game --- */
function applyItem(type) {
  switch (type) {
    case 'EXPAND':
      if (paddle.expandTimers.length < 3) {
        paddle.widthMultiplier *= 1.8;
        paddle.expandTimers.push({ time: 15000 });
        activeEffects.push({ name: 'EXPAND', timer: 15000 });
      }
      break;

    case 'SHRINK':
      paddle.widthMultiplier *= 0.6;
      paddle.shrinkTimers.push({ time: 10000 });
      activeEffects.push({ name: 'SHRINK', timer: 10000 });
      break;

    case 'MULTIBALL': {
      const aliveBalls = balls.filter(b => b.active && !b.stuck);
      if (aliveBalls.length > 0) {
        const src = aliveBalls[0];
        for (let i = 0; i < 2; i++) {
          const angle = (Math.random() - 0.5) * 1.2;
          const cos = Math.cos(angle), sin = Math.sin(angle);
          const nb = new Ball(src.x, src.y,
            src.vx * cos - src.vy * sin,
            src.vx * sin + src.vy * cos);
          balls.push(nb);
        }
      }
      break;
    }

    case 'FIREBALL':
      fireballTimer = 8000;
      activeEffects.push({ name: 'FIRE', timer: 8000 });
      break;

    case 'SHIELD':
      shieldActive = true;
      break;

    case 'SCORE2X':
      scoreX2Timer = 20000;
      activeEffects.push({ name: 'SCOREx2', timer: 20000 });
      break;
  }
}

/* --- Drop an item from a destroyed block --- */
function dropItem(x, y, blockType) {
  let rate = BLOCK_TYPES[blockType].dropRate;
  if (blockType === 'GOLD') rate = 1.0;   // always drop

  if (Math.random() < rate) {
    let possibleItems;
    if (blockType === 'POISON') {
      possibleItems = ['SHRINK'];
    } else {
      possibleItems = ['EXPAND', 'MULTIBALL', 'FIREBALL', 'SHIELD', 'SCORE2X'];
    }
    const type = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    items.push(new Item(x, y, type));
  }
}
