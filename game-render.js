function draw() {
  ctx.save();
  const shakeX = state.shake > 0 ? randomBetween(-state.shake, state.shake) : 0;
  const shakeY = state.shake > 0 ? randomBetween(-state.shake, state.shake) : 0;
  ctx.translate(Math.round(shakeX), Math.round(shakeY));
  drawBackground();
  drawArenaDecor();
  if (state.player) {
    drawMonsters();
    if (state.screen === "boss" && state.boss) drawBoss();
    drawEnemyBullets();
    drawFireballs();
    drawPlayer();
    drawParticles();
    drawFloatingTexts();
    drawHud();
    drawCrosshair();
  }
  if (state.paused) drawPauseScreen();
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.3, state.flash * 1.5)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  ctx.restore();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, state.screen === "boss" ? "#311433" : "#211c45");
  gradient.addColorStop(0.55, state.screen === "boss" ? "#1d132e" : "#141633");
  gradient.addColorStop(1, "#0a0c1c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = state.screen === "boss" ? "#7a2845" : "#342b63";
  for (let x = 0; x < WIDTH; x += 96) {
    const height = 30 + ((x / 96) % 3) * 16;
    ctx.fillRect(x, ARENA_TOP - height, 70, height);
    ctx.fillRect(x + 18, ARENA_TOP - height - 15, 14, 15);
    ctx.fillRect(x + 46, ARENA_TOP - height - 22, 13, 22);
  }
  ctx.fillStyle = "#10142a";
  ctx.fillRect(0, ARENA_TOP, WIDTH, HEIGHT - ARENA_TOP);
  ctx.fillStyle = state.screen === "boss" ? "#291631" : "#1a1b38";
  for (let y = ARENA_TOP; y < HEIGHT; y += 32) {
    for (let x = (Math.floor(y / 32) % 2) * 32; x < WIDTH; x += 64) ctx.fillRect(x, y, 32, 16);
  }
  ctx.strokeStyle = state.screen === "boss" ? "rgba(255,77,109,.18)" : "rgba(98,216,255,.12)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= WIDTH; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, ARENA_TOP);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = ARENA_TOP; y <= HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawArenaDecor() {
  drawTorch(34, 135);
  drawTorch(926, 135);
  drawTorch(34, 495);
  drawTorch(926, 495);
  if (state.screen === "boss") {
    ctx.fillStyle = "rgba(255,77,109,.1)";
    ctx.fillRect(744, ARENA_TOP, 216, HEIGHT - ARENA_TOP);
    ctx.strokeStyle = "#8e3150";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(744, ARENA_TOP);
    ctx.lineTo(744, HEIGHT);
    ctx.stroke();
  }
}

function drawTorch(x, y) {
  ctx.fillStyle = "#69452e";
  ctx.fillRect(x - 4, y, 8, 26);
  ctx.fillStyle = "#ff7043";
  ctx.fillRect(x - 7, y - 10, 14, 13);
  ctx.fillStyle = "#ffd65a";
  ctx.fillRect(x - 3, y - 15, 6, 12);
}

function drawPlayer() {
  const p = state.player;
  if (p.invincible > 0 && Math.floor(p.invincible * 12) % 2 === 0) return;
  const bob = Math.sin(p.walkCycle) * 2;
  const x = Math.round(p.x);
  const y = Math.round(p.y + bob);
  ctx.save();
  ctx.translate(x, y);
  if (p.facingX < 0) ctx.scale(-1, 1);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(-17, 16, 34, 8);
  ctx.fillStyle = "#4056a8";
  ctx.fillRect(-15, -4, 30, 25);
  ctx.fillStyle = "#62d8ff";
  ctx.fillRect(-11, 0, 22, 12);
  ctx.fillStyle = "#f0bd86";
  ctx.fillRect(-12, -22, 24, 20);
  ctx.fillStyle = "#382746";
  ctx.fillRect(-15, -25, 30, 8);
  ctx.fillRect(-15, -18, 6, 10);
  ctx.fillStyle = "#22223d";
  ctx.fillRect(3, -13, 4, 4);
  ctx.fillStyle = "#d7e8ff";
  ctx.fillRect(9, -2, 13, 8);
  ctx.fillStyle = "#8d5cbd";
  ctx.fillRect(15, -5, 10, 14);
  ctx.fillStyle = "#1b1d38";
  ctx.fillRect(-14, 21, 10, 8);
  ctx.fillRect(5, 21, 10, 8);
  ctx.restore();
}

