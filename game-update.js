function initialiseMonsterMotion(monster) {
  const speed = state.screen === "boss" ? randomBetween(55, 82) : randomBetween(68, 102);
  const angle = randomBetween(0, Math.PI * 2);
  monster.vx = Math.cos(angle) * speed;
  monster.vy = Math.sin(angle) * speed;
  monster.turnTimer = randomBetween(1.2, 2.8);
}

function updateMonsterMovement(dt) {
  const activeMonsters = state.monsters.filter(monster => monster.alive);

  for (const monster of activeMonsters) {
    if (!Number.isFinite(monster.vx) || !Number.isFinite(monster.vy)) {
      initialiseMonsterMotion(monster);
    }

    monster.phase += dt * 2.6;
    monster.turnTimer -= dt;

    // Make the monsters occasionally change direction so that their paths
    // feel alive without becoming too fast or unpredictable for pupils.
    if (monster.turnTimer <= 0) {
      const speed = Math.hypot(monster.vx, monster.vy);
      const currentAngle = Math.atan2(monster.vy, monster.vx);
      const newAngle = currentAngle + randomBetween(-0.7, 0.7);
      monster.vx = Math.cos(newAngle) * speed;
      monster.vy = Math.sin(newAngle) * speed;
      monster.turnTimer = randomBetween(1.2, 2.8);
    }

    monster.x += monster.vx * dt;
    monster.y += monster.vy * dt;

    // Leave extra room above each monster for its moving answer label.
    const minX = state.screen === "boss" ? 245 + monster.radius : 260 + monster.radius;
    const maxX = state.screen === "boss" ? 690 - monster.radius : WIDTH - monster.radius - 22;
    const minY = ARENA_TOP + monster.radius + 42;
    const maxY = HEIGHT - monster.radius - 18;

    if (monster.x <= minX) {
      monster.x = minX;
      monster.vx = Math.abs(monster.vx);
    } else if (monster.x >= maxX) {
      monster.x = maxX;
      monster.vx = -Math.abs(monster.vx);
    }

    if (monster.y <= minY) {
      monster.y = minY;
      monster.vy = Math.abs(monster.vy);
    } else if (monster.y >= maxY) {
      monster.y = maxY;
      monster.vy = -Math.abs(monster.vy);
    }

    monster.hitFlash = Math.max(0, monster.hitFlash - dt);
    monster.wrongFlash = Math.max(0, monster.wrongFlash - dt);
  }

  // Gently separate monsters when they touch so their answer labels remain readable.
  for (let firstIndex = 0; firstIndex < activeMonsters.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < activeMonsters.length; secondIndex++) {
      const first = activeMonsters[firstIndex];
      const second = activeMonsters[secondIndex];
      let dx = second.x - first.x;
      let dy = second.y - first.y;
      let distance = Math.hypot(dx, dy);
      const minimumDistance = first.radius + second.radius + 24;

      if (distance < minimumDistance) {
        if (distance === 0) {
          dx = 1;
          dy = 0;
          distance = 1;
        }

        const normalX = dx / distance;
        const normalY = dy / distance;
        const overlap = (minimumDistance - distance) / 2;
        first.x -= normalX * overlap;
        first.y -= normalY * overlap;
        second.x += normalX * overlap;
        second.y += normalY * overlap;

        const firstAlongNormal = first.vx * normalX + first.vy * normalY;
        const secondAlongNormal = second.vx * normalX + second.vy * normalY;
        const velocityDifference = secondAlongNormal - firstAlongNormal;

        first.vx += velocityDifference * normalX;
        first.vy += velocityDifference * normalY;
        second.vx -= velocityDifference * normalX;
        second.vy -= velocityDifference * normalY;
      }
    }
  }
}

