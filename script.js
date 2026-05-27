const OBJECTIVES = {
  tutorial: "Read the workflow, then start the simulation.",
  door: "Swipe your ID card over the door reader to unlock the workshop.",
  roomBenchSlice: "Go to the Bench Area and slice the model.",
  slice: "Click Slice in Bambu Lab. Check print time, dimensions, and supports first.",
  roomTrayCollect: "Go to the SD Card Tray and collect the transfer kit.",
  trayCollect: "Click the SD card and USB reader to pick them up.",
  trayAssemble: "Slide the SD card into the side slot of the USB reader.",
  roomBenchExport: "Return to the Bench Area and export the sliced file.",
  benchDock: "Drag the SD Card + Reader to the USB dock on the side of the laptop base.",
  benchExport: "Click Export to copy the sliced file onto the SD card.",
  roomBenchUndock: "Return to the Bench Area and undock the loaded reader.",
  benchUndock: "Drag the loaded USB reader out of the laptop dock.",
  separateKit: "Use the Separate action in inventory so the SD card can go into the printer.",
  roomPrinter: "Go to the 3D Printers and insert the loaded SD card.",
  printerDock: "Separate the SD card before using the printer.",
  printerInsert: "Drag an SD card into the vertical slot beside the printer screen.",
  printerNoFiles: "No printable files were found. Tap the printer screen to eject the SD card.",
  printerStart: "Tap the printer screen to start the print. Leave the SD card in the printer.",
  roomTrayReturn: "Return to the SD Card Tray with the USB adapter.",
  trayReturn: "Drag the USB adapter back into the tray.",
  complete: "Tutorial complete. Print started and adapter returned.",
};

const HOTSPOTS = {
  printers: {
    label: "Printer Bank",
    info: "These Bambu printers wait for a loaded SD card before a job can be started.",
    action: openPrinterScene,
  },
  bench: {
    label: "Bench Area",
    info: "This bench area is where you slice the model, check print settings, and export the file.",
    action: openWorkstationScene,
  },
  tray: {
    label: "Transfer Tray",
    info: "The tray stores the SD card and USB reader used to move sliced files to the printers.",
    action: openTrayScene,
  },
  bin: {
    label: "Waste Bin",
    info: "A waste bin for support scraps, failed prints, and packaging.",
  },
};

const LEVEL1_STORAGE_KEY = "workshop-level-1-complete";

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
    // Local storage is optional; the current session still tracks progress.
  }
}

const state = {
  scene: "tutorial",
  objective: "tutorial",
  level1Complete: readStoredFlag(LEVEL1_STORAGE_KEY),
  inventory: ["id-card"],
  doorUnlocked: false,
  sliced: false,
  sliceState: "idle",
  transfer: {
    cardPicked: false,
    adapterPicked: false,
    assembled: false,
    loaded: false,
    separated: false,
    location: "tray",
    cardLocation: "loose",
    printStarted: false,
    returned: false,
    tutorialCompleted: false,
  },
  dragging: null,
  modelInspecting: null,
  modelRotationX: -18,
  modelRotationY: 24,
  modelZoom: 1,
  manualHintsRemaining: 2,
  attemptHintTimer: null,
  attemptedGuideKey: null,
  activeHint: null,
  selectedTheme: "default",
  postItHint: null,
};

const scenes = {
  tutorial: document.getElementById("scene-tutorial"),
  door: document.getElementById("scene-door"),
  room: document.getElementById("scene-room"),
  workstation: document.getElementById("scene-workstation"),
  tray: document.getElementById("scene-tray"),
  printer: document.getElementById("scene-printer"),
};

const tutorialStart = document.getElementById("tutorial-start");
const hintButton = document.getElementById("hint-button");
const settingsButton = document.getElementById("settings-button");
const settingsPanel = document.getElementById("settings-panel");
const themeChoiceButtons = [...document.querySelectorAll("[data-theme-choice]")];
const helpButton = document.getElementById("help-button");
const returnButton = document.getElementById("return-button");
const inventory = document.getElementById("inventory");
const inventoryPanel = document.querySelector(".inventory-panel");
const objectiveText = document.getElementById("objective-text");
const dialogueBox = document.querySelector(".dialogue-box");
const dialogueFrame = document.getElementById("dialogue-frame");
const dialogueSpeaker = document.getElementById("dialogue-speaker");
const dialogueText = document.getElementById("dialogue-text");
const dialoguePrompt = document.getElementById("dialogue-prompt");
const postItHint = document.getElementById("post-it-hint");
const manualHintPanel = document.getElementById("manual-hint-panel");
const manualHintTitle = document.getElementById("manual-hint-title");
const manualHintText = document.getElementById("manual-hint-text");
const gestureHint = document.getElementById("gesture-hint");
const dragGhost = document.getElementById("drag-ghost");
const doorReader = document.getElementById("door-reader");
const completionPopup = document.getElementById("completion-popup");
const completionContinue = document.getElementById("completion-continue");

const workstationStatus = document.getElementById("workstation-status");
const workstationAction = document.getElementById("workstation-action");
const workstationModeChip = document.querySelector(".ui-status");
const modelInspector = document.getElementById("model-inspector");
const modelCanvas = document.getElementById("model-canvas");
const supportPreviewLabel = document.getElementById("support-preview-label");
const modelZoomInButton = document.getElementById("model-zoom-in");
const modelZoomOutButton = document.getElementById("model-zoom-out");
const modelZoomValue = document.getElementById("model-zoom-value");
const benchDock = document.getElementById("bench-dock");
const benchDockLabel = document.getElementById("bench-dock-label");
const benchKitPreview = document.getElementById("bench-kit-preview");

const trayItems = document.querySelector(".tray-items");
const pickupCardButton = document.getElementById("pickup-sd-card");
const pickupAdapterButton = document.getElementById("pickup-adapter");
const assemblyZone = document.getElementById("assembly-zone");
const assemblyHint = document.getElementById("assembly-hint");
const assemblyCard = document.getElementById("assembly-card");
const assemblyAdapter = document.getElementById("assembly-adapter");
const adapterSlot = document.getElementById("adapter-slot");
const adapterCardPreview = document.getElementById("adapter-card-preview");
const trayReturnZone = document.getElementById("tray-return-zone");
const trayReturnSlot = document.getElementById("tray-return-slot");
const trayReturnHint = document.getElementById("tray-return-hint");
const trayReturnLabel = document.getElementById("tray-return-label");
const trayReturnPreview = document.getElementById("tray-return-preview");

const printerScreen = document.getElementById("printer-screen");
const printerTransferCopy = document.getElementById("printer-transfer-copy");
const printerKitDock = document.getElementById("printer-kit-dock");
const printerKitLabel = document.getElementById("printer-kit-label");
const printerConverterStand = document.getElementById("printer-converter-stand");
const printerLooseCard = document.getElementById("printer-loose-card");
const printerCardSlot = document.getElementById("printer-card-slot");
const printerSlotLabel = document.getElementById("printer-slot-label");
const printerSlotCard = document.getElementById("printer-slot-card");
const printerConverterSlot = document.getElementById("printer-converter-slot");
const printerConverterLabel = document.getElementById("printer-converter-label");
const printerConverterCardPreview = document.getElementById("printer-converter-card-preview");
const printerScreenTitle = printerScreen.querySelector(".printer-screen-meta strong");
const printerScreenSubtitle = printerScreen.querySelector(".printer-screen-meta span");
const printerScreenAction = printerScreen.querySelector(".printer-screen-print");

const hotspotButtons = [...document.querySelectorAll("[data-hotspot]")];
const dropTargets = [...document.querySelectorAll("[data-drop-target]")];

returnButton.textContent = "Return";

let dialogueTimer = null;
let dialoguePendingAction = null;
let dialogueFullText = "";
let tutorialReturnScene = null;
let sliceTimer = null;
let completionPopupShown = false;
let completionPopupTimer = null;
let completionPopupPending = false;

