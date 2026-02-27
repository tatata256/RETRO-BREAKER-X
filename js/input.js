/* ============================================================
   input.js — Keyboard, Mouse & Touch Input
   ============================================================ */
'use strict';

const keys = {};
let mouseX      = W / 2;
let touchActive = false;
let mouseActive = false;

// --- Keyboard ---
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') mouseActive = false;

  // --- Hidden dev command: type "dev" on title screen ---
  if (gameState === STATE.TITLE && e.key.length === 1) {
    devInputBuf += e.key.toLowerCase();
    if (devInputBuf.length > 10) devInputBuf = devInputBuf.slice(-10);
    if (devInputBuf.endsWith('dev')) {
      devMode = !devMode;
      devInputBuf = '';
      console.log('%c[DEV MODE] ' + (devMode ? 'ON' : 'OFF'), 'color:#0f0;font-weight:bold');
    }
  }

  // Pause toggle
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (gameState === STATE.PLAYING)    { gameState = STATE.PAUSED;  audio.stopBGM(); }
    else if (gameState === STATE.PAUSED) { gameState = STATE.PLAYING; audio.startBGM(isBossStage); }
  }

  // Launch ball
  if ((e.key === ' ' || e.key === 'Enter') && gameState === STATE.PLAYING) launchBall();

  // Title → start
  if (gameState === STATE.TITLE && (e.key === ' ' || e.key === 'Enter')) startGame();

  // Game-over → title
  if (gameState === STATE.GAMEOVER && (e.key === ' ' || e.key === 'Enter') && !rankingNameInput) gameState = STATE.TITLE;

  // Stage clear → next
  if (gameState === STATE.STAGECLEAR && (e.key === ' ' || e.key === 'Enter')) nextStage();

  // Name input
  if (rankingNameInput) handleNameInput(e.key);

  e.preventDefault();
});

document.addEventListener('keyup', e => { keys[e.key] = false; });

// --- Mouse ---
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width * W;
  mouseActive = true;
});

canvas.addEventListener('click', e => {
  audio.init();
  if (gameState === STATE.TITLE)     { startGame(); return; }
  if (gameState === STATE.PLAYING && devMode) { devClearStage(); return; }
  if (gameState === STATE.PLAYING)   { launchBall(); return; }
  if (gameState === STATE.GAMEOVER && !rankingNameInput) { gameState = STATE.TITLE; return; }
  if (gameState === STATE.STAGECLEAR) { nextStage(); return; }
  if (gameState === STATE.RANKING)    { gameState = STATE.TITLE; return; }
});

// --- Touch ---
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  audio.init();
  touchActive = true;
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.touches[0].clientX - rect.left) / rect.width * W;

  if (gameState === STATE.TITLE)     { startGame(); return; }
  if (gameState === STATE.PLAYING)   { launchBall(); }
  if (gameState === STATE.GAMEOVER && !rankingNameInput) { gameState = STATE.TITLE; return; }
  if (gameState === STATE.STAGECLEAR) { nextStage(); return; }
  if (gameState === STATE.RANKING)    { gameState = STATE.TITLE; return; }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  mouseX = (e.touches[0].clientX - rect.left) / rect.width * W;
}, { passive: false });

canvas.addEventListener('touchend', () => { touchActive = false; }, { passive: false });

// --- Pause button (mobile) ---
document.getElementById('pauseBtn').addEventListener('click', () => {
  if (gameState === STATE.PLAYING)     { gameState = STATE.PAUSED;  audio.stopBGM(); }
  else if (gameState === STATE.PAUSED) { gameState = STATE.PLAYING; audio.startBGM(isBossStage); }
});
