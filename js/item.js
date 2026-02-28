/* ============================================================
   item.js — パワーアップアイテムの定義・処理
   ============================================================ */
'use strict';

/**
 * アイテムの種類一覧
 * label : アイテム上に表示される文字
 * color : アイテムの背景色
 * desc  : 効果名（UI表示用）
 */
const ITEM_TYPES = {
  EXPAND:    { label: '▶◀', color: '#00ff00', desc: 'EXPAND' },     // パドル拡大
  SHRINK:    { label: '◀▶', color: '#ff00ff', desc: 'SHRINK' },     // パドル縮小
  MULTIBALL: { label: '●●●', color: '#00ccff', desc: 'MULTI' },  // マルチボール
  FIREBALL:  { label: '🔥',  color: '#ff4400', desc: 'FIRE' },      // ファイアボール（貫通）
  SHIELD:    { label: '━━', color: '#00ffff', desc: 'SHIELD' },   // シールド（落下防止）
  SCORE2X:   { label: '×2',  color: '#ffff00', desc: 'SCOREx2' },   // スコア2倍
  LIFE:      { label: '❤',  color: '#ff4466', desc: 'LIFE' },       // ライフ回復
};

/** ライフの上限値 */
const MAX_LIVES = 10;

/** 落下するアイテム1個を表すクラス */
class Item {
  constructor(x, y, type) {
    this.x      = x;         // 中心X座標
    this.y      = y;         // 中心Y座標
    this.type   = type;      // ITEM_TYPESのキー名
    this.vy     = 2;         // 落下速度（px/フレーム）
    this.active = true;      // 有効フラグ
    this.width  = 30;        // 幅（px）
    this.height = 16;        // 高さ（px）
  }

  /** アイテムの位置を更新し、パドルとの当たり判定を行う */
  update() {
    this.y += this.vy;                        // 重力で落下
    if (this.y > H) this.active = false;      // 画面外で消滅

    // パドルでキャッチしたか判定
    if (this.y + this.height >= paddle.y && this.y <= paddle.y + paddle.height &&
        this.x + this.width / 2 >= paddle.x - paddle.drawWidth / 2 &&
        this.x - this.width / 2 <= paddle.x + paddle.drawWidth / 2) {
      this.active = false;
      applyItem(this.type);    // 効果を適用
      audio.sfxItem();         // 取得音を再生
    }
  }

  /** アイテムを矩形＋ラベルとして描画する */
  draw(ctx) {
    const info = ITEM_TYPES[this.type];
    ctx.fillStyle   = info.color;
    ctx.globalAlpha = 0.85;     // 少し透明
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    // 白い枠線
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    // ラベル文字
    ctx.fillStyle    = '#ffffff';
    ctx.font         = '7px "Press Start 2P"';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.label, this.x, this.y + 1);
    ctx.globalAlpha = 1;
  }
}

/** 画面上に存在するアイテムの配列 */
let items         = [];
/** 現在有効なアイテム効果の配列（画面に残り時間を表示） */
let activeEffects = [];

/**
 * アイテムを取得した際に効果をゲームに適用する
 * @param {string} type - アイテムの種類キー
 */
function applyItem(type) {
  switch (type) {
    case 'EXPAND':
      // パドルを拡大（1.8倍、最大3重まで）15秒間持続
      if (paddle.expandTimers.length < 3) {
        paddle.widthMultiplier *= 1.8;
        paddle.expandTimers.push({ time: 15000 });
        activeEffects.push({ name: 'EXPAND', timer: 15000 });
      }
      break;

    case 'SHRINK':
      // パドルを縮小（0.6倍）10秒間持続
      paddle.widthMultiplier *= 0.6;
      paddle.shrinkTimers.push({ time: 10000 });
      activeEffects.push({ name: 'SHRINK', timer: 10000 });
      break;

    case 'MULTIBALL': {
      // 生存中のボールを基準に2つ追加生成（角度を少しずらす）
      const aliveBalls = balls.filter(b => b.active && !b.stuck);
      if (aliveBalls.length > 0) {
        const src = aliveBalls[0];
        for (let i = 0; i < 2; i++) {
          const angle = (Math.random() - 0.5) * 1.2;
          const cos = Math.cos(angle), sin = Math.sin(angle);
          const nb = new Ball(src.x, src.y,
            src.vx * cos - src.vy * sin,   // 回転行列で速度ベクトルを回転
            src.vx * sin + src.vy * cos);
          balls.push(nb);
        }
      }
      break;
    }

    case 'FIREBALL':
      // ファイアボール（ブロック貫通）8秒間持続
      fireballTimer = 8000;
      activeEffects.push({ name: 'FIRE', timer: 8000 });
      break;

    case 'SHIELD':
      // シールドを展開（ボール落下を1回防ぐ）
      shieldActive = true;
      break;

    case 'SCORE2X':
      // スコア2倍ボーナス20秒間持続
      scoreX2Timer = 20000;
      activeEffects.push({ name: 'SCOREx2', timer: 20000 });
      break;

    case 'LIFE':
      // ライフを＋1回復（上限MAX_LIVES）
      if (lives < MAX_LIVES) {
        lives++;
        spawnParticles(paddle.x, paddle.y, '#ff4466', 20);
      }
      break;
  }
}

/**
 * ブロック破壊時にアイテムをドロップするか判定し、生成する
 * @param {number} x         - ドロップ座標X
 * @param {number} y         - ドロップ座標Y
 * @param {string} blockType - 破壊されたブロックの種類
 */
function dropItem(x, y, blockType) {
  let rate = BLOCK_TYPES[blockType].dropRate;
  if (blockType === 'GOLD') rate = 1.0;   // GOLDブロックは必ずドロップ

  if (Math.random() < rate) {
    let possibleItems;
    if (blockType === 'POISON') {
      // POISONブロックはSHRINK（パドル縮小）だけドロップ
      possibleItems = ['SHRINK'];
    } else {
      // それ以外は6種類からランダム
      possibleItems = ['EXPAND', 'MULTIBALL', 'FIREBALL', 'SHIELD', 'SCORE2X', 'LIFE'];
    }
    const type = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    items.push(new Item(x, y, type));
  }
}
