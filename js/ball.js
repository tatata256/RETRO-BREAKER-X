/* ============================================================
   ball.js — ボールの物理演算と描画
   ============================================================ */
'use strict';

/** ボール1個を表すクラス（マルチボール時は複数存在） */
class Ball {
  /**
   * @param {number} x  - 初期X座標
   * @param {number} y  - 初期Y座標
   * @param {number} vx - X方向速度
   * @param {number} vy - Y方向速度
   */
  constructor(x, y, vx, vy) {
    this.x       = x;
    this.y       = y;
    this.vx      = vx;
    this.vy      = vy;
    this.radius  = 5;       // ボールの半径（px）
    this.active  = true;    // 生存フラグ（falseで消滅扱い）
    this.stuck   = false;   // パドルにくっ付いている状態
    this.offsetX = 0;       // くっ付き時のパドル中心からのオフセット
  }

  /** 現在の速さ（スカラー値）を計算する */
  get speed() { return Math.sqrt(this.vx * this.vx + this.vy * this.vy); }

  /** ボールの位置と衝突を毎フレーム更新する */
  update() {
    // パドルにくっ付いている場合はパドルに追従するだけ
    if (this.stuck) {
      this.x = paddle.x + this.offsetX;
      this.y = paddle.y - this.radius;
      return;
    }

    // 毒ブロック効果中はボール速度が半減
    const speedMult = slowTimer > 0 ? 0.5 : 1;
    this.x += this.vx * speedMult;
    this.y += this.vy * speedMult;

    // --- 壁との衝突判定 ---
    // 左壁
    if (this.x - this.radius < 0) { this.x = this.radius;     this.vx = Math.abs(this.vx); }
    // 右壁
    if (this.x + this.radius > W) { this.x = W - this.radius;  this.vx = -Math.abs(this.vx); }
    // 天井（ステータスバーの下端）
    if (this.y - this.radius < STATUS_BAR_H) { this.y = STATUS_BAR_H + this.radius; this.vy = Math.abs(this.vy); }

    // --- シールドとの衝突判定 ---
    if (shieldActive && this.vy > 0 &&
        this.y + this.radius >= shieldY &&
        this.y + this.radius <= shieldY + 6) {
      this.vy = -Math.abs(this.vy);    // 上方向に跳ね返す
      shieldActive = false;            // シールドは1回で消滅
      spawnParticles(this.x, shieldY, '#00ffff', 12);
      audio.sfxPaddle();
    }

    // --- 画面下に落ちた場合（ミス） ---
    if (this.y - this.radius > H) {
      this.active = false;
    }

    // --- パドルとの衝突判定 ---
    if (this.vy > 0 &&
        this.y + this.radius >= paddle.y &&
        this.y + this.radius <= paddle.y + paddle.height + 4 &&
        this.x >= paddle.x - paddle.drawWidth / 2 - this.radius &&
        this.x <= paddle.x + paddle.drawWidth / 2 + this.radius) {
      // パドル上の当たった位置に応じて反射角を計算
      const relX  = (this.x - paddle.x) / (paddle.drawWidth / 2);  // -1〜+1に正規化
      const angle = relX * (70 * Math.PI / 180);                   // 最大70°の反射角
      const spd   = Math.min(this.speed, 12);                      // 速度上限12
      this.vx = spd * Math.sin(angle);
      this.vy = -spd * Math.cos(angle);
      this.y  = paddle.y - this.radius;   // めり込み防止
      combo      = 0;                     // パドル反射時にコンボリセット
      comboTimer = 0;
      audio.sfxPaddle();
    }

    // --- 速度の上限を制限 ---
    const currentSpeed = this.speed;
    if (currentSpeed > 12) {
      const scale = 12 / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }

  /** ボールを円として描画する（ファイアボール中は赤く光る） */
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    if (fireballTimer > 0) {
      // ファイアボール状態：赤い光
      ctx.fillStyle   = '#ff4400';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur  = 10;
    } else {
      // 通常状態：白い光
      ctx.fillStyle   = '#ffffff';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur  = 6;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

/** 画面上に存在するボールの配列 */
let balls = [];

/** パドルにくっ付いているボールを発射する */
function launchBall() {
  balls.forEach(b => {
    if (b.stuck) {
      // ステージが進むほど初速が速くなる（最大9）
      const baseSpeed = Math.min(5 + (stage - 1) * 0.3, 9);
      b.vx    = (Math.random() - 0.5) * 3;   // ランダムな横方向成分
      b.vy    = -baseSpeed;                   // 上方向に発射
      b.stuck = false;
    }
  });
}

/** ボールを1つだけにリセットし、パドル上にくっ付ける */
function resetBall() {
  balls = [new Ball(paddle.x, paddle.y - 6, 0, 0)];
  balls[0].stuck   = true;
  balls[0].offsetX = 0;
}
