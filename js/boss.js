/* ============================================================
   boss.js — ボス敵の定義・行動・描画
   ============================================================ */
'use strict';

// --- ボス画像のプリロード ---
const bossImages = {};
{
  const imgDefs = {
    GATEKEEPER:      'img/boss/GATEKEEPER.png',              // ステージ6ボス
    PHANTOM:         'img/boss/PHANTOM.png',                 // ステージ11ボス
    CHAOSCORE:       'img/boss/CHAOSCORE（本体）.png',        // ステージ16ボス本体
    CHAOSCORE_CORE1: 'img/boss/CHAOSCORE（サブコア1）.png',   // ステージ16 サブコア①
    CHAOSCORE_CORE2: 'img/boss/CHAOSCORE（サブコア2）.png',   // ステージ16 サブコア②
  };
  for (const [key, src] of Object.entries(imgDefs)) {
    const img = new Image();
    img.src = src;
    bossImages[key] = img;
  }
}

/** ボス1体を表すクラス */
class Boss {
  /**
   * @param {string} type - ボスの種類（'GATEKEEPER'/'PHANTOM'/'CHAOSCORE'）
   */
  constructor(type) {
    this.type       = type;
    this.x          = W / 2;         // ボス中心X座標
    this.y          = 80;            // ボス中心Y座標
    this.width      = 80;            // 当たり判定の幅
    this.height     = 30;            // 当たり判定の高さ
    this.alive      = true;          // 生存フラグ
    this.phase      = 1;             // 行動フェーズ（CHAOSCORE用）
    this.moveDir    = 1;             // 移動方向（1:右 / -1:左）
    this.timer      = 0;             // フレームカウンター（攻撃タイミング管理用）
    this.invulnTimer = 0;            // 無敵時間（被弾後の短い無敵フレーム数）
    this.barrierTimer = 0;           // バリアタイマー（将来拡張用）
    this.invisTimer = 0;             // 透明化タイマー（PHANTOM用）
    this.visible    = true;          // 表示状態（PHANTOM用）
    this.cores      = [];            // サブコア配列（CHAOSCORE Phase3用）

    // ボスタイプごとのHP・サイズの初期設定
    switch (type) {
      case 'GATEKEEPER': this.maxHp = 20; this.hp = 20; this.width = 90; break;
      case 'PHANTOM':    this.maxHp = 35; this.hp = 35; this.width = 80; break;
      case 'CHAOSCORE':  this.maxHp = 60; this.hp = 60; this.width = 70; break;
    }
  }

  /** ボスの行動を毎フレーム更新する */
  update() {
    if (!this.alive) return;
    this.timer++;
    // タイプ別の行動を実行
    switch (this.type) {
      case 'GATEKEEPER': this.updateGatekeeper(); break;
      case 'PHANTOM':    this.updatePhantom();    break;
      case 'CHAOSCORE':  this.updateChaosCore();  break;
    }
    if (this.invulnTimer > 0) this.invulnTimer--;   // 無敵時間を減算
  }

  /* --- GATE KEEPER: 左右移動＋狙い撃ち＋ブロック生成 --- */
  updateGatekeeper() {
    // 左右に往復移動
    this.x += this.moveDir * 2;
    if (this.x > W - this.width / 2) { this.x = W - this.width / 2; this.moveDir = -1; }
    if (this.x < this.width / 2)     { this.x = this.width / 2;     this.moveDir =  1; }

    // 120フレームごとにパドルを狙った弾を発射
    if (this.timer % 120 === 0) {
      const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
      bossBullets.push(new BossBullet(
        this.x, this.y + this.height / 2,
        Math.cos(angle) * 3, Math.sin(angle) * 3,
        '#ff4444'
      ));
    }

    // 180フレームごとにNORMALブロックを追加生成（場に6個未満なら）
    if (this.timer % 180 === 0 && blocks.filter(b => b.alive).length < 6) {
      const col = Math.floor(Math.random() * BLOCK_COLS);
      const row = Math.floor(Math.random() * 3) + 3;
      blocks.push(new Block(col, row, 'NORMAL'));
    }
  }

