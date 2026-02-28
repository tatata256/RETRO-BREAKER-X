/* ============================================================
   main.js — ゲームループ・更新ロジック・レスポンシブリサイズ
   ============================================================ */
'use strict';

let lastTime    = 0;    // 前フレームのタイムスタンプ
let accumulator = 0;    // 固定タイムステップ用の蓄積時間

/**
 * ゲームの1フレーム分の更新処理
 * DT（16.67ms）ごとに呼び出される
 */
function update() {
  // === READY状態（カウントダウン中） ===
  if (gameState === STATE.READY) {
    readyTimer--;
    // マウス/タッチでパドルをスムーズに追従
    if (mouseActive || touchActive) paddle.x += (mouseX - paddle.x) * 0.15;
    // 矢印キーでパドルを移動
    if (keys['ArrowLeft'])  paddle.x -= paddle.speed;
    if (keys['ArrowRight']) paddle.x += paddle.speed;
    paddle.update();
    balls.forEach(b => b.update());   // ボールはパドルに追従
    if (readyTimer <= 0) gameState = STATE.PLAYING;   // カウントダウン終了→プレイ開始
    return;
  }

  // PLAYING状態以外は更新しない
  if (gameState !== STATE.PLAYING) return;

  // === タイマーの減算 ===
  if (fireballTimer > 0) fireballTimer -= DT;    // ファイアボール残り時間
  if (scoreX2Timer  > 0) scoreX2Timer  -= DT;    // スコア2倍残り時間
  if (slowTimer     > 0) slowTimer     -= DT;    // 減速残り時間
  if (comboTimer    > 0) comboTimer--; else combo = 0;   // コンボタイマー（切れたらリセット）

  // 有効なアイテム効果のタイマーを減算し、切れたものを除去
  activeEffects = activeEffects.filter(e => { e.timer -= DT; return e.timer > 0; });

  // === パドルの更新 ===
  if (mouseActive || touchActive) paddle.x += (mouseX - paddle.x) * 0.15;   // スムーズな追従
  if (keys['ArrowLeft'])  paddle.x -= paddle.speed;
  if (keys['ArrowRight']) paddle.x += paddle.speed;
  paddle.update();

  // === ボールの更新 ===
  balls.forEach(b => b.update());

  // === ボールとブロックの衝突判定 ===
  balls.forEach(b => { if (b.active && !b.stuck) checkBlockCollision(b); });

  // === ボスの更新とボール衝突判定 ===
  if (boss && boss.alive) {
    boss.update();
    balls.forEach(b => { if (b.active && !b.stuck) boss.checkHit(b); });
  }

  // === ボス弾の更新（画面外やパドルヒットで除去） ===
  bossBullets.forEach(b => b.update());
  bossBullets = bossBullets.filter(b => b.active);

  // === ブロックの更新（MOVING/INVISIの動作） ===
  blocks.forEach(b => b.update(DT));

  // === アイテムの更新（落下とパドルキャッチ） ===
  items.forEach(i => i.update());
  items = items.filter(i => i.active);

  // === 死亡ボールの除去とミス判定 ===
  const aliveBalls = balls.filter(b => b.active);
  if (aliveBalls.length === 0) loseLife(); else balls = aliveBalls;

  // === パーティクルの更新（寿命切れを除去） ===
  particles.forEach(p => p.update());
  particles = particles.filter(p => p.life > 0);

  // === ステージクリア確認 ===
  checkStageComplete();
}

/**
 * 固定タイムステップのゲームループ
 * DT（16.67ms）単位でupdate()を呼び、毎フレームdraw()を実行
 */
function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  const delta = timestamp - lastTime;   // 前フレームからの経過時間
  lastTime = timestamp;
  accumulator += delta;

  // 蓄積時間がDT以上ある限り更新を繰り返す
  while (accumulator >= DT) {
    update();
    accumulator -= DT;
  }

  draw();   // 描画
  requestAnimationFrame(gameLoop);   // 次フレームを予約
}

// ゲームループを開始
requestAnimationFrame(gameLoop);

/**
 * ウィンドウサイズに応じてゲーム表示をレスポンシブにスケーリング
 * アスペクト比（W/H）を維持しながら画面にフィットさせる
 */
function resize() {
  const wrapper = document.getElementById('gameWrapper');
  const maxW = window.innerWidth, maxH = window.innerHeight;
  const ratio = W / H;
  let w, h;
  if (maxW / maxH > ratio) { h = maxH; w = h * ratio; }   // 縦が基準
  else                      { w = maxW; h = w / ratio; }   // 横が基準
  wrapper.style.width  = w + 'px';
  wrapper.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();   // 初回実行
