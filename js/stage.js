/* ============================================================
   stage.js — Stage Generation
   ============================================================ */
'use strict';

function generateStage(stageNum) {
  blocks        = [];
  boss          = null;
  isBossStage   = false;
  items         = [];
  activeEffects = [];
  fireballTimer = 0;
  scoreX2Timer  = 0;
  slowTimer     = 0;
  shieldActive  = false;

  // --- Boss stages ---
  if (stageNum === 6)  { isBossStage = true; boss = new Boss('GATEKEEPER'); audio.startBGM(true); return; }
  if (stageNum === 11) { isBossStage = true; boss = new Boss('PHANTOM');    audio.startBGM(true); return; }
  if (stageNum === 16) { isBossStage = true; boss = new Boss('CHAOSCORE');  audio.startBGM(true); return; }

  audio.startBGM(false);

  // --- Available block types by stage progression ---
  let availableTypes = ['NORMAL'];
  if (stageNum >= 2)  availableTypes.push('ARMOR');
  if (stageNum >= 3)  availableTypes.push('GOLD');
  if (stageNum >= 4)  availableTypes.push('SPLITTER');
  if (stageNum >= 5)  availableTypes.push('MOVING');
  if (stageNum >= 7)  availableTypes.push('POISON');
  if (stageNum >= 8)  availableTypes.push('INVISI');
  if (stageNum >= 9)  availableTypes.push('MIRROR');

  const numRows = Math.min(3 + Math.floor(stageNum / 2), 10);
  const pattern = stageNum % 5;

  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      let place = true;

      // Pattern-based layout
      switch (pattern) {
        case 0: place = true; break;
        case 1: place = (row + col) % 2 === 0; break;                                           // checkerboard
        case 2: place = col > 1 && col < 8; break;                                               // narrow
        case 3: place = row < numRows - 1 || col % 2 === 0; break;                               // bottom gaps
        case 4: place = !(col >= 3 && col <= 6 && row >= 1 && row <= numRows - 2); break;        // hollow
      }

      // Random removal / insertion
      if (Math.random() < 0.1) place = !place;

      if (place) {
        let type = 'NORMAL';
        const r  = Math.random();

        if (stageNum <= 5) {
          if      (r < 0.6)                                     type = 'NORMAL';
          else if (r < 0.8  && availableTypes.includes('ARMOR'))    type = 'ARMOR';
          else if (r < 0.9  && availableTypes.includes('GOLD'))     type = 'GOLD';
          else if (r < 0.95 && availableTypes.includes('SPLITTER')) type = 'SPLITTER';
          else if (availableTypes.includes('MOVING'))                type = 'MOVING';
        } else if (stageNum <= 10) {
          if      (r < 0.35)                                    type = 'NORMAL';
          else if (r < 0.50)                                    type = 'ARMOR';
          else if (r < 0.60)                                    type = 'GOLD';
          else if (r < 0.70)                                    type = 'SPLITTER';
          else if (r < 0.80)                                    type = 'MOVING';
          else if (r < 0.90 && availableTypes.includes('POISON')) type = 'POISON';
          else if (availableTypes.includes('INVISI'))              type = 'INVISI';
        } else {
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

        if (!availableTypes.includes(type)) type = 'NORMAL';
        blocks.push(new Block(col, row, type));
      }
    }
  }
}
