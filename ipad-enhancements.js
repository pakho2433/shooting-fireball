"use strict";

const ipadJoystickZone = document.getElementById("joystickZone");
const ipadJoystickKnob = document.getElementById("joystickKnob");
const ipadHintPanel = document.getElementById("hintPanel");
const ipadHintText = document.getElementById("hintText");
const ipadUpgradeSignal = document.getElementById("upgradeSignal");
const ipadUpgradeSignalTitle = document.getElementById("upgradeSignalTitle");
const ipadUpgradeSignalText = document.getElementById("upgradeSignalText");

const IPAD_AUTO_UPGRADE_SCORES = [50, 100];
let ipadUpgradeSignalTimer = null;
let ipadActiveJoystickPointer = null;

state.joystickX = 0;
state.joystickY = 0;
state.questionWrongCount = 0;

function ipadHideHint() {
  if (!ipadHintPanel) return;
  ipadHintPanel.hidden = true;
  ipadHintPanel.classList.remove("hint-visible");
}

function ipadHintForQuestion() {
  const tense = state.question?.tense;
  if (tense === "Simple Present") {
    return "Look for routines or facts. With he, she or it, the verb usually ends in -s or -es.";
  }
  if (tense === "Present Continuous") {
    return "Look for clues such as now, Look!, Listen! or at the moment. Use am/is/are + verb-ing.";
  }
  if (tense === "Simple Past") {
    return "Look for past-time clues such as yesterday, last week or ago. Choose the past form of the verb.";
  }
  return "Read the time clue carefully and decide when the action happens.";
}

function ipadShowHint() {
  if (!ipadHintPanel || !ipadHintText) return;
  ipadHintText.textContent = ipadHintForQuestion();
  ipadHintPanel.hidden = false;
  requestAnimationFrame(() => ipadHintPanel.classList.add("hint-visible"));
  beep(620, 0.08, "triangle", 0.035);
  beep(760, 0.1, "triangle", 0.03, 0.08);
  announce(`Hint: ${ipadHintText.textContent}`);
}

function ipadShowUpgradeSignal(level, targetScore) {
  if (!ipadUpgradeSignal) return;
  window.clearTimeout(ipadUpgradeSignalTimer);
  ipadUpgradeSignalTitle.textContent = `${targetScore} POINTS!`;
  ipadUpgradeSignalText.textContent = `FIREBALL UPGRADED TO LEVEL ${level}`;
  ipadUpgradeSignal.hidden = false;
  ipadUpgradeSignal.classList.remove("upgrade-signal-active");
  void ipadUpgradeSignal.offsetWidth;
  ipadUpgradeSignal.classList.add("upgrade-signal-active");
  ipadUpgradeSignalTimer = window.setTimeout(() => {
    ipadUpgradeSignal.classList.remove("upgrade-signal-active");
    ipadUpgradeSignal.hidden = true;
  }, 1900);
}

function ipadPerformAutomaticUpgrade(targetScore) {
  if (!state.player || state.fireLevel >= MAX_FIRE_LEVEL) return;
  state.fireLevel += 1;
  state.flash = 0.34;
  state.shake = 12;
  burst(state.player.x, state.player.y, state.fireLevel === 2 ? "#62d8ff" : "#c98cff", 48, 260);
  burst(state.player.x, state.player.y, "#ffd65a", 30, 210);
  addFloatingText(`AUTO UPGRADE! LEVEL ${state.fireLevel}`, state.player.x, state.player.y - 48, "#fff39a");
  playUpgradeSound();
  ipadShowUpgradeSignal(state.fireLevel, targetScore);
  announce(`You reached ${targetScore} points. Fireball automatically upgraded to level ${state.fireLevel}.`);
}

updateUpgradeButton = function ipadAutomaticUpgradeCheck() {
  if (upgradeButton) upgradeButton.style.display = "none";
  while (state.fireLevel < MAX_FIRE_LEVEL) {
    const targetScore = IPAD_AUTO_UPGRADE_SCORES[state.fireLevel - 1];
    if (!Number.isFinite(targetScore) || state.score < targetScore) break;
    ipadPerformAutomaticUpgrade(targetScore);
  }
};

