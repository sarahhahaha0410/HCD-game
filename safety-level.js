const LEVEL1_STORAGE_KEY = "workshop-level-1-complete";
const LEVEL2_STORAGE_KEY = "workshop-level-2-complete";
const THEME_STORAGE_KEY = "workshop-theme";
const COLOUR_BLIND_THEMES = new Set(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]);

const SAFETY_LEVEL_QUESTIONS = [
  {
    type: "single",
    prompt: "A print has finished, but the build plate is still warm and the part feels stuck. What should you do first?",
    options: [
      "Let the bed cool further before removal",
      "Lift one corner to test whether it releases",
      "Move the hot plate to a clearer bench",
      "Use extra force with a scraper while it is warm",
    ],
    answer: "Let the bed cool further before removal",
    explanation: "Cooling reduces burn risk and usually helps the print release without force.",
  },
  {
    type: "multi",
    prompt: "Which parts are most likely to be dangerously hot during or shortly after an FDM print? Select all that apply.",
    options: ["Nozzle", "Heated bed", "Filament spool and holder", "Printer door handle"],
    answers: ["Nozzle", "Heated bed"],
    explanation: "Both the nozzle and heated bed can retain burn-level heat after printing.",
  },
  {
    type: "single",
    prompt: "A print starts forming a blob around the nozzle while the printer is running. What is the safest immediate response?",
    options: [
      "Pause or stop the print and ask a technician if needed",
      "Open the printer and pull loose filament away by hand",
      "Unplug and turn off the printer immediately",
      "Wait to see whether later layers fix it",
    ],
    answer: "Pause or stop the print and ask a technician if needed",
    explanation: "Stopping through normal controls avoids reaching into hot moving parts or abruptly cutting power.",
  },
  {
    type: "single",
    prompt: "In the slicer preview, a curved overhang has unsupported areas. What is the best safety/workflow decision before printing?",
    options: [
      "Add or verify supports and recheck time/material impact",
      "Print faster so unsupported layers spend less time hot",
      "Ignore it if the model looks stable from the front",
      "Increase layer height so the overhang bridges itself",
    ],
    answer: "Add or verify supports and recheck time/material impact",
    explanation: "Unsupported overhangs can fail and create waste or printer issues.",
  },
  {
    type: "single",
    prompt: "The first layer is peeling up at one corner after the print has started. What should you do?",
    options: [
      "Pause/stop and restart after checking bed adhesion/setup",
      "Hold the corner down until the next layers cover it",
      "Open the door and press it flat with a scraper",
      "Leave it because upper layers usually fix adhesion",
    ],
    answer: "Pause/stop and restart after checking bed adhesion/setup",
    explanation: "Failed first-layer adhesion can ruin the print and should not be corrected by reaching in.",
  },
  {
    type: "single",
    prompt: "You need to remove supports from a finished print. Which approach is safest?",
    options: [
      "Move to a clear bench and remove supports carefully with suitable tools",
      "Remove supports while the print is still on the hot bed",
      "Twist the supports off quickly near the printer opening",
      "Use the printer door as a brace while pulling",
    ],
    answer: "Move to a clear bench and remove supports carefully with suitable tools",
    explanation: "Controlled post-processing reduces injury and avoids damaging the part.",
  },
  {
    type: "single",
    prompt: "You notice stringing or loose filament inside the printer during an active print. What should you avoid?",
    options: [
      "Reaching into the printer while it is moving or hot",
      "Watching the next few seconds from outside the printer",
      "Using the printer controls to pause",
      "Calling a technician if unsure",
    ],
    answer: "Reaching into the printer while it is moving or hot",
    explanation: "Loose filament is not worth hand contact with hot or moving parts.",
  },
  {
    type: "single",
    prompt: "Before starting someone else's prepared print file, which check matters most for workshop safety and reliability?",
    options: [
      "Review preview, estimated time, dimensions, material, and supports",
      "Check only that the file name looks correct",
      "Start it if the printer is currently idle",
      "Choose the fastest profile to reduce queue time",
    ],
    answer: "Review preview, estimated time, dimensions, material, and supports",
    explanation: "Safety includes checking whether the job is sensible before committing printer time and material.",
  },
];

const state = {
  queue: [],
  current: null,
  attempts: {},
  selected: [],
  feedback: null,
  complete: false,
};