function update(dt) {
  if (state.paused || !["battle", "boss"].includes(state.screen)) {
    updateParticles(dt);
    return;
  }

  const player = state.player;
  if (!player) return;

  player.shootCooldown = Math.max(0, player.shootCooldown - dt);
  player.invincible = Math.max(0, player.invincible - dt);
  state.shake = Math.max(0, state.shake - 24 * dt);
  state.flash = Math.max(0, state.flash - dt);

  let moveX = 0;
  let moveY = 0;
  if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) moveX -= 1;
  if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) moveX += 1;
  if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) moveY -= 1;
  if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) moveY += 1;

  const moveLength = Math.hypot(moveX, moveY);
  if (moveLength > 0) {
    moveX /= moveLength;
    moveY /= moveLength;
    player.x += moveX * player.speed * dt;
    player.y += moveY * player.speed * dt;
    player.facingX = moveX;
    player.facingY = moveY;
    player.walkCycle += dt * 11;
  }

  const rightLimit = state.screen === "boss" ? 735 : WIDTH - 24;
  player.x = clamp(player.x, 24, rightLimit);
  player.y = clamp(player.y, ARENA_TOP + 24, HEIGHT - 28);

  updateMonsterMovement(dt);
  updateFireballs(dt);
  updateParticles(dt);
  updateFloatingTexts(dt);

  if (state.screen === "boss" && state.boss) updateBoss(dt);

  if (state.transitionTimer > 0) {
    state.transitionTimer -= dt;
    if (state.transitionTimer <= 0) {
      if (state.screen === "battle" && state.correctCount >= BOSS_UNLOCK_CORRECT) enterBossBattle();
      else if (state.screen === "boss" && state.boss?.hp > 0) nextQuestion();
      else if (state.screen === "battle") nextQuestion();
    }
  }
}

function updateFireballs(dt) {
  for (let index = state.fireballs.length - 1; index >= 0; index--) {
    const fireball = state.fireballs[index];
    fireball.x += fireball.vx * dt;
    fireball.y += fireball.vy * dt;
    fireball.life -= dt;
    fireball.trailTimer -= dt;

    if (fireball.trailTimer <= 0) {
      fireball.trailTimer = 0.025;
      state.particles.push({
        x: fireball.x,
        y: fireball.y,
        vx: randomBetween(-25, 25),
        vy: randomBetween(-25, 25),
        size: Math.floor(randomBetween(2, 4 + fireball.level)),
        color: fireball.level === 1 ? "#ffb15a" : fireball.level === 2 ? "#62d8ff" : "#c98cff",
        life: 0.22,
        maxLife: 0.22
      });
    }

    let collided = false;
    for (const monster of state.monsters) {
      if (monster.alive && circleHit(fireball, monster)) {
        handleMonsterHit(monster);
        collided = true;
        break;
      }
    }

    if (!collided && state.screen === "boss" && state.boss && circleHit(fireball, state.boss)) {
      addFloatingText("HIT AN ANSWER FIRST!", state.boss.x, state.boss.y - 78, "#ffffff");
      state.boss.hitFlash = 0.08;
      collided = true;
      beep(90, 0.05, "square", 0.018);
    }

    if (collided || fireball.life <= 0 || fireball.x < -40 || fireball.x > WIDTH + 40 || fireball.y < -40 || fireball.y > HEIGHT + 40) {
      state.fireballs.splice(index, 1);
    }
  }
}

function updateBoss(dt) {
  const boss = state.boss;
  boss.phase += dt;
  boss.y = 260 + Math.sin(boss.phase * 1.55) * 60;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.rage = boss.hp <= 45 ? 1 : 0;

  state.bossShotTimer -= dt;
  if (state.bossShotTimer <= 0 && state.transitionTimer <= 0) {
    spawnBossBullet();
    state.bossShotTimer = boss.rage ? randomBetween(0.58, 0.82) : randomBetween(0.9, 1.25);
  }

  for (let index = state.enemyBullets.length - 1; index >= 0; index--) {
    const bullet = state.enemyBullets[index];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (circleHit(bullet, state.player)) {
      state.enemyBullets.splice(index, 1);
      takePlayerDamage(1);
      continue;
    }

    if (bullet.life <= 0 || bullet.x < -30 || bullet.x > WIDTH + 30 || bullet.y < ARENA_TOP - 30 || bullet.y > HEIGHT + 30) {
      state.enemyBullets.splice(index, 1);
    }
  }
}

function updateParticles(dt) {
  for (let index = state.particles.length - 1; index >= 0; index--) {
    const particle = state.particles[index];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.02, dt);
    particle.vy *= Math.pow(0.02, dt);
    particle.life -= dt;
    if (particle.life <= 0) state.particles.splice(index, 1);
  }
}

function updateFloatingTexts(dt) {
  for (let index = state.floatingTexts.length - 1; index >= 0; index--) {
    const item = state.floatingTexts[index];
    item.y -= 38 * dt;
    item.life -= dt;
    if (item.life <= 0) state.floatingTexts.splice(index, 1);
  }
}