function drawMonsters() {
  for (const monster of state.monsters) {
    if (!monster.alive) continue;
    const x = Math.round(monster.x);
    const y = Math.round(monster.y);
    const r = monster.radius;
    const bodyColor = monster.wrongFlash > 0 ? "#ff4d6d" : monster.hitFlash > 0 ? "#ffffff" : `hsl(${monster.hue} 62% 54%)`;
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(x - r, y + r - 3, r * 2, 9);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - r + 4, y - r + 10, r * 2 - 8, r * 2 - 15);
    ctx.fillRect(x - r + 10, y - r + 3, r * 2 - 20, 12);
    ctx.fillRect(x - r + 1, y - 5, 8, 22);
    ctx.fillRect(x + r - 9, y - 5, 8, 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 14, y - 14, 9, 10);
    ctx.fillRect(x + 5, y - 14, 9, 10);
    ctx.fillStyle = "#17152f";
    ctx.fillRect(x - 9, y - 10, 4, 5);
    ctx.fillRect(x + 5, y - 10, 4, 5);
    ctx.fillRect(x - 10, y + 8, 20, 5);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 8, y + 8, 4, 4);
    ctx.fillRect(x + 4, y + 8, 4, 4);
    drawAnswerLabel(monster.answer, x, y - r - 22, monster.wrongFlash > 0);
  }
}

function drawAnswerLabel(text, x, y, wrong) {
  ctx.font = "bold 14px 'Courier New', monospace";
  const padding = 8;
  const width = Math.max(72, ctx.measureText(text).width + padding * 2);
  ctx.fillStyle = wrong ? "#5b1728" : "#14142c";
  ctx.fillRect(Math.round(x - width / 2), Math.round(y - 14), Math.round(width), 27);
  ctx.strokeStyle = wrong ? "#ff8aa0" : "#fff2b8";
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(x - width / 2), Math.round(y - 14), Math.round(width), 27);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawFireballs() {
  for (const fireball of state.fireballs) {
    const x = Math.round(fireball.x);
    const y = Math.round(fireball.y);
    const r = fireball.radius;
    const outer = fireball.level === 1 ? "#ff6b3d" : fireball.level === 2 ? "#168ed1" : "#7d38d5";
    const middle = fireball.level === 1 ? "#ffb15a" : fireball.level === 2 ? "#62d8ff" : "#c98cff";
    ctx.fillStyle = outer;
    ctx.fillRect(x - r - 2, y - r - 2, (r + 2) * 2, (r + 2) * 2);
    ctx.fillStyle = middle;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = "#fffbd1";
    ctx.fillRect(x - Math.max(2, r - 4), y - Math.max(2, r - 4), Math.max(4, (r - 4) * 2), Math.max(4, (r - 4) * 2));
  }
}

function drawEnemyBullets() {
  for (const bullet of state.enemyBullets) {
    const x = Math.round(bullet.x);
    const y = Math.round(bullet.y);
    ctx.fillStyle = "#760f37";
    ctx.fillRect(x - bullet.radius - 2, y - bullet.radius - 2, bullet.radius * 2 + 4, bullet.radius * 2 + 4);
    ctx.fillStyle = "#ff4d6d";
    ctx.fillRect(x - bullet.radius, y - bullet.radius, bullet.radius * 2, bullet.radius * 2);
    ctx.fillStyle = "#ffd0db";
    ctx.fillRect(x - 2, y - 2, 4, 4);
  }
}

function drawBoss() {
  const boss = state.boss;
  const x = Math.round(boss.x);
  const y = Math.round(boss.y);
  const flash = boss.hitFlash > 0;
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.fillRect(x - 66, y + 58, 132, 14);
  ctx.fillStyle = flash ? "#ffffff" : boss.rage ? "#d52b54" : "#8d315f";
  ctx.fillRect(x - 54, y - 50, 108, 108);
  ctx.fillRect(x - 68, y - 24, 20, 52);
  ctx.fillRect(x + 48, y - 24, 20, 52);
  ctx.fillStyle = flash ? "#ffffff" : "#4a193e";
  ctx.fillRect(x - 40, y - 66, 22, 22);
  ctx.fillRect(x + 18, y - 66, 22, 22);
  ctx.fillStyle = "#ffeaf2";
  ctx.fillRect(x - 30, y - 20, 18, 17);
  ctx.fillRect(x + 12, y - 20, 18, 17);
  ctx.fillStyle = boss.rage ? "#ffd65a" : "#ff4d6d";
  ctx.fillRect(x - 24, y - 14, 9, 10);
  ctx.fillRect(x + 15, y - 14, 9, 10);
  ctx.fillStyle = "#25112d";
  ctx.fillRect(x - 26, y + 18, 52, 10);
  ctx.fillStyle = "#ffffff";
  for (let tooth = -20; tooth <= 16; tooth += 12) ctx.fillRect(x + tooth, y + 18, 7, 8);
  ctx.fillStyle = "#0d0c1d";
  ctx.fillRect(690, 106, 250, 22);
  ctx.strokeStyle = "#fff3c4";
  ctx.lineWidth = 3;
  ctx.strokeRect(690, 106, 250, 22);
  ctx.fillStyle = boss.rage ? "#ff4d6d" : "#ff8f3d";
  ctx.fillRect(694, 110, 242 * (boss.hp / boss.maxHp), 14);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`FINAL BOSS ${boss.hp}/100`, 815, 101);
  ctx.textAlign = "left";
}