  /* --- PHANTOM: 透明化＋狙い撃ち＋拡散弾＋HP低下時にMOVINGブロック生成 --- */
  updatePhantom() {
    // 左右に往復移動
    this.x += this.moveDir * 1.5;
    if (this.x > W - this.width / 2) this.moveDir = -1;
    if (this.x < this.width / 2)     this.moveDir =  1;

    // 透明化の周期制御（120フレーム周期で40フレーム間透明）
    this.invisTimer++;
    this.visible = this.invisTimer % 120 >= 40;

    // 可視状態で90フレームごとにパドルへ狙い撃ち
    if (this.visible && this.timer % 90 === 0) {
      const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
      bossBullets.push(new BossBullet(
        this.x, this.y + this.height / 2,
        Math.cos(angle) * 3, Math.sin(angle) * 3,
        '#9944ff'
      ));
    }

    // 透明化が解除された瞬間に3方向の拡散弾を発射
    if (this.invisTimer % 120 === 40) {
      for (let i = -1; i <= 1; i++) {
        bossBullets.push(new BossBullet(
          this.x + i * 20, this.y + this.height / 2,
          i * 1.5, 3, '#cc66ff'
        ));
      }
    }

    // HP50%以下でMOVINGブロックを追加生成（場に5個未満なら）
    if (this.hp < this.maxHp * 0.5 && this.timer % 150 === 0 && blocks.filter(b => b.alive).length < 5) {
      const col = Math.floor(Math.random() * BLOCK_COLS);
      const row = Math.floor(Math.random() * 4) + 3;
      blocks.push(new Block(col, row, 'MOVING'));
    }
  }

  /* --- CHAOS CORE: 3フェーズの最終ボス --- */
  updateChaosCore() {
    const hpRatio = this.hp / this.maxHp;   // HP残量比率

    if (hpRatio > 0.66) {
      // フェーズ1（HP 67%〜100%）: 高速移動＋狙い撃ち
      this.phase = 1;
      this.x += this.moveDir * 4;
      if (this.timer % 60 === 0) {
        const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
        bossBullets.push(new BossBullet(
          this.x, this.y + this.height / 2,
          Math.cos(angle) * 4, Math.sin(angle) * 4,
          '#ff4400'
        ));
      }
    } else if (hpRatio > 0.33) {
      // フェーズ2（HP 34%〜66%）: ボール引力＋5方向拡散弾
      this.phase = 2;
      this.x += this.moveDir * 2;
      // ボールを引き寄せる重力場効果
      balls.forEach(b => {
        if (b.active && !b.stuck) {
          const dx = this.x - b.x, dy = this.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0 && dist < 250) {
            b.vx += (dx / dist) * 0.08;   // ボスの方向へ微量加速
            b.vy += (dy / dist) * 0.08;
          }
        }
      });
      // 45フレームごとに5方向の拡散弾
      if (this.timer % 45 === 0) {
        for (let i = -2; i <= 2; i++) {
          bossBullets.push(new BossBullet(
            this.x, this.y + this.height / 2,
            i * 1.5, 3.5, '#ff8800'
          ));
        }
      }
    } else {
      // フェーズ3（HP 0%〜33%）: サブコア分離＋連射
      this.phase = 3;
      this.x += this.moveDir * 3;
      // サブコアが未生成なら2つ生成
      if (this.cores.length === 0) {
        this.cores = [
          { x: this.x - 40, y: this.y, dir:  1 },
          { x: this.x + 40, y: this.y, dir: -1 },
        ];
      }
      // サブコアも左右に往復移動
      this.cores.forEach(c => {
        c.x += c.dir * 2;
        if (c.x > W - 20) c.dir = -1;
        if (c.x < 20)     c.dir =  1;
      });
      // 本体からパドルへの狙い撃ち（50フレームごと）
      if (this.timer % 50 === 0) {
        const angle = Math.atan2(paddle.y - this.y, paddle.x - this.x);
        bossBullets.push(new BossBullet(
          this.x, this.y + this.height / 2,
          Math.cos(angle) * 4.5, Math.sin(angle) * 4.5,
          '#ff2200'
        ));
      }
      // サブコアから真下へ弾を発射（70フレームごと）
      if (this.timer % 70 === 0) {
        this.cores.forEach(c => {
          bossBullets.push(new BossBullet(c.x, c.y + 10, 0, 3, '#ff6600'));
        });
      }
    }

