"use strict";

const RESULT_EMAIL = "yuetki1999@gmail.com";
const RESULT_ENDPOINT = `https://formsubmit.co/${RESULT_EMAIL}`;
const TENSES = ["Simple Present", "Present Continuous", "Simple Past"];

const studentNameInput = document.getElementById("studentName");
const studentClassInput = document.getElementById("studentClass");
const studentNumberInput = document.getElementById("studentNumber");
const studentFormError = document.getElementById("studentFormError");
const studentResultSummary = document.getElementById("studentResultSummary");
const reportStatus = document.getElementById("reportStatus");
const retryReportButton = document.getElementById("retryReportButton");

function emptyStats() {
  return Object.fromEntries(TENSES.map(tense => [tense, {
    firstAttempts: 0,
    firstCorrect: 0,
    wrongHits: 0
  }]));
}

state.studentProfile = null;
state.tenseStats = emptyStats();
state.firstAttemptPending = false;
state.reportSnapshot = null;

function clean(value, maxLength) {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function readStudentDetails() {
  const profile = {
    name: clean(studentNameInput.value, 60),
    className: clean(studentClassInput.value, 20),
    classNumber: clean(studentNumberInput.value, 10)
  };

  const fields = [
    [studentNameInput, profile.name, "name"],
    [studentClassInput, profile.className, "class"],
    [studentNumberInput, profile.classNumber, "class number"]
  ];

  fields.forEach(([input]) => input.classList.remove("input-error"));
  const missing = fields.filter(([, value]) => !value);
  if (missing.length) {
    missing.forEach(([input]) => input.classList.add("input-error"));
    studentFormError.textContent = `Please enter your ${missing.map(([, , label]) => label).join(", ")}.`;
    missing[0][0].focus();
    return null;
  }

  studentFormError.textContent = "";
  return profile;
}

function accuracy(stats) {
  return stats.firstAttempts ? Math.round(stats.firstCorrect / stats.firstAttempts * 100) : null;
}

function weakAnalysis(statsByTense) {
  const tested = TENSES.map(tense => ({ tense, score: accuracy(statsByTense[tense]) }))
    .filter(item => item.score !== null);
  if (!tested.length) return "Not enough completed questions to identify a weak tense.";

  const weak = tested.filter(item => item.score < 80).sort((a, b) => a.score - b.score);
  if (weak.length) return `Needs more practice: ${weak.map(item => `${item.tense} (${item.score}%)`).join(", ")}.`;

  const lowest = Math.min(...tested.map(item => item.score));
  return `No tense scored below 80%. Lowest performance: ${tested.filter(item => item.score === lowest).map(item => `${item.tense} (${item.score}%)`).join(", ")}.`;
}

function buildSnapshot(victory) {
  const stats = Object.fromEntries(TENSES.map(tense => [tense, { ...state.tenseStats[tense] }]));
  return {
    student: { ...state.studentProfile },
    outcome: victory ? "Final Boss defeated" : "Game over",
    score: state.score,
    correctQuestions: state.correctCount,
    bestStreak: state.bestStreak,
    fireLevel: state.fireLevel,
    stats,
    analysis: weakAnalysis(stats),
    finished: new Date().toLocaleString("en-HK", { timeZone: "Asia/Hong_Kong" })
  };
}

function renderSnapshot(snapshot) {
  const rows = TENSES.map(tense => {
    const stats = snapshot.stats[tense];
    const score = accuracy(stats);
    return `<div class="student-result-row"><strong>${tense}</strong><span>First try: ${score === null ? "Not tested" : `${score}%`}</span><span>Wrong hits: ${stats.wrongHits}</span></div>`;
  }).join("");

  studentResultSummary.innerHTML = `<div class="student-result-header">${snapshot.student.name} · ${snapshot.student.className} (${snapshot.student.classNumber})</div>${rows}<div class="weak-tense-box"><strong>Teacher analysis:</strong> ${snapshot.analysis}</div>`;
}

function addHidden(form, name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  form.appendChild(input);
}

function sendReport(snapshot = state.reportSnapshot) {
  if (!snapshot) return;

  reportStatus.className = "report-status";
  reportStatus.textContent = "Sending result to the teacher...";
  retryReportButton.hidden = true;

  let frame = document.getElementById("resultEmailFrame");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "resultEmailFrame";
    frame.name = "resultEmailFrame";
    frame.hidden = true;
    document.body.appendChild(frame);
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = RESULT_ENDPOINT;
  form.target = "resultEmailFrame";
  form.hidden = true;

  addHidden(form, "_subject", `Tense Fireball Result - ${snapshot.student.className} ${snapshot.student.classNumber} - ${snapshot.student.name}`);
  addHidden(form, "_template", "table");
  addHidden(form, "_captcha", "false");
  addHidden(form, "Student Name", snapshot.student.name);
  addHidden(form, "Class", snapshot.student.className);
  addHidden(form, "Class Number", snapshot.student.classNumber);
  addHidden(form, "Outcome", snapshot.outcome);
  addHidden(form, "Score", String(snapshot.score));
  addHidden(form, "Correct Questions", String(snapshot.correctQuestions));
  addHidden(form, "Best Streak", String(snapshot.bestStreak));
  addHidden(form, "Final Fireball Level", String(snapshot.fireLevel));
  addHidden(form, "Weak Tense Analysis", snapshot.analysis);

  TENSES.forEach(tense => {
    const stats = snapshot.stats[tense];
    const score = accuracy(stats);
    addHidden(form, `${tense} Result`, score === null ? "Not tested" : `${score}% first-try accuracy; ${stats.firstCorrect}/${stats.firstAttempts}; ${stats.wrongHits} wrong hits`);
  });

  addHidden(form, "Finished", snapshot.finished);
  document.body.appendChild(form);
  form.submit();
  form.remove();

  window.setTimeout(() => {
    reportStatus.className = "report-status report-success";
    reportStatus.textContent = "Result submitted to yuetki1999@gmail.com.";
  }, 1200);
}

const originalResetGame = resetGame;
resetGame = function resetGameWithStudentDetails() {
  const profile = readStudentDetails();
  if (!profile) return;

  state.studentProfile = profile;
  state.tenseStats = emptyStats();
  state.firstAttemptPending = false;
  state.reportSnapshot = null;
  studentResultSummary.innerHTML = "";
  reportStatus.textContent = "";
  retryReportButton.hidden = true;
  originalResetGame();
};

const originalNextQuestion = nextQuestion;
nextQuestion = function trackedNextQuestion() {
  originalNextQuestion();
  state.firstAttemptPending = true;
};

const originalHandleMonsterHit = handleMonsterHit;
handleMonsterHit = function trackedMonsterHit(monster) {
  const tense = state.question?.tense;
  const valid = monster && monster.alive && monster.hitFlash <= 0 && state.tenseStats[tense];

  if (valid) {
    const stats = state.tenseStats[tense];
    if (!monster.correct) stats.wrongHits += 1;
    if (state.firstAttemptPending) {
      stats.firstAttempts += 1;
      if (monster.correct) stats.firstCorrect += 1;
      state.firstAttemptPending = false;
    }
  }

  originalHandleMonsterHit(monster);
};

const originalEndGame = endGame;
endGame = function endGameWithEmail(victory) {
  if (state.screen === "ended") return;
  originalEndGame(victory);
  state.reportSnapshot = buildSnapshot(victory);
  renderSnapshot(state.reportSnapshot);
  sendReport(state.reportSnapshot);
};

retryReportButton.addEventListener("click", () => sendReport());

[studentNameInput, studentClassInput, studentNumberInput].forEach(input => {
  input.addEventListener("input", () => {
    input.classList.remove("input-error");
    studentFormError.textContent = "";
  });
});
