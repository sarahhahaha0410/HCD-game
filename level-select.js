const LEVEL1_STORAGE_KEY = "workshop-level-1-complete";
const LEVEL2_STORAGE_KEY = "workshop-level-2-complete";
const THEME_STORAGE_KEY = "workshop-theme";
const COLOUR_BLIND_THEMES = new Set(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]);

const level1Card = document.getElementById("level-1-card");
const level2Card = document.getElementById("level-2-card");
const level1Start = document.getElementById("level-1-start");
const level2Start = document.getElementById("level-2-start");
const level1Status = document.getElementById("level-1-status");
const level2Status = document.getElementById("level-2-status");
const levelSelectStatus = document.getElementById("level-select-status");
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

function renderLevelCards() {
  const level1Complete = readStoredFlag(LEVEL1_STORAGE_KEY);
  const level2Complete = readStoredFlag(LEVEL2_STORAGE_KEY);
  const level2Unlocked = level1Complete || level2Complete;

  level1Card.classList.toggle("level-card-complete", level1Complete);
  level1Start.textContent = level1Complete ? "Replay Simulation" : "Start Simulation";
  level1Status.textContent = level1Complete ? "Completed. Replay any time." : "Required first level.";

  level2Card.classList.toggle("level-card-locked", !level2Unlocked);
  level2Card.classList.toggle("level-card-complete", level2Complete);
  level2Start.disabled = !level2Unlocked;
  level2Start.textContent = !level2Unlocked ? "Locked" : level2Complete ? "Replay Safety Check" : "Start Safety Check";
  level2Status.textContent = !level2Unlocked
    ? "Complete Level 1 to unlock."
    : level2Complete
      ? "Completed. Replay any time."
      : "Unlocked. Master every scenario to pass.";

  levelSelectStatus.textContent = level2Unlocked
    ? "Level 2 unlocked. Choose a level to continue."
    : "Complete Level 1 to unlock the Level 2 safety check.";
}

settingsButton.addEventListener("click", () => {
  const expanded = settingsButton.getAttribute("aria-expanded") === "true";
  settingsButton.setAttribute("aria-expanded", String(!expanded));
  settingsPanel.classList.toggle("hidden", expanded);
});

themeChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => persistTheme(button.dataset.themeChoice));
});

level1Start.addEventListener("click", () => {
  window.location.href = "level1.html";
});

level2Start.addEventListener("click", () => {
  if (level2Start.disabled) {
    return;
  }
  window.location.href = "level2.html";
});

applyTheme(getStoredTheme());
renderLevelCards();
