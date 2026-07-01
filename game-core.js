"use strict";

// -------------------------------------------------------------------------
// TEACHER EDIT ZONE
// Add or change questions here. Each question needs exactly three choices.
// "answer" is the zero-based index of the correct choice.
// -------------------------------------------------------------------------
const QUESTION_BANK = [
  { tense: "Simple Present", prompt: "Mary ________ to school every day.", choices: ["goes", "go", "went"], answer: 0 },
  { tense: "Simple Present", prompt: "My brother usually ________ football after school.", choices: ["plays", "is playing", "played"], answer: 0 },
  { tense: "Simple Present", prompt: "The sun ________ in the east.", choices: ["rises", "rose", "is rise"], answer: 0 },
  { tense: "Simple Present", prompt: "We ________ our classroom every Friday.", choices: ["clean", "cleans", "cleaned"], answer: 0 },
  { tense: "Simple Present", prompt: "Mum always ________ tea in the morning.", choices: ["drinks", "drink", "drank"], answer: 0 },
  { tense: "Simple Present", prompt: "Tom and Sam ________ the bus to school.", choices: ["take", "takes", "took"], answer: 0 },
  { tense: "Present Continuous", prompt: "Look! Daddy ________ now.", choices: ["comes", "is coming", "came"], answer: 1 },
  { tense: "Present Continuous", prompt: "Listen! The baby ________.", choices: ["is crying", "cries", "cried"], answer: 0 },
  { tense: "Present Continuous", prompt: "The children ________ in the playground at the moment.", choices: ["are running", "run", "ran"], answer: 0 },
  { tense: "Present Continuous", prompt: "I ________ my homework right now.", choices: ["am doing", "do", "did"], answer: 0 },
  { tense: "Present Continuous", prompt: "Be quiet! Miss Lee ________ on the phone.", choices: ["is talking", "talks", "talked"], answer: 0 },
  { tense: "Present Continuous", prompt: "We ________ for the school concert now.", choices: ["are practising", "practise", "practised"], answer: 0 },
  { tense: "Simple Past", prompt: "Yesterday, Miss Chan ________ her phone.", choices: ["loses", "lost", "is losing"], answer: 1 },
  { tense: "Simple Past", prompt: "Peter ________ his grandparents last Sunday.", choices: ["visited", "visits", "is visiting"], answer: 0 },
  { tense: "Simple Past", prompt: "We ________ a rainbow after the storm.", choices: ["saw", "see", "are seeing"], answer: 0 },
  { tense: "Simple Past", prompt: "Amy ________ a cake for Mum yesterday.", choices: ["made", "makes", "is making"], answer: 0 },
  { tense: "Simple Past", prompt: "The class ________ to the museum last week.", choices: ["went", "goes", "is going"], answer: 0 },
  { tense: "Simple Past", prompt: "I ________ my keys two minutes ago.", choices: ["found", "find", "am finding"], answer: 0 }
];

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const questionText = document.getElementById("questionText");
const tenseBadge = document.getElementById("tenseBadge");
const startOverlay = document.getElementById("startOverlay");
const messageOverlay = document.getElementById("messageOverlay");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const upgradeButton = document.getElementById("upgradeButton");
const soundButton = document.getElementById("soundButton");
const liveStatus = document.getElementById("liveStatus");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const ARENA_TOP = 100;
const BOSS_UNLOCK_CORRECT = 8;
const MAX_FIRE_LEVEL = 3;
const UPGRADE_COST = 50;

const state = {
  screen: "start",
  paused: false,
  soundOn: true,
  score: 0,
  energy: 0,
  fireLevel: 1,
  correctCount: 0,
  streak: 0,
  bestStreak: 0,
  question: null,
  usedQuestionIndexes: [],
  monsters: [],
  fireballs: [],
  enemyBullets: [],
  particles: [],
  floatingTexts: [],
  boss: null,
  bossShotTimer: 0,
  transitionTimer: 0,
  shake: 0,
  flash: 0,
  lastTime: 0,
  mouse: { x: WIDTH / 2, y: HEIGHT / 2 },
  keys: new Set(),
  player: null,
  audioContext: null
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => Math.random() * (max - min) + min;

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function announce(text) {
  liveStatus.textContent = "";
  window.setTimeout(() => { liveStatus.textContent = text; }, 10);
}

function initAudio() {
  if (!state.audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) state.audioContext = new AudioCtx();
  }
  if (state.audioContext?.state === "suspended") state.audioContext.resume();
}