const THEME_STORAGE_KEY = "workshop-theme";
const HINT_ATTEMPT_DELAY_MS = 3500;
const MODEL_MESH = window.WORKSHOP_MODEL_MESH ?? { vertices: [], normals: [], dimensions: null };
const SUPPORT_PREVIEW = window.WORKSHOP_SUPPORT_PREVIEW ?? { segments: [] };
const MODEL_ZOOM_MIN = 0.65;
const MODEL_ZOOM_MAX = 2.35;
const MODEL_ZOOM_STEP = 0.18;
const COLOUR_BLIND_THEMES = new Set(["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]);
let modelGlState = null;
const SCENE_LABELS = {
  tutorial: "Instructions",
  door: "Workshop Entrance",
  room: "Main Workshop",
  workstation: "Bench Area",
  tray: "SD Card Tray",
  printer: "3D Printers",
};

function getInitialTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme) {
    return savedTheme === "colourblind" ? "deuteranopia" : savedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "night" : "default";
}

function applyTheme(theme) {
  const normalizedTheme = theme === "colourblind" ? "deuteranopia" : theme;
  state.selectedTheme = normalizedTheme;
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
  localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
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

function resetSimulationState() {
  if (sliceTimer) {
    clearTimeout(sliceTimer);
    sliceTimer = null;
  }

  clearCompletionPopupTimer();
  completionPopupShown = false;
  completionPopupPending = false;
  completionPopup.classList.add("hidden");
  state.inventory = ["id-card"];
  state.doorUnlocked = false;
  state.sliced = false;
  state.sliceState = "idle";
  state.transfer = {
    cardPicked: false,
    adapterPicked: false,
    assembled: false,
    loaded: false,
    separated: false,
    location: "tray",
    cardLocation: "loose",
    printStarted: false,
    returned: false,
    tutorialCompleted: false,
  };
  state.dragging = null;
  state.manualHintsRemaining = 2;
  state.attemptedGuideKey = null;
  state.activeHint = null;
  state.postItHint = null;
  doorReader.classList.remove("unlocked");
  clearHintVisuals();
  renderInventory();
  renderTrayScene();
  renderWorkstationScene();
  renderPrinterScene();
}

function startLevelOne() {
  if (state.doorUnlocked || state.transfer.tutorialCompleted || state.objective === "complete") {
    resetSimulationState();
  }
  startGame();
}

function getVisibleElement(selector) {
  if (!selector) {
    return null;
  }

  return selector
    .split(",")
    .map((part) => part.trim())
    .flatMap((part) => [...document.querySelectorAll(part)])
    .find((element) => element.getClientRects().length > 0 && !element.classList.contains("hidden")) ?? null;
}

function getStepGuide() {
  const objective = state.objective;

  if (objective === "door") {
    return {
      key: "door",
      scene: "door",
      sourceSelector: '[data-drag-item="id-card"]',
      targetSelector: "#door-reader",
      action: "drag",
      hint: "Drag your ID card from Inventory to the card reader beside the door handle.",
      postIt: "Swipe ID card here.",
      manualTitle: "Swipe your ID card",
      manual: "Drag the ID Card from Inventory onto the door reader beside the handle. This unlocks the workshop so you can start the print workflow.",
    };
  }

  if (objective === "roomBenchSlice") {
    return {
      key: "room-bench-slice",
      scene: "room",
      targetSelector: '[data-hotspot="bench"]',
      action: "click",
      hint: "Click Bench Area first. The model has to be sliced before it can be exported.",
      postIt: "Start at the bench.",
      manualTitle: "Go to the Bench Area",
      manual: "Click the Bench Area hotspot. The laptop there is where you inspect the model, slice it, and later export the print file to the SD card.",
    };
  }

  if (objective === "slice") {
    return {
      key: "slice",
      scene: "workstation",
      targetSelector: "#workstation-action",
      action: "click",
      hint: "Check the print time, dimensions, and support warning, then click Slice.",
      postIt: "Click Slice.",
      manualTitle: "Slice the desk tidy",
      manual: "On the laptop screen, check the practical readouts, then click Slice. Slicing prepares printer instructions before anything can be exported to the SD card.",
    };
  }

  if (objective === "roomTrayCollect") {
    return {
      key: "room-tray-collect",
      scene: "room",
      targetSelector: '[data-hotspot="tray"]',
      action: "click",
      hint: "Go to the SD Card Tray to collect the SD card and USB reader.",
      postIt: "Collect transfer media next.",
      manualTitle: "Collect the transfer kit",
      manual: "Click the SD Card Tray hotspot. You need both the SD card and the USB reader before you can export the sliced file from the bench laptop.",
    };
  }

  if (objective === "trayCollect") {
    const missingCard = !state.transfer.cardPicked;
    return {
      key: missingCard ? "tray-collect-card" : "tray-collect-reader",
      scene: "tray",
      targetSelector: missingCard ? "#pickup-sd-card" : "#pickup-adapter",
      action: "click",
      hint: missingCard ? "Click the SD Card item." : "Click the USB Reader item.",
      postIt: missingCard ? "Pick up the SD card." : "Pick up the USB reader.",
      manualTitle: missingCard ? "Pick up the SD card" : "Pick up the USB reader",
      manual: missingCard
        ? "Click the SD Card item on the tray. The SD card stores the sliced print file that the printer will read."
        : "Click the USB Reader item on the tray. The reader lets the laptop write the sliced file onto the SD card.",
    };
  }

  if (objective === "trayAssemble") {
    if (hasTransferKitOnAssemblySurface()) {
      return {
        key: "tray-collect-kit",
        scene: "tray",
        sourceSelector: "#assembly-adapter",
        targetSelector: ".inventory-panel",
        action: "drag",
        hint: "Drag the assembled SD Card + Reader away from the assembly surface to store it in Inventory.",
        postIt: "Move the reader to Inventory.",
        manualTitle: "Move the reader into Inventory",
        manual: "Drag the assembled SD Card + Reader away from the tray surface. You do not need to aim perfectly at the Inventory panel; once it is pulled off the tray, it will be stored in Inventory automatically.",
      };
    }

    return {
      key: "tray-assemble",
      scene: "tray",
      sourceSelector: "#assembly-card",
      targetSelector: "#adapter-slot",
      action: "drag",
      hint: "Drag the loose SD card into the slot on the USB reader.",
      postIt: "Slide SD into the reader.",
      manualTitle: "Insert SD card into the reader",
      manual: "Drag the loose SD card into the slot on the USB reader. The card must be seated in the reader before the laptop can export a file onto it.",
    };
  }

  if ((objective === "roomBenchExport" || objective === "benchDock" || objective === "benchExport") && canReassembleTransferKit() && !state.transfer.loaded) {
    return {
      key: "reassemble-before-export",
      scene: state.scene,
      targetSelector: '[data-inventory-action="reassemble-transfer"]',
      action: "click",
      hint: "Click Reassemble so the SD card is back inside the USB reader before export.",
      postIt: "Reassemble before export.",
      manualTitle: "Reassemble the reader",
      manual: "Click Reassemble in Inventory. Export only works when the SD card is inside the USB reader, because the laptop writes the sliced file through the reader.",
    };
  }

  if (objective === "roomBenchExport") {
    return {
      key: "room-bench-export",
      scene: "room",
      targetSelector: '[data-hotspot="bench"]',
      action: "click",
      hint: "Return to the Bench Area so the sliced file can be exported.",
      postIt: "Export at the bench.",
      manualTitle: "Return to the Bench Area",
      manual: "Click the Bench Area hotspot. The file is sliced, but it still needs to be exported from the laptop onto the SD card.",
    };
  }

  if (objective === "benchDock") {
    return {
      key: "bench-dock",
      scene: "workstation",
      sourceSelector: '[data-drag-item="transfer-kit"]',
      targetSelector: "#bench-dock",
      action: "drag",
      hint: "Drag the SD Card + Reader from Inventory to the USB dock on the laptop base.",
      postIt: "Dock the reader.",
      manualTitle: "Dock the USB reader",
      manual: "Drag the SD Card + Reader from Inventory to the USB dock on the left side of the laptop base. The laptop needs the reader connected before it can export to the SD card.",
    };
  }

  if (objective === "benchExport") {
    return {
      key: "bench-export",
      scene: "workstation",
      targetSelector: "#workstation-action",
      action: "click",
      hint: "Click Export to write the sliced file onto the SD card.",
      postIt: "Export the file.",
      manualTitle: "Export the sliced file",
      manual: "Click Export on the laptop. This writes the prepared desk-tidy file onto the SD card inside the USB reader.",
    };
  }

  if (objective === "benchUndock") {
    if (state.transfer.separated && state.transfer.location === "bench-dock") {
      return {
        key: "bench-undock-adapter",
        scene: "workstation",
        sourceSelector: "#bench-kit-preview",
        targetSelector: "#bench-kit-preview",
        action: "drag",
        dragEndOffset: { x: -130, y: 0 },
        hint: "Pull the USB adapter out of the laptop dock before reassembling it with the SD card.",
        postIt: "Pull the adapter out.",
        manualTitle: "Pull out the adapter",
        manual: "Drag the USB adapter left, away from the laptop dock. You only need to pull it out of the computer; it will return to Inventory, where you can reassemble it with the SD card.",
      };
    }

    return {
      key: "bench-undock",
      scene: "workstation",
      sourceSelector: "#bench-kit-preview",
      targetSelector: "#bench-kit-preview",
      action: "drag",
      dragEndOffset: { x: -130, y: 0 },
      hint: "Drag the reader away from the laptop dock to put it back in Inventory.",
      postIt: "Pull the reader out.",
      manualTitle: "Pull out the USB reader",
      manual: "Drag the loaded USB reader left, away from the laptop dock. You only need to pull it out of the computer; it will return to Inventory automatically.",
    };
  }

  if (objective === "roomBenchUndock") {
    return {
      key: "room-bench-undock",
      scene: "room",
      targetSelector: '[data-hotspot="bench"]',
      action: "click",
      hint: "Go back to the Bench Area and undock the loaded reader.",
      postIt: "Reader is still docked.",
      manualTitle: "Go back to the Bench Area",
      manual: "Click the Bench Area hotspot. The loaded reader is still plugged into the laptop and needs to be pulled out before using the SD card in the printer.",
    };
  }

  if (objective === "separateKit" || objective === "printerDock") {
    return {
      key: "separate-kit",
      scene: state.scene,
      targetSelector: '[data-inventory-action="separate-transfer"]',
      action: "click",
      hint: "Click Separate in Inventory. Printers take the SD card only, not the whole USB reader.",
      postIt: "Separate the SD card.",
      manualTitle: "Separate the SD card",
      manual: "Click Separate on the SD Card + Reader item in Inventory. The printer takes only the SD card, so remove it from the USB reader before going to the printer slot.",
    };
  }

  if (objective === "roomPrinter") {
    return {
      key: "room-printer",
      scene: "room",
      targetSelector: '[data-hotspot="printers"]',
      action: "click",
      hint: "Go to the 3D Printers with the loaded SD card.",
      postIt: "Use the printer next.",
      manualTitle: "Go to the printer",
      manual: "Click the 3D Printers hotspot. Take the loaded SD card there and insert it into the printer slot beside the screen.",
    };
  }

  if (objective === "printerInsert") {
    return {
      key: "printer-insert",
      scene: "printer",
      sourceSelector: '[data-drag-item="loaded-sd-card"], [data-drag-item="empty-sd-card"]',
      targetSelector: "#printer-card-slot",
      action: "drag",
      hint: "Drag the SD card into the vertical slot beside the printer screen.",
      postIt: "Insert SD card here.",
      manualTitle: "Insert the SD card",
      manual: "Drag the loaded SD card from Inventory into the vertical slot beside the printer screen. The printer reads the print file from this card.",
    };
  }

  if (objective === "printerNoFiles" || objective === "printerStart") {
    return {
      key: objective,
      scene: "printer",
      targetSelector: "#printer-screen",
      action: "click",
      hint: objective === "printerNoFiles"
        ? "Tap the printer screen to eject the empty SD card, then export a file before trying again."
        : "Tap the printer screen to start the print.",
      postIt: objective === "printerNoFiles" ? "Tap to eject." : "Tap Print.",
      manualTitle: objective === "printerNoFiles" ? "Eject the empty card" : "Start the print",
      manual: objective === "printerNoFiles"
        ? "Tap the printer screen to eject the empty SD card. Then go back to the bench workflow and export a sliced file before trying again."
        : "Tap the printer screen to start the print. Leave the SD card in the printer once the job starts.",
    };
  }

  if (objective === "roomTrayReturn") {
    return {
      key: "room-tray-return",
      scene: "room",
      targetSelector: '[data-hotspot="tray"]',
      action: "click",
      hint: "Return to the SD Card Tray with the USB adapter.",
      postIt: "Return the adapter.",
      manualTitle: "Return to the tray",
      manual: "Click the SD Card Tray hotspot. The print is running, so the last lab step is returning the USB adapter to its tray.",
    };
  }

  if (objective === "trayReturn") {
    return {
      key: "tray-return",
      scene: "tray",
      sourceSelector: '[data-drag-item="usb-adapter"]',
      targetSelector: "#tray-return-slot",
      action: "drag",
      hint: "Drag the USB adapter from Inventory back into the tray.",
      postIt: "Drop adapter here.",
      manualTitle: "Return the USB adapter",
      manual: "Drag the USB adapter from Inventory into the return tray. The SD card stays in the printer; only the adapter goes back here.",
    };
  }

  return null;
}

function renderHintButton() {
  hintButton.textContent = `Hint (${state.manualHintsRemaining})`;
  hintButton.disabled = state.manualHintsRemaining <= 0 || !getStepGuide();
}

function clearHintVisuals({ keepPostIt = false } = {}) {
  document.querySelectorAll(".hint-halo, .is-next-target").forEach((element) => {
    element.classList.remove("hint-halo", "is-next-target");
  });

  gestureHint.classList.add("hidden");
  gestureHint.classList.remove("active");
  manualHintPanel.classList.add("hidden");
  manualHintTitle.textContent = "Next Step";
  manualHintText.textContent = "";
  state.activeHint = null;

  if (!keepPostIt) {
    postItHint.classList.add("hidden");
    postItHint.textContent = "";
    postItHint.removeAttribute("style");
    state.postItHint = null;
  }
}

function cancelAttemptHint() {
  if (state.attemptHintTimer) {
    clearTimeout(state.attemptHintTimer);
    state.attemptHintTimer = null;
  }

  state.attemptedGuideKey = null;
}

function markGuideProgress() {
  cancelAttemptHint();
  clearHintVisuals();
}

function positionPostIt(anchor) {
  if (!anchor) {
    postItHint.removeAttribute("style");
    return;
  }

  const rect = anchor.getBoundingClientRect();
  const width = 300;
  const left = Math.min(Math.max(18, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 18);
  const below = rect.bottom + 12;
  const top = Math.min(Math.max(92, below), window.innerHeight - 170);
  postItHint.style.left = `${left}px`;
  postItHint.style.top = `${top}px`;
}

function showPostItHint(text, anchor = null) {
  const anchorElement = typeof anchor === "string" ? getVisibleElement(anchor) : anchor;
  state.postItHint = text;
  postItHint.textContent = text;
  postItHint.classList.remove("hidden");
  positionPostIt(anchorElement);
}

function showGestureHint(source, target, guide = {}) {
  if (!source || !target) {
    return;
  }

  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = guide.dragEndOffset ? startX + guide.dragEndOffset.x : targetRect.left + targetRect.width / 2;
  const endY = guide.dragEndOffset ? startY + guide.dragEndOffset.y : targetRect.top + targetRect.height / 2;
  const dx = endX - startX;
  const dy = endY - startY;

  gestureHint.style.setProperty("--hint-start-x", `${startX}px`);
  gestureHint.style.setProperty("--hint-start-y", `${startY}px`);
  gestureHint.style.setProperty("--hint-end-x", `${endX}px`);
  gestureHint.style.setProperty("--hint-end-y", `${endY}px`);
  gestureHint.style.setProperty("--hint-distance", `${Math.hypot(dx, dy)}px`);
  gestureHint.style.setProperty("--hint-angle", `${Math.atan2(dy, dx)}rad`);
  gestureHint.classList.remove("hidden");
  gestureHint.classList.add("active");
}

function showManualHint(guide) {
  manualHintTitle.textContent = guide.manualTitle ?? "Next Step";
  manualHintText.textContent = guide.manual ?? guide.hint;
  manualHintPanel.classList.remove("hidden");
}

function showHint({ manual = false } = {}) {
  const guide = getStepGuide();
  if (!guide) {
    renderHintButton();
    return false;
  }

  if (manual) {
    if (state.manualHintsRemaining <= 0) {
      renderHintButton();
      return false;
    }

    state.manualHintsRemaining -= 1;
    renderHintButton();
  }

  clearHintVisuals();

  if (state.scene !== guide.scene) {
    const label = SCENE_LABELS[guide.scene] ?? "the correct station";
    if (manual) {
      showManualHint({
        manualTitle: `Go to ${label}`,
        manual: guide.manual ?? guide.hint,
      });
    } else {
      showPostItHint(`Go to ${label}. ${guide.hint}`);
    }
    return true;
  }

  const target = getVisibleElement(guide.targetSelector);
  const source = getVisibleElement(guide.sourceSelector);

  if (source) {
    source.classList.add("hint-halo");
  }

  if (target) {
    target.classList.add("hint-halo", "is-next-target");
  }

  if (guide.action === "drag" && source && target) {
    showGestureHint(source, target, guide);
  }

  if (manual) {
    showManualHint(guide);
  } else {
    showPostItHint(guide.postIt, target || source);
  }

  state.activeHint = guide.key;
  return true;
}

function isElementRelevantToGuide(element, guide) {
  if (!element || !guide) {
    return false;
  }

  const selectors = [guide.sourceSelector, guide.targetSelector].filter(Boolean);
  return selectors.some((selector) => element.closest(selector));
}

function armAttemptHint(reason = "attempt") {
  const guide = getStepGuide();
  if (!guide || state.scene !== guide.scene) {
    return;
  }

  if (state.attemptHintTimer && state.attemptedGuideKey === guide.key) {
    return;
  }

  cancelAttemptHint();
  state.attemptedGuideKey = guide.key;
  state.attemptHintTimer = setTimeout(() => {
    const nextGuide = getStepGuide();
    const settingsOpen = !settingsPanel.classList.contains("hidden");
    const blocked = !nextGuide || settingsOpen || completionPopupShown;

    if (!blocked && nextGuide.key === state.attemptedGuideKey && state.scene === nextGuide.scene) {
      showHint({ manual: false });
    }

    state.attemptHintTimer = null;
  }, HINT_ATTEMPT_DELAY_MS);
}

function scheduleIdleHint() {
  if (state.attemptHintTimer) {
    clearTimeout(state.attemptHintTimer);
  }

  state.attemptHintTimer = null;
  state.attemptedGuideKey = null;
}

function recordActivity() {
  // Pointer/keyboard activity alone is not progress. Hints persist until
  // the guided action succeeds or the scene/objective changes.
}

function flashElement(element, className) {
  if (!element) {
    return;
  }

  element.classList.remove("success-pop", "error-pop");
  void element.offsetWidth;
  element.classList.add(className);
  setTimeout(() => {
    element.classList.remove(className);
  }, 620);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyModelRotation() {
  renderModelPreview();
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function resizeModelCanvas() {
  if (!modelCanvas) {
    return false;
  }

  const rect = modelCanvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.round(rect.width * ratio));
  const height = Math.max(220, Math.round(rect.height * ratio));

  if (modelCanvas.width !== width || modelCanvas.height !== height) {
    modelCanvas.width = width;
    modelCanvas.height = height;
    return true;
  }

  return false;
}

function transformModelPoint(x, y, z, rotationX, rotationY) {
  // STL uses Z-up. Convert to a screen-friendly Y-up coordinate before rotation.
  let px = x;
  let py = z;
  let pz = y;
  const yaw = rotationY * Math.PI / 180;
  const pitch = rotationX * Math.PI / 180;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cx = Math.cos(pitch);
  const sx = Math.sin(pitch);

  const x1 = px * cy + pz * sy;
  const z1 = -px * sy + pz * cy;
  const y1 = py;
  const y2 = y1 * cx - z1 * sx;
  const z2 = y1 * sx + z1 * cx;
  return { x: x1, y: y2, z: z2 };
}

function projectModelPoint(point, width, height, modelScale) {
  const camera = 2.8;
  const perspective = camera / (camera + point.z);
  return {
    x: width / 2 + point.x * modelScale * perspective,
    y: height * 0.57 - point.y * modelScale * perspective,
    z: point.z,
  };
}

function createModelShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createModelProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createModelShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createModelShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function getSmoothModelMesh() {
  const positions = MODEL_MESH.positions ?? MODEL_MESH.vertices ?? [];
  const normals = MODEL_MESH.normals ?? [];
  const indices = MODEL_MESH.indices ?? [];
  if (!positions.length || !normals.length || !indices.length) {
    return null;
  }
  return { positions, normals, indices };
}

function createSupportSurfacePositions(segments) {
  const positions = [];
  const beadHalfWidth = 0.0026;
  const beadHalfHeight = 0.0012;
  const beadLift = 0.0003;
  const minimumVisibleLength = 0.001;

  segments.forEach((segment) => {
    const [ax, ay, az, bx, by, bz] = segment;
    const dx = bx - ax;
    const dz = bz - az;
    const flatLength = Math.hypot(dx, dz);

    if (flatLength < minimumVisibleLength) {
      return;
    }

    const offsetX = (-dz / flatLength) * beadHalfWidth;
    const offsetZ = (dx / flatLength) * beadHalfWidth;
    const aLeftTop = [ax + offsetX, ay + beadLift + beadHalfHeight, az + offsetZ];
    const aRightTop = [ax - offsetX, ay + beadLift + beadHalfHeight, az - offsetZ];
    const bLeftTop = [bx + offsetX, by + beadLift + beadHalfHeight, bz + offsetZ];
    const bRightTop = [bx - offsetX, by + beadLift + beadHalfHeight, bz - offsetZ];
    const aLeftBottom = [ax + offsetX, ay + beadLift - beadHalfHeight, az + offsetZ];
    const aRightBottom = [ax - offsetX, ay + beadLift - beadHalfHeight, az - offsetZ];
    const bLeftBottom = [bx + offsetX, by + beadLift - beadHalfHeight, bz + offsetZ];
    const bRightBottom = [bx - offsetX, by + beadLift - beadHalfHeight, bz - offsetZ];

    positions.push(
      ...aLeftTop, ...aRightTop, ...bRightTop,
      ...aLeftTop, ...bRightTop, ...bLeftTop,
      ...aLeftBottom, ...aLeftTop, ...bLeftTop,
      ...aLeftBottom, ...bLeftTop, ...bLeftBottom,
      ...aRightTop, ...aRightBottom, ...bRightBottom,
      ...aRightTop, ...bRightBottom, ...bRightTop,
    );
  });

  return positions;
}

function createModelGlState() {
  if (!modelCanvas) {
    return null;
  }

  const mesh = getSmoothModelMesh();
  if (!mesh) {
    return null;
  }

  const gl = modelCanvas.getContext("webgl", { alpha: true, antialias: true });
  if (!gl) {
    return null;
  }

  const modelProgram = createModelProgram(gl, `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform float uYaw;
    uniform float uPitch;
    uniform float uAspect;
    uniform float uScale;
    uniform float uYOffset;
    uniform float uCamera;
    varying vec3 vNormal;
    varying float vDepth;

    vec3 rotatePoint(vec3 p) {
      float cy = cos(uYaw);
      float sy = sin(uYaw);
      float cx = cos(uPitch);
      float sx = sin(uPitch);
      vec3 yawed = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
      return vec3(yawed.x, yawed.y * cx - yawed.z * sx, yawed.y * sx + yawed.z * cx);
    }

    void main() {
      vec3 rotated = rotatePoint(aPosition);
      vec3 normal = normalize(rotatePoint(aNormal));
      float perspective = uCamera / (uCamera + rotated.z);
      gl_Position = vec4(
        rotated.x * uScale * uAspect * perspective,
        rotated.y * uScale * perspective + uYOffset,
        (rotated.z + 1.25) / 2.5,
        1.0
      );
      vNormal = normal;
      vDepth = rotated.z;
    }
  `, `
    precision mediump float;
    varying vec3 vNormal;
    varying float vDepth;

    void main() {
      vec3 normal = gl_FrontFacing ? normalize(vNormal) : -normalize(vNormal);
      vec3 viewLight = normalize(vec3(0.0, 0.0, -1.0));
      vec3 keyLight = normalize(vec3(-0.34, 0.62, -0.72));
      vec3 fillLight = normalize(vec3(0.45, 0.28, -0.84));
      vec3 overheadLight = normalize(vec3(0.0, 0.94, -0.34));
      float view = max(dot(normal, viewLight), 0.0);
      float key = max(dot(normal, keyLight), 0.0);
      float fill = max(dot(normal, fillLight), 0.0);
      float overhead = max(dot(normal, overheadLight), 0.0);
      float facing = max(dot(normal, viewLight), 0.0);
      float rim = pow(1.0 - facing, 2.0);
      float relief = smoothstep(0.07, 0.36, length(normal.xy)) * smoothstep(0.18, 0.92, facing);
      vec3 base = vec3(0.64, 0.76, 0.90);
      vec3 shadow = vec3(0.38, 0.49, 0.62);
      vec3 highlight = vec3(0.95, 0.98, 1.0);
      float shade = 0.54 + view * 0.30 + key * 0.22 + fill * 0.12 + overhead * 0.12;
      vec3 color = mix(shadow, base, shade);
      color = mix(color, highlight, pow(max(view, key), 2.0) * 0.18 + overhead * 0.08 + rim * 0.02);
      color = mix(color, vec3(0.20, 0.31, 0.43), relief * 0.18);
      float contour = pow(1.0 - abs(dot(normal, viewLight)), 1.35);
      color = mix(color, vec3(0.28, 0.40, 0.53), contour * 0.10);
      gl_FragColor = vec4(color, 1.0);
    }
  `);

  const lineProgram = createModelProgram(gl, `
    attribute vec3 aPosition;
    uniform float uYaw;
    uniform float uPitch;
    uniform float uAspect;
    uniform float uScale;
    uniform float uYOffset;
    uniform float uCamera;

    vec3 rotatePoint(vec3 p) {
      float cy = cos(uYaw);
      float sy = sin(uYaw);
      float cx = cos(uPitch);
      float sx = sin(uPitch);
      vec3 yawed = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
      return vec3(yawed.x, yawed.y * cx - yawed.z * sx, yawed.y * sx + yawed.z * cx);
    }

    void main() {
      vec3 rotated = rotatePoint(aPosition);
      float perspective = uCamera / (uCamera + rotated.z);
      gl_Position = vec4(
        rotated.x * uScale * uAspect * perspective,
        rotated.y * uScale * perspective + uYOffset,
        (rotated.z + 1.25) / 2.5,
        1.0
      );
    }
  `, `
    precision mediump float;
    uniform vec4 uColor;
    void main() {
      gl_FragColor = uColor;
    }
  `);

  if (!modelProgram || !lineProgram) {
    return null;
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  const requiresUint32Indices = mesh.positions.length / 3 > 65535;
  if (requiresUint32Indices && !gl.getExtension("OES_element_index_uint")) {
    console.warn("This browser does not support the high-detail STL preview index buffer.");
    return null;
  }
  const IndexArray = requiresUint32Indices ? Uint32Array : Uint16Array;
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new IndexArray(mesh.indices), gl.STATIC_DRAW);

  const supportPositions = createSupportSurfacePositions(SUPPORT_PREVIEW.segments ?? []);
  const supportBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, supportBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(supportPositions), gl.STATIC_DRAW);

  return {
    gl,
    modelProgram,
    lineProgram,
    positionBuffer,
    normalBuffer,
    indexBuffer,
    supportBuffer,
    indexCount: mesh.indices.length,
    indexType: requiresUint32Indices ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
    supportVertexCount: supportPositions.length / 3,
  };
}

function setModelProgramUniforms(gl, program, width, height) {
  gl.uniform1f(gl.getUniformLocation(program, "uYaw"), normalizeDegrees(state.modelRotationY) * Math.PI / 180);
  gl.uniform1f(gl.getUniformLocation(program, "uPitch"), state.modelRotationX * Math.PI / 180);
  gl.uniform1f(gl.getUniformLocation(program, "uAspect"), height / width);
  gl.uniform1f(gl.getUniformLocation(program, "uScale"), 1.54 * state.modelZoom);
  gl.uniform1f(gl.getUniformLocation(program, "uYOffset"), -0.02);
  gl.uniform1f(gl.getUniformLocation(program, "uCamera"), 2.9);
}

function updateModelZoomControls() {
  if (!modelZoomValue) {
    return;
  }

  modelZoomValue.textContent = `${Math.round(state.modelZoom * 100)}%`;
  if (modelZoomOutButton) {
    modelZoomOutButton.disabled = state.modelZoom <= MODEL_ZOOM_MIN + 0.01;
  }
  if (modelZoomInButton) {
    modelZoomInButton.disabled = state.modelZoom >= MODEL_ZOOM_MAX - 0.01;
  }
}

function setModelZoom(nextZoom) {
  state.modelZoom = clamp(nextZoom, MODEL_ZOOM_MIN, MODEL_ZOOM_MAX);
  updateModelZoomControls();
  renderModelPreview();
}

function adjustModelZoom(delta) {
  setModelZoom(state.modelZoom + delta);
}

function handleModelWheel(event) {
  event.preventDefault();
  event.stopPropagation();
  const direction = event.deltaY > 0 ? -1 : 1;
  adjustModelZoom(direction * MODEL_ZOOM_STEP);
}

function handleModelZoomKey(event) {
  if (!["+", "=", "-", "_", "0"].includes(event.key)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  if (event.key === "0") {
    setModelZoom(1);
    return;
  }

  adjustModelZoom((event.key === "-" || event.key === "_") ? -MODEL_ZOOM_STEP : MODEL_ZOOM_STEP);
}

function renderModelPreview() {
  if (!modelCanvas || !getSmoothModelMesh()) {
    return;
  }

  resizeModelCanvas();
  if (!modelGlState) {
    modelGlState = createModelGlState();
  }
  if (!modelGlState) {
    return;
  }

  const { gl } = modelGlState;
  const width = modelCanvas.width;
  const height = modelCanvas.height;
  const showSupports = state.sliceState === "ready" && modelGlState.supportVertexCount > 0;

  supportPreviewLabel?.classList.toggle("hidden", !showSupports);

  gl.viewport(0, 0, width, height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);

  gl.useProgram(modelGlState.modelProgram);
  setModelProgramUniforms(gl, modelGlState.modelProgram, width, height);

  const positionLocation = gl.getAttribLocation(modelGlState.modelProgram, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, modelGlState.positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  const normalLocation = gl.getAttribLocation(modelGlState.modelProgram, "aNormal");
  gl.bindBuffer(gl.ARRAY_BUFFER, modelGlState.normalBuffer);
  gl.enableVertexAttribArray(normalLocation);
  gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelGlState.indexBuffer);
  gl.drawElements(gl.TRIANGLES, modelGlState.indexCount, modelGlState.indexType, 0);

  if (showSupports) {
    gl.useProgram(modelGlState.lineProgram);
    setModelProgramUniforms(gl, modelGlState.lineProgram, width, height);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.uniform4f(gl.getUniformLocation(modelGlState.lineProgram, "uColor"), 0.38, 0.50, 0.64, 1.0);
    const linePositionLocation = gl.getAttribLocation(modelGlState.lineProgram, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, modelGlState.supportBuffer);
    gl.enableVertexAttribArray(linePositionLocation);
    gl.vertexAttribPointer(linePositionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, modelGlState.supportVertexCount);
  }
}

function startModelInspection(event) {
  if (event.target.closest("[data-model-zoom]")) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  state.modelInspecting = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startRotationX: state.modelRotationX,
    startRotationY: state.modelRotationY,
  };

  modelInspector.setPointerCapture?.(event.pointerId);
  modelInspector.classList.add("is-inspecting");
}

function updateModelInspection(event) {
  if (!state.modelInspecting || state.modelInspecting.pointerId !== event.pointerId) {
    return false;
  }

  event.preventDefault();
  const deltaX = event.clientX - state.modelInspecting.startX;
  const deltaY = event.clientY - state.modelInspecting.startY;
  state.modelRotationY = normalizeDegrees(state.modelInspecting.startRotationY - deltaX * 0.55);
  state.modelRotationX = clamp(state.modelInspecting.startRotationX - deltaY * 0.38, -85, 85);
  applyModelRotation();
  return true;
}

function endModelInspection(event) {
  if (!state.modelInspecting || state.modelInspecting.pointerId !== event.pointerId) {
    return false;
  }

  event.preventDefault();
  modelInspector.releasePointerCapture?.(event.pointerId);
  modelInspector.classList.remove("is-inspecting");
  state.modelInspecting = null;
  return true;
}

function showScene(name) {
  state.scene = name;

  Object.entries(scenes).forEach(([sceneName, element]) => {
    const isActive = sceneName === name;
    element.classList.toggle("active", isActive);
    element.setAttribute("aria-hidden", String(!isActive));
  });

  updateUtilityButtons();
  clearHintVisuals();
  scheduleIdleHint();
}

function updateUtilityButtons() {
  const canReturn = state.doorUnlocked && !["tutorial", "door", "room"].includes(state.scene);
  const canUseTrainingTools = state.scene !== "tutorial";
  hintButton.classList.toggle("hidden", !canUseTrainingTools);
  helpButton.classList.toggle("hidden", state.scene === "tutorial");
  returnButton.classList.toggle("hidden", !canReturn);
  renderHintButton();
}

function setObjective(key) {
  state.objective = key;
  objectiveText.textContent = OBJECTIVES[key];
  updateHotspotStates();
  renderWorkstationScene();
  renderTrayScene();
  renderPrinterScene();
  clearHintVisuals();
  renderHintButton();
  scheduleIdleHint();
}

function updateDialoguePrompt() {
  const canAdvance = Boolean(dialoguePendingAction && !dialogueTimer);
  dialogueFrame.classList.toggle("can-continue", canAdvance);
  dialoguePrompt.classList.toggle("hidden", !canAdvance);
}

function clearCompletionPopupTimer() {
  if (!completionPopupTimer) {
    return;
  }

  clearTimeout(completionPopupTimer);
  completionPopupTimer = null;
}

function showCompletionPopup() {
  if (completionPopupShown) {
    return;
  }

  clearCompletionPopupTimer();
  completionPopupPending = false;
  completionPopupShown = true;
  completionPopup.classList.remove("hidden");
  completionContinue.focus();
}

function isCompletionPopupPending() {
  return state.transfer.printStarted && state.transfer.returned && state.transfer.tutorialCompleted && !completionPopupShown;
}

function hideCompletionPopup() {
  completionPopup.classList.add("hidden");

  if (state.transfer.tutorialCompleted) {
    window.location.href = "index.html";
  }
}

function scheduleCompletionPopupAfterTyping() {
  if (!completionPopupPending || completionPopupShown || dialogueTimer) {
    return;
  }

  clearCompletionPopupTimer();
  completionPopupTimer = setTimeout(showCompletionPopup, 3000);
}

function markTutorialComplete(message) {
  if (state.transfer.tutorialCompleted) {
    if (!completionPopupShown) {
      showCompletionPopup();
    }
    return;
  }

  state.transfer.tutorialCompleted = true;
  state.level1Complete = true;
  writeStoredFlag(LEVEL1_STORAGE_KEY, true);
  completionPopupPending = false;
  setDialogue(message, "Guide");
  finishTyping();
  showCompletionPopup();
}

function finishTyping() {
  if (!dialogueTimer) {
    return;
  }

  clearInterval(dialogueTimer);
  dialogueTimer = null;
  dialogueText.textContent = dialogueFullText;
  updateDialoguePrompt();
  scheduleCompletionPopupAfterTyping();
}

function advanceDialogue() {
  if (!dialoguePendingAction) {
    return;
  }

  const action = dialoguePendingAction;
  dialoguePendingAction = null;
  updateDialoguePrompt();
  action();
}

function setDialogue(text, speaker = "Guide", options = {}) {
  const { onContinue = null, continueText = "Click anywhere to continue" } = options;

  dialogueSpeaker.textContent = speaker;
  dialogueFullText = text;
  dialoguePendingAction = onContinue;
  dialoguePrompt.textContent = continueText;

  if (dialogueTimer) {
    clearInterval(dialogueTimer);
    dialogueTimer = null;
  }

  dialogueText.textContent = "";

  let index = 0;
  dialogueTimer = setInterval(() => {
    dialogueText.textContent += text[index];
    index += 1;

    if (index >= text.length) {
      clearInterval(dialogueTimer);
      dialogueTimer = null;
      updateDialoguePrompt();
      scheduleCompletionPopupAfterTyping();
    }
  }, 24);

  updateDialoguePrompt();
}

function clearDialogueState() {
  if (dialogueTimer) {
    clearInterval(dialogueTimer);
    dialogueTimer = null;
  }

  dialoguePendingAction = null;
  if (isCompletionPopupPending()) {
    completionPopupPending = true;
    scheduleCompletionPopupAfterTyping();
  } else {
    completionPopupPending = false;
    clearCompletionPopupTimer();
  }
  updateDialoguePrompt();
}

function hasTransferKitInInventory() {
  return state.transfer.assembled && state.transfer.location === "inventory" && !state.transfer.separated && !state.transfer.returned;
}

function hasTransferKitOnAssemblySurface() {
  return state.transfer.assembled && state.transfer.location === "assembly-surface" && !state.transfer.separated;
}

function isAdapterOnlyTransfer() {
  return state.transfer.separated && state.transfer.location === "inventory-adapter" && state.transfer.cardLocation === "printer-slot";
}

function isAdapterDockedWithoutCard() {
  return state.transfer.separated && state.transfer.location === "bench-dock";
}

function hasSdCardInInventory() {
  return state.transfer.separated && state.transfer.cardLocation === "inventory-card";
}

function hasLoadedSdCardInInventory() {
  return state.transfer.loaded && hasSdCardInInventory();
}

function hasEmptySdCardInInventory() {
  return !state.transfer.loaded && hasSdCardInInventory();
}

function hasUsbAdapterInInventory() {
  return state.transfer.separated && state.transfer.location === "inventory-adapter" && !state.transfer.returned;
}

function canSeparateTransferKit() {
  return state.transfer.assembled && state.transfer.location === "inventory" && !state.transfer.separated;
}

function canReassembleTransferKit() {
  return hasSdCardInInventory() && hasUsbAdapterInInventory();
}

function getTransferInventoryName() {
  return isAdapterOnlyTransfer() ? "USB Adapter" : "SD Card + Reader";
}

function getTransferAriaLabel() {
  return isAdapterOnlyTransfer() ? "USB adapter" : "SD card and reader";
}

function getTransferIconMarkup() {
  const cardState = state.transfer.loaded ? "state-loaded" : "state-empty";
  return `
    <span class="combo-adapter-shape"></span>
    ${isAdapterOnlyTransfer() || isAdapterDockedWithoutCard() ? "" : `<span class="combo-card-shape ${cardState}"></span>`}
  `;
}

function getTransferStatusText() {
  if (!state.transfer.loaded) {
    return "Blank media ready";
  }

  return "Slice file exported";
}

function renderInventory() {
  const items = [];

  if (state.inventory.includes("id-card")) {
    items.push(`
      <div class="inventory-item ${state.doorUnlocked ? "used" : ""}">
        <button
          class="inventory-token inventory-id"
          type="button"
          data-drag-item="id-card"
          aria-label="ID card"
        >
          <span class="token-chip"></span>
          <span class="token-avatar"></span>
          <span class="token-line token-line-short"></span>
          <span class="token-line"></span>
        </button>
        <div class="inventory-copy">
          <strong>ID Card</strong>
          <p>${state.doorUnlocked ? "Access used" : "Ready to swipe"}</p>
        </div>
      </div>
    `);
  }

  if (hasTransferKitInInventory()) {
    items.push(`
      <div class="inventory-item reward ${state.transfer.loaded ? "state-loaded" : "state-empty"}">
        <button
          class="inventory-token inventory-combo"
          type="button"
          data-drag-item="transfer-kit"
          aria-label="${getTransferAriaLabel()}"
        >
          ${getTransferIconMarkup()}
        </button>
        <div class="inventory-copy">
          <strong>${getTransferInventoryName()}</strong>
          <p>${getTransferStatusText()}</p>
          ${canSeparateTransferKit() ? '<button class="inventory-action" type="button" data-inventory-action="separate-transfer">Separate</button>' : ""}
        </div>
      </div>
    `);
  }

  if (hasSdCardInInventory()) {
    items.push(`
      <div class="inventory-item reward ${state.transfer.loaded ? "state-loaded" : "state-empty"}">
        <button
          class="inventory-token inventory-sd-card ${state.transfer.loaded ? "state-loaded" : "state-empty"}"
          type="button"
          data-drag-item="${state.transfer.loaded ? "loaded-sd-card" : "empty-sd-card"}"
          aria-label="${state.transfer.loaded ? "Loaded SD card" : "Empty SD card"}"
        >
          <span class="card-contacts"></span>
          <span class="card-mark">SD</span>
        </button>
        <div class="inventory-copy">
          <strong>${state.transfer.loaded ? "Loaded SD Card" : "Empty SD Card"}</strong>
          <p>${state.transfer.loaded ? "Slice file exported" : "No print file yet"}</p>
        </div>
      </div>
    `);
  }

  if (hasUsbAdapterInInventory()) {
    items.push(`
      <div class="inventory-item reward">
        <button
          class="inventory-token inventory-adapter-only"
          type="button"
          data-drag-item="usb-adapter"
          aria-label="USB adapter"
        >
          <span class="combo-adapter-shape"></span>
        </button>
        <div class="inventory-copy">
          <strong>USB Adapter</strong>
          <p>${state.transfer.loaded ? "Return to tray when ready" : "Ready to reassemble"}</p>
          ${canReassembleTransferKit() ? '<button class="inventory-action" type="button" data-inventory-action="reassemble-transfer">Reassemble</button>' : ""}
        </div>
      </div>
    `);
  }

  inventory.innerHTML = items.join("");
}

function getRequiredHotspot() {
  if (state.doorUnlocked) {
    return null;
  }

  if (
    state.objective === "roomBenchSlice" ||
    state.objective === "roomBenchExport" ||
    state.objective === "roomBenchUndock" ||
    state.objective === "benchDock"
  ) {
    return "bench";
  }

  if (state.objective === "roomTrayCollect" || state.objective === "roomTrayReturn") {
    return "tray";
  }

  if (state.objective === "roomPrinter") {
    return "printers";
  }

  return null;
}

function updateHotspotStates() {
  const requiredHotspot = getRequiredHotspot();

  hotspotButtons.forEach((button) => {
    const isRequired = button.dataset.hotspot === requiredHotspot;
    button.classList.toggle("hotspot-objective", isRequired);
    button.classList.toggle("hotspot-muted", requiredHotspot !== null && !isRequired);
  });
}

function getWorkshopReturnObjective() {
  if (state.transfer.printStarted && state.transfer.returned) {
    return "complete";
  }

  if (state.transfer.printStarted && !state.transfer.returned) {
    return "roomTrayReturn";
  }

  if (state.transfer.location === "bench-dock") {
    return state.transfer.loaded ? "roomBenchUndock" : "roomBenchExport";
  }

  if (state.transfer.loaded && !state.transfer.separated && state.transfer.location === "inventory") {
    return "separateKit";
  }

  if (hasTransferKitOnAssemblySurface()) {
    return "roomTrayCollect";
  }

  if (state.transfer.cardLocation === "printer-slot" && !state.transfer.printStarted) {
    return "roomPrinter";
  }

  if (hasSdCardInInventory()) {
    return "roomPrinter";
  }

  if (hasUsbAdapterInInventory()) {
    return state.objective === "trayReturn" || state.objective === "roomTrayReturn" ? "roomTrayReturn" : "roomPrinter";
  }

  if (state.transfer.returned && !state.transfer.printStarted) {
    return "roomPrinter";
  }

  if (state.transfer.cardPicked && state.transfer.adapterPicked && !state.transfer.assembled) {
    return "roomTrayCollect";
  }

  if ((state.transfer.cardPicked || state.transfer.adapterPicked) && !state.transfer.assembled) {
    return "roomTrayCollect";
  }

  if (state.transfer.assembled && !state.transfer.loaded && state.transfer.location === "inventory") {
    return state.sliceState === "idle" ? "roomBenchSlice" : "roomBenchExport";
  }

  if (state.sliceState === "processing") {
    return state.transfer.assembled ? "roomBenchExport" : "roomTrayCollect";
  }

  if (state.sliced && (!state.transfer.assembled || hasTransferKitOnAssemblySurface())) {
    return "roomTrayCollect";
  }

  return "roomBenchSlice";
}

function cancelActiveDrag() {
  if (!state.dragging) {
    return;
  }

  state.dragging.source.classList.remove("drag-origin");
  dragGhost.classList.add("hidden");
  dragGhost.innerHTML = "";
  delete dragGhost.dataset.item;
  clearDropHighlights();
  state.dragging = null;
}

function returnToWorkshopRoom() {
  if (!state.doorUnlocked || state.scene === "tutorial" || state.scene === "door") {
    return;
  }

  cancelActiveDrag();

  if (isCompletionPopupPending()) {
    showScene("room");
    setObjective("complete");
    scheduleCompletionPopupAfterTyping();
    return;
  }

  clearDialogueState();
  showScene("room");
  setObjective(getWorkshopReturnObjective());
  setDialogue("Returned to the workshop. Explore the stations and use their feedback to continue.", "Guide");
}

function openInstructionReview() {
  if (state.scene === "tutorial") {
    return;
  }

  cancelActiveDrag();
  clearDialogueState();
  tutorialReturnScene = state.scene;
  tutorialStart.textContent = "Return To Training";
  showScene("tutorial");
  setDialogue("Review the controls, then click Return To Training to continue where you left off.", "Guide");
}

function closeInstructionReview() {
  const nextScene = tutorialReturnScene;
  tutorialReturnScene = null;
  tutorialStart.textContent = state.level1Complete ? "Replay Simulation" : "Start Simulation";

  if (!nextScene) {
    startLevelOne();
    return;
  }

  showScene(nextScene);
  setDialogue("Back to training. Continue experimenting from the current state.", "Guide");
}

function renderWorkstationScene() {
  const dockVisible = state.scene === "workstation" || state.transfer.location === "bench-dock";
  renderModelPreview();

  benchDock.classList.toggle("active", dockVisible);
  benchDock.classList.toggle("occupied", state.transfer.location === "bench-dock");
  benchDock.classList.toggle("adapter-only", state.transfer.location === "bench-dock" && state.transfer.separated);
  benchKitPreview.classList.toggle("hidden", state.transfer.location !== "bench-dock");
  benchKitPreview.classList.toggle("adapter-only", state.transfer.location === "bench-dock" && state.transfer.separated);
  benchKitPreview.classList.toggle("state-loaded", state.transfer.location === "bench-dock" && state.transfer.loaded);
  benchKitPreview.classList.toggle("state-empty", state.transfer.location === "bench-dock" && !state.transfer.loaded && !state.transfer.separated);
  benchDockLabel.textContent = "USB Dock";

  if (state.transfer.location === "bench-dock" && state.transfer.separated) {
    workstationModeChip.textContent = "Adapter connected";
    workstationStatus.textContent = state.sliceState === "idle"
      ? "The USB adapter is docked without an SD card. You can still slice the model, but export needs the SD card attached."
      : "The USB adapter is docked, but there is no SD card in it. Drag it out when you are done checking the dock.";
    workstationAction.textContent = state.sliceState === "idle" ? "Slice" : "No SD Card";
    workstationAction.disabled = state.sliceState !== "idle";
    return;
  }

  if (state.transfer.location === "bench-dock" && state.transfer.loaded) {
    workstationModeChip.textContent = "File exported";
    workstationStatus.textContent = "The loaded reader is docked. Drag it out when you are ready to use the SD card.";
    workstationAction.textContent = "Reader Loaded";
    workstationAction.disabled = true;
    return;
  }

  if (state.transfer.location === "bench-dock" && !state.transfer.loaded && state.sliceState === "ready") {
    workstationModeChip.textContent = "Reader connected";
    workstationStatus.textContent = "The reader is docked and the slice file is ready. Click Export to write the file onto the SD card.";
    workstationAction.textContent = "Export";
    workstationAction.disabled = false;
    return;
  }

  if (state.transfer.location === "bench-dock" && !state.transfer.loaded) {
    workstationModeChip.textContent = state.sliceState === "processing" ? "Slicing..." : "Reader connected";
    workstationStatus.textContent = state.sliceState === "processing"
      ? "The reader is docked. Wait for slicing to finish before exporting."
      : "The reader is docked early. Slice the model first; no file can export yet.";
    workstationAction.textContent = state.sliceState === "idle" ? "Slice" : "Slicing...";
    workstationAction.disabled = state.sliceState !== "idle";
    return;
  }

  if (state.sliceState === "idle") {
    workstationModeChip.textContent = "Ready to slice";
    workstationStatus.textContent = state.transfer.separated
      ? "Your SD card and USB adapter are separated. You can dock the adapter alone, but export needs the reader reassembled."
      : state.transfer.assembled
      ? "Click Slice to prepare a file, or dock the USB reader first if you want it connected before slicing."
      : "Your laptop is open on the bench. Slice now or collect the SD card kit first.";
    workstationAction.textContent = "Slice";
    workstationAction.disabled = false;
    return;
  }

  if (state.sliceState === "processing") {
    workstationModeChip.textContent = "Slicing...";
    workstationStatus.textContent = "Bambu Lab is slicing. You can wait here; it will finish in a few seconds.";
    workstationAction.textContent = "Slicing...";
    workstationAction.disabled = true;
    return;
  }

  workstationModeChip.textContent = "Slice complete";

  if (state.transfer.separated && !state.transfer.loaded) {
    workstationModeChip.textContent = "Reader separated";
    workstationStatus.textContent = "You can dock the adapter alone to check the port, but export needs the SD card reassembled into the reader.";
    workstationAction.textContent = "Export";
    workstationAction.disabled = true;
    return;
  }

  workstationStatus.textContent = hasTransferKitOnAssemblySurface()
    ? "The slice is ready. Drag the assembled reader out of the tray surface into inventory, then dock it here."
    : "The slice is ready. Dock the SD Card + Reader to export the file.";
  workstationAction.textContent = "Export";
  workstationAction.disabled = true;
}

function renderTrayScene() {
  const returnMode = state.objective === "trayReturn" || state.transfer.returned || (state.transfer.printStarted && hasUsbAdapterInInventory());
  const kitOnAssemblySurface = hasTransferKitOnAssemblySurface();

  trayItems.classList.toggle("hidden", returnMode);
  assemblyZone.classList.toggle("hidden", returnMode);
  trayReturnZone.classList.toggle("hidden", !returnMode);

  if (returnMode) {
    trayReturnSlot.classList.toggle("complete", state.transfer.returned);
    trayReturnLabel.classList.toggle("hidden", state.transfer.returned);
    trayReturnPreview.classList.toggle("hidden", !state.transfer.returned);
    trayReturnHint.textContent = state.transfer.returned
      ? "The USB adapter is visible in the tray again."
      : "This tray accepts the USB adapter when you want to put it away.";
    return;
  }

  pickupCardButton.classList.toggle("collected", state.transfer.cardPicked);
  pickupAdapterButton.classList.toggle("collected", state.transfer.adapterPicked);
  pickupCardButton.classList.toggle("state-empty", !state.transfer.loaded);
  pickupCardButton.classList.toggle("state-loaded", state.transfer.loaded);
  pickupCardButton.disabled = state.transfer.cardPicked;
  pickupAdapterButton.disabled = state.transfer.adapterPicked;

  assemblyCard.classList.toggle("hidden", !state.transfer.cardPicked || state.transfer.assembled);
  assemblyAdapter.classList.toggle("hidden", !state.transfer.adapterPicked || (state.transfer.assembled && !kitOnAssemblySurface));
  adapterSlot.classList.toggle("complete", kitOnAssemblySurface);
  adapterCardPreview.classList.toggle("hidden", !kitOnAssemblySurface);
  adapterCardPreview.classList.toggle("state-loaded", kitOnAssemblySurface && state.transfer.loaded);
  adapterCardPreview.classList.toggle("state-empty", kitOnAssemblySurface && !state.transfer.loaded);

  if (state.transfer.assembled) {
    adapterSlot.innerHTML = "<span>Card seated</span>";
    assemblyHint.textContent = kitOnAssemblySurface
      ? "The SD card is seated. Drag the assembled reader out of this surface to store it in inventory."
      : state.transfer.loaded
      ? "The exported file is on the SD card. You can separate or reassemble the reader in inventory."
      : "The SD card reader kit is stored in your inventory.";
    assemblyZone.classList.toggle("assembly-complete", kitOnAssemblySurface);
    return;
  }

  adapterSlot.innerHTML = "<span>Slide card in</span>";
  assemblyZone.classList.remove("assembly-complete");

  if (state.transfer.cardPicked && state.transfer.adapterPicked) {
    assemblyHint.textContent = "Both parts are ready. Slide the SD card into the reader slot.";
  } else if (state.transfer.cardPicked || state.transfer.adapterPicked) {
    assemblyHint.textContent = "Click to pick up the remaining part.";
  } else {
    assemblyHint.textContent = "Click both tray items to pick them up.";
  }
}

function renderPrinterScene() {
  const cardInPrinter = state.transfer.cardLocation === "printer-slot";

  printerScreenTitle.textContent = "Sliced Model";
  printerScreenSubtitle.textContent = "PLA / 0.20 mm";
  printerScreenAction.textContent = "Print";
  printerScreen.classList.toggle("printing", state.transfer.printStarted);
  printerKitDock.classList.add("hidden");
  printerKitDock.classList.remove("occupied");
  printerConverterStand.classList.add("hidden");
  printerLooseCard.classList.add("hidden");
  printerSlotCard.classList.add("hidden");
  printerCardSlot.classList.toggle("loaded", cardInPrinter);
  printerCardSlot.classList.toggle("state-loaded", cardInPrinter && state.transfer.loaded);
  printerCardSlot.classList.toggle("state-empty", cardInPrinter && !state.transfer.loaded);
  printerSlotCard.classList.toggle("state-loaded", cardInPrinter && state.transfer.loaded);
  printerSlotCard.classList.toggle("state-empty", cardInPrinter && !state.transfer.loaded);
  printerConverterSlot.classList.remove("loaded");
  printerConverterCardPreview.classList.toggle("hidden", true);
  printerScreen.disabled = state.objective !== "printerStart" && state.objective !== "printerNoFiles";

  if (state.objective === "printerDock") {
    printerTransferCopy.textContent = "Separate the SD card from the USB adapter in your inventory before using the printer.";
    printerKitLabel.textContent = "Separate first";
    printerSlotLabel.textContent = "Insert card";
    printerConverterLabel.textContent = "Reader slot";
    return;
  }

  if (state.objective === "printerInsert") {
    printerTransferCopy.textContent = "Drag an SD card from inventory into the vertical slot beside the printer screen.";
    printerKitLabel.textContent = "Use SD card";
    printerSlotLabel.textContent = "Slide card in";
    printerConverterLabel.textContent = "Reader slot";
    return;
  }

  if (state.objective === "printerNoFiles") {
    printerScreenTitle.textContent = "No Files Available";
    printerScreenSubtitle.textContent = "SD card is empty";
    printerScreenAction.textContent = "Eject";
    printerTransferCopy.textContent = "The printer found no printable files on this SD card. Tap the screen to eject it.";
    printerKitLabel.textContent = "Empty card";
    printerSlotLabel.textContent = "Card seated";
    printerConverterLabel.textContent = "Reader empty";
    return;
  }

  if (state.objective === "printerStart") {
    printerTransferCopy.textContent = "The SD card is fully inside the printer. Tap the screen to start the print, then leave the card inserted.";
    printerKitLabel.textContent = "Reader waiting";
    printerSlotLabel.textContent = "Card seated";
    printerConverterLabel.textContent = "Reader empty";
    return;
  }

  if (state.transfer.printStarted && cardInPrinter) {
    printerScreenTitle.textContent = "Printing";
    printerScreenSubtitle.textContent = "42 min remaining";
    printerScreenAction.textContent = "Active";
    printerScreen.disabled = true;
    printerTransferCopy.textContent = state.transfer.returned
      ? "The print is running and the USB adapter is already back in the tray."
      : "The print is running. The SD card stays in the printer.";
    printerKitLabel.textContent = state.transfer.returned ? "Complete" : "Adapter in inventory";
    printerSlotLabel.textContent = "Card seated";
    printerConverterLabel.textContent = "Reader empty";
    return;
  }

  printerTransferCopy.textContent = "Insert an SD card here. Empty cards can be ejected; loaded cards can start a print.";
  printerKitLabel.textContent = "No reader needed";
  printerSlotLabel.textContent = "Insert card";
  printerConverterLabel.textContent = "Reader slot";
}

function isRequiredHotspot(type) {
  return type === getRequiredHotspot();
}

function handleHotspot(type) {
  const config = HOTSPOTS[type];
  if (!config) {
    return;
  }

  const requiredHotspot = getRequiredHotspot();
  const visitedWrongStation = requiredHotspot && requiredHotspot !== type && ["bench", "tray", "printers"].includes(type);

  if ((isRequiredHotspot(type) || ["bench", "tray", "printers"].includes(type)) && typeof config.action === "function") {
    config.action();
    if (visitedWrongStation) {
      const requiredLabel = HOTSPOTS[requiredHotspot].label;
      showPostItHint(`You can inspect this station, but the next useful step is at ${requiredLabel}. Return to the room when ready.`);
    }
    return;
  }

  setDialogue(config.info, config.label);
}

function startGame() {
  helpButton.classList.remove("hidden");
  showScene("door");
  setObjective("door");
  setDialogue("Swipe your ID card over the reader beside the handle to enter the workshop.", "Guide");
}

function unlockDoor() {
  if (state.doorUnlocked) {
    return;
  }

  state.doorUnlocked = true;
  doorReader.classList.add("unlocked");
  renderInventory();
  setDialogue("Access granted. The workshop door unlocks. Step inside and explore the room tools.", "System", {
    onContinue: () => {
      showScene("room");
      setObjective("roomBenchSlice");
      setDialogue("You are inside the print room. Start at the Bench Area, then follow the transfer media and printer workflow.", "Guide");
    },
  });
}

function openWorkstationScene() {
  showScene("workstation");

  if (state.transfer.location === "bench-dock" && state.transfer.separated) {
    setObjective("benchUndock");
    setDialogue("The USB adapter is docked without an SD card. Export is unavailable, but you can drag it out any time.", "Guide");
    return;
  }

  if (state.transfer.location === "bench-dock" && state.transfer.loaded) {
    setObjective("benchUndock");
    setDialogue("Drag the loaded USB reader out of the laptop dock to store it in your inventory.", "Guide");
    return;
  }

  if (state.transfer.location === "bench-dock" && state.sliceState === "ready") {
    setObjective("benchExport");
    setDialogue("The reader is connected. Click Export to copy the sliced file onto the SD card.", "Guide");
    return;
  }

  if (state.transfer.location === "bench-dock") {
    setObjective("slice");
    setDialogue(state.sliceState === "processing"
      ? "The reader is docked while slicing runs. Wait here; Export will unlock when slicing finishes."
      : "The reader is docked early. Click Slice first; no file can export yet.", "Guide");
    return;
  }

  if (state.sliceState === "idle") {
    setObjective("slice");
    setDialogue("Check the practical readouts, then click Slice. You can connect the USB reader later when you are ready to export.", "Guide");
    return;
  }

  if (state.sliceState === "processing") {
    setObjective("slice");
    setDialogue("Bambu Lab is still slicing. You can wait here; it will finish in a few seconds.", "Bambu Lab");
    return;
  }

  if (state.transfer.separated && !state.transfer.loaded && state.sliced) {
    setObjective("roomBenchExport");
    setDialogue("The USB port accepts an adapter, but Export needs an SD card inside the reader.", "Guide");
    return;
  }

  if (state.transfer.assembled && !state.transfer.loaded && state.transfer.location === "inventory") {
    setObjective("benchDock");
    setDialogue("If you want to plug in the USB reader, drag it to the dock on the side of the laptop base.", "Guide");
    return;
  }

  if (state.sliced && !state.transfer.assembled) {
    setObjective("roomTrayCollect");
    setDialogue("Bambu Lab has a sliced file ready. Export needs writable media in the USB dock.", "Guide");
    return;
  }

  setDialogue(HOTSPOTS.bench.info, HOTSPOTS.bench.label);
}

function completeSlice() {
  if (state.sliceState !== "idle") {
    return;
  }

  state.sliceState = "processing";
  state.sliced = false;
  if (sliceTimer) {
    clearTimeout(sliceTimer);
  }

  renderWorkstationScene();
  setObjective("slice");
  setDialogue("Slicing started. You can stay here; it will finish in a few seconds.", "Bambu Lab");

  sliceTimer = setTimeout(finishSlicing, 4000);
}

function finishSlicing() {
  if (state.sliceState !== "processing") {
    return;
  }

  state.sliceState = "ready";
  state.sliced = true;
  sliceTimer = null;
  renderWorkstationScene();

  if (state.scene !== "workstation") {
    if (state.scene === "room") {
      setObjective(getWorkshopReturnObjective());
    }
    return;
  }

  if (state.transfer.location === "bench-dock" && state.transfer.assembled && !state.transfer.separated && !state.transfer.loaded) {
    setObjective("benchExport");
    setDialogue("Slicing complete. The docked reader is ready, so you can export the file now.", "Bambu Lab");
    return;
  }

  if (state.transfer.location === "bench-dock" && state.transfer.separated) {
    setObjective("benchUndock");
  setDialogue("Slicing complete, but only the USB adapter is docked. Export needs an SD card inside the reader.", "Bambu Lab");
    return;
  }

  setObjective(hasTransferKitInInventory() ? "benchDock" : getWorkshopReturnObjective());
  setDialogue("Slicing complete. Export is available when writable media is connected to the laptop.", "Bambu Lab");
}

function openTrayScene() {
  showScene("tray");

  if (state.transfer.printStarted && hasUsbAdapterInInventory() && !state.transfer.returned) {
    setObjective("trayReturn");
    setDialogue("The print is running. Return the USB adapter to the tray to finish the tutorial.", "Guide");
    return;
  }

  if ((state.objective === "roomTrayReturn" || (state.transfer.loaded && hasUsbAdapterInInventory())) && !state.transfer.returned) {
    setObjective("trayReturn");
    setDialogue("This tray accepts the USB adapter. Drag the adapter here if you want to put it away.", "Guide");
    return;
  }

  if (state.transfer.returned) {
    setObjective(state.transfer.printStarted ? "complete" : "roomPrinter");
    setDialogue(state.transfer.printStarted
      ? "Tutorial complete. The print is running and the USB adapter is already back in the tray."
      : "The USB adapter is already back in the tray.", "Guide");
    return;
  }

  if (state.transfer.cardPicked && state.transfer.adapterPicked && !state.transfer.assembled) {
    setObjective("trayAssemble");
    setDialogue(OBJECTIVES.trayAssemble, "Guide");
    return;
  }

  if (hasTransferKitOnAssemblySurface()) {
    setObjective("trayAssemble");
    setDialogue("Drag the assembled SD Card + Reader out of the assembly surface to store it in inventory.", "Guide");
    return;
  }

  if (state.transfer.assembled) {
    setDialogue(state.transfer.loaded
      ? "The SD card reader is loaded. You can separate or reassemble it in your inventory."
      : "The SD card reader kit is assembled. You can separate or reassemble it in inventory when needed.", "Guide");
    return;
  }

  setObjective("trayCollect");
  setDialogue("Click to pick up the SD card and USB reader from the tray.", "Guide");
}

function pickTrayItem(kind) {
  if (kind === "card" && !state.transfer.cardPicked) {
    markGuideProgress();
    state.transfer.cardPicked = true;
    renderTrayScene();

    if (state.transfer.adapterPicked) {
      setObjective("trayAssemble");
      setDialogue("Both parts are ready. Slide the SD card into the side slot of the USB reader.", "Guide");
    } else {
      setDialogue("You picked up the SD card. Click the USB reader if you want that part too.", "Guide");
    }

    return;
  }

  if (kind === "adapter" && !state.transfer.adapterPicked) {
    markGuideProgress();
    state.transfer.adapterPicked = true;
    renderTrayScene();

    if (state.transfer.cardPicked) {
      setObjective("trayAssemble");
      setDialogue("Both parts are ready. Slide the SD card into the side slot of the USB reader.", "Guide");
    } else {
      setDialogue("You picked up the USB reader. Click the SD card if you want that part too.", "Guide");
    }
  }
}

function finishAssembly() {
  if (state.transfer.assembled) {
    return;
  }

  state.transfer.assembled = true;
  state.transfer.location = "assembly-surface";
  state.transfer.cardLocation = "converter";
  renderTrayScene();
  renderInventory();
  setDialogue("The SD card clicks into the USB reader. Drag the assembled reader out of this surface to store it in inventory.", "Guide");
}

function collectAssembledKitFromTray() {
  if (!hasTransferKitOnAssemblySurface()) {
    return;
  }

  state.transfer.location = "inventory";
  renderTrayScene();
  renderInventory();
  setObjective(getWorkshopReturnObjective());
  setDialogue("The SD Card + Reader is now in your inventory.", "Guide");
}

function dockKitAtBench() {
  if (!hasTransferKitInInventory()) {
    return;
  }

  state.transfer.location = "bench-dock";
  renderInventory();
  renderWorkstationScene();

  if (state.sliceState === "ready") {
    setObjective("benchExport");
    setDialogue("The USB reader is docked into the laptop base. Click Export to copy the file.", "Guide");
    return;
  }

  setObjective("slice");
  setDialogue(state.sliceState === "processing"
    ? "The USB reader is docked. Wait for slicing to finish before exporting."
    : "The USB reader is docked. No file can export until Bambu Lab has prepared one.", "Guide");
}

function dockAdapterAtBench() {
  if (!hasUsbAdapterInInventory()) {
    return;
  }

  state.transfer.location = "bench-dock";
  renderInventory();
  renderWorkstationScene();
  setObjective("benchUndock");
  setDialogue("The USB adapter is docked, but there is no SD card attached. Export is unavailable; drag the adapter out when you are done.", "Guide");
}

function exportSliceFile() {
  if (
    state.transfer.loaded ||
    state.transfer.separated ||
    state.transfer.location !== "bench-dock" ||
    !state.transfer.assembled ||
    state.sliceState !== "ready"
  ) {
    return;
  }

  state.transfer.loaded = true;
  renderWorkstationScene();
  setObjective("benchUndock");
  setDialogue("Export complete. Drag the loaded USB reader out of the laptop dock.", "Guide");
}

function undockReaderFromBench() {
  if (state.transfer.separated) {
    state.transfer.location = "inventory-adapter";
    renderInventory();
    renderWorkstationScene();
    setObjective(state.sliceState === "idle" ? "slice" : getWorkshopReturnObjective());
    setDialogue("The USB adapter is back in your inventory.", "Guide");
    return;
  }

  state.transfer.location = "inventory";
  renderInventory();
  renderWorkstationScene();
  setObjective(state.transfer.loaded ? "separateKit" : getWorkshopReturnObjective());
  setDialogue(state.transfer.loaded
    ? "The loaded reader is stored in your inventory. You can separate or reassemble the SD card and USB adapter there."
    : "The SD Card + Reader is back in your inventory.", "Guide");
}

function separateTransferKit() {
  if (!canSeparateTransferKit()) {
    return;
  }

  state.transfer.separated = true;
  state.transfer.location = "inventory-adapter";
  state.transfer.cardLocation = "inventory-card";
  renderInventory();
  renderWorkstationScene();
  renderTrayScene();
  renderPrinterScene();
  if (state.scene === "printer" && !state.transfer.printStarted) {
    setObjective("printerInsert");
  } else {
    setObjective(state.transfer.loaded ? "roomPrinter" : getWorkshopReturnObjective());
  }
  setDialogue(state.transfer.loaded
    ? "The loaded SD card and USB adapter are separated."
    : "The empty SD card and USB adapter are separated. You can reassemble them in inventory or test the empty card in the printer.", "Guide");
}

function reassembleTransferKit() {
  if (!canReassembleTransferKit()) {
    return;
  }

  state.transfer.separated = false;
  state.transfer.location = "inventory";
  state.transfer.cardLocation = "converter";
  renderInventory();
  renderWorkstationScene();
  renderTrayScene();
  renderPrinterScene();
  if (state.scene === "printer" && !state.transfer.printStarted) {
    setObjective("printerDock");
  } else {
    setObjective(getWorkshopReturnObjective());
  }
  setDialogue(state.transfer.loaded
    ? "The loaded SD card is back in the USB adapter. You can separate it again from inventory if needed."
    : "The empty SD card is back in the USB adapter. You can separate it again from inventory if needed.", "Guide");
}

function openPrinterScene() {
  showScene("printer");

  if (state.transfer.printStarted) {
    setObjective(state.transfer.returned ? "complete" : "roomTrayReturn");
    if (!isCompletionPopupPending()) {
      setDialogue(state.transfer.returned
        ? "Tutorial complete. The print is running and the adapter is back in the tray."
        : "The print is running. Good lab practice: return the USB adapter to the tray to finish the tutorial.", "Guide");
    }
    return;
  }

  if (hasSdCardInInventory() && !state.transfer.printStarted) {
    setObjective("printerInsert");
    setDialogue("Drag an SD card from your inventory into the vertical slot beside the printer screen.", "Guide");
    return;
  }

  if (state.transfer.location === "inventory" && !state.transfer.separated && !state.transfer.printStarted) {
    setObjective("printerDock");
    setDialogue("Separate the SD card from the USB adapter in your inventory before using the printer.", "Guide");
    return;
  }

  if (state.transfer.cardLocation === "printer-slot" && !state.transfer.printStarted) {
    setObjective(state.transfer.loaded ? "printerStart" : "printerNoFiles");
    setDialogue(state.transfer.loaded
      ? "The SD card is fully inside the printer. Tap the screen to start the print."
      : "The printer found no printable files. Tap the screen to eject the empty SD card.", "Guide");
    return;
  }

  setDialogue(HOTSPOTS.printers.info, HOTSPOTS.printers.label);
}

function dockKitAtPrinter() {
  setObjective("printerDock");
  setDialogue("Do not bring the whole reader to the printer. Separate the SD card in your inventory first.", "Guide");
}

function insertCardIntoPrinter() {
  state.transfer.cardLocation = "printer-slot";
  renderPrinterScene();
  renderInventory();
  setObjective(state.transfer.loaded ? "printerStart" : "printerNoFiles");
  setDialogue(state.transfer.loaded
    ? "The SD card slides fully into the printer slot. Use the screen to start the job."
    : "The SD card slides fully into the printer slot, but the printer shows no printable files. Tap the screen to eject it.", "Guide");
}

function ejectEmptySdCard() {
  if (state.objective !== "printerNoFiles" || state.transfer.loaded || state.transfer.cardLocation !== "printer-slot") {
    return;
  }

  state.transfer.cardLocation = "inventory-card";
  state.transfer.separated = true;
  renderInventory();
  renderPrinterScene();
  setObjective("printerInsert");
  setDialogue("The empty SD card is back in your inventory. Export a sliced file to the card before printing.", "Guide");
}

function startPrint() {
  if (state.objective === "printerNoFiles") {
    ejectEmptySdCard();
    return;
  }

  if (state.objective !== "printerStart") {
    return;
  }

  if (!state.transfer.loaded) {
    setObjective("printerNoFiles");
    setDialogue("The printer found no printable files. Tap the screen to eject the empty SD card.", "Guide");
    return;
  }

  state.transfer.printStarted = true;
  renderPrinterScene();
  renderInventory();

  if (state.transfer.returned) {
    setObjective("complete");
    markTutorialComplete("Print started and USB adapter returned. You completed the 3D printing room tutorial.");
    return;
  }

  setObjective("roomTrayReturn");
  setDialogue("The print has started. Good lab practice: return the USB adapter to the tray to finish the tutorial.", "Guide");
}

function finishTrayReturn() {
  state.transfer.location = "returned";
  state.transfer.returned = true;
  renderInventory();
  renderTrayScene();

  if (state.transfer.printStarted) {
    setObjective("complete");
    markTutorialComplete("Print started and USB adapter returned. You completed the 3D printing room tutorial.");
    return;
  }

  setObjective(getWorkshopReturnObjective());
  setDialogue("The USB adapter is back in the tray.", "Guide");
}

function canDragItem(item) {
  if (item === "id-card") {
    return state.inventory.includes("id-card");
  }

  if (item === "sd-card") {
    return state.scene === "tray" && state.transfer.cardPicked && !state.transfer.assembled;
  }

  if (item === "transfer-kit") {
    return hasTransferKitInInventory();
  }

  if (item === "assembled-transfer-kit") {
    return state.scene === "tray" && hasTransferKitOnAssemblySurface();
  }

  if (item === "loaded-sd-card") {
    return hasLoadedSdCardInInventory();
  }

  if (item === "empty-sd-card") {
    return hasEmptySdCardInInventory();
  }

  if (item === "usb-adapter") {
    return hasUsbAdapterInInventory();
  }

  if (item === "docked-transfer-kit") {
    return (
      state.scene === "workstation" &&
      state.transfer.location === "bench-dock"
    );
  }

  if (item === "printer-sd-card") {
    return false;
  }

  return false;
}

function canDropOnTarget(item, targetName) {
  return (
    (item === "id-card" && targetName === "door-reader" && state.objective === "door") ||
    (item === "sd-card" && targetName === "adapter-slot" && state.objective === "trayAssemble") ||
    (item === "transfer-kit" && targetName === "bench-dock" && state.scene === "workstation" && hasTransferKitInInventory()) ||
    (item === "usb-adapter" && targetName === "bench-dock" && hasUsbAdapterInInventory()) ||
    (item === "usb-adapter" && targetName === "tray-return-slot" && (state.objective === "trayReturn" || state.objective === "roomTrayReturn")) ||
    ((item === "loaded-sd-card" || item === "empty-sd-card") &&
      targetName === "printer-card-slot" &&
      state.scene === "printer" &&
      !state.transfer.printStarted &&
      state.transfer.cardLocation !== "printer-slot")
  );
}

function getDragMarkup(item) {
  if (item === "id-card") {
    return `
      <div class="drag-card drag-id-card">
        <span class="token-chip"></span>
        <span class="token-avatar"></span>
        <span class="token-line token-line-short"></span>
        <span class="token-line"></span>
      </div>
    `;
  }

  if (item === "sd-card" || item === "printer-sd-card" || item === "loaded-sd-card" || item === "empty-sd-card") {
    const stateClass = item === "loaded-sd-card" || (item === "printer-sd-card" && state.transfer.loaded)
      ? "state-loaded"
      : "state-empty";
    return `
      <div class="drag-card drag-sd-card ${stateClass}">
        <span class="card-contacts"></span>
        <span class="card-mark">SD</span>
      </div>
    `;
  }

  if (item === "transfer-kit" || item === "docked-transfer-kit" || item === "assembled-transfer-kit") {
    return `
      <div class="drag-card drag-transfer-kit">
        ${getTransferIconMarkup()}
      </div>
    `;
  }

  if (item === "usb-adapter") {
    return `
      <div class="drag-card drag-transfer-kit">
        <span class="combo-adapter-shape"></span>
      </div>
    `;
  }

  return "";
}

function startDrag(item, source, pointerId, clientX, clientY) {
  recordActivity();
  if (isElementRelevantToGuide(source, getStepGuide())) {
    armAttemptHint("drag-source");
  }

  state.dragging = {
    item,
    pointerId,
    source,
    activeTarget: null,
    invalidTarget: null,
  };

  source.classList.add("drag-origin");
  dragGhost.innerHTML = getDragMarkup(item);
  dragGhost.classList.remove("hidden");
  dragGhost.dataset.item = item;
  moveDragGhost(clientX, clientY);
  updateDropTarget(clientX, clientY);
}

function moveDragGhost(clientX, clientY) {
  dragGhost.style.left = `${clientX}px`;
  dragGhost.style.top = `${clientY}px`;
}

function clearDropHighlights() {
  dropTargets.forEach((target) => {
    target.classList.remove("drop-ready", "drop-invalid");
  });
}

function getDropTargetAt(clientX, clientY) {
  dragGhost.classList.add("drop-probe");
  const hovered = document.elementFromPoint(clientX, clientY)?.closest("[data-drop-target]");
  dragGhost.classList.remove("drop-probe");

  if (hovered) {
    return hovered;
  }

  const insertingSdCard =
    state.scene === "printer" &&
    !state.transfer.printStarted &&
    state.transfer.cardLocation !== "printer-slot" &&
    (state.dragging?.item === "loaded-sd-card" || state.dragging?.item === "empty-sd-card");

  if (insertingSdCard) {
    const rect = printerCardSlot.getBoundingClientRect();
    const expandedRect = {
      left: rect.left - 82,
      right: rect.right + 70,
      top: rect.top - 24,
      bottom: rect.bottom + 24,
    };

    if (
      clientX >= expandedRect.left &&
      clientX <= expandedRect.right &&
      clientY >= expandedRect.top &&
      clientY <= expandedRect.bottom
    ) {
      return printerCardSlot;
    }
  }

  return null;
}

function updateDropTarget(clientX, clientY) {
  if (!state.dragging) {
    return;
  }

  const hovered = getDropTargetAt(clientX, clientY);
  const targetName = hovered?.dataset.dropTarget ?? null;
  const nextTarget = hovered && canDropOnTarget(state.dragging.item, targetName) ? hovered : null;
  const nextInvalidTarget = hovered && !nextTarget ? hovered : null;

  if (state.dragging.activeTarget && state.dragging.activeTarget !== nextTarget) {
    state.dragging.activeTarget.classList.remove("drop-ready");
  }

  if (state.dragging.invalidTarget && state.dragging.invalidTarget !== nextInvalidTarget) {
    state.dragging.invalidTarget.classList.remove("drop-invalid");
  }

  state.dragging.activeTarget = nextTarget;
  state.dragging.invalidTarget = nextInvalidTarget;

  if (nextTarget) {
    nextTarget.classList.add("drop-ready");
    if (isElementRelevantToGuide(nextTarget, getStepGuide())) {
      armAttemptHint("drop-target");
    }
  }

  if (nextInvalidTarget) {
    nextInvalidTarget.classList.add("drop-invalid");
  }
}

function getInvalidDropMessage(item, targetName) {
  if (targetName === "door-reader") {
    return state.doorUnlocked
      ? "The door is already unlocked."
      : "Only your ID card can unlock this reader.";
  }

  if (targetName === "adapter-slot") {
    return "Only the loose SD card can slide into this reader slot.";
  }

  if (targetName === "bench-dock") {
    return "Only the USB adapter or SD card reader belongs in the dock on the side of the laptop base.";
  }

  if (targetName === "printer-kit-dock") {
    return "The whole reader does not go to the printer. Separate the SD card first.";
  }

  if (targetName === "printer-card-slot") {
    if (item === "transfer-kit") {
      return "Separate the SD card from the USB adapter before inserting it.";
    }

    return "Only an SD card goes into the printer slot beside the screen.";
  }

  if (targetName === "printer-converter-slot") {
    return "Leave the SD card in the printer after starting the print.";
  }

  if (targetName === "tray-return-slot") {
    if (item === "transfer-kit") {
      return "Separate the SD card first, then return only the USB adapter.";
    }

    return "Return only the USB adapter here.";
  }

  return "That item does not belong there.";
}

function endDrag(clientX, clientY) {
  if (!state.dragging) {
    return;
  }

  updateDropTarget(clientX, clientY);

  const { item, source, activeTarget, invalidTarget } = state.dragging;
  source.classList.remove("drag-origin");
  dragGhost.classList.add("hidden");
  dragGhost.innerHTML = "";
  delete dragGhost.dataset.item;

  if (item === "docked-transfer-kit") {
    const releasedOnDock = document.elementFromPoint(clientX, clientY)?.closest("#bench-dock, #bench-kit-preview");

    if (releasedOnDock) {
      setDialogue("Drag the USB reader away from the dock to pull it out.", "Guide");
      if (!state.activeHint) {
        showPostItHint("Pull the reader away from the dock, not back onto it.", benchKitPreview);
      }
    } else {
      markGuideProgress();
      flashElement(benchDock, "success-pop");
      undockReaderFromBench();
    }

    clearDropHighlights();
    state.dragging = null;
    return;
  }

  if (item === "assembled-transfer-kit") {
    const releasedOnAssembly = document.elementFromPoint(clientX, clientY)?.closest("#assembly-adapter, #adapter-slot, #assembly-zone");

    if (releasedOnAssembly) {
      setDialogue("Drag the assembled reader away from the assembly surface to store it in inventory.", "Guide");
      if (!state.activeHint) {
        showPostItHint("Move it away from the tray surface to store it.", assemblyAdapter);
      }
    } else {
      markGuideProgress();
      flashElement(assemblyAdapter, "success-pop");
      collectAssembledKitFromTray();
    }

    clearDropHighlights();
    state.dragging = null;
    return;
  }

  if (activeTarget) {
    const targetName = activeTarget.dataset.dropTarget;
    markGuideProgress();
    flashElement(activeTarget, "success-pop");

    if (targetName === "door-reader" && item === "id-card") {
      unlockDoor();
    } else if (targetName === "adapter-slot" && item === "sd-card") {
      finishAssembly();
    } else if (targetName === "bench-dock" && item === "transfer-kit") {
      dockKitAtBench();
    } else if (targetName === "bench-dock" && item === "usb-adapter") {
      dockAdapterAtBench();
    } else if (targetName === "printer-card-slot" && (item === "loaded-sd-card" || item === "empty-sd-card")) {
      insertCardIntoPrinter();
    } else if (targetName === "tray-return-slot" && item === "usb-adapter") {
      finishTrayReturn();
    }
  } else if (invalidTarget) {
    const message = getInvalidDropMessage(item, invalidTarget.dataset.dropTarget);
    flashElement(invalidTarget, "error-pop");
    if (!state.activeHint) {
      showPostItHint(message, invalidTarget);
    }
    setDialogue(message, "System");
  }

  clearDropHighlights();
  state.dragging = null;
}

document.addEventListener("pointerdown", (event) => {
  recordActivity();
  if (isElementRelevantToGuide(event.target, getStepGuide())) {
    armAttemptHint("pointer-target");
  } else if (
    event.target.closest("#workstation-action") &&
    state.scene === "workstation" &&
    (canReassembleTransferKit() || (state.transfer.location === "bench-dock" && state.transfer.separated))
  ) {
    armAttemptHint("blocked-workstation-action");
  }

  const source = event.target.closest("[data-drag-item]");
  if (!source) {
    return;
  }

  const item = source.dataset.dragItem;
  if (!canDragItem(item)) {
    return;
  }

  event.preventDefault();
  startDrag(item, source, event.pointerId, event.clientX, event.clientY);
});

document.addEventListener("pointermove", (event) => {
  if (updateModelInspection(event)) {
    return;
  }

  recordActivity();
  if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
    return;
  }

  event.preventDefault();
  moveDragGhost(event.clientX, event.clientY);
  updateDropTarget(event.clientX, event.clientY);
});

document.addEventListener("pointerup", (event) => {
  if (endModelInspection(event)) {
    return;
  }

  recordActivity();
  if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
    return;
  }

  event.preventDefault();
  endDrag(event.clientX, event.clientY);
});

document.addEventListener("pointercancel", (event) => {
  if (endModelInspection(event)) {
    return;
  }

  recordActivity();
  if (!state.dragging || state.dragging.pointerId !== event.pointerId) {
    return;
  }

  endDrag(event.clientX, event.clientY);
});

document.addEventListener("keydown", (event) => {
  recordActivity();
  if (event.key !== "Escape") {
    return;
  }

  if (!state.doorUnlocked || state.scene === "tutorial" || state.scene === "door") {
    return;
  }

  event.preventDefault();
  returnToWorkshopRoom();
});

document.addEventListener("click", (event) => {
  if (state.dragging) {
    return;
  }

  if (event.target.closest(".utility-cluster, .settings-panel, .post-it-hint, .manual-hint-panel")) {
    return;
  }

    if (event.target.closest("#completion-popup")) {
      return;
    }

    if (completionPopupPending && !completionPopupShown && !dialogueTimer) {
      event.preventDefault();
    event.stopImmediatePropagation();
    showCompletionPopup();
    return;
  }

  if (event.target.closest("[data-inventory-action]")) {
    return;
  }

  if (event.target.closest("#model-inspector")) {
    return;
  }

  if (dialogueTimer) {
    event.preventDefault();
    event.stopImmediatePropagation();
    finishTyping();
    return;
  }

  if (!dialoguePendingAction) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  advanceDialogue();
}, true);

inventory.addEventListener("click", (event) => {
  const action = event.target.closest("[data-inventory-action]");
  if (!action) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (action.dataset.inventoryAction === "separate-transfer") {
    separateTransferKit();
  } else if (action.dataset.inventoryAction === "reassemble-transfer") {
    reassembleTransferKit();
  }
});

hintButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  showHint({ manual: true });
});

settingsButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const willOpen = settingsPanel.classList.contains("hidden");
  settingsPanel.classList.toggle("hidden", !willOpen);
  settingsButton.setAttribute("aria-expanded", String(willOpen));
});

themeChoiceButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    persistTheme(button.dataset.themeChoice);
  });
});

document.addEventListener("click", (event) => {
  if (settingsPanel.classList.contains("hidden")) {
    return;
  }

  if (event.target.closest(".settings-panel, .settings-button")) {
    return;
  }

  settingsPanel.classList.add("hidden");
  settingsButton.setAttribute("aria-expanded", "false");
});

hotspotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    handleHotspot(button.dataset.hotspot);
  });
});

tutorialStart.addEventListener("click", () => {
  if (tutorialReturnScene) {
    closeInstructionReview();
    return;
  }

  startLevelOne();
});

helpButton.addEventListener("click", openInstructionReview);
returnButton.addEventListener("click", returnToWorkshopRoom);
modelInspector.addEventListener("pointerdown", startModelInspection);
modelInspector.addEventListener("wheel", handleModelWheel, { passive: false });
modelInspector.addEventListener("keydown", handleModelZoomKey);
modelInspector.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
});
modelZoomOutButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  adjustModelZoom(-MODEL_ZOOM_STEP);
});
modelZoomInButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  adjustModelZoom(MODEL_ZOOM_STEP);
});
window.addEventListener("resize", renderModelPreview);

workstationAction.addEventListener("click", () => {
  if (state.sliceState === "idle") {
    flashElement(workstationAction, "success-pop");
    completeSlice();
  } else if (!workstationAction.disabled && workstationAction.textContent === "Export") {
    flashElement(workstationAction, "success-pop");
    exportSliceFile();
  }
});

pickupCardButton.addEventListener("click", () => {
  flashElement(pickupCardButton, "success-pop");
  pickTrayItem("card");
});

pickupAdapterButton.addEventListener("click", () => {
  flashElement(pickupAdapterButton, "success-pop");
  pickTrayItem("adapter");
});

printerScreen.addEventListener("click", () => {
  if (!printerScreen.disabled) {
    flashElement(printerScreen, "success-pop");
  }
  startPrint();
});
completionContinue.addEventListener("click", hideCompletionPopup);

applyTheme(getInitialTheme());
updateModelZoomControls();
applyModelRotation();
renderInventory();
renderTrayScene();
renderWorkstationScene();
renderPrinterScene();
tutorialStart.textContent = state.level1Complete ? "Replay Simulation" : "Start Simulation";
setObjective("tutorial");
showScene("tutorial");
setDialogue("Read the workflow, then click Start Simulation to begin the guided lab workflow.", "Guide");
