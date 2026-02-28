/* ============================================================
   ranking.js — スコアランキングと名前入力
   ============================================================ */
'use strict';

let rankingNameInput = false;         // 名前入力モードかどうか
let nameInputText    = '';            // 入力中の名前文字列
const NAME_CHARS     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';  // 使用可能な文字

/**
 * 名前入力時のキー入力を処理する
 * @param {string} key - 押されたキー名
 */
function handleNameInput(key) {
  // Enterで名前を確定してランキング画面へ
  if (key === 'Enter' || key === 'Return') {
    if (nameInputText.length > 0) {
      saveScore(nameInputText, score);
      rankingNameInput = false;
      gameState = STATE.RANKING;
    }
    return;
  }
  // Backspaceで最後の1文字を削除
  if (key === 'Backspace') {
    nameInputText = nameInputText.slice(0, -1);
    return;
  }
  // 英字・数字・スペースを追加（最大8文字）
  if (key.length === 1 && nameInputText.length < 8) {
    const ch = key.toUpperCase();
    if (NAME_CHARS.includes(ch)) nameInputText += ch;
  }
}

/**
 * スコアをlocalStorageに保存する（上位10件まで）
 * @param {string} name - プレイヤー名
 * @param {number} sc   - スコア
 */
function saveScore(name, sc) {
  try {
    let rankings = JSON.parse(localStorage.getItem('retroBreakerX_rankings') || '[]');
    rankings.push({ name, score: sc, stage, date: new Date().toISOString().slice(0, 10) });
    rankings.sort((a, b) => b.score - a.score);   // スコア降順でソート
    rankings = rankings.slice(0, 10);              // 上位10件のみ保持
    localStorage.setItem('retroBreakerX_rankings', JSON.stringify(rankings));
  } catch (e) { /* localStorageが使えない環境 */ }
}

/**
 * localStorageからランキングデータを取得する
 * @returns {Array} ランキング配列
 */
function getRankings() {
  try {
    return JSON.parse(localStorage.getItem('retroBreakerX_rankings') || '[]');
  } catch (e) { return []; }
}
