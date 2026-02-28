/* ============================================================
   block.js — Block Types & Block Class
   ============================================================ */
'use strict';

// --- Preload block images ---
const blockImages = {};
{
  const img = new Image();
  img.src = 'img/block/explosive.png';
  blockImages.ARMOR = img;
}

const BLOCK_TYPES = {
  NORMAL:   { name: 'Normal',   color: '#888888', hp: 1, dropRate: 0.10, score: 100 },
  ARMOR:    { name: 'Armor',    color: '#c0c0c0', hp: 3, dropRate: 0.20, score: 300 },
  SPLITTER: { name: 'Splitter', color: '#00cccc', hp: 1, dropRate: 0.30, score: 150 },
  MOVING:   { name: 'Moving',   color: '#cccc00', hp: 1, dropRate: 0.15, score: 150 },
  POISON:   { name: 'Poison',   color: '#9900cc', hp: 1, dropRate: 0.00, score: 100 },
  GOLD:     { name: 'Gold',     color: '#ffcc00', hp: 2, dropRate: 0.60, score: 500 },
  INVISI:   { name: 'Invisi',   color: '#ffffff', hp: 1, dropRate: 0.05, score: 200 },
  MIRROR:   { name: 'Mirror',   color: '#eeeeff', hp: 1, dropRate: 0.10, score: 200 },
};

class Block {
  constructor(col, row, type) {
    this.col        = col;
    this.row        = row;
    this.x          = BLOCK_OFFSET_X + col * BLOCK_W;
    this.y          = BLOCK_OFFSET_Y + row * BLOCK_H;
    this.type       = type;
    this.hp         = BLOCK_TYPES[type].hp;
    this.maxHp      = this.hp;
    this.alive      = true;
    this.moveDir    = 1;
    this.moveOffset = 0;
    this.invisiTimer = Math.random() * Math.PI * 2;
  }

  get drawX()   { return this.x + (this.type === 'MOVING' ? this.moveOffset : 0); }
  get drawY()   { return this.y; }
  get centerX() { return this.drawX + BLOCK_W / 2; }
  get centerY() { return this.drawY + BLOCK_H / 2; }

  update(dt) {
    if (!this.alive) return;
    if (this.type === 'MOVING') {
      const mSpeed = 0.5 + stage * 0.15;
      this.moveOffset += this.moveDir * mSpeed;
      const maxOff = BLOCK_W * 0.8;
      if (Math.abs(this.moveOffset) > maxOff) {
        this.moveDir *= -1;
        this.moveOffset = Math.sign(this.moveOffset) * maxOff;
      }
    }
    if (this.type === 'INVISI') {
      this.invisiTimer += 0.03;
    }
  }

  draw(ctx) {
    if (!this.alive) return;
    const bx = this.drawX;
    const by = this.drawY;

    let alpha = 1;
    if (this.type === 'INVISI') {
      alpha = 0.3 + 0.4 * Math.abs(Math.sin(this.invisiTimer));
    }

    ctx.globalAlpha = alpha;
    const info = BLOCK_TYPES[this.type];

    // Block body
    ctx.fillStyle = info.color;
    ctx.fillRect(bx + 1, by + 1, BLOCK_W - 2, BLOCK_H - 2);

    // HP indicator for multi-hp blocks
    if (this.maxHp > 1 && this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      const dmgWidth = (1 - this.hp / this.maxHp) * (BLOCK_W - 4);
      ctx.fillRect(bx + 2, by + 2, dmgWidth, BLOCK_H - 4);
    }

    // Special visual indicators
    if (this.type === 'ARMOR') {
      const aImg = blockImages.ARMOR;
      if (aImg && aImg.complete && aImg.naturalWidth > 0) {
        ctx.drawImage(aImg, bx + 1, by + 1, BLOCK_W - 2, BLOCK_H - 2);
      } else {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.strokeRect(bx + 3, by + 3, BLOCK_W - 6, BLOCK_H - 6);
      }
    }
    if (this.type === 'GOLD') {
      ctx.strokeStyle = '#fff700'; ctx.lineWidth = 2;
      ctx.strokeRect(bx + 2, by + 2, BLOCK_W - 4, BLOCK_H - 4);
    }
    if (this.type === 'SPLITTER') {
      ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('S', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 3);
    }
    if (this.type === 'POISON') {
      ctx.fillStyle = '#ff00ff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('P', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 3);
    }
    if (this.type === 'MIRROR') {
      ctx.fillStyle = '#aaaaff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('M', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 3);
    }
    if (this.type === 'MOVING') {
      ctx.fillStyle = '#000000'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('>>', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 2);
    }

    ctx.globalAlpha = 1;
  }

  hit(dmg = 1) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) { this.alive = false; return true; }   // destroyed
    return false;                                             // damaged
  }
}

let blocks = [];