upgradeFireball = function ipadManualUpgradeDisabled() {
  if (!state.player || !["battle", "boss"].includes(state.screen)) return;
  const nextTarget = IPAD_AUTO_UPGRADE_SCORES[state.fireLevel - 1];
  const message = state.fireLevel >= MAX_FIRE_LEVEL
    ? "MAX FIREBALL POWER"
    : `AUTO UPGRADE AT ${nextTarget} POINTS`;
  addFloatingText(message, state.player.x, state.player.y - 40, "#fff39a");
};

takePlayerDamage = function ipadUnlimitedLivesFeedback() {
  const player = state.player;
  if (!player || player.invincible > 0) return;
  player.invincible = 0.65;
  state.streak = 0;
  state.shake = 7;
  state.flash = 0.08;
  burst(player.x, player.y, "#ff8aa0", 14, 120);
  addFloatingText("KEEP TRYING!", player.x, player.y - 36, "#ffb4c1");
  playWrongSound();
  announce("Keep trying. There is no life limit in this game.");
};

const ipadPreviousNextQuestion = nextQuestion;
nextQuestion = function ipadNextQuestionWithHintReset() {
  ipadPreviousNextQuestion();
  state.questionWrongCount = 0;
  ipadHideHint();
};

const ipadPreviousHandleMonsterHit = handleMonsterHit;
handleMonsterHit = function ipadMonsterHitWithHints(monster) {
  const validWrongHit = Boolean(monster && monster.alive && monster.hitFlash <= 0 && !monster.correct);
  if (validWrongHit) state.questionWrongCount += 1;

  ipadPreviousHandleMonsterHit(monster);

  if (validWrongHit && state.questionWrongCount === 2) {
    ipadShowHint();
  }
};

const ipadPreviousResetGame = resetGame;
resetGame = function ipadResetGame() {
  state.joystickX = 0;
  state.joystickY = 0;
  state.questionWrongCount = 0;
  ipadHideHint();
  if (ipadUpgradeSignal) ipadUpgradeSignal.hidden = true;
  ipadResetJoystick();
  ipadPreviousResetGame();
};

const ipadPreviousUpdate = update;
update = function ipadUpdateWithJoystick(dt) {
  ipadPreviousUpdate(dt);
  if (state.paused || !state.player || !["battle", "boss"].includes(state.screen)) return;

  const magnitude = Math.hypot(state.joystickX, state.joystickY);
  if (magnitude < 0.05) return;

  const player = state.player;
  player.x += state.joystickX * player.speed * dt;
  player.y += state.joystickY * player.speed * dt;
  player.facingX = state.joystickX;
  player.facingY = state.joystickY;
  player.walkCycle += dt * 11 * magnitude;

  const rightLimit = state.screen === "boss" ? 735 : WIDTH - 24;
  player.x = clamp(player.x, 24, rightLimit);
  player.y = clamp(player.y, ARENA_TOP + 24, HEIGHT - 28);
};