const objectiveText = document.getElementById("objective-text");
const safetyProgress = document.getElementById("safety-progress");
const safetyQuestionCard = document.getElementById("safety-question-card");
const levelSelectButton = document.getElementById("level-select-button");
const settingsButton = document.getElementById("settings-button");
const settingsPanel = document.getElementById("settings-panel");
const themeChoiceButtons = [...document.querySelectorAll("[data-theme-choice]")];

function readStoredFlag(key) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeStoredFlag(key, value) {
  try {
    localStorage.setItem(key, value ? "true" : "false");
  } catch {
    // Local storage is optional; the current session still tracks completion.
  }
}

function getStoredTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      return savedTheme === "colourblind" ? "deuteranopia" : savedTheme;
    }
  } catch {
    // Storage is optional; fall back to system preference.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "default";
}

function applyTheme(theme) {
  const normalizedTheme = theme === "colourblind" ? "deuteranopia" : theme;
  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.classList.toggle("scheme-colourblind", COLOUR_BLIND_THEMES.has(normalizedTheme));
  document.documentElement.classList.toggle("scheme-protanopia", normalizedTheme === "protanopia");
  document.documentElement.classList.toggle("scheme-deuteranopia", normalizedTheme === "deuteranopia");
  document.documentElement.classList.toggle("scheme-tritanopia", normalizedTheme === "tritanopia");
  document.documentElement.classList.toggle("scheme-achromatopsia", normalizedTheme === "achromatopsia");
  document.documentElement.classList.toggle("scheme-high-contrast", normalizedTheme === "high-contrast");
  document.documentElement.classList.toggle("scheme-night", normalizedTheme === "night");

  themeChoiceButtons.forEach((button) => {
    const active = button.dataset.themeChoice === normalizedTheme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function persistTheme(theme) {
  const normalizedTheme = theme === "colourblind" ? "deuteranopia" : theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  } catch {
    // Theme still applies for this page load.
  }
  applyTheme(normalizedTheme);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSafetyAnswerSet(question) {
  return question.type === "multi" ? question.answers : [question.answer];
}

function isSameAnswerSet(selected, answers) {
  return selected.length === answers.length && selected.every((choice) => answers.includes(choice));
}

function renderLockedState() {
  objectiveText.textContent = "Complete Level 1 before starting the safety check.";
  safetyProgress.textContent = "Locked";
  safetyQuestionCard.innerHTML = `
    <article class="safety-complete-card">
      <p class="safety-question-meta">Locked</p>
      <h4>Level 2 Locked</h4>
      <p>Complete Level 1: Simulation before starting this safety check.</p>
      <button class="safety-return" type="button" data-safety-action="return-select">Return To Level Select</button>
    </article>
  `;
}

function renderSafetyQuiz() {
  if (state.complete) {
    const missedCount = Object.values(state.attempts).reduce((total, count) => total + count, 0);
    objectiveText.textContent = "Level 2 complete. Safety scenarios mastered.";
    safetyProgress.textContent = "Complete";
    safetyQuestionCard.innerHTML = `
      <article class="safety-complete-card">
        <p class="safety-question-meta">Safety Pass</p>
        <h4>Level 2 Complete</h4>
        <p>You mastered all safety scenarios. Missed attempts corrected: ${missedCount}.</p>
        <button class="safety-return" type="button" data-safety-action="return-select">Return To Level Select</button>
      </article>
    `;
    return;
  }

  if (!state.queue.length) {
    completeLevelTwo();
    return;
  }

  const currentIndex = state.current ?? state.queue[0];
  const question = SAFETY_LEVEL_QUESTIONS[currentIndex];
  const selected = state.selected;
  const feedback = state.feedback;
  const totalMistakes = Object.values(state.attempts).reduce((total, count) => total + count, 0);
  objectiveText.textContent = "Complete the Level 2 safety scenarios. Missed questions return until mastered.";
  safetyProgress.textContent = `${state.queue.length} remaining // ${totalMistakes} misses`;

  const answerSet = getSafetyAnswerSet(question);
  const optionButtons = question.options.map((option, optionIndex) => {
    const isSelected = selected.includes(option);
    const isCorrectAnswer = feedback && answerSet.includes(option);
    const isIncorrectSelection = feedback && isSelected && !answerSet.includes(option);
    const stateClass = isCorrectAnswer ? " correct" : isIncorrectSelection ? " incorrect" : "";
    return `
      <button
        class="safety-choice${stateClass}"
        type="button"
        data-safety-choice="${optionIndex}"
        aria-pressed="${isSelected}"
        ${feedback ? "disabled" : ""}
      >${escapeHtml(option)}</button>
    `;
  }).join("");

  const feedbackHtml = feedback ? `
    <div class="safety-feedback ${feedback.correct ? "correct" : "incorrect"}">
      <strong>${feedback.correct ? "Correct" : "Review this scenario"}</strong>
      <p>${escapeHtml(question.explanation)}</p>
      ${feedback.correct ? "" : `<p>Best answer: ${escapeHtml(answerSet.join(" + "))}</p>`}
    </div>
    <div class="safety-actions">
      <button class="safety-continue" type="button" data-safety-action="continue">Continue</button>
    </div>
  ` : `
    <div class="safety-actions">
      ${question.type === "multi"
        ? `<button class="safety-submit" type="button" data-safety-action="submit" ${selected.length ? "" : "disabled"}>Check Response</button>`
        : `<span class="safety-question-meta">Select one response</span>`}
    </div>
  `;

  safetyQuestionCard.innerHTML = `
    <p class="safety-question-meta">${question.type === "multi" ? "Select all that apply" : "Single best response"} // Prompt ${currentIndex + 1}</p>
    <h4>${escapeHtml(question.prompt)}</h4>
    <div class="safety-options">${optionButtons}</div>
    ${feedbackHtml}
  `;
}

function submitSafetyAnswer(choice = null) {
  const currentIndex = state.current;
  const question = SAFETY_LEVEL_QUESTIONS[currentIndex];
  if (!question || state.feedback) {
    return;
  }

  const selected = question.type === "multi" ? state.selected : [choice];
  const answerSet = getSafetyAnswerSet(question);
  const correct = isSameAnswerSet(selected, answerSet);
  if (!correct) {
    state.attempts[currentIndex] = (state.attempts[currentIndex] ?? 0) + 1;
  }

  state.selected = selected.filter(Boolean);
  state.feedback = { correct };
  renderSafetyQuiz();
}

function continueSafetyQuiz() {
  if (!state.feedback) {
    return;
  }

  const currentIndex = state.current;
  if (state.feedback.correct) {
    state.queue = state.queue.filter((index) => index !== currentIndex);
  } else {
    state.queue = [...state.queue.filter((index) => index !== currentIndex), currentIndex];
  }

  state.current = state.queue[0] ?? null;
  state.selected = [];
  state.feedback = null;

  if (!state.queue.length) {
    completeLevelTwo();
    return;
  }

  renderSafetyQuiz();
}

function completeLevelTwo() {
  state.complete = true;
  writeStoredFlag(LEVEL2_STORAGE_KEY, true);
  renderSafetyQuiz();
}

function startSafetyQuiz() {
  if (!readStoredFlag(LEVEL1_STORAGE_KEY) && !readStoredFlag(LEVEL2_STORAGE_KEY)) {
    renderLockedState();
    return;
  }

  state.queue = SAFETY_LEVEL_QUESTIONS.map((_, index) => index);
  state.current = state.queue[0];
  state.attempts = {};
  state.selected = [];
  state.feedback = null;
  state.complete = false;
  renderSafetyQuiz();
}

settingsButton.addEventListener("click", () => {
  const expanded = settingsButton.getAttribute("aria-expanded") === "true";
  settingsButton.setAttribute("aria-expanded", String(!expanded));
  settingsPanel.classList.toggle("hidden", expanded);
});

themeChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => persistTheme(button.dataset.themeChoice));
});

levelSelectButton.addEventListener("click", () => {
  window.location.href = "index.html";
});

safetyQuestionCard.addEventListener("click", (event) => {
  const choiceButton = event.target.closest("[data-safety-choice]");
  const actionButton = event.target.closest("[data-safety-action]");

  if (choiceButton) {
    const question = SAFETY_LEVEL_QUESTIONS[state.current];
    if (!question || state.feedback) {
      return;
    }

    const choice = question.options[Number(choiceButton.dataset.safetyChoice)];
    if (question.type === "multi") {
      state.selected = state.selected.includes(choice)
        ? state.selected.filter((selectedChoice) => selectedChoice !== choice)
        : [...state.selected, choice];
      renderSafetyQuiz();
      return;
    }

    submitSafetyAnswer(choice);
    return;
  }

  if (!actionButton) {
    return;
  }

  if (actionButton.dataset.safetyAction === "submit") {
    submitSafetyAnswer();
  } else if (actionButton.dataset.safetyAction === "continue") {
    continueSafetyQuiz();
  } else if (actionButton.dataset.safetyAction === "return-select") {
    window.location.href = "index.html";
  }
});

applyTheme(getStoredTheme());
startSafetyQuiz();
