/* ============================================================
   main.js — Game Loop, Update Logic & Responsive Resize
   ============================================================ */
'use strict';

let lastTime    = 0;
let accumulator = 0;

/* --- Per-frame update --- */
function update() {
  // Ready countdown
  if (gameState === STATE.READY) {
    readyTimer--;
    if (mouseActive || touchActive) paddle.x += (mouseX - paddle.x) * 0.15;
    if (keys['ArrowLeft'])  paddle.x -= paddle.speed;
    if (keys['ArrowRight']) paddle.x += paddle.speed;
    paddle.update();
    balls.forEach(b => b.update());
    if (readyTimer <= 0) gameState = STATE.PLAYING;
    return;
  }

  if (gameState !== STATE.PLAYING) return;

  // Timers
  if (fireballTimer > 0) fireballTimer -= DT;
  if (scoreX2Timer  > 0) scoreX2Timer  -= DT;
  if (slowTimer     > 0) slowTimer     -= DT;
  if (comboTimer    > 0) comboTimer--; else combo = 0;

  activeEffects = activeEffects.filter(e => { e.timer -= DT; return e.timer > 0; });

  // Paddle
  if (mouseActive || touchActive) paddle.x += (mouseX - paddle.x) * 0.15;
  if (keys['ArrowLeft'])  paddle.x -= paddle.speed;
  if (keys['ArrowRight']) paddle.x += paddle.speed;
  paddle.update();

  // Balls
  balls.forEach(b => b.update());

  // Block collisions
  balls.forEach(b => { if (b.active && !b.stuck) checkBlockCollision(b); });

  // Boss
  if (boss && boss.alive) {
    boss.update();
    balls.forEach(b => { if (b.active && !b.stuck) boss.checkHit(b); });
  }

  // Blocks
  blocks.forEach(b => b.update(DT));

  // Items
  items.forEach(i => i.update());
  items = items.filter(i => i.active);

  // Remove dead balls
  const aliveBalls = balls.filter(b => b.active);
  if (aliveBalls.length === 0) loseLife(); else balls = aliveBalls;

  // Particles
  particles.forEach(p => p.update());
  particles = particles.filter(p => p.life > 0);

  // Win check
  checkStageComplete();
}

/* --- Fixed-timestep game loop --- */
function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += delta;

  while (accumulator >= DT) {
    update();
    accumulator -= DT;
  }

  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

/* --- Responsive scaling --- */
function resize() {
  const wrapper = document.getElementById('gameWrapper');
  const maxW = window.innerWidth, maxH = window.innerHeight;
  const ratio = W / H;
  let w, h;
  if (maxW / maxH > ratio) { h = maxH; w = h * ratio; }
  else                      { w = maxW; h = w / ratio; }
  wrapper.style.width  = w + 'px';
  wrapper.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();
