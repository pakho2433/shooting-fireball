function canvasPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

canvas.addEventListener("mousemove", event => {
  const position = canvasPosition(event);
  state.mouse.x = position.x;
  state.mouse.y = position.y;
});

canvas.addEventListener("mousedown", event => {
  if (event.button !== 0) return;
  event.preventDefault();
  const position = canvasPosition(event);
  state.mouse.x = position.x;
  state.mouse.y = position.y;
  initAudio();
  shootAt(position.x, position.y);
  canvas.focus();
});

canvas.addEventListener("contextmenu", event => event.preventDefault());

window.addEventListener("keydown", event => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  state.keys.add(event.code);
  if (event.code === "KeyU" && !event.repeat) upgradeFireball();
  if (event.code === "KeyP" && !event.repeat && ["battle", "boss"].includes(state.screen)) {
    state.paused = !state.paused;
    announce(state.paused ? "Game paused." : "Game continued.");
  }
});

window.addEventListener("keyup", event => state.keys.delete(event.code));
window.addEventListener("blur", () => {
  state.keys.clear();
  if (["battle", "boss"].includes(state.screen)) state.paused = true;
});

startButton.addEventListener("click", () => {
  initAudio();
  resetGame();
});
restartButton.addEventListener("click", () => {
  initAudio();
  resetGame();
});
upgradeButton.addEventListener("click", upgradeFireball);
soundButton.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundButton.textContent = `SOUND: ${state.soundOn ? "ON" : "OFF"}`;
  soundButton.setAttribute("aria-pressed", String(state.soundOn));
  if (state.soundOn) beep(440, 0.08, "square", 0.035);
});

function gameLoop(timestamp) {
  const dt = Math.min(0.033, (timestamp - state.lastTime) / 1000 || 0);
  state.lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
