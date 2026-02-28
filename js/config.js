/* ============================================================
   config.js — 定数とグローバルなゲーム状態の管理
   ============================================================ */
'use strict';

// --- キャンバスの初期設定 ---
const canvas = document.getElementById('gameCanvas');  // HTML上のcanvas要素を取得
const ctx    = canvas.getContext('2d');                 // 2D描画コンテキストを取得
const W = 480;   // キャンバスの幅（ピクセル）
const H = 560;   // キャンバスの高さ（ピクセル）

// --- ゲームの状態定数（画面遷移に使用） ---
const STATE = {
  TITLE: 0,       // タイトル画面
  PLAYING: 1,     // プレイ中
  PAUSED: 2,      // 一時停止
  GAMEOVER: 3,    // ゲームオーバー
  STAGECLEAR: 4,  // ステージクリア
  RANKING: 5,     // ランキング表示
  NAMEINPUT: 6,   // 名前入力
  READY: 7        // 開始前カウントダウン
};

// --- ブロックのグリッド定数 ---
const BLOCK_W        = 48;   // ブロック1個の幅
const BLOCK_H        = 26;   // ブロック1個の高さ
const BLOCK_COLS     = 10;   // 横に並ぶブロック数
const BLOCK_ROWS     = 15;   // 縦に並ぶブロック数（最大）
const BLOCK_OFFSET_X = 0;    // ブロック配置のX方向オフセット
const BLOCK_OFFSET_Y = 50;   // ブロック配置のY方向オフセット（ステータスバーの下から）
const STATUS_BAR_H   = 42;   // 画面上部のステータスバーの高さ（ボールの天井）

// --- 物理演算 ---
const DT = 16.67;  // 1フレームあたりのミリ秒数（60fps時）

// --- 変化するゲーム状態変数 ---
let gameState           = STATE.TITLE;  // 現在のゲーム状態
let score               = 0;            // 現在のスコア
let lives               = 3;            // 残りライフ数
let stage               = 1;            // 現在のステージ番号
let combo               = 0;            // 現在のコンボ数
let maxCombo            = 0;            // 最大コンボ数（記録用）
let comboTimer          = 0;            // コンボの持続タイマー（0になるとコンボリセット）
let scoreMultiplier     = 1;            // スコア倍率
let scoreX2Timer        = 0;            // スコア2倍アイテムの残り時間（ミリ秒）
let slowTimer           = 0;            // スロー効果の残り時間（ミリ秒）
let fireballTimer       = 0;            // ファイアボール効果の残り時間（ミリ秒）
let shieldActive        = false;        // シールドが有効かどうか
let shieldY             = H - 30;       // シールドのY座標
let readyTimer          = 0;            // ステージ開始前のカウントダウンタイマー
let stageTransitionTimer = 0;           // ステージクリア画面の表示タイマー

// --- 開発者モード（隠しコマンド） ---
let devMode      = false;   // 開発者モードが有効かどうか
let devInputBuf  = '';      // タイトル画面でのキー入力バッファ
