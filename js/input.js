/* ============================================================
   input.js — キーボード・マウス・タッチ入力のハンドリング
   ============================================================ */
'use strict';

const keys = {};                 // 現在押されているキーのマップ
let mouseX      = W / 2;         // マウス/タッチのX座標（パドル追従用）
let touchActive = false;         // タッチ中フラグ
let mouseActive = false;         // マウス操作が有効か（矢印キーで無効化）

// ===== キーボード入力 =====
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  // 矢印キーを押したらマウス操作を無効化（キーボード優先）
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') mouseActive = false;

  // --- 隠し開発者コマンド：タイトル画面で"dev"と入力すると開発モード切替 ---
  if (gameState === STATE.TITLE && e.key.length === 1) {
    devInputBuf += e.key.toLowerCase();
    if (devInputBuf.length > 10) devInputBuf = devInputBuf.slice(-10);
    if (devInputBuf.endsWith('dev')) {
      devMode = !devMode;
      devInputBuf = '';
      console.log('%c[DEV MODE] ' + (devMode ? 'ON' : 'OFF'), 'color:#0f0;font-weight:bold');
    }
  }

  // ポーズの切り替え（P/Escapeキー）
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (gameState === STATE.PLAYING)    { gameState = STATE.PAUSED;  audio.stopBGM(); }
    else if (gameState === STATE.PAUSED) { gameState = STATE.PLAYING; audio.startBGM(isBossStage); }
  }

  // スペース/Enterでボール発射
  if ((e.key === ' ' || e.key === 'Enter') && gameState === STATE.PLAYING) launchBall();

  // タイトル画面→ゲーム開始
  if (gameState === STATE.TITLE && (e.key === ' ' || e.key === 'Enter')) startGame();

  // ゲームオーバー画面→タイトルへ戻る
  if (gameState === STATE.GAMEOVER && (e.key === ' ' || e.key === 'Enter') && !rankingNameInput) gameState = STATE.TITLE;

  // ステージクリア画面→次のステージへ
  if (gameState === STATE.STAGECLEAR && (e.key === ' ' || e.key === 'Enter')) nextStage();

  // 名前入力モード中のキー入力処理
  if (rankingNameInput) handleNameInput(e.key);

  e.preventDefault();   // ブラウザのデフォルト動作を防止
});

// キーを離したらフラグをクリア
document.addEventListener('keyup', e => { keys[e.key] = false; });

// ===== マウス入力 =====
canvas.addEventListener('mousemove', e => {
  // Canvas内のマウス位置をゲーム座標に変換
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width * W;
  mouseActive = true;   // マウスを動かしたらマウス操作を有効化
});

canvas.addEventListener('click', e => {
  audio.init();   // 初回クリックでオーディオコンテキストを初期化
  if (gameState === STATE.TITLE)     { startGame(); return; }
  if (gameState === STATE.PLAYING && devMode) { devClearStage(); return; }   // 開発モード: クリックで即クリア
  if (gameState === STATE.PLAYING)   { launchBall(); return; }
  if (gameState === STATE.GAMEOVER && !rankingNameInput) { gameState = STATE.TITLE; return; }
  if (gameState === STATE.STAGECLEAR) { nextStage(); return; }
  if (gameState === STATE.RANKING)    { gameState = STATE.TITLE; return; }
});

// ===== タッチ入力（モバイル対応） =====
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  audio.init();
  touchActive = true;
  // タッチ位置をゲーム座標に変換
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.touches[0].clientX - rect.left) / rect.width * W;

  // 画面状態に応じたタッチ操作
  if (gameState === STATE.TITLE)     { startGame(); return; }
  if (gameState === STATE.PLAYING)   { launchBall(); }
  if (gameState === STATE.GAMEOVER && !rankingNameInput) { gameState = STATE.TITLE; return; }
  if (gameState === STATE.STAGECLEAR) { nextStage(); return; }
  if (gameState === STATE.RANKING)    { gameState = STATE.TITLE; return; }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  // タッチ移動でパドル位置を更新
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.touches[0].clientX - rect.left) / rect.width * W;
}, { passive: false });

canvas.addEventListener('touchend', () => { touchActive = false; }, { passive: false });

// ===== ポーズボタン（モバイル用のUIボタン） =====
document.getElementById('pauseBtn').addEventListener('click', () => {
  if (gameState === STATE.PLAYING)     { gameState = STATE.PAUSED;  audio.stopBGM(); }
  else if (gameState === STATE.PAUSED) { gameState = STATE.PLAYING; audio.startBGM(isBossStage); }
});