function beep(frequency, duration = 0.08, type = "square", volume = 0.04, delay = 0) {
  if (!state.soundOn) return;
  initAudio();
  if (!state.audioContext) return;
  const start = state.audioContext.currentTime + delay;
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playShootSound() {
  beep(250 + state.fireLevel * 90, 0.06, "square", 0.035);
  beep(420 + state.fireLevel * 110, 0.05, "triangle", 0.025, 0.025);
}

function playCorrectSound() {
  beep(520, 0.08, "square", 0.04);
  beep(660, 0.08, "square", 0.04, 0.08);
  beep(820, 0.12, "triangle", 0.05, 0.16);
}

function playWrongSound() {
  beep(170, 0.14, "sawtooth", 0.035);
  beep(115, 0.18, "sawtooth", 0.03, 0.1);
}

function playUpgradeSound() {
  [330, 440, 550, 720].forEach((tone, index) => beep(tone, 0.1, "square", 0.04, index * 0.07));
}

function resetGame() {
  state.screen = "battle";
  state.paused = false;
  state.score = 0;
  state.energy = 0;
  state.fireLevel = 1;
  state.correctCount = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.usedQuestionIndexes = [];
  state.monsters = [];
  state.fireballs = [];
  state.enemyBullets = [];
  state.particles = [];
  state.floatingTexts = [];
  state.boss = null;
  state.bossShotTimer = 0;
  state.transitionTimer = 0;
  state.shake = 0;
  state.flash = 0;
  state.player = {
    x: 110,
    y: HEIGHT / 2 + 70,
    radius: 18,
    speed: 220,
    hp: 5,
    maxHp: 5,
    invincible: 0,
    shootCooldown: 0,
    facingX: 1,
    facingY: 0,
    walkCycle: 0
  };
  messageOverlay.hidden = true;
  startOverlay.hidden = true;
  nextQuestion();
  updateUpgradeButton();
  canvas.focus();
  announce("Game started. Read the question and shoot the monster with the correct answer.");
}

function getNextQuestionIndex() {
  if (state.usedQuestionIndexes.length >= QUESTION_BANK.length) state.usedQuestionIndexes = [];
  const available = QUESTION_BANK.map((_, index) => index).filter(index => !state.usedQuestionIndexes.includes(index));
  const index = available[Math.floor(Math.random() * available.length)];
  state.usedQuestionIndexes.push(index);
  return index;
}

function nextQuestion() {
  const source = QUESTION_BANK[getNextQuestionIndex()];
  const bundledChoices = source.choices.map((text, originalIndex) => ({ text, correct: originalIndex === source.answer }));
  const choices = shuffle(bundledChoices);
  state.question = { tense: source.tense, prompt: source.prompt, choices };
  questionText.textContent = source.prompt;
  tenseBadge.textContent = source.tense;
  tenseBadge.style.color = source.tense === "Simple Present" ? "#66e3a4" : source.tense === "Present Continuous" ? "#62d8ff" : "#ffb15a";
  spawnAnswerMonsters(choices);
}

function spawnAnswerMonsters(choices) {
  const bossMode = state.screen === "boss";
  const positions = bossMode
    ? [{ x: 390, y: 215 }, { x: 515, y: 350 }, { x: 690, y: 245 }]
    : [{ x: 455, y: 205 }, { x: 650, y: 340 }, { x: 820, y: 205 }];
  state.monsters = choices.map((choice, index) => ({
    x: positions[index].x,
    y: positions[index].y,
    baseY: positions[index].y,
    radius: bossMode ? 30 : 36,
    answer: choice.text,
    correct: choice.correct,
    hue: [118, 205, 292][index],
    phase: Math.random() * Math.PI * 2,
    hitFlash: 0,
    wrongFlash: 0,
    alive: true
  }));
}

function enterBossBattle() {
  state.screen = "boss";
  state.fireballs = [];
  state.enemyBullets = [];
  state.monsters = [];
  state.boss = { x: 820, y: 265, radius: 62, hp: 100, maxHp: 100, phase: 0, hitFlash: 0, rage: 0 };
  state.player.x = 100;
  state.player.y = HEIGHT / 2 + 70;
  state.bossShotTimer = 1.4;
  state.transitionTimer = 1.2;
  nextQuestion();
  announce("Final Boss battle. Avoid the boss bullets and keep shooting the correct answer monsters.");
  beep(120, 0.25, "sawtooth", 0.05);
  beep(90, 0.35, "sawtooth", 0.04, 0.2);
}

function updateUpgradeButton() {
  const available = state.energy >= UPGRADE_COST && state.fireLevel < MAX_FIRE_LEVEL && ["battle", "boss"].includes(state.screen);
  upgradeButton.style.display = available ? "block" : "none";
  if (available) upgradeButton.innerHTML = `UPGRADE TO LEVEL ${state.fireLevel + 1}<br>${UPGRADE_COST} ENERGY · PRESS U`;
}

function upgradeFireball() {
  if (!["battle", "boss"].includes(state.screen) || state.paused) return;
  if (state.fireLevel >= MAX_FIRE_LEVEL) {
    addFloatingText("MAX POWER!", state.player.x, state.player.y - 35, "#ffd65a");
    return;
  }
  if (state.energy < UPGRADE_COST) {
    addFloatingText(`${UPGRADE_COST - state.energy} MORE ENERGY`, state.player.x, state.player.y - 35, "#ffffff");
    beep(140, 0.1, "square", 0.025);
    return;
  }
  state.energy -= UPGRADE_COST;
  state.fireLevel += 1;
  state.flash = 0.18;
  state.shake = 6;
  burst(state.player.x, state.player.y, "#ffd65a", 24, 180);
  addFloatingText(`FIREBALL LEVEL ${state.fireLevel}!`, state.player.x, state.player.y - 42, "#ffd65a");
  playUpgradeSound();
  updateUpgradeButton();
  announce(`Fireball upgraded to level ${state.fireLevel}. Correct answers now earn ${state.fireLevel * 10} points.`);
}

function shootAt(targetX, targetY) {
  const player = state.player;
  if (!player || player.shootCooldown > 0 || state.transitionTimer > 0 || state.paused || !["battle", "boss"].includes(state.screen)) return;
  let dx = targetX - player.x;
  let dy = targetY - player.y;
  const length = Math.hypot(dx, dy) || 1;
  dx /= length;
  dy /= length;
  player.facingX = dx;
  player.facingY = dy;
  const speed = 520 + state.fireLevel * 35;
  const radius = 6 + state.fireLevel * 3;
  state.fireballs.push({
    x: player.x + dx * 25,
    y: player.y + dy * 25,
    vx: dx * speed,
    vy: dy * speed,
    radius,
    life: 1.35,
    level: state.fireLevel,
    trailTimer: 0
  });
  player.shootCooldown = Math.max(0.15, 0.34 - state.fireLevel * 0.045);
  playShootSound();
}

function takePlayerDamage(amount = 1) {
  const player = state.player;
  if (!player || player.invincible > 0) return;
  player.hp -= amount;
  player.invincible = 1.05;
  state.streak = 0;
  state.shake = 10;
  state.flash = 0.12;
  burst(player.x, player.y, "#ff4d6d", 18, 140);
  addFloatingText("-1 HEART", player.x, player.y - 35, "#ff8aa0");
  playWrongSound();
  announce(`You were hit. ${Math.max(0, player.hp)} hearts remaining.`);
  if (player.hp <= 0) endGame(false);
}

function handleMonsterHit(monster) {
  if (!monster.alive || monster.hitFlash > 0) return;
  monster.hitFlash = 0.18;
  if (monster.correct) {
    monster.alive = false;
    const earned = 10 * state.fireLevel;
    state.score += earned;
    state.energy += earned;
    state.correctCount += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    burst(monster.x, monster.y, "#ffd65a", 26, 190);
    addFloatingText(`CORRECT! +${earned}`, monster.x, monster.y - 42, "#fff39a");
    playCorrectSound();
    updateUpgradeButton();
    if (state.screen === "boss" && state.boss) {
      const bossDamage = 14 + state.fireLevel * 6;
      state.boss.hp = Math.max(0, state.boss.hp - bossDamage);
      state.boss.hitFlash = 0.25;
      state.shake = 8;
      addFloatingText(`BOSS -${bossDamage}`, state.boss.x, state.boss.y - 75, "#ffb15a");
      announce(`Correct. The boss lost ${bossDamage} health.`);
      if (state.boss.hp <= 0) window.setTimeout(() => endGame(true), 450);
      else state.transitionTimer = 0.62;
    } else if (state.correctCount >= BOSS_UNLOCK_CORRECT) {
      state.transitionTimer = 1.15;
      announce("Correct. The Final Boss has appeared.");
    } else {
      state.transitionTimer = 0.62;
      announce(`Correct. You earned ${earned} points.`);
    }
  } else {
    monster.wrongFlash = 0.5;
    state.streak = 0;
    burst(monster.x, monster.y, "#ff4d6d", 12, 110);
    addFloatingText("WRONG MONSTER!", monster.x, monster.y - 42, "#ff7d92");
    takePlayerDamage(1);
  }
}

function endGame(victory) {
  if (state.screen === "ended") return;
  state.screen = "ended";
  state.paused = false;
  upgradeButton.style.display = "none";
  messageOverlay.hidden = false;
  messageTitle.textContent = victory ? "GRAMMAR HERO!" : "TRY AGAIN!";
  messageText.innerHTML = victory
    ? `You defeated the Final Boss with <strong>${state.score} points</strong>.<br>Your best correct-answer streak was <strong>${state.bestStreak}</strong>.`
    : `The monsters won this round, but every mistake helps you learn.<br>You scored <strong>${state.score} points</strong> with a best streak of <strong>${state.bestStreak}</strong>.`;
  if (victory) {
    [392, 523, 659, 784].forEach((tone, index) => beep(tone, 0.18, "square", 0.045, index * 0.12));
    burst(WIDTH / 2, HEIGHT / 2, "#ffd65a", 60, 300);
  }
  announce(victory ? "Victory. You defeated the Final Boss." : "Game over. Press Play Again to restart.");
}

function addFloatingText(text, x, y, color) {
  state.floatingTexts.push({ text, x, y, color, life: 1.05, maxLife: 1.05 });
}

function burst(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const velocity = randomBetween(speed * 0.35, speed);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      size: Math.floor(randomBetween(2, 6)),
      color,
      life: randomBetween(0.25, 0.75),
      maxLife: 0.75
    });
  }
}

function spawnBossBullet() {
  const boss = state.boss;
  const player = state.player;
  if (!boss || !player) return;
  const rage = boss.hp <= 45 ? 1 : 0;
  const patterns = rage ? 3 : 2;
  const baseAngle = Math.atan2(player.y - boss.y, player.x - boss.x);
  const spread = rage ? 0.28 : 0.18;
  for (let i = 0; i < patterns; i++) {
    const offset = (i - (patterns - 1) / 2) * spread;
    const angle = baseAngle + offset;
    const speed = rage ? 240 : 205;
    state.enemyBullets.push({
      x: boss.x - 45,
      y: boss.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: rage ? 8 : 7,
      life: 5
    });
  }
  beep(rage ? 95 : 115, 0.08, "sawtooth", 0.02);
}

function circleHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.radius + b.radius;
  return dx * dx + dy * dy <= radius * radius;
}
