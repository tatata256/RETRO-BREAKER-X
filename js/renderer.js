/* ============================================================
   renderer.js — 全画面の描画と視覚演出
   ============================================================ */
'use strict';

let frameCount = 0;   // フレームカウンター（アニメーション用）

/* --- ゲーム状態に応じた描画の振り分け --- */
function draw() {
  frameCount++;
  // 背景を暗い紺色でクリア
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, W, H);

  switch (gameState) {
    case STATE.TITLE:      drawTitle();  break;                 // タイトル画面
    case STATE.READY:      drawGame(); drawReady(); break;      // ゲーム画面＋"READY"オーバーレイ
    case STATE.PLAYING:    drawGame();  break;                  // ゲームプレイ中
    case STATE.PAUSED:     drawGame(); drawPause(); break;      // ゲーム画面＋ポーズオーバーレイ
    case STATE.GAMEOVER:   drawGameOver();   break;             // ゲームオーバー画面
    case STATE.STAGECLEAR: drawStageClear(); break;             // ステージクリア画面
    case STATE.RANKING:    drawRanking();    break;             // ランキング画面
  }

  drawCRT();   // CRT風フィルターを最前面に重ねる
}

/* --- ゲームプレイ中の描画 --- */
function drawGame() {
  drawStatusBar();                        // ステータスバー（スコア・ライフ等）
  blocks.forEach(b => b.draw(ctx));       // ブロック
  if (boss) boss.draw(ctx);              // ボス
  bossBullets.forEach(b => b.draw(ctx)); // ボス弾
  items.forEach(i => i.draw(ctx));       // アイテム

  // シールドラインの描画
  if (shieldActive) {
    ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(20, shieldY); ctx.lineTo(W - 20, shieldY); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  paddle.draw(ctx);                      // パドル
  balls.forEach(b => b.draw(ctx));       // ボール
  particles.forEach(p => p.draw(ctx));   // パーティクル
  drawActiveEffects();                   // アクティブな効果の残り時間表示

  // コンボ表示（3コンボ以上で画面中央に表示）
  if (combo >= 3) {
    ctx.fillStyle = '#ffcc00'; ctx.font = '12px "Press Start 2P"'; ctx.textAlign = 'center';
    const scale = 1 + Math.sin(frameCount * 0.1) * 0.1;   // 脈動アニメーション
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(scale, scale);
    ctx.fillText(`${combo} COMBO!`, 0, 0);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(`x${Math.min(1 + Math.floor(combo / 3), 8)}`, 0, 16);   // コンボ倍率
    ctx.restore();
  }
}

/* --- ステータスバー（画面上部のスコア・ステージ・ライフ情報） --- */
function drawStatusBar() {
  // 半透明の黒い背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, 42);

  ctx.fillStyle = '#00ff88'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 8, 16);    // スコア
  ctx.fillText(`STAGE ${stage}`, 8, 32);    // ステージ番号

  // ライフを♥マークで表示
  ctx.textAlign = 'right';
  let lifeStr = '';
  for (let i = 0; i < lives; i++) lifeStr += '♥ ';
  ctx.fillStyle = '#ff4466';
  ctx.fillText(lifeStr, W - 8, 16);

  // コンボ数表示
  if (combo > 0) { ctx.fillStyle = '#ffcc00'; ctx.fillText(`COMBO ${combo}`, W - 8, 32); }
}

/** 画面下部に現在有効なアイテム効果と残り時間を表示する */
function drawActiveEffects() {
  const y = H - 20;
  ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'left';
  let x = 8;
  activeEffects.forEach(e => {
    const sec = Math.ceil(e.timer / 1000);   // 残り秒数
    // 効果の種類に応じた色分け
    let col = '#00ff88';
    if (e.name === 'SHRINK' || e.name === 'SLOW') col = '#ff00ff';   // デバフはピンク
    if (e.name === 'FIRE')   col = '#ff4400';                       // ファイアは赤
    if (e.name === 'SCOREx2') col = '#ffff00';                      // スコア倍は黄
    ctx.fillStyle = col;
    ctx.fillText(`${e.name}:${sec}s`, x, y);
    x += 80;
  });
  // シールドが有効なら表示
  if (shieldActive) { ctx.fillStyle = '#00ffff'; ctx.fillText('SHIELD', x, y); }
}

/* --- オーバーレイ画面群 --- */