function drawParticles() {
  for (const particle of state.particles) {
    ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = particle.color;
    ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts() {
  ctx.font = "bold 16px 'Courier New', monospace";
  ctx.textAlign = "center";
  for (const item of state.floatingTexts) {
    ctx.globalAlpha = clamp(item.life / item.maxLife, 0, 1);
    ctx.fillStyle = "#090914";
    ctx.fillText(item.text, item.x + 2, item.y + 2);
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, item.x, item.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawHud() {
  const p = state.player;
  ctx.fillStyle = "rgba(10,9,26,.9)";
  ctx.fillRect(12, 12, 150, 76);
  ctx.strokeStyle = "#5e548d";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, 150, 76);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillText("HEARTS", 24, 32);
  for (let i = 0; i < p.maxHp; i++) drawHeart(24 + i * 23, 44, i < p.hp);
  ctx.fillStyle = "rgba(10,9,26,.9)";
  ctx.fillRect(798, 12, 150, 76);
  ctx.strokeStyle = "#5e548d";
  ctx.strokeRect(798, 12, 150, 76);
  ctx.fillStyle = "#ffd65a";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillText(`SCORE ${state.score}`, 812, 33);
  ctx.fillStyle = "#62d8ff";
  ctx.fillText(`ENERGY ${state.energy}`, 812, 52);
  ctx.fillStyle = "#c98cff";
  ctx.fillText(`FIRE LV.${state.fireLevel}`, 812, 71);
  ctx.fillStyle = "rgba(10,9,26,.78)";
  ctx.fillRect(177, 12, 118, 34);
  ctx.strokeStyle = "#5e548d";
  ctx.strokeRect(177, 12, 118, 34);
  ctx.fillStyle = "#66e3a4";
  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillText(`STREAK x${state.streak}`, 189, 34);
  if (state.screen === "battle") {
    const progress = state.correctCount / BOSS_UNLOCK_CORRECT;
    ctx.fillStyle = "rgba(10,9,26,.82)";
    ctx.fillRect(305, 12, 365, 34);
    ctx.strokeStyle = "#5e548d";
    ctx.strokeRect(305, 12, 365, 34);
    ctx.fillStyle = "#2c284d";
    ctx.fillRect(313, 20, 235, 18);
    ctx.fillStyle = "#ff8f3d";
    ctx.fillRect(313, 20, 235 * progress, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText(`BOSS PORTAL ${state.correctCount}/${BOSS_UNLOCK_CORRECT}`, 560, 34);
  }
}

function drawHeart(x, y, filled) {
  ctx.fillStyle = filled ? "#ff4d6d" : "#43334f";
  ctx.fillRect(x, y, 7, 7);
  ctx.fillRect(x + 10, y, 7, 7);
  ctx.fillRect(x - 3, y + 5, 23, 7);
  ctx.fillRect(x + 1, y + 12, 15, 6);
  ctx.fillRect(x + 5, y + 18, 7, 4);
}

function drawCrosshair() {
  if (!["battle", "boss"].includes(state.screen)) return;
  const x = Math.round(state.mouse.x);
  const y = Math.round(state.mouse.y);
  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x - 3, y);
  ctx.moveTo(x + 3, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y - 3);
  ctx.moveTo(x, y + 3);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
}

function drawPauseScreen() {
  ctx.fillStyle = "rgba(7,7,18,.68)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#ffd65a";
  ctx.font = "bold 38px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px 'Courier New', monospace";
  ctx.fillText("Press P to continue", WIDTH / 2, HEIGHT / 2 + 34);
  ctx.textAlign = "left";
}