    // 画面端で方向反転
    if (this.x > W - this.width / 2) this.moveDir = -1;
    if (this.x < this.width / 2)     this.moveDir =  1;

    // 200フレームごとにARMORブロックを追加生成（場に4個未満なら）
    if (this.timer % 200 === 0 && blocks.filter(b => b.alive).length < 4) {
      const col = Math.floor(Math.random() * BLOCK_COLS);
      const row = Math.floor(Math.random() * 3) + 3;
      blocks.push(new Block(col, row, 'ARMOR'));
    }
  }

  /**
   * ボールとの当たり判定を行い、ヒット時にダメージ処理を実行する
   * @param {Ball} ball - 判定対象のボール
   * @returns {boolean} ヒットしたかどうか
   */
  checkHit(ball) {
    if (!this.alive || this.invulnTimer > 0) return false;
    // PHANTOM透明時はダメージを受けない
    if (this.type === 'PHANTOM' && !this.visible) return false;

    // ヒットボックスの一覧（本体＋サブコア）
    const hitBoxes = [{ x: this.x, y: this.y, w: this.width, h: this.height }];
    if (this.type === 'CHAOSCORE' && this.phase === 3) {
      this.cores.forEach(c => hitBoxes.push({ x: c.x, y: c.y, w: 30, h: 20 }));
    }

    for (const box of hitBoxes) {
      // 矩形とボール（円）の簡易衝突判定
      if (ball.x + ball.radius > box.x - box.w / 2 &&
          ball.x - ball.radius < box.x + box.w / 2 &&
          ball.y + ball.radius > box.y - box.h / 2 &&
          ball.y - ball.radius < box.y + box.h / 2) {
        this.hp--;
        this.invulnTimer = 10;        // 10フレーム無敵
        ball.vy = -ball.vy;           // ボールを跳ね返す
        score += 50;                  // ヒットボーナス
        audio.sfxBoss();
        spawnParticles(ball.x, ball.y, '#ff0044', 6);
        // HPが0になったらボス撃破
        if (this.hp <= 0) {
          this.alive = false;
          spawnParticles(this.x, this.y, '#ffcc00', 30);
          audio.sfxExplosion();
        }
        return true;
      }
    }
    return false;
  }

  /** ボスを描画する（画像またはフォールバックの矩形） */
  draw(ctx) {
    if (!this.alive) return;

    // 透明度の設定：PHANTOM透明時は薄く、被弾直後は点滅
    let alpha = 1;
    if (this.type === 'PHANTOM' && !this.visible) alpha = 0.15;
    if (this.invulnTimer > 0 && this.invulnTimer % 4 < 2) alpha = 0.3;
    ctx.globalAlpha = alpha;

    // ボス本体の画像を描画（画像が無い場合は矩形で代替）
    const img = bossImages[this.type];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    } else {
      // フォールバック：色付き矩形＋名前テキスト
      let color;
      switch (this.type) {
        case 'GATEKEEPER': color = '#ff4444'; break;
        case 'PHANTOM':    color = '#9944ff'; break;
        case 'CHAOSCORE':  color = '#ff2200'; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      ctx.fillStyle = '#ffffff'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
      const names = { GATEKEEPER: 'GATE KEEPER', PHANTOM: 'PHANTOM', CHAOSCORE: 'CHAOS CORE' };
      ctx.fillText(names[this.type], this.x, this.y + 2);
    }

    // CHAOSCORE Phase3のサブコアを描画
    if (this.type === 'CHAOSCORE' && this.phase === 3) {
      this.cores.forEach((c, i) => {
        const coreImg = bossImages['CHAOSCORE_CORE' + (i + 1)];
        if (coreImg && coreImg.complete && coreImg.naturalWidth > 0) {
          ctx.drawImage(coreImg, c.x - 15, c.y - 10, 30, 20);
        } else {
          // フォールバック：オレンジの矩形
          ctx.fillStyle = '#ff6600';
          ctx.fillRect(c.x - 15, c.y - 10, 30, 20);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.strokeRect(c.x - 15, c.y - 10, 30, 20);
        }
      });
    }
    ctx.globalAlpha = 1;

    // --- HPバーの描画 ---
    let hpColor;
    switch (this.type) {
      case 'GATEKEEPER': hpColor = '#ff4444'; break;
      case 'PHANTOM':    hpColor = '#9944ff'; break;
      case 'CHAOSCORE':  hpColor = this.phase === 3 ? '#ff8800' : '#ff2200'; break;
    }
    const barW = 200, barH = 8;
    const barX = W / 2 - barW / 2, barY = 30;
    ctx.fillStyle = '#333';  ctx.fillRect(barX, barY, barW, barH);            // 背景
    ctx.fillStyle = hpColor; ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);  // HP量
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);                                    // 枠線
    ctx.fillStyle = '#fff'; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText(`HP ${this.hp}/${this.maxHp}`, W / 2, barY - 2);            // HPテキスト
  }
}

