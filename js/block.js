/* ============================================================
   block.js — ブロックの種類定義とBlockクラス
   ============================================================ */
'use strict';

// --- ブロック画像のプリロード ---
const blockImages = {};
{
  const img = new Image();
  img.src = 'img/block/explosive.png';   // ARMORブロック用の爆弾画像
  blockImages.ARMOR = img;
}

/**
 * ブロックの種類一覧
 * name     : 名前
 * color    : ベース色
 * hp       : 耐久力（何回当てれば破壊）
 * dropRate : アイテムドロップ率
 * score    : 破壊時の基本スコア
 */
const BLOCK_TYPES = {
  NORMAL:   { name: 'Normal',   color: '#888888', hp: 1, dropRate: 0.10, score: 100 },   // 通常ブロック
  ARMOR:    { name: 'Armor',    color: '#c0c0c0', hp: 3, dropRate: 0.20, score: 300 },   // 装甲（破壊時に周囲を巻き込んで爆発）
  SPLITTER: { name: 'Splitter', color: '#00cccc', hp: 1, dropRate: 0.30, score: 150 },   // スプリッター（破壊時にボール分裂）
  MOVING:   { name: 'Moving',   color: '#cccc00', hp: 1, dropRate: 0.15, score: 150 },   // 移動ブロック（左右に動く）
  POISON:   { name: 'Poison',   color: '#9900cc', hp: 1, dropRate: 0.00, score: 100 },   // 毒（ボール減速、SHRINKのみドロップ）
  GOLD:     { name: 'Gold',     color: '#ffcc00', hp: 2, dropRate: 0.60, score: 500 },   // ゴールド（高スコア、高ドロップ率）
  INVISI:   { name: 'Invisi',   color: '#ffffff', hp: 1, dropRate: 0.05, score: 200 },   // 透明（点滅して見えにくい）
  MIRROR:   { name: 'Mirror',   color: '#eeeeff', hp: 1, dropRate: 0.10, score: 200 },   // ミラー（破壊時にボール反転）
};

/** ブロック1個を表すクラス */
class Block {
  /**
   * @param {number} col  - 列番号（0始まり）
   * @param {number} row  - 行番号（0始まり）
   * @param {string} type - BLOCK_TYPESのキー名
   */
  constructor(col, row, type) {
    this.col        = col;
    this.row        = row;
    this.x          = BLOCK_OFFSET_X + col * BLOCK_W;   // ピクセル座標X
    this.y          = BLOCK_OFFSET_Y + row * BLOCK_H;   // ピクセル座標Y
    this.type       = type;
    this.hp         = BLOCK_TYPES[type].hp;              // 残りHP
    this.maxHp      = this.hp;                           // 最大HP（ダメージ表示用）
    this.alive      = true;                              // 生存フラグ
    this.moveDir    = 1;                                 // MOVINGブロックの移動方向
    this.moveOffset = 0;                                 // MOVINGブロックの移動オフセット
    this.invisiTimer = Math.random() * Math.PI * 2;      // INVISIブロックの点滅タイマー
  }

  /** 描画用X座標（MOVINGはオフセットを加算） */
  get drawX()   { return this.x + (this.type === 'MOVING' ? this.moveOffset : 0); }
  /** 描画用Y座標 */
  get drawY()   { return this.y; }
  /** ブロック中心のX座標 */
  get centerX() { return this.drawX + BLOCK_W / 2; }
  /** ブロック中心のY座標 */
  get centerY() { return this.drawY + BLOCK_H / 2; }

  /** ブロックの状態を毎フレーム更新する */
  update(dt) {
    if (!this.alive) return;
    // MOVINGブロック：左右に往復移動
    if (this.type === 'MOVING') {
      const mSpeed = 0.5 + stage * 0.15;   // ステージが進むほど速くなる
      this.moveOffset += this.moveDir * mSpeed;
      const maxOff = BLOCK_W * 0.8;        // 最大移動量
      if (Math.abs(this.moveOffset) > maxOff) {
        this.moveDir *= -1;                // 方向反転
        this.moveOffset = Math.sign(this.moveOffset) * maxOff;
      }
    }
    // INVISIブロック：点滅タイマーを進める
    if (this.type === 'INVISI') {
      this.invisiTimer += 0.03;
    }
  }

  /** ブロックをCanvasに描画する */
  draw(ctx) {
    if (!this.alive) return;
    const bx = this.drawX;
    const by = this.drawY;

    // INVISIブロックは透明度が変化する
    let alpha = 1;
    if (this.type === 'INVISI') {
      alpha = 0.3 + 0.4 * Math.abs(Math.sin(this.invisiTimer));
    }

    ctx.globalAlpha = alpha;
    const info = BLOCK_TYPES[this.type];

    // ブロック本体の矩形を描画
    ctx.fillStyle = info.color;
    ctx.fillRect(bx + 1, by + 1, BLOCK_W - 2, BLOCK_H - 2);

    // 複数HPブロックはダメージ量を暗いバーで表示
    if (this.maxHp > 1 && this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      const dmgWidth = (1 - this.hp / this.maxHp) * (BLOCK_W - 4);
      ctx.fillRect(bx + 2, by + 2, dmgWidth, BLOCK_H - 4);
    }

    // --- タイプ別の特殊な見た目 ---
    if (this.type === 'ARMOR') {
      // ARMORブロック：爆弾画像を描画（画像がなければ枠線で代替）
      const aImg = blockImages.ARMOR;
      if (aImg && aImg.complete && aImg.naturalWidth > 0) {
        ctx.drawImage(aImg, bx + 1, by + 1, BLOCK_W - 2, BLOCK_H - 2);
      } else {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        ctx.strokeRect(bx + 3, by + 3, BLOCK_W - 6, BLOCK_H - 6);
      }
    }
    if (this.type === 'GOLD') {
      // GOLDブロック：金色の二重枠線
      ctx.strokeStyle = '#fff700'; ctx.lineWidth = 2;
      ctx.strokeRect(bx + 2, by + 2, BLOCK_W - 4, BLOCK_H - 4);
    }
    if (this.type === 'SPLITTER') {
      // SPLITTERブロック：「S」の文字を表示
      ctx.fillStyle = '#ffffff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('S', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 3);
    }
    if (this.type === 'POISON') {
      // POISONブロック：「P」の文字を表示
      ctx.fillStyle = '#ff00ff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('P', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 3);
    }
    if (this.type === 'MIRROR') {
      // MIRRORブロック：「M」の文字を表示
      ctx.fillStyle = '#aaaaff'; ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('M', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 3);
    }
    if (this.type === 'MOVING') {
      // MOVINGブロック：「>>」の文字を表示
      ctx.fillStyle = '#000000'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
      ctx.fillText('>>', bx + BLOCK_W / 2, by + BLOCK_H / 2 + 2);
    }

    ctx.globalAlpha = 1;
  }

  /**
   * ブロックにダメージを与える
   * @param {number} dmg - ダメージ量（デフォルト1）
   * @returns {boolean}  - 破壊された場合true、まだ生存ならfalse
   */
  hit(dmg = 1) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) { this.alive = false; return true; }   // 破壊
    return false;                                             // ダメージのみ
  }
}

/** ステージ上のブロック配列 */
let blocks = [];
