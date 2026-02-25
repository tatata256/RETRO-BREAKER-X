/* ============================================================
   ranking.js — Score Ranking & Name Input
   ============================================================ */
'use strict';

let rankingNameInput = false;
let nameInputText    = '';
const NAME_CHARS     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

function handleNameInput(key) {
  if (key === 'Enter' || key === 'Return') {
    if (nameInputText.length > 0) {
      saveScore(nameInputText, score);
      rankingNameInput = false;
      gameState = STATE.RANKING;
    }
    return;
  }
  if (key === 'Backspace') {
    nameInputText = nameInputText.slice(0, -1);
    return;
  }
  if (key.length === 1 && nameInputText.length < 8) {
    const ch = key.toUpperCase();
    if (NAME_CHARS.includes(ch)) nameInputText += ch;
  }
}

function saveScore(name, sc) {
  try {
    let rankings = JSON.parse(localStorage.getItem('retroBreakerX_rankings') || '[]');
    rankings.push({ name, score: sc, stage, date: new Date().toISOString().slice(0, 10) });
    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 10);
    localStorage.setItem('retroBreakerX_rankings', JSON.stringify(rankings));
  } catch (e) { /* localStorage unavailable */ }
}

function getRankings() {
  try {
    return JSON.parse(localStorage.getItem('retroBreakerX_rankings') || '[]');
  } catch (e) { return []; }
}
