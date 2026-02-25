/* ============================================================
   collision.js — Block-Ball Collision & Destruction Effects
   ============================================================ */
'use strict';

function checkBlockCollision(ball) {
  for (const block of blocks) {
    if (!block.alive) continue;

    const bx = block.drawX;
    const by = block.drawY;

    if (ball.x + ball.radius > bx && ball.x - ball.radius < bx + BLOCK_W &&
        ball.y + ball.radius > by && ball.y - ball.radius < by + BLOCK_H) {

      const dmg       = fireballTimer > 0 ? 999 : 1;
      const destroyed = block.hit(dmg);

      if (fireballTimer <= 0) {
        // Reflect ball based on smallest overlap axis
        const overlapLeft   = (ball.x + ball.radius) - bx;
        const overlapRight  = (bx + BLOCK_W) - (ball.x - ball.radius);
        const overlapTop    = (ball.y + ball.radius) - by;
        const overlapBottom = (by + BLOCK_H) - (ball.y - ball.radius);
        const minOverlap    = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop || minOverlap === overlapBottom) ball.vy = -ball.vy;
        else ball.vx = -ball.vx;
      }

      if (destroyed) {
        onBlockDestroyed(block, ball);
      } else {
        audio.sfxHit();
        spawnParticles(ball.x, ball.y, BLOCK_TYPES[block.type].color, 3);
      }
      return true;
    }
  }
  return false;
}

function onBlockDestroyed(block, ball) {
  const info = BLOCK_TYPES[block.type];

  // Combo
  combo++;
  comboTimer = 180;
  if (combo > maxCombo) maxCombo = combo;
  const comboMult = Math.min(1 + Math.floor(combo / 3), 8);

  // Score
  let pts = info.score * comboMult;
  if (scoreX2Timer > 0) pts *= 2;
  score += pts;

  // Particles & sound
  spawnParticles(block.centerX, block.centerY, info.color, 10);
  audio.sfxBreak();

  // --- Special block effects ---
  switch (block.type) {
    case 'ARMOR':
      // Explosion: damage all adjacent blocks
      blocks.forEach(b => {
        if (!b.alive || b === block) return;
        if (Math.abs(b.col - block.col) <= 1 && Math.abs(b.row - block.row) <= 1) {
          if (b.hit(1)) onBlockDestroyed(b, ball);
        }
      });
      audio.sfxExplosion();
      break;

    case 'SPLITTER':
      if (ball) {
        const angle1 = Math.PI / 6;
        const newBall = new Ball(ball.x, ball.y,
          ball.vx * Math.cos(angle1) - ball.vy * Math.sin(angle1),
          ball.vx * Math.sin(angle1) + ball.vy * Math.cos(angle1));
        balls.push(newBall);
      }
      break;

    case 'POISON':
      slowTimer = 3000;
      activeEffects.push({ name: 'SLOW', timer: 3000 });
      break;

    case 'MIRROR':
      balls.forEach(b => {
        if (b.active && !b.stuck) { b.vx = -b.vx; b.vy = -b.vy; }
      });
      spawnParticles(block.centerX, block.centerY, '#ffffff', 15);
      break;
  }

  // Item drop
  dropItem(block.centerX, block.centerY, block.type);
}
