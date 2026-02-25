/* ============================================================
   game.js — Game Flow (Start, Stage Transitions, Lives)
   ============================================================ */
'use strict';

function startGame() {
  audio.init();
  score    = 0;
  lives    = 3;
  stage    = 1;
  combo    = 0;
  maxCombo = 0;
  paddle.reset();
  generateStage(stage);
  resetBall();
  gameState  = STATE.READY;
  readyTimer = 120;
  audio.startBGM(false);
}

function nextStage() {
  stage++;
  if (stage > 16) {
    // All stages cleared!
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

function loseLife() {
  lives--;
  audio.sfxMiss();
  if (lives <= 0) {
    gameState        = STATE.GAMEOVER;
    audio.stopBGM();
    rankingNameInput = true;
    nameInputText    = '';
    return;
  }
  resetBall();
  shieldActive = false;
}

function checkStageComplete() {
  if (isBossStage) {
    if (boss && !boss.alive) {
      score += lives * 1000;
      gameState            = STATE.STAGECLEAR;
      stageTransitionTimer = 0;
      audio.stopBGM();
    }
  } else {
    if (blocks.filter(b => b.alive).length === 0) {
      score += lives * 1000;
      gameState            = STATE.STAGECLEAR;
      stageTransitionTimer = 0;
      audio.stopBGM();
    }
  }
}