drawHud = function ipadDrawHud() {
  ctx.fillStyle = "rgba(10,9,26,.9)";
  ctx.fillRect(12, 12, 168, 76);
  ctx.strokeStyle = "#5e548d";
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 12, 168, 76);
  ctx.fillStyle = "#66e3a4";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillText("NO LIFE LIMIT", 25, 35);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillText("LEARN · TRY AGAIN", 25, 57);
  ctx.fillStyle = "#ffb4c1";
  ctx.fillText("DODGE BOSS SHOTS", 25, 74);

  ctx.fillStyle = "rgba(10,9,26,.9)";
  ctx.fillRect(798, 12, 150, 76);
  ctx.strokeStyle = "#5e548d";
  ctx.strokeRect(798, 12, 150, 76);
  ctx.fillStyle = "#ffd65a";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillText(`SCORE ${state.score}`, 812, 33);
  ctx.fillStyle = "#62d8ff";
  const nextTarget = IPAD_AUTO_UPGRADE_SCORES[state.fireLevel - 1];
  ctx.fillText(nextTarget ? `NEXT ${nextTarget}` : "MAX POWER", 812, 52);
  ctx.fillStyle = "#c98cff";
  ctx.fillText(`FIRE LV.${state.fireLevel}`, 812, 71);

  ctx.fillStyle = "rgba(10,9,26,.78)";
  ctx.fillRect(190, 12, 118, 34);
  ctx.strokeStyle = "#5e548d";
  ctx.strokeRect(190, 12, 118, 34);
  ctx.fillStyle = "#66e3a4";
  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillText(`STREAK x${state.streak}`, 202, 34);

  if (state.screen === "battle") {
    const progress = state.correctCount / BOSS_UNLOCK_CORRECT;
    ctx.fillStyle = "rgba(10,9,26,.82)";
    ctx.fillRect(318, 12, 352, 34);
    ctx.strokeStyle = "#5e548d";
    ctx.strokeRect(318, 12, 352, 34);
    ctx.fillStyle = "#2c284d";
    ctx.fillRect(326, 20, 222, 18);
    ctx.fillStyle = "#ff8f3d";
    ctx.fillRect(326, 20, 222 * progress, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText(`BOSS ${state.correctCount}/${BOSS_UNLOCK_CORRECT}`, 560, 34);
  }
};

function ipadResetJoystick() {
  state.joystickX = 0;
  state.joystickY = 0;
  if (ipadJoystickKnob) ipadJoystickKnob.style.transform = "translate(-50%, -50%)";
}

function ipadMoveJoystick(event) {
  if (!ipadJoystickZone || !ipadJoystickKnob) return;
  const rect = ipadJoystickZone.getBoundingClientRect();
  const centreX = rect.left + rect.width / 2;
  const centreY = rect.top + rect.height / 2;
  const maximum = rect.width * 0.32;
  let dx = event.clientX - centreX;
  let dy = event.clientY - centreY;
  const distance = Math.hypot(dx, dy);

  if (distance > maximum) {
    dx = dx / distance * maximum;
    dy = dy / distance * maximum;
  }

  state.joystickX = dx / maximum;
  state.joystickY = dy / maximum;
  ipadJoystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

if (ipadJoystickZone) {
  ipadJoystickZone.addEventListener("pointerdown", event => {
    event.preventDefault();
    ipadActiveJoystickPointer = event.pointerId;
    ipadJoystickZone.setPointerCapture(event.pointerId);
    ipadMoveJoystick(event);
  });

  ipadJoystickZone.addEventListener("pointermove", event => {
    if (event.pointerId !== ipadActiveJoystickPointer) return;
    event.preventDefault();
    ipadMoveJoystick(event);
  });

  const finishJoystick = event => {
    if (event.pointerId !== ipadActiveJoystickPointer) return;
    ipadActiveJoystickPointer = null;
    ipadResetJoystick();
  };

  ipadJoystickZone.addEventListener("pointerup", finishJoystick);
  ipadJoystickZone.addEventListener("pointercancel", finishJoystick);
  ipadJoystickZone.addEventListener("lostpointercapture", () => {
    ipadActiveJoystickPointer = null;
    ipadResetJoystick();
  });
}

function ipadShootFromPointer(event) {
  if (event.pointerType === "mouse") return;
  event.preventDefault();
  const position = canvasPosition(event);
  state.mouse.x = position.x;
  state.mouse.y = position.y;
  initAudio();
  shootAt(position.x, position.y);
}

canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", ipadShootFromPointer, { passive: false });
window.addEventListener("pointerup", event => {
  if (event.pointerId === ipadActiveJoystickPointer) {
    ipadActiveJoystickPointer = null;
    ipadResetJoystick();
  }
});