/** "READY" カウントダウン画面（ボスステージは警告表示付き） */
function drawReady() {
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#00ff88'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
  ctx.fillText(`STAGE ${stage}`, W / 2, H / 2 - 20);

  if (isBossStage) {
    // ボスステージではボス名とWARNINGを表示
    ctx.fillStyle = '#ff4444'; ctx.font = '12px "Press Start 2P"';
    const bossNames = { 6: 'GATE KEEPER', 11: 'PHANTOM', 16: 'CHAOS CORE' };
    ctx.fillText(`BOSS: ${bossNames[stage] || '???'}`, W / 2, H / 2 + 10);
    ctx.font = '8px "Press Start 2P"'; ctx.fillText('WARNING!', W / 2, H / 2 + 30);
  }

  ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"';
  ctx.fillText('GET READY', W / 2, H / 2 + 50);
}

/** タイトル画面の描画（星アニメ・ロゴ・操作説明） */
function drawTitle() {
  // 背景に流れる星のアニメーション
  for (let i = 0; i < 50; i++) {
    const sx = (Math.sin(i * 127.1 + frameCount * 0.01) * 0.5 + 0.5) * W;
    const sy = (Math.cos(i * 311.7 + frameCount * 0.008) * 0.5 + 0.5) * H;
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(frameCount * 0.05 + i) * 0.3})`;
    ctx.fillRect(sx, sy, 2, 2);
  }

  // ゲームタイトル（光る緑の文字）
  ctx.fillStyle = '#00ff88'; ctx.font = '24px "Press Start 2P"'; ctx.textAlign = 'center';
  ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 15;
  ctx.fillText('RETRO', W / 2, H / 3 - 20);
  ctx.fillText('BREAKER X', W / 2, H / 3 + 20);
  ctx.shadowBlur = 0;

  // サブタイトル
  ctx.fillStyle = '#ff00ff'; ctx.font = '8px "Press Start 2P"';
  ctx.fillText('WEB BLOCK BREAKING GAME', W / 2, H / 3 + 50);

  // 「CLICK TO START」の点滅表示
  if (Math.floor(frameCount / 30) % 2 === 0) {
    ctx.fillStyle = '#ffffff'; ctx.font = '10px "Press Start 2P"';
    ctx.fillText('CLICK TO START', W / 2, H * 0.65);
  }

  // 操作説明
  ctx.fillStyle = '#888888'; ctx.font = '7px "Press Start 2P"';
  ctx.fillText('MOUSE/KEYS: MOVE PADDLE', W / 2, H * 0.78);
  ctx.fillText('CLICK/SPACE: LAUNCH BALL', W / 2, H * 0.83);
  ctx.fillText('P/ESC: PAUSE', W / 2, H * 0.88);

  // バージョン情報
  ctx.fillStyle = '#ffcc00'; ctx.font = '7px "Press Start 2P"';
  ctx.fillText('v1.0 | 2026', W / 2, H * 0.95);
}

/** ポーズ画面の描画 */
function drawPause() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#00ff88'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center';
  ctx.fillText('PAUSED', W / 2, H / 2);
  ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"';
  ctx.fillText('PRESS P OR ESC', W / 2, H / 2 + 30);
  ctx.fillText('TO CONTINUE', W / 2, H / 2 + 45);
}

/** ゲームオーバー画面（全ステージクリア時はお祝いメッセージ） */
function drawGameOver() {
  ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H);

  if (stage > 16) {
    // 全ステージクリア時のお祝いメッセージ
    ctx.fillStyle = '#ffcc00'; ctx.font = '18px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 10;
    ctx.fillText('CONGRATULATIONS!', W / 2, H / 4); ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ff88'; ctx.font = '10px "Press Start 2P"';
    ctx.fillText('ALL STAGES CLEARED!', W / 2, H / 4 + 30);
  } else {
    // 通常のゲームオーバー表示
    ctx.fillStyle = '#ff4444'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 4);
  }

  // 最終スコア・ステージ・最大コンボを表示
  ctx.fillStyle = '#ffffff'; ctx.font = '10px "Press Start 2P"';
  ctx.fillText(`FINAL SCORE: ${score}`, W / 2, H / 3 + 20);
  ctx.fillText(`STAGE: ${Math.min(stage, 16)}`, W / 2, H / 3 + 45);
  ctx.fillText(`MAX COMBO: ${maxCombo}`, W / 2, H / 3 + 65);

  if (rankingNameInput) {
    // 名前入力フォームを表示
    ctx.fillStyle = '#ffcc00'; ctx.font = '10px "Press Start 2P"';
    ctx.fillText('ENTER YOUR NAME', W / 2, H / 2 + 40);
    const boxW = 200, boxH = 30;
    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - boxW / 2, H / 2 + 55, boxW, boxH);
    // 入力中の文字＋点滅カーソル
    ctx.fillStyle = '#00ff88'; ctx.font = '14px "Press Start 2P"';
    ctx.fillText(nameInputText + (Math.floor(frameCount / 20) % 2 === 0 ? '_' : ''), W / 2, H / 2 + 76);
    ctx.fillStyle = '#888888'; ctx.font = '7px "Press Start 2P"';
    ctx.fillText('PRESS ENTER TO CONFIRM', W / 2, H / 2 + 100);
  } else {
    // タイトルへ戻るボタン（点滅）
    if (Math.floor(frameCount / 30) % 2 === 0) {
      ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"';
      ctx.fillText('CLICK TO RETURN', W / 2, H * 0.85);
    }
  }
}

/** ステージクリア画面の描画 */
function drawStageClear() {
  stageTransitionTimer++;
  ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#00ff88'; ctx.font = '18px "Press Start 2P"'; ctx.textAlign = 'center';
  ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 10;
  ctx.fillText('STAGE CLEAR!', W / 2, H / 3); ctx.shadowBlur = 0;

  // ボスステージなら擃破メッセージ
  if (isBossStage) {
    ctx.fillStyle = '#ff4444'; ctx.font = '10px "Press Start 2P"';
    ctx.fillText('BOSS DEFEATED!', W / 2, H / 3 + 30);
  }

  // スコアとライフボーナスを表示
  ctx.fillStyle = '#ffffff'; ctx.font = '10px "Press Start 2P"';
  ctx.fillText(`SCORE: ${score}`, W / 2, H / 2);
  ctx.fillText(`BONUS: ${lives * 1000}`, W / 2, H / 2 + 25);

  // 60フレーム後に「CLICK FOR NEXT STAGE」を点滅表示
  if (stageTransitionTimer > 60 && Math.floor(frameCount / 30) % 2 === 0) {
    ctx.fillStyle = '#ffcc00'; ctx.font = '8px "Press Start 2P"';
    ctx.fillText('CLICK FOR NEXT STAGE', W / 2, H * 0.75);
  }
}

/** ランキング画面の描画（上位10名） */
function drawRanking() {
  ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffcc00'; ctx.font = '14px "Press Start 2P"'; ctx.textAlign = 'center';
  ctx.fillText('HALL OF FAME', W / 2, 50);

  const rankings = getRankings();
  ctx.font = '7px "Press Start 2P"';

  // ヘッダー行
  ctx.fillStyle = '#00ff88'; ctx.textAlign = 'left';
  ctx.fillText('RANK', 40, 90);  ctx.fillText('NAME', 110, 90);
  ctx.fillText('SCORE', 250, 90); ctx.fillText('STG', 380, 90);

  // 区切り線
  ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(30, 96); ctx.lineTo(W - 30, 96); ctx.stroke();

  // 各ランキングエントリを表示（1位は金、2、3位は緑、それ以降は灰色）
  rankings.forEach((r, i) => {
    const y = 115 + i * 22;
    ctx.fillStyle = i === 0 ? '#ffcc00' : i < 3 ? '#00ff88' : '#888888';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}.`, 50, y);
    ctx.fillText(r.name, 110, y);
    ctx.textAlign = 'right';  ctx.fillText(`${r.score}`, 340, y);
    ctx.textAlign = 'center'; ctx.fillText(`${r.stage || '?'}`, 395, y);
  });

  // データがない場合のメッセージ
  if (rankings.length === 0) {
    ctx.fillStyle = '#888888'; ctx.textAlign = 'center';
    ctx.fillText('NO RECORDS YET', W / 2, 150);
  }

  // 「CLICK TO RETURN」の点滅表示
  if (Math.floor(frameCount / 30) % 2 === 0) {
    ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('CLICK TO RETURN', W / 2, H - 50);
  }
}

/**
 * CRT風のフィルターを重ねる
 * - スキャンライン（3ピクセル間隔の横線）
 * - ビネット（画面端を暗くする円形グラデーション）
 */
function drawCRT() {
  // スキャンライン
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

  // ビネット効果（周辺を暗くする）
  const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}
