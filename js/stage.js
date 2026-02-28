/* ============================================================
   stage.js — ステージの生成ロジック
   ============================================================ */
'use strict';

/**
 * 指定されたステージ番号に応じてブロック配置またはボスを生成する
 * @param {number} stageNum - ステージ番号（1～16）
 */
function generateStage(stageNum) {
  // ゲーム状態を初期化
  blocks        = [];
  boss          = null;
  isBossStage   = false;
  items         = [];
  activeEffects = [];
  fireballTimer = 0;
  scoreX2Timer  = 0;
  slowTimer     = 0;
  shieldActive  = false;

  // --- ボスステージの判定（ステージ6/11/16） ---
  if (stageNum === 6)  { isBossStage = true; boss = new Boss('GATEKEEPER'); audio.startBGM(true); return; }
  if (stageNum === 11) { isBossStage = true; boss = new Boss('PHANTOM');    audio.startBGM(true); return; }
  if (stageNum === 16) { isBossStage = true; boss = new Boss('CHAOSCORE');  audio.startBGM(true); return; }

  audio.startBGM(false);   // 通常ステージのBGMを開始

  // --- ステージ進行に応じて使用可能なブロックタイプを解禁 ---
  let availableTypes = ['NORMAL'];
  if (stageNum >= 2)  availableTypes.push('ARMOR');      // ステージ2から装甲
  if (stageNum >= 3)  availableTypes.push('GOLD');       // ステージ3からゴールド
  if (stageNum >= 4)  availableTypes.push('SPLITTER');   // ステージ4からスプリッター
  if (stageNum >= 5)  availableTypes.push('MOVING');     // ステージ5から移動
  if (stageNum >= 7)  availableTypes.push('POISON');     // ステージ7から毒
  if (stageNum >= 8)  availableTypes.push('INVISI');     // ステージ8から透明
  if (stageNum >= 9)  availableTypes.push('MIRROR');     // ステージ9からミラー

  // ブロックの行数（ステージが進むほど增える、最大10行）
  const numRows = Math.min(3 + Math.floor(stageNum / 2), 10);
  // 5種類のレイアウトパターンをステージ番号でローテーション
  const pattern = stageNum % 5;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      let place = true;

      // パターン別のブロック配置ルール
      switch (pattern) {
        case 0: place = true; break;                                                              // 全埋め
        case 1: place = (row + col) % 2 === 0; break;                                            // チェッカーボード
        case 2: place = col > 1 && col < 8; break;                                               // 中央集中
        case 3: place = row < numRows - 1 || col % 2 === 0; break;                               // 下端に隠間
        case 4: place = !(col >= 3 && col <= 6 && row >= 1 && row <= numRows - 2); break;        // 中央が空洞
      }

      // 10%の確率で配置を反転（ランダムなバリエーション）
      if (Math.random() < 0.1) place = !place;

      if (place) {
        let type = 'NORMAL';
        const r  = Math.random();

        // 3段階の難易度ティアでブロックタイプの出現率を変更
        if (stageNum <= 5) {
          // 前半：NORMALが多く、特殊ブロックは少ない
          if      (r < 0.6)                                     type = 'NORMAL';
          else if (r < 0.8  && availableTypes.includes('ARMOR'))    type = 'ARMOR';
          else if (r < 0.9  && availableTypes.includes('GOLD'))     type = 'GOLD';
          else if (r < 0.95 && availableTypes.includes('SPLITTER')) type = 'SPLITTER';
          else if (availableTypes.includes('MOVING'))                type = 'MOVING';
        } else if (stageNum <= 10) {
          // 中盤：特殊ブロックが増加
          if      (r < 0.35)                                    type = 'NORMAL';
          else if (r < 0.50)                                    type = 'ARMOR';
          else if (r < 0.60)                                    type = 'GOLD';
          else if (r < 0.70)                                    type = 'SPLITTER';
          else if (r < 0.80)                                    type = 'MOVING';
          else if (r < 0.90 && availableTypes.includes('POISON')) type = 'POISON';
          else if (availableTypes.includes('INVISI'))              type = 'INVISI';
        } else {
          // 後半：全タイプが均等に近い確率で出現
          if      (r < 0.20) type = 'NORMAL';
          else if (r < 0.30) type = 'ARMOR';
          else if (r < 0.40) type = 'GOLD';
          else if (r < 0.50) type = 'SPLITTER';
          else if (r < 0.60) type = 'MOVING';
          else if (r < 0.72) type = 'POISON';
          else if (r < 0.82) type = 'INVISI';
          else if (r < 0.92) type = 'MIRROR';
          else               type = 'ARMOR';
        }

        // 解禁されていないタイプが選ばれた場合はNORMALにフォールバック
        if (!availableTypes.includes(type)) type = 'NORMAL';
        blocks.push(new Block(col, row, type));
      }
    }
  }
}
