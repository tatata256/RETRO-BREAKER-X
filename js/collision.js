/* ============================================================
   collision.js — ボールとブロックの衝突判定と破壊処理
   ============================================================ */
'use strict';

/**
 * ボールと全ブロックの衝突を確認し、ヒット時に反射とダメージを処理する
 * @param {Ball} ball - 判定対象のボール
 * @returns {boolean} 衝突があったかどうか
 */
function checkBlockCollision(ball) {
  for (const block of blocks) {
    if (!block.alive) continue;

    const bx = block.drawX;
    const by = block.drawY;

    // 矩形と円の簡易衝突判定
    if (ball.x + ball.radius > bx && ball.x - ball.radius < bx + BLOCK_W &&
        ball.y + ball.radius > by && ball.y - ball.radius < by + BLOCK_H) {

      // ファイアボール中は999ダメージ（即破壊）
      const dmg       = fireballTimer > 0 ? 999 : 1;
      const destroyed = block.hit(dmg);

      if (fireballTimer <= 0) {
        // 通常時：最も浅いめり込み軸でボールを反射
        const overlapLeft   = (ball.x + ball.radius) - bx;
        const overlapRight  = (bx + BLOCK_W) - (ball.x - ball.radius);
        const overlapTop    = (ball.y + ball.radius) - by;
        const overlapBottom = (by + BLOCK_H) - (ball.y - ball.radius);
        const minOverlap    = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        // 上下からの衝突ならY反転、左右ならX反転
        if (minOverlap === overlapTop || minOverlap === overlapBottom) ball.vy = -ball.vy;
        else ball.vx = -ball.vx;
      }

      if (destroyed) {
        onBlockDestroyed(block, ball);   // 破壊時の特殊効果を実行
      } else {
        audio.sfxHit();                  // ダメージ音
        spawnParticles(ball.x, ball.y, BLOCK_TYPES[block.type].color, 3);
      }
      return true;
    }
  }
  return false;
}

/**
 * ブロック破壊時のスコア加算・コンボ・特殊効果・アイテムドロップを処理する
 * @param {Block} block - 破壊されたブロック
 * @param {Ball}  ball  - 破壊のきっかけとなったボール
 */
function onBlockDestroyed(block, ball) {
  const info = BLOCK_TYPES[block.type];

  // --- コンボ計算 ---
  combo++;
  comboTimer = 180;                                         // コンボ表示時間（フレーム）
  if (combo > maxCombo) maxCombo = combo;
  const comboMult = Math.min(1 + Math.floor(combo / 3), 8); // 3連続毎に倍率UP（最大8倍）

  // --- スコア加算 ---
  let pts = info.score * comboMult;
  if (scoreX2Timer > 0) pts *= 2;   // スコア2倍ボーナス中
  score += pts;

  // --- パーティクルと破壊音 ---
  spawnParticles(block.centerX, block.centerY, info.color, 10);
  audio.sfxBreak();

  // --- ブロックタイプ別の特殊効果 ---
  switch (block.type) {
    case 'ARMOR':
      // 爆発：隣接ブロックに1ダメージ（連鎖破壊あり）
      blocks.forEach(b => {
        if (!b.alive || b === block) return;
        if (Math.abs(b.col - block.col) <= 1 && Math.abs(b.row - block.row) <= 1) {
          if (b.hit(1)) onBlockDestroyed(b, ball);   // 再帰的に破壊処理
        }
      });
      audio.sfxExplosion();
      break;

    case 'SPLITTER':
      // ボール分裂：新しいボールを1つ追加（角度を少しずらす）
      if (ball) {
        const angle1 = Math.PI / 6;   // 30度回転
        const newBall = new Ball(ball.x, ball.y,
          ball.vx * Math.cos(angle1) - ball.vy * Math.sin(angle1),
          ball.vx * Math.sin(angle1) + ball.vy * Math.cos(angle1));
        balls.push(newBall);
      }
      break;

    case 'POISON':
      // ボール減速効果を3秒間付与
      slowTimer = 3000;
      activeEffects.push({ name: 'SLOW', timer: 3000 });
      break;

    case 'MIRROR':
      // 全ボールの速度ベクトルを反転
      balls.forEach(b => {
        if (b.active && !b.stuck) { b.vx = -b.vx; b.vy = -b.vy; }
      });
      spawnParticles(block.centerX, block.centerY, '#ffffff', 15);
      break;
  }

  // アイテムのドロップ判定
  dropItem(block.centerX, block.centerY, block.type);
}
