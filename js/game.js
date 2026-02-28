/* ============================================================
   game.js — ゲームフロー制御（開始・ステージ遷移・ライフ管理）
   ============================================================ */
'use strict';

/** ゲームを初期状態から開始する */
function startGame() {
  audio.init();          // オーディオコンテキストを初期化
  score    = 0;
  lives    = 3;          // 初期ライフ3
  stage    = 1;          // ステージ1から開始
  combo    = 0;
  maxCombo = 0;
  bossBullets = [];
  paddle.reset();        // パドルを初期位置に戻す
  generateStage(stage);  // ステージ1のブロックを生成
  resetBall();           // ボールをパドル上にセット
  gameState  = STATE.READY;
  readyTimer = 120;      // 「READY」表示時間（120フレーム≈約2秒）
  audio.startBGM(false);
}

/** 次のステージに進む */
function nextStage() {
  stage++;
  bossBullets = [];
  // ステージ16を超えたら全ステージクリア→ゲームオーバー（ランキング登録へ）
  if (stage > 16) {
    gameState        = STATE.GAMEOVER;
    rankingNameInput = true;
    nameInputText    = '';
    return;
  }
  paddle.reset();
  generateStage(stage);
  resetBall();
  gameState  = STATE.READY;
  readyTimer = 120;
}

/** ボール落下時にライフを減らす（ボールはリセットされる） */
function loseLife() {
  lives--;
  audio.sfxMiss();
  // ライフが0以下でゲームオーバー
  if (lives <= 0) {
    gameState        = STATE.GAMEOVER;
    audio.stopBGM();
    rankingNameInput = true;
    nameInputText    = '';
    return;
  }
  resetBall();           // ボールをパドル上にリセット
  shieldActive = false;  // シールドも解除
}

/**
 * ボス弾がパドルに当たった時の処理
 * loseLife()と違い、ボールはリセットせずそのまま続行する
 */
function bulletHit() {
  lives--;
  audio.sfxMiss();
  if (lives <= 0) {
    gameState        = STATE.GAMEOVER;
    audio.stopBGM();
    rankingNameInput = true;
    nameInputText    = '';
  }
}

/** ステージクリア条件を確認する */
function checkStageComplete() {
  if (isBossStage) {
    // ボスステージ：ボスを倒したらクリア
    if (boss && !boss.alive) {
      score += lives * 1000;                   // 残りライフ×1000点ボーナス
      gameState            = STATE.STAGECLEAR;
      stageTransitionTimer = 0;
      audio.stopBGM();
    }
  } else {
    // 通常ステージ：全ブロック破壊でクリア
    if (blocks.filter(b => b.alive).length === 0) {
      score += lives * 1000;
      gameState            = STATE.STAGECLEAR;
      stageTransitionTimer = 0;
      audio.stopBGM();
    }
  }
}

/** 開発モード専用：ステージを即座にクリアする */
function devClearStage() {
  if (!devMode) return;
  if (isBossStage && boss) {
    boss.alive = false;                        // ボスを即死
  } else {
    blocks.forEach(b => { b.alive = false; }); // 全ブロック即破壊
  }
  checkStageComplete();
}