// --- ボス関連のグローバル変数 ---
let boss        = null;     // 現在のボスインスタンス（いなければnull）
let isBossStage = false;    // 現在のステージがボスステージかどうか
let bossBullets = [];       // 画面上に存在するボス弾の配列

/* ============================================================
   BossBullet — ボスが発射する弾クラス
   ============================================================ */
class BossBullet {
  /**
   * @param {number} x     - 初期X座標
   * @param {number} y     - 初期Y座標
   * @param {number} vx    - X方向速度
   * @param {number} vy    - Y方向速度
   * @param {string} color - 弾の色
   */
  constructor(x, y, vx, vy, color) {
    this.x      = x;
    this.y      = y;
    this.vx     = vx;
    this.vy     = vy;
    this.radius = 4;                    // 弾の半径（px）
    this.color  = color || '#ff4444';   // デフォルト色
    this.active = true;                 // 有効フラグ
  }

  /** 弾の位置を更新し、パドル/シールドとの衝突を判定する */
  update() {
    this.x += this.vx;
    this.y += this.vy;
    // 画面外に出たら消滅
    if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
      this.active = false;
      return;
    }

    // パドルに当たった → ライフを減らす（ボールはそのまま継続）
    if (this.y + this.radius >= paddle.y &&
        this.y - this.radius <= paddle.y + paddle.height &&
        this.x >= paddle.x - paddle.drawWidth / 2 &&
        this.x <= paddle.x + paddle.drawWidth / 2) {
      this.active = false;
      spawnParticles(this.x, this.y, this.color, 10);
      bulletHit();    // loseLife()ではなくbulletHit()を使い、ボールをリセットしない
    }

    // シールドに当たった → シールドを消費して弾を消滅させる
    if (shieldActive && this.vy > 0 &&
        this.y + this.radius >= shieldY &&
        this.y + this.radius <= shieldY + 6) {
      this.active = false;
      shieldActive = false;
      spawnParticles(this.x, shieldY, '#00ffff', 8);
    }
  }

  /** ボス弾を光る円として描画する */
  draw(ctx) {
    // 外側の色付き円
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    // ぼかし効果
    ctx.shadowColor = this.color;
    ctx.shadowBlur  = 6;
    // 内側の白い円（光芒効果）
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
