/* ============================================================
   config.js — Constants & Global Game State
   ============================================================ */
'use strict';

// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = 480;
const H = 640;

// --- Game States ---
const STATE = {
  TITLE: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3,
  STAGECLEAR: 4, RANKING: 5, NAMEINPUT: 6, READY: 7
};

// --- Block Grid Constants ---
const BLOCK_W        = 48;
const BLOCK_H        = 20;
const BLOCK_COLS     = 10;
const BLOCK_ROWS     = 15;
const BLOCK_OFFSET_X = 0;
const BLOCK_OFFSET_Y = 50;
const STATUS_BAR_H   = 42;

// --- Physics ---
const DT = 16.67;  // ms per frame at 60 fps

// --- Mutable Game State ---
let gameState           = STATE.TITLE;
let score               = 0;
let lives               = 3;
let stage               = 1;
let combo               = 0;
let maxCombo            = 0;
let comboTimer          = 0;
let scoreMultiplier     = 1;
let scoreX2Timer        = 0;
let slowTimer           = 0;
let fireballTimer       = 0;
let shieldActive        = false;
let shieldY             = H - 30;
let readyTimer          = 0;
let stageTransitionTimer = 0;

// --- Developer Mode (hidden) ---
let devMode      = false;
let devInputBuf  = '';
