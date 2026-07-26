"use strict";

/** Live app URL (GitHub Pages) — used in chart export footers */
const APP_SHARE_URL = "fishese.github.io/period-tracker/period-tracker";

// Import modular utilities
import { toISO, fromISO, addDays, diffDays, today } from "./dateUtils.js";
import { deriveKey, encryptData, decryptData, hashPin } from "./crypto.js";
import {
  resetSessionTimer,
  startCountdown,
  hideBanner,
  setLockApp,
} from "./session.js";
import {
  normalizeFlowLevel,
  getFlowLevelFromLog,
  applyFlowLevelToLog,
  normalizePainValue,
  getPainValueFromLog,
  normalizeMoodValue,
  getMoodValueFromLog,
  sanitize,
  safeText,
} from "./validators.js";
import {
  getCycleInfo,
  calculatePredictions,
  getDayType,
  getStatisticalCycleData,
  getOverallStatisticalCycleData,
  getRollingStatisticalCycleData,
  getShiftedCycles,
  getMostRecentShift,
  getRollingSpreadInfo,
  recalculateCycleLength,
  recalculatePeriodDuration,
  getPredictionPeriodDuration,
  isPeriodEpisodeActive,
  setState as setCyclesState,
} from "./cycles.js";
import { initKeyboardNavigation, setNavigationState } from "./navigation.js";
import { t, tp, applyI18n, setLanguage, getLanguage, getSupportedLanguages } from "./i18n.js";
import {
  cleanupEmptyLogs,
  isSameMenses,
  setState as setPeriodMarkingState,
} from "./periodMarking.js";
import { buildDripCsv } from "./export-drip.js";
import { buildCycleHistoryFromLogs, parseDripCsv } from "./import-drip.js";
import {
  isDriveConfigured,
  isDriveConnected,
  isDriveAutoBackupEnabled,
  setDriveAutoBackup,
  getDriveLastSyncTime,
  startDriveConnect,
  disconnectDrive,
  handleDriveOAuthReturn,
  completePendingDriveOAuth,
  hasPendingDriveOAuthExchange,
  consumeDriveOAuthError,
  getDriveOAuthErrorKey,
  getDriveOAuthErrorDetail,
  consumeDriveShowConnectedToast,
  consumeDrivePendingRestore,
  downloadDriveBackup,
  uploadDriveBackup,
  scheduleDriveBackupUpload,
  cancelScheduledDriveBackupUpload,
  wireDriveDb,
} from "./drive-sync.js";

const STORE_KEY = "mycyclekeeper_enc_v1"; // encrypted blob
const SALT_KEY = "mycyclekeeper_salt_v1"; // random salt (not secret)
const PINHASH_KEY = "mycyclekeeper_ph_v1"; // HMAC of PIN for fast wrong-PIN detection
const BACKUP_KEY = "mycyclekeeper_lastbackup_v1"; // ISO date of last export
const THEME_KEY = "mycyclekeeper_theme"; // UI-only preference, not sensitive
const SCHEMA_VERSION = 1; // bump when state shape changes

const VALID_THEMES = ["default", "light", "dark", "kawaii"];

function setTheme(name) {
  const t = VALID_THEMES.includes(name) ? name : "default";
  if (t === "default") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = t;
  }
  try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
  // Sync the radio buttons (called programmatically as well as from onclick)
  document.querySelectorAll('input[name="theme"]').forEach(r => {
    r.checked = r.value === t;
  });
}

function loadTheme() {
  let saved = "dark";
  try { saved = localStorage.getItem(THEME_KEY) || "dark"; } catch (_) {}
  setTheme(saved);
}

// The old deriveKey, encryptData, decryptData, hashPin functions are now imported from crypto.js

async function getOrCreateSalt() {
  try {
    let s = await getFromDB(SALT_KEY);
    if (s) {
      if (typeof s !== "string") {
        throw new Error("salt_corrupted: expected string");
      }
      return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoded = btoa(String.fromCharCode(...salt));
    await setInDB(SALT_KEY, encoded);
    return salt;
  } catch (error) {
    console.error("🚨 Error in getOrCreateSalt:", error);
    showModal({
      icon: "⚠️",
      title: t("storage_error_title"),
      msg: t("storage_error_msg"),
      confirmText: t("ok"),
    });
    throw error;
  }
}

let state = {
  lastPeriodStart: null,
  cycleLength: 28,
  periodDuration: 5,
  toleranceDays: null,
  autoFillDays: null,
  showFertility: false,
  showCyclePhases: true,
  logs: {},
  cycleHistory: [],
};

function isFertilityVisible() {
  return state.showFertility === true;
}

function isCyclePhaseTimelineVisible() {
  return state.showCyclePhases !== false;
}

// Initialize modular state references
setCyclesState(state);
setPeriodMarkingState(state);

// Apply saved theme immediately so there's no flash of default colours
loadTheme();

let sessionPin = null; // PIN held only in JS memory (never persisted)
let viewMonth = new Date();
let selectedDate = null;
let currentTab = "calendar";
let backupReminderShownThisSession = false;
let serviceWorkerReloadPending = false;
let serviceWorkerReloading = false;
let serviceWorkerReloadDeadlineTimer = null;
const SERVICE_WORKER_RELOAD_MAX_DELAY_MS = 5 * 60 * 1000;

// Reset on any user interaction (deferred until DOM ready)
function bindTap(el, handler) {
  if (!el || typeof handler !== "function") return;
  let lastRun = 0;
  const run = (e) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastRun < 500) return;
    lastRun = now;
    handler(e);
  };
  el.addEventListener("touchend", run, { passive: false });
  el.addEventListener("click", run);
}

function setupEventListeners() {
  ["touchstart", "touchend", "click", "keydown", "mousemove", "scroll"].forEach(
    (ev) =>
      document.addEventListener(
        ev,
        () => {
          if (sessionPin) resetSessionTimer();
        },
        { passive: true }
      )
  );
  const bannerEl = document.getElementById("timeout-banner");
  if (bannerEl) {
    bannerEl.addEventListener("click", () => {
      hideBanner();
      resetSessionTimer();
    });
  }

  // Add explicit touch handlers for mobile nav buttons (fixes iOS/mobile touch issues)
  const navButtons = document.querySelectorAll(".bnav-item");
  navButtons.forEach((btn) => {
    btn.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        const tab = btn.id.replace("bnav-", "");
        if (["calendar", "insights", "settings", "about", "support"].includes(tab)) {
          switchTab(tab);
        }
      },
      { passive: false }
    );
  });

  bindTap(document.getElementById("btn-drive-connect"), connectGoogleDrive);
  bindTap(document.getElementById("btn-drive-sync"), syncGoogleDriveNow);
  bindTap(document.getElementById("btn-drive-disconnect"), disconnectGoogleDrive);
}

function showToast(msg, duration = 2500) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), duration);
}

function _ensureModalBox() {
  if (!document.getElementById("modal-confirm")) {
    _restoreModalBox();
  }
}

function closeAppModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("visible");
  _clearImportPinContext();
  _ensureModalBox();
}

function showModal({
  icon = "⚠️",
  title = "",
  msg = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
} = {}) {
  _ensureModalBox();
  const iconEl = document.getElementById("modal-icon");
  const titleEl = document.getElementById("modal-title");
  const msgEl = document.getElementById("modal-msg");
  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");
  if (!iconEl || !titleEl || !msgEl || !confirmBtn || !cancelBtn) return;

  iconEl.textContent = icon;
  titleEl.textContent = title;
  msgEl.textContent = msg;
  confirmBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText || "";
  cancelBtn.style.display = cancelText ? "" : "none";
  const overlay = document.getElementById("modal-overlay");
  overlay.classList.add("visible");
  confirmBtn.onclick = () => {
    overlay.classList.remove("visible");
    onConfirm && onConfirm();
  };
  cancelBtn.onclick = () => {
    overlay.classList.remove("visible");
    onCancel && onCancel();
  };

  // Move focus into modal immediately (accessibility standard)
  setTimeout(() => {
    const focusTarget = cancelText ? cancelBtn : confirmBtn;
    if (focusTarget) {
      focusTarget.focus();
    }
  }, 0);
}

let pinBuffer = "";
let unlockInProgress = false;
let pinAttempts = 0;
let pinLockUntil = 0; // timestamp: locked until this ms (brute-force delay)
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60000; // 60-second lockout after 5 failed attempts

function updatePinDots(buf, prefix = "d") {
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(prefix + i);
    if (!el) return;
    el.classList.toggle("filled", i < buf.length);
  }
}

async function pinInput(digit) {
  if (unlockInProgress) return;
  if (pinBuffer.length >= 4) return;
  pinBuffer += digit;
  updatePinDots(pinBuffer);
  if (pinBuffer.length === 4) await submitPin();
}

function pinDelete() {
  if (unlockInProgress) return;
  pinBuffer = pinBuffer.slice(0, -1);
  updatePinDots(pinBuffer);
  document.getElementById("lock-error").textContent = "";
}

async function submitPin() {
  if (unlockInProgress) return;
  unlockInProgress = true;
  const pin = pinBuffer;
  pinBuffer = "";
  updatePinDots("");

  // Brute-force time-delay: refuse entry while locked out
  if (pinLockUntil && Date.now() < pinLockUntil) {
    const secsLeft = Math.ceil((pinLockUntil - Date.now()) / 1000);
    document.getElementById(
      "lock-error"
    ).textContent = t("too_many_attempts", { secs: secsLeft });
    unlockInProgress = false;
    return;
  }

  try {
    const salt = await getOrCreateSalt();
    const storedHash = await getFromDB(PINHASH_KEY);
    const attemptHash = await hashPin(pin, salt);

    if (attemptHash !== storedHash) {
      pinAttempts++;
      const remaining = MAX_ATTEMPTS - pinAttempts;
      const dots = document.querySelectorAll("#pin-dots .pin-dot");
      dots.forEach((d) => {
        d.classList.add("error");
        setTimeout(() => d.classList.remove("error"), 500);
      });
      if (remaining <= 0) {
        pinLockUntil = Date.now() + LOCKOUT_MS;
        document.getElementById("lock-error").textContent =
          t("locked_out");
        setTimeout(() => {
          // After lockout period: reset and allow retry without erasing
          pinAttempts = 0;
          pinLockUntil = 0;
          document.getElementById("lock-error").textContent =
            t("lockout_ended");
        }, LOCKOUT_MS);
      } else {
        document.getElementById(
          "lock-error"
        ).textContent = tp("incorrect_pin", remaining, { remaining });
      }
      return;
    }

    // PIN correct — decrypt data
    const blob = await getFromDB(STORE_KEY);
    if (blob) {
      try {
        state = await decryptData(blob, pin, salt);
        // Default fields added in later versions (migration from older saves)
        state.autoFillDays = state.autoFillDays ?? null;
        state.showCyclePhases = state.showCyclePhases ?? true;
        // Re-initialize module state references after loading encrypted data
        setCyclesState(state);
        setPeriodMarkingState(state);
        if (state.cycleHistory?.length) {
          recalculateCycleLength(state.cycleHistory);
        }
        recalculatePeriodDuration();
      } catch {
        document.getElementById("lock-error").textContent =
          t("decryption_failed");
        return;
      }
    }
    pinAttempts = 0;
    sessionPin = pin;
    document.getElementById("lock-screen").classList.add("hidden");
    document.getElementById("app").style.display = "block";
    document.getElementById("bottom-nav").style.display = "flex";
    resetSessionTimer();
    viewMonth = new Date();
    updateStatusCard();
    renderCalendar();
    switchTab("calendar");
    updateInsights(); // Populate insights for desktop view
    loadSettingsFields();
    await completePendingDriveOAuth();
    await maybeCompleteDriveConnectFlow();
    await maybeShowDriveOAuthError();
  } catch (error) {
    console.error("🚨 PIN submission error:", error);
    document.getElementById("lock-error").textContent =
      t("error_try_again");
  } finally {
    unlockInProgress = false;
  }
}

function lockApp() {
  sessionPin = null;
  clearTimeout(serviceWorkerReloadDeadlineTimer);
  serviceWorkerReloadDeadlineTimer = null;
  state = {
    lastPeriodStart: null,
    cycleLength: 28,
    periodDuration: 5,
    toleranceDays: null,
    autoFillDays: null,
    showFertility: false,
    showCyclePhases: true,
    logs: {},
    cycleHistory: [],
  };
  setCyclesState(state);
  setPeriodMarkingState(state);
  hideBanner();
  document.getElementById("app").style.display = "none";
  document.getElementById("bottom-nav").style.display = "none";
  document.getElementById("lock-screen").classList.remove("hidden");
  const logModal = document.getElementById("log-modal-overlay");
  if (logModal) logModal.classList.remove("visible");
  document.getElementById("history-fullpage-overlay")?.remove();
  document.body.style.overflow = "";
  document.getElementById("print-options-overlay")?.classList.remove("visible");
  document.getElementById("print-summary")?.replaceChildren();
  closeAppModal();
  pinBuffer = "";
  updatePinDots("");
  document.getElementById("lock-error").textContent = "";

  // Lock and clear sensitive UI first. If navigation is blocked for any
  // reason, the app must remain securely locked rather than fail open.
  if (serviceWorkerReloadPending && !serviceWorkerReloading) {
    serviceWorkerReloading = true;
    window.location.reload();
  }
}

// Initialize session module with lockApp function
setLockApp(lockApp);

async function forgotPinFlow() {
  showModal({
    icon: "⚠️",
    title: t("forgot_pin_title"),
    msg: t("forgot_pin_msg"),
    confirmText: t("forgot_pin_confirm"),
    cancelText: t("cancel"),
    onConfirm: () => {
      // Second confirmation step
      showModal({
        icon: "⚠️",
        title: t("forgot_pin_confirm2_title"),
        msg: t("forgot_pin_confirm2_msg"),
        confirmText: t("forgot_pin_confirm2_btn"),
        cancelText: t("cancel"),
        onConfirm: async () => {
          try {
            await _executeForgotPinReset();
          } catch (error) {
            console.error("🚨 Reset error:", error);
            showModal({
              icon: "⚠️",
              title: t("reset_failed_title"),
              msg: t("reset_failed_msg"),
              confirmText: t("ok"),
            });
          }
        },
      });
    },
  });
}

async function _executeForgotPinReset() {
  try {
    await clearDB();
    sessionStorage.clear();
    state = {
      lastPeriodStart: null,
      cycleLength: 28,
      periodDuration: 5,
      toleranceDays: null,
      autoFillDays: null,
      showFertility: false,
      showCyclePhases: true,
      logs: {},
      cycleHistory: [],
    };
    // Re-initialize module state references after creating new state
    setCyclesState(state);
    setPeriodMarkingState(state);
    pinAttempts = 0;
    pinLockUntil = 0;
    sessionPin = null;
    document.getElementById("lock-screen").classList.add("hidden");
    document.getElementById("onboarding").classList.remove("hidden");
    document.getElementById("app").style.display = "none";
    document.getElementById("bottom-nav").style.display = "none";
    document.getElementById("lock-error").textContent = "";
    showModal({
      icon: "✅",
      title: t("reset_complete_title"),
      msg: t("reset_complete_msg"),
      cancelText: "",
      confirmText: t("ok"),
    });
  } catch (error) {
    console.error("🚨 Reset error:", error);
    showModal({
      icon: "⚠️",
      title: t("reset_failed_title"),
      msg: t("reset_failed_msg"),
      confirmText: t("ok"),
    });
  }
}

async function save() {
  if (!sessionPin) return;
  try {
    const salt = await getOrCreateSalt();
    const enc = await encryptData(state, sessionPin, salt);
    try {
      await setInDB(STORE_KEY, enc);
    } catch (e) {
      if (
        e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOMQuota_REACHED" ||
        /quota/i.test(e.message || "")
      ) {
        showModal({
          icon: "⚠️",
          title: t("storage_full_title"),
          msg: t("storage_full_msg"),
          confirmText: t("ok"),
        });
        return;
      }
      throw e;
    }
  } catch (error) {
    console.error("🚨 Save error:", error);
    const detail = error?.message ? `\n\n(${error.message})` : "";
    showModal({
      icon: "⚠️",
      title: t("save_failed_title"),
      msg: t("save_failed_msg") + detail,
      confirmText: t("ok"),
    });
    return;
  }

  // Never let Drive backup scheduling fail a successful local save
  try {
    if (await isDriveAutoBackupEnabled()) {
      scheduleDriveBackupUpload(() => performDriveBackupUpload(false));
    }
  } catch (err) {
    console.warn("[Drive backup] schedule check failed:", err);
  }
}

function formatDateLocale(dateOrIso) {
  const d =
    typeof dateOrIso === "string" ? fromISO(dateOrIso) : dateOrIso;
  return d.toLocaleDateString(getLanguage(), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function rebuildCycleHistoryFromLogs() {
  const { cycleHistory, lastPeriodStart } = buildCycleHistoryFromLogs(
    state.logs,
    state.cycleLength || 28
  );
  state.cycleHistory = cycleHistory;
  state.lastPeriodStart = lastPeriodStart;
  if (cycleHistory.length) {
    recalculateCycleLength(state.cycleHistory);
    recalculatePeriodDuration();
  }
}

let setupPin = "";

function setupPinInput(digit) {
  if (setupPin.length >= 4) return;
  setupPin += digit;
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("sp" + i);
    if (el) el.classList.toggle("filled", i < setupPin.length);
  }
  if (setupPin.length === 4) {
    document.getElementById("onboard-continue-btn").disabled = false;
  }
}

function setupPinDelete() {
  setupPin = setupPin.slice(0, -1);
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("sp" + i);
    if (el) el.classList.toggle("filled", i < setupPin.length);
  }
  document.getElementById("onboard-continue-btn").disabled = true;
}

function proceedToOnboardSetup() {
  if (setupPin.length < 4) {
    showModal({
      icon: "🔢",
      title: t("set_pin_title"),
      msg: t("set_pin_msg"),
      cancelText: "",
      confirmText: t("ok"),
    });
    return;
  }
  sessionPin = setupPin;
  const overlay = document.getElementById("onboard-setup-overlay");
  if (overlay) {
    overlay.classList.remove("hidden");
    document.getElementById("onboarding")?.scrollTo({ top: 0, behavior: "smooth" });
    const firstField = document.getElementById("ob-last-period");
    if (firstField) setTimeout(() => firstField.focus(), 300);
  }
}

function backToOnboardPin() {
  document.getElementById("onboard-setup-overlay")?.classList.add("hidden");
}

async function finishOnboarding() {
  document.getElementById("onboard-setup-overlay")?.classList.add("hidden");
  document.getElementById("onboarding").classList.add("hidden");
  document.getElementById("lock-screen").classList.add("hidden");
  document.getElementById("app").style.display = "block";
  document.getElementById("bottom-nav").style.display = "flex";
  resetSessionTimer();
  viewMonth = new Date();
  updateStatusCard();
  renderCalendar();
  updateInsights();
  switchTab("calendar");
}

async function startApp() {
  if (setupPin.length < 4) {
    showModal({
      icon: "🔢",
      title: t("set_pin_title"),
      msg: t("set_pin_msg"),
      cancelText: "",
      confirmText: t("ok"),
    });
    return;
  }

  try {
    sessionPin = setupPin;

    const lp = document.getElementById("ob-last-period")?.value;
    const cl = parseInt(document.getElementById("ob-cycle-len")?.value);
    const pd = parseInt(document.getElementById("ob-period-dur")?.value);

    if (lp) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lp)) {
        showModal({
          icon: "📅",
          title: t("invalid_date_title"),
          msg: t("invalid_date_msg"),
          cancelText: "",
          confirmText: t("ok"),
        });
        return;
      }
      if (cl < 20 || cl > 45) {
        showModal({
          icon: "⚠️",
          title: t("invalid_cycle_title"),
          msg: t("invalid_cycle_msg"),
          cancelText: "",
          confirmText: t("ok"),
        });
        return;
      }
      if (pd < 1 || pd > 10) {
        showModal({
          icon: "⚠️",
          title: t("invalid_duration_title"),
          msg: t("invalid_duration_msg"),
          cancelText: "",
          confirmText: t("ok"),
        });
        return;
      }
      state.lastPeriodStart = lp;
      state.cycleLength = cl || 28;
      state.periodDuration = pd || 5;
      state.cycleHistory = [{ start: lp, length: cl || 28 }];
    }

    const salt = await getOrCreateSalt();
    const pinHash = await hashPin(setupPin, salt);
    await setInDB(PINHASH_KEY, pinHash);
    await save();

    await finishOnboarding();
  } catch (error) {
    console.error("🚨 App startup error:", error);
    showModal({
      icon: "⚠️",
      title: t("setup_error_title"),
      msg: t("setup_error_msg"),
      confirmText: t("ok"),
    });
  }
}

// Date utility functions are now imported from dateUtils.js

// Cycle functions are now imported from cycles.js
// They were: getCycleInfo, calculatePredictions, getDayType, isPredictedFuturePeriod

// Validator functions are now imported from validators.js
// They were: sanitize, safeText

function updateNoteCount() {
  const ta = document.getElementById("log-note");
  const el = document.getElementById("note-limit");
  if (ta && el) el.textContent = t("note_count", { count: ta.value.length });
}

let currentFlowValue = 1;
let currentFlowSet = false;
let currentFlowEstimated = false;
let currentMoodValue = 50;
let currentMoodSet = false;
let currentPainValue = 5;
let currentPainSet = false;

// Tracks which dates already had auto-fill applied this session to prevent double-fill
// when both autoSaveSymptomSelection and saveLog run for the same date.
const autoFillDatesThisSession = new Set();

function getAutoFillDayCount() {
  if (state.autoFillDays === 0) return 0;
  if (state.autoFillDays != null && state.autoFillDays > 0) {
    return state.autoFillDays;
  }
  return getPredictionPeriodDuration();
}

// Reads the "This is a new period, not a continuation" checkbox in the log
// panel — lets a user manually split a period the gap-tolerance heuristic
// would otherwise group with a recent one (e.g. spotting a few days before
// the real flow starts).
function getForceNewCycleFlag() {
  const cb = document.getElementById("log-force-new-cycle");
  return !!(cb && cb.checked);
}

// Fills the next N days with light flow when a brand-new period starts.
function applyAutoFill(dateStr, flow, forceNewCycle = false) {
  if (!flow) return false;
  const fillDays = getAutoFillDayCount();
  if (fillDays <= 0) return false;
  if (autoFillDatesThisSession.has(dateStr)) return false;
  if (!forceNewCycle && isSameMenses(dateStr)) return false;
  const start = fromISO(dateStr);
  for (let i = 1; i <= fillDays; i++) {
    const next = toISO(addDays(start, i));
    if (!state.logs[next]?.flow) {
      state.logs[next] = {
        ...(state.logs[next] || {}),
        flow: 1,
        flowEstimated: true,
      };
    }
  }
  autoFillDatesThisSession.add(dateStr);
  return true;
}

async function autoSaveSymptomSelection() {
  if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) return;

  const noteEl = document.getElementById("log-note");
  const rawNote = noteEl ? noteEl.value : "";
  const previousLog = state.logs[selectedDate] || {};
  const hadFlow = !!previousLog.flow;
  const log = {};

  const forceNewCycle = getForceNewCycleFlag();

  if (currentFlowSet) {
    applyFlowLevelToLog(log, currentFlowValue);
    if (currentFlowEstimated && log.flow) log.flowEstimated = true;
    if (log.flow) {
      updateCycleHistory(selectedDate, forceNewCycle);
      recalculatePeriodDuration();
    }
  }

  if (currentPainSet) {
    log.pain = normalizePainValue(currentPainValue, 5);
  }

  if (currentMoodSet) {
    log.mood = normalizeMoodValue(currentMoodValue, 50);
  }

  log.note = rawNote.slice(0, 500).replace(/[<>]/g, "");

  state.logs[selectedDate] = log;
  const didAutoFill =
    !hadFlow && currentFlowSet && log.flow
      ? applyAutoFill(selectedDate, log.flow, forceNewCycle)
      : false;
  cleanupEmptyLogs();
  if (hadFlow && !log.flow) {
    rebuildCycleHistoryFromLogs();
    recalculatePeriodDuration();
  }
  await save();
  renderCalendar();
  updateStatusCard();
  updateInsights();
  updateLogEditorUI();
  if (didAutoFill) {
    try { showAutoFillBanner(getAutoFillDayCount()); } catch (_) {}
  }
}

// ── Autosave note debounce ──────────────────────────────────────────────
let _noteSaveTimer = null;
function scheduleAutoSaveNote() {
  // Show "saving…" feel
  const indicator = document.getElementById("autosave-indicator");
  if (indicator) {
    indicator.textContent = t("log_saving");
    indicator.classList.add("visible");
  }
  clearTimeout(_noteSaveTimer);
  _noteSaveTimer = setTimeout(async () => {
    await autoSaveSymptomSelection();
    showAutosaveIndicator();
  }, 800);
}

function showAutosaveIndicator() {
  const indicator = document.getElementById("autosave-indicator");
  if (!indicator) return;
  indicator.textContent = t("log_saved");
  indicator.classList.add("visible");
}

async function resetLogWithConfirm() {
  // Two-tap confirmation: first click shows confirm state, second click resets
  const btn = document.getElementById("log-reset-btn");
  if (!btn) return;

  if (btn.dataset.confirming === "true") {
    // Second tap — actually reset
    btn.dataset.confirming = "false";
    btn.textContent = "\u21ba Reset day";
    btn.classList.remove("confirming");
    clearTimeout(btn._confirmTimer);
    await deleteLog();
    showAutosaveIndicator();
  } else {
    // First tap — ask for confirmation
    btn.dataset.confirming = "true";
    btn.textContent = "Tap again to reset";
    btn.classList.add("confirming");
    btn._confirmTimer = setTimeout(() => {
      btn.dataset.confirming = "false";
      btn.textContent = "\u21ba Reset day";
      btn.classList.remove("confirming");
    }, 3000);
  }
}

function deleteLogWithConfirm() {
  if (!state.logs[selectedDate]) return;
  showModal({
    icon: "\uD83D\uDDD1\uFE0F",
    title: t("log_delete_title"),
    msg: t("log_delete_message"),
    cancelText: t("cancel"),
    confirmText: t("log_delete_entry"),
    onConfirm: async () => {
      await deleteLog();
      updateLogEditorUI();
      showToast(t("log_entry_deleted"));
    },
  });
}

async function deleteLog() {
  if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) return;

  // Remove the log entry
  delete state.logs[selectedDate];

  // Clear the UI
  currentFlowSet = false;
  currentFlowEstimated = false;
  currentPainSet = false;
  currentMoodSet = false;
  updateFlowButtonVisual(1, false);
  updatePainButtonVisual(5, false);
  updateMoodButtonVisual(50, false);

  const noteEl = document.getElementById("log-note");
  if (noteEl) noteEl.value = "";
  updateNoteCount();

  // Rebuild cycle history from remaining flow logs
  rebuildCycleHistoryFromLogs();

  // Save and refresh
  await save();
  renderCalendar();
  updateStatusCard();
  updateInsights();
}

function toggleLogSection(sectionName) {
  document.querySelectorAll(".log-section").forEach((section) => {
    const isTarget = section.id === `log-section-${sectionName}`;
    section.classList.toggle("open", isTarget);
    const toggle = section.querySelector(".log-section-toggle");
    const panel = section.querySelector(".log-section-panel");
    const chevron = section.querySelector(".log-section-chevron");
    if (toggle) toggle.setAttribute("aria-expanded", String(isTarget));
    if (panel) panel.hidden = !isTarget;
    if (chevron) chevron.textContent = isTarget ? "⌄" : "›";
  });
  if (sectionName === "note") {
    setTimeout(() => document.getElementById("log-note")?.focus(), 0);
  }
}

function setLogEditorSaving() {
  const indicator = document.getElementById("autosave-indicator");
  if (indicator) {
    indicator.textContent = t("log_saving");
    indicator.classList.add("visible");
  }
}

async function selectFlowValue(value) {
  currentFlowEstimated = false;
  if (value === null) {
    currentFlowSet = false;
  } else {
    currentFlowValue = normalizeFlowLevel(value, 1);
    currentFlowSet = true;
  }
  updateLogEditorUI();
  setLogEditorSaving();
  await autoSaveSymptomSelection();
  showAutosaveIndicator();
}

function previewInlinePain(value) {
  const v = normalizePainValue(value, 5);
  const label = document.getElementById("log-pain-value");
  if (label) label.textContent = `${v.toFixed(v % 1 ? 1 : 0)} / 10`;
}

async function selectPainValue(value) {
  currentPainValue = normalizePainValue(value, 5);
  currentPainSet = true;
  updateLogEditorUI();
  setLogEditorSaving();
  await autoSaveSymptomSelection();
  showAutosaveIndicator();
}

async function selectMoodValue(value) {
  currentMoodValue = normalizeMoodValue(value, 50);
  currentMoodSet = true;
  updateLogEditorUI();
  setLogEditorSaving();
  await autoSaveSymptomSelection();
  showAutosaveIndicator();
}

async function clearLogField(field, event) {
  event?.stopPropagation();
  if (field === "flow") {
    currentFlowSet = false;
    currentFlowEstimated = false;
  } else if (field === "pain") {
    currentPainSet = false;
  } else if (field === "mood") {
    currentMoodSet = false;
  } else if (field === "note") {
    const note = document.getElementById("log-note");
    if (note) note.value = "";
    updateNoteCount();
  }
  updateLogEditorUI();
  setLogEditorSaving();
  await autoSaveSymptomSelection();
  showAutosaveIndicator();
}

function updateLogEditorUI() {
  const noteValue = document.getElementById("log-note")?.value.trim() || "";
  const entryExists =
    currentFlowSet || currentPainSet || currentMoodSet || !!noteValue;
  const entryMode = document.getElementById("log-entry-mode");
  if (entryMode)
    entryMode.textContent = entryExists ? t("log_edit_entry") : t("log_add_entry");

  const flowSummary = document.getElementById("log-flow-summary");
  const flowIcon = document.getElementById("log-flow-icon");
  if (flowIcon) flowIcon.textContent = currentFlowSet ? flowIconFromValue(currentFlowValue) : "🩸";
  if (flowSummary) {
    flowSummary.textContent = currentFlowSet
      ? `${currentFlowEstimated ? "Estimated · " : ""}${flowWordLabelFromValue(currentFlowValue)}`
      : t("log_not_recorded");
    flowSummary.classList.toggle("is-set", currentFlowSet);
  }
  document.getElementById("log-flow-clear")?.classList.toggle("visible", currentFlowSet);
  document.getElementById("log-flow-estimated")?.classList.toggle("hidden", !currentFlowEstimated);
  document.querySelectorAll("[data-flow-value]").forEach((button) => {
    const selected = currentFlowSet
      ? button.dataset.flowValue === String(currentFlowValue)
      : button.dataset.flowValue === "none";
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const painSummary = document.getElementById("log-pain-summary");
  if (painSummary) {
    painSummary.textContent = !currentPainSet
      ? t("log_not_recorded")
      : currentPainValue === 0
        ? t("log_no_pain")
        : `${currentPainValue.toFixed(currentPainValue % 1 ? 1 : 0)} / 10`;
    painSummary.classList.toggle("is-set", currentPainSet);
  }
  document.getElementById("log-pain-clear")?.classList.toggle("visible", currentPainSet);
  const noPainButton = document.getElementById("log-no-pain");
  const noPainSelected = currentPainSet && currentPainValue === 0;
  noPainButton?.classList.toggle("selected", noPainSelected);
  noPainButton?.setAttribute("aria-pressed", String(noPainSelected));
  const painSlider = document.getElementById("log-pain-slider");
  if (painSlider && currentPainValue > 0) painSlider.value = String(currentPainValue);
  previewInlinePain(currentPainValue > 0 ? currentPainValue : painSlider?.value || 5);

  const moodSummary = document.getElementById("log-mood-summary");
  const moodIcon = document.getElementById("log-mood-icon");
  if (moodIcon) moodIcon.textContent = currentMoodSet ? moodIconFromValue(currentMoodValue) : "😐";
  if (moodSummary) {
    moodSummary.textContent = currentMoodSet
      ? moodLabelFromValue(currentMoodValue)
      : t("log_not_recorded");
    moodSummary.classList.toggle("is-set", currentMoodSet);
  }
  document.getElementById("log-mood-clear")?.classList.toggle("visible", currentMoodSet);
  document.querySelectorAll("[data-mood-value]").forEach((button) => {
    const selected =
      currentMoodSet && button.dataset.moodValue === String(currentMoodValue);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const noteSummary = document.getElementById("log-note-summary");
  if (noteSummary) {
    noteSummary.textContent = noteValue
      ? noteValue.replace(/\s+/g, " ").slice(0, 34)
      : t("log_add_note");
    noteSummary.classList.toggle("is-set", !!noteValue);
  }
  document.getElementById("log-note-clear")?.classList.toggle("visible", !!noteValue);
  const deleteButton = document.getElementById("log-reset-btn");
  if (deleteButton) deleteButton.hidden = !entryExists;
}

function flowIconFromValue(value) {
  const v = normalizeFlowLevel(value, 1);
  if (v === 0) return "💧";
  if (v === 1) return "🩸";
  if (v === 2) return "🩸🩸";
  return "🩸🩸🩸";
}

function flowLabelFromValue(value) {
  const v = normalizeFlowLevel(value, 1);
  if (v === 0) return "💧";
  if (v === 1) return "🩸";
  if (v === 2) return "🩸🩸";
  return "🩸🩸🩸";
}

function updateFlowButtonVisual(value, isSet = true) {
  const v = normalizeFlowLevel(value, 1);
  currentFlowValue = v;
  currentFlowSet = isSet;

  const flowBtn = document.getElementById("log-flow");
  const flowIcon = document.getElementById("log-flow-icon");

  if (flowBtn) {
    if (isSet) {
      flowBtn.classList.add("active-flow");
      flowBtn.style.borderColor = "";
      flowBtn.style.background = "";
      flowBtn.style.color = "";
    } else {
      flowBtn.classList.remove("active-flow");
      flowBtn.style.borderColor = "";
      flowBtn.style.background = "";
      flowBtn.style.color = "";
    }
  }
  if (flowIcon) flowIcon.textContent = flowIconFromValue(v);
  updateLogEditorUI();
}

function flowWordLabelFromValue(value) {
  const v = normalizeFlowLevel(value, 1);
  if (v === 0) return t("flow_spotting");
  if (v === 1) return t("flow_light");
  if (v === 2) return t("flow_medium");
  return t("flow_heavy");
}

function updateFlowModalPreview(value) {
  const slider = document.getElementById("flow-modal-slider");
  const label = document.getElementById("flow-modal-value");
  const wordLabel = document.getElementById("flow-modal-word");
  if (!slider || !label) return;
  const v = normalizeFlowLevel(value, 1);
  slider.style.accentColor = "#FF3D6B";
  label.textContent = flowLabelFromValue(v);
  label.style.color = "var(--rose)";
  label.style.whiteSpace = "nowrap";
  label.style.letterSpacing = "-0.22em";
  label.style.lineHeight = "1";
  if (wordLabel) wordLabel.textContent = flowWordLabelFromValue(v);
}

function showFlowModal() {
  const overlay = document.getElementById("modal-overlay");
  const iconEl = document.getElementById("modal-icon");
  const titleEl = document.getElementById("modal-title");
  const msgEl = document.getElementById("modal-msg");
  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");

  if (!overlay || !iconEl || !titleEl || !msgEl || !confirmBtn || !cancelBtn)
    return;

  iconEl.textContent = "🩸";
  titleEl.textContent = t("set_flow");
  msgEl.textContent = "";

  const wrap = document.createElement("div");
  wrap.className = "flow-modal-wrap";
  const valueEl = document.createElement("div");
  valueEl.id = "flow-modal-value";
  valueEl.className = "flow-modal-value";
  const wordEl = document.createElement("div");
  wordEl.id = "flow-modal-word";
  wordEl.style.cssText = "font-size:0.875rem;color:var(--text-muted);margin-top:0.25rem;text-align:center;";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "3";
  slider.step = "1";
  slider.value = String(currentFlowValue);
  slider.id = "flow-modal-slider";
  slider.className = "flow-modal-slider";
  slider.addEventListener("input", (e) =>
    updateFlowModalPreview(e.target.value)
  );
  wrap.appendChild(valueEl);
  wrap.appendChild(wordEl);
  wrap.appendChild(slider);
  msgEl.appendChild(wrap);

  confirmBtn.textContent = t("save");
  cancelBtn.textContent = t("cancel");
  cancelBtn.style.display = "";

  updateFlowModalPreview(currentFlowValue);

  confirmBtn.onclick = async () => {
    const v = normalizeFlowLevel(slider.value, 1);
    updateFlowButtonVisual(v, true);
    overlay.classList.remove("visible");
    await autoSaveSymptomSelection();
    showAutosaveIndicator();
  };
  cancelBtn.onclick = () => {
    overlay.classList.remove("visible");
  };

  overlay.classList.add("visible");

  // Move focus to slider immediately
  setTimeout(() => {
    if (slider) {
      slider.focus();
    }
  }, 0);
}

function painColorFromValue(value) {
  const v = normalizePainValue(value, 5);
  const t = v / 10;
  const low = { r: 255, g: 179, b: 71 }; // #FFB347 (light orange)
  const high = { r: 255, g: 140, b: 0 }; // #FF8C00 (dark orange)
  const r = Math.round(low.r + (high.r - low.r) * t);
  const g = Math.round(low.g + (high.g - low.g) * t);
  const b = Math.round(low.b + (high.b - low.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function painLabelFromValue(value) {
  const v = normalizePainValue(value, 5);
  return t("pain_label", { value: v.toFixed(1) });
}

function updatePainButtonVisual(value, isSet = true) {
  const v = normalizePainValue(value, 5);
  currentPainValue = v;
  currentPainSet = isSet;

  const painBtn = document.getElementById("log-headache");
  const painIcon = document.getElementById("log-pain-icon");
  const col = painColorFromValue(v);

  if (painBtn) {
    if (isSet) {
      painBtn.classList.add("active-symptom");
      painBtn.style.borderColor = col;
      painBtn.style.background = "rgba(255, 255, 255, 0.06)";
      painBtn.style.color = col;
    } else {
      painBtn.classList.remove("active-symptom");
      painBtn.style.borderColor = "";
      painBtn.style.background = "";
      painBtn.style.color = "";
    }
  }
  if (painIcon) painIcon.textContent = "🤕";
  const painLabel = document.getElementById("log-pain-label");
  if (painLabel) painLabel.textContent = isSet ? `Pain: ${v.toFixed(1)}/10` : "Pain";
  updateLogEditorUI();
}

function updatePainModalPreview(value) {
  const slider = document.getElementById("pain-modal-slider");
  const label = document.getElementById("pain-modal-value");
  if (!slider || !label) return;
  const v = normalizePainValue(value, 5);
  const col = painColorFromValue(v);
  slider.style.accentColor = col;
  label.textContent = painLabelFromValue(v);
  label.style.color = col;
}

function showPainModal() {
  const overlay = document.getElementById("modal-overlay");
  const iconEl = document.getElementById("modal-icon");
  const titleEl = document.getElementById("modal-title");
  const msgEl = document.getElementById("modal-msg");
  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");

  if (!overlay || !iconEl || !titleEl || !msgEl || !confirmBtn || !cancelBtn)
    return;

  iconEl.textContent = "🤕";
  titleEl.textContent = t("set_pain");
  msgEl.textContent = "";

  const wrap = document.createElement("div");
  wrap.className = "pain-modal-wrap";
  const valueEl = document.createElement("div");
  valueEl.id = "pain-modal-value";
  valueEl.className = "pain-modal-value";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "1";
  slider.max = "10";
  slider.step = "0.5";
  slider.value = String(currentPainValue);
  slider.id = "pain-modal-slider";
  slider.className = "pain-modal-slider";
  slider.addEventListener("input", (e) =>
    updatePainModalPreview(e.target.value)
  );
  wrap.appendChild(valueEl);
  wrap.appendChild(slider);
  msgEl.appendChild(wrap);

  confirmBtn.textContent = t("save");
  cancelBtn.textContent = t("cancel");
  cancelBtn.style.display = "";

  updatePainModalPreview(currentPainValue);

  confirmBtn.onclick = async () => {
    const v = normalizePainValue(slider.value, 5);
    updatePainButtonVisual(v, true);
    overlay.classList.remove("visible");
    await autoSaveSymptomSelection();
    showAutosaveIndicator();
  };
  cancelBtn.onclick = () => {
    overlay.classList.remove("visible");
  };

  overlay.classList.add("visible");

  // Move focus to slider immediately
  setTimeout(() => {
    if (slider) {
      slider.focus();
    }
  }, 0);
}

function moodColorFromValue(value) {
  const v = normalizeMoodValue(value, 50);
  const t = v / 100;
  const low = { r: 139, g: 127, b: 232 }; // #8B7FE8
  const high = { r: 46, g: 204, b: 113 }; // #2ECC71
  const r = Math.round(low.r + (high.r - low.r) * t);
  const g = Math.round(low.g + (high.g - low.g) * t);
  const b = Math.round(low.b + (high.b - low.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function moodLabelFromValue(value) {
  const v = normalizeMoodValue(value, 50);
  if (v < 35) return t("mood_low");
  if (v > 65) return t("mood_happy");
  return t("mood_neutral");
}

function moodIconFromValue(value) {
  const v = normalizeMoodValue(value, 50);
  if (v < 35) return "😔";
  if (v > 65) return "😊";
  return "😐";
}

function updateMoodButtonVisual(value, isSet = true) {
  const v = normalizeMoodValue(value, 50);
  currentMoodValue = v;
  currentMoodSet = isSet;

  const moodBtn = document.getElementById("log-mood");
  const moodIcon = document.getElementById("log-mood-icon");
  const col = moodColorFromValue(v);

  if (moodBtn) {
    if (isSet) {
      moodBtn.classList.add("active-mood");
      moodBtn.style.borderColor = col;
      moodBtn.style.background = "rgba(255, 255, 255, 0.06)";
      moodBtn.style.color = col;
    } else {
      moodBtn.classList.remove("active-mood");
      moodBtn.style.borderColor = "";
      moodBtn.style.background = "";
      moodBtn.style.color = "";
    }
  }
  if (moodIcon) moodIcon.textContent = moodIconFromValue(v);
  updateLogEditorUI();
}

function updateMoodModalPreview(value) {
  const slider = document.getElementById("mood-modal-slider");
  const label = document.getElementById("mood-modal-value");
  if (!slider || !label) return;
  const v = normalizeMoodValue(value, 50);
  const col = moodColorFromValue(v);
  slider.style.accentColor = col;
  label.textContent = moodLabelFromValue(v);
  label.style.color = col;
}

function showMoodModal() {
  const overlay = document.getElementById("modal-overlay");
  const iconEl = document.getElementById("modal-icon");
  const titleEl = document.getElementById("modal-title");
  const msgEl = document.getElementById("modal-msg");
  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");

  if (!overlay || !iconEl || !titleEl || !msgEl || !confirmBtn || !cancelBtn)
    return;

  iconEl.textContent = "🎚️";
  titleEl.textContent = t("set_mood");
  msgEl.textContent = "";

  const wrap = document.createElement("div");
  wrap.className = "mood-modal-wrap";
  const valueEl = document.createElement("div");
  valueEl.id = "mood-modal-value";
  valueEl.className = "mood-modal-value";
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "100";
  slider.step = "50";
  slider.value = String(currentMoodValue);
  slider.id = "mood-modal-slider";
  slider.className = "mood-modal-slider";
  slider.addEventListener("input", (e) =>
    updateMoodModalPreview(e.target.value)
  );

  const tickLabels = document.createElement("div");
  tickLabels.style.display = "flex";
  tickLabels.style.justifyContent = "space-between";
  tickLabels.style.fontSize = "1.25rem";
  tickLabels.style.marginTop = "0.5rem";
  tickLabels.style.padding = "0 0.5rem";
  tickLabels.style.cursor = "pointer";
  ["😔", "😐", "😊"].forEach((emoji, idx) => {
    const span = document.createElement("span");
    span.textContent = emoji;
    // allow clicking emoji to change slider
    span.onclick = () => {
      slider.value = idx * 50;
      updateMoodModalPreview(slider.value);
    };
    tickLabels.appendChild(span);
  });

  wrap.appendChild(valueEl);
  wrap.appendChild(slider);
  wrap.appendChild(tickLabels);
  msgEl.appendChild(wrap);

  confirmBtn.textContent = t("save");
  cancelBtn.textContent = t("cancel");
  cancelBtn.style.display = "";

  updateMoodModalPreview(currentMoodValue);

  confirmBtn.onclick = async () => {
    const v = normalizeMoodValue(slider.value, 50);
    updateMoodButtonVisual(v, true);
    overlay.classList.remove("visible");
    await autoSaveSymptomSelection();
    showAutosaveIndicator();
  };
  cancelBtn.onclick = () => {
    overlay.classList.remove("visible");
  };

  overlay.classList.add("visible");

  // Move focus to slider immediately
  setTimeout(() => {
    if (slider) {
      slider.focus();
    }
  }, 0);
}

function getStatusPhaseLabel(info) {
  let phase = info.phase;
  if (
    !isFertilityVisible() &&
    (phase === "Fertile Window" || phase === "Ovulation Day")
  ) {
    phase = info.cycleDay <= info.ovulationDay ? "Follicular" : "Luteal";
  }

  const phaseNum = {
    Menstruation: 1,
    Follicular: 2,
    "Fertile Window": 3,
    "Ovulation Day": 3,
    Luteal: 4,
  }[phase] ?? "—";
  const phaseNameKey = {
    Menstruation: "period_short",
    Follicular: "follicular",
    "Fertile Window": "fertile",
    "Ovulation Day": "ovulation_short",
    Luteal: "luteal",
  }[phase] || "luteal";

  return { phaseNum, phaseNameKey };
}

function updateStatusCard() {
  const info = getCycleInfo();
  const emptyHint = document.getElementById("status-empty-hint");
  const importHint = document.getElementById("status-import-hint");
  if (!info) {
    safeText("status-phase-text", "");
    safeText("status-title", "");
    safeText("status-subtitle", "");
    safeText("cycle-day", "—");
    safeText("days-until-next", "—");
    safeText("cycle-len-disp", "—");
    const reminderBanner = document.getElementById("reminder-banner");
    if (reminderBanner) reminderBanner.style.display = "none";
    if (emptyHint) {
      emptyHint.textContent = t("status_no_data_hint");
      emptyHint.classList.remove("hidden");
    }
    if (importHint) {
      const link = importHint.querySelector("#status-import-link");
      if (link) link.textContent = t("status_import_hint");
      importHint.classList.remove("hidden");
    }
    return;
  }
  if (emptyHint) emptyHint.classList.add("hidden");
  if (importHint) importHint.classList.add("hidden");

  // Date line
  const phaseEl = document.getElementById("status-phase");
  if (phaseEl) phaseEl.style.color = "";
  const dateLabel = new Date().toLocaleDateString(getLanguage(), {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  safeText("status-phase-text", dateLabel);

  // Main status line
  if (info.isLate) {
    safeText(
      "status-title",
      tp("status_period_late", info.daysLate, { n: info.daysLate })
    );
    safeText(
      "status-subtitle",
      t("status_period_expected_on", {
        date: formatDateLocale(info.expectedPeriodStart),
      })
    );
  } else {
    safeText(
      "status-title",
      t("status_cycle_day_of", { day: info.cycleDay, total: info.cl })
    );

    const { phaseNum, phaseNameKey } = getStatusPhaseLabel(info);

    const predictedDate = info.nextPeriod.toLocaleDateString(getLanguage(), { month: "long", day: "numeric" });
    let periodMsg;
    if (info.phase === "Menstruation") {
      periodMsg = t("subtitle_menstruation", { day: info.cycleDay });
    } else if (info.daysUntilNext <= 0) {
      periodMsg = t("status_period_today");
    } else if (info.daysUntilNext <= 3) {
      periodMsg = t("status_period_soon_date", { date: predictedDate });
    } else {
      periodMsg = t("status_period_in_date", { date: predictedDate });
    }

    safeText(
      "status-subtitle",
      t("status_phase_line", {
        num: phaseNum,
        phase: t(phaseNameKey),
        detail: periodMsg,
      })
    );
  }

  safeText("cycle-day", info.isLate ? info.daysLate : info.cycleDay);
  safeText(
    "days-until-next",
    info.isLate ? "—" : info.daysUntilNext > 0 ? info.daysUntilNext : t("now")
  );
  safeText("cycle-len-disp", info.cl);
  updateCycleBar(info);
  updateReminderBanner(info);
  updateShiftBanner();
  updateSpreadBanner();
}

function updateShiftBanner() {
  const banner = document.getElementById("shift-banner");
  const text = document.getElementById("shift-text");
  if (!banner || !text) return;

  const shift = getMostRecentShift(state.cycleHistory);
  if (!shift) {
    banner.style.display = "none";
    return;
  }

  const days = Math.abs(shift.shift);
  text.textContent =
    shift.shift > 0
      ? tp("cycle_shift_longer", days, { days })
      : tp("cycle_shift_shorter", days, { days });
  banner.style.display = "flex";
}

function updateSpreadBanner() {
  const banner = document.getElementById("spread-banner");
  const text = document.getElementById("spread-text");
  if (!banner || !text) return;

  const spreadInfo = getRollingSpreadInfo();
  if (!spreadInfo?.level) {
    banner.style.display = "none";
    banner.className = "spread-banner";
    return;
  }

  text.textContent =
    spreadInfo.level === "irregular"
      ? t("cycle_spread_irregular", {
          spread: spreadInfo.spread,
          min: spreadInfo.min,
          max: spreadInfo.max,
        })
      : t("cycle_spread_caution", {
          spread: spreadInfo.spread,
          min: spreadInfo.min,
          max: spreadInfo.max,
        });
  banner.className =
    spreadInfo.level === "irregular"
      ? "spread-banner spread-banner--irregular"
      : "spread-banner spread-banner--caution";
  banner.style.display = "flex";
}

function updateReminderBanner(info) {
  const banner = document.getElementById("reminder-banner");
  const text = document.getElementById("reminder-text");
  if (!banner || !text || !info || info.isLate) return;

  // Show banner if period is coming within 3 days
  if (info.daysUntilNext > 0 && info.daysUntilNext <= 3) {
    text.textContent = tp("period_expected_in", info.daysUntilNext);
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
  }
}

function updateCycleBar(info) {
  const bar = document.getElementById("cycle-bar");
  if (!bar) return;
  safeText("bar-cycle-end", t("bar_day", { n: info.cl }));
  const showPhases = isCyclePhaseTimelineVisible();
  const primaryLabel = document.getElementById("cycle-legend-primary-label");
  const secondaryLabel = document.getElementById("cycle-legend-secondary-label");
  const secondaryDot = document.getElementById("cycle-legend-secondary-dot");
  const ovulationLegend = document.getElementById("cycle-legend-ovulation");
  const lutealLegend = document.getElementById("cycle-legend-luteal");

  if (primaryLabel) {
    primaryLabel.dataset.i18n = showPhases ? "menstrual" : "period_short";
    primaryLabel.textContent = t(showPhases ? "menstrual" : "period_short");
  }
  if (secondaryLabel) {
    secondaryLabel.dataset.i18n = showPhases
      ? "follicular"
      : "other_cycle_days";
    secondaryLabel.textContent = t(
      showPhases ? "follicular" : "other_cycle_days"
    );
  }
  if (secondaryDot) {
    secondaryDot.className = `legend-dot ${
      showPhases ? "legend-dot--fertile" : "legend-dot--neutral"
    }`;
  }
  if (ovulationLegend) ovulationLegend.hidden = !showPhases;
  if (lutealLegend) lutealLegend.hidden = !showPhases;

  const menstrualDays = Math.min(Math.max(info.pd, 0), info.cl);
  const follicularDays = Math.max(
    0,
    Math.min(info.ovulationDay - menstrualDays - 1, info.cl - menstrualDays)
  );
  const ovulationDays =
    info.ovulationDay > menstrualDays && info.ovulationDay <= info.cl ? 1 : 0;
  const lutealDays = Math.max(
    0,
    info.cl - menstrualDays - follicularDays - ovulationDays
  );
  const segs = showPhases
    ? [
        { c: "linear-gradient(90deg,#FF3D6B,#FF6B4A)", w: menstrualDays },
        {
          c: "linear-gradient(90deg,#34D399,#2DD4BF)",
          w: follicularDays,
        },
        { c: "#F59E0B", w: ovulationDays },
        {
          c: "linear-gradient(90deg,#A78BFA,#7C3AED)",
          w: lutealDays,
        },
      ]
    : [
        { c: "linear-gradient(90deg,#FF3D6B,#FF6B4A)", w: menstrualDays },
        {
          c: "linear-gradient(90deg,#64748B,#475569)",
          w: info.cl - menstrualDays,
        },
      ];
  bar.innerHTML = "";
  let left = 0;
  segs.forEach((s) => {
    // Skip zero/negative-width segments without moving the cursor backwards
    // (can happen for short cycles with a long period duration).
    if (s.w <= 0) return;
    const seg = document.createElement("div");
    seg.style.cssText = `position:absolute;top:0;height:100%;border-radius:999px;left:${(
      (left / info.cl) *
      100
    ).toFixed(2)}%;width:${((s.w / info.cl) * 100).toFixed(2)}%;background:${
      s.c
    };`;
    bar.appendChild(seg);
    left += s.w;
  });
  const todayPct = ((info.cycleDay - 1) / info.cl) * 100;
  if (todayPct >= 0 && todayPct <= 100) {
    const m = document.createElement("div");
    m.className = "today-marker";
    m.style.left = todayPct.toFixed(2) + "%";
    bar.appendChild(m);
  }
}

function renderPredictionsTab() {
  const el = document.getElementById("predictions-list");
  if (!el) return;
  el.innerHTML = "";
  const info = getCycleInfo();
  if (!info || !info.nextPeriod) {
    const p = document.createElement("p");
    p.style.cssText = "color:var(--text-muted);font-size:0.875rem;padding:0.5rem 0";
    p.textContent = t("predictions_empty");
    el.appendChild(p);
    return;
  }
  const rollingStats = getRollingStatisticalCycleData(fromISO(today()), 1);
  const predCl = rollingStats ? Math.round(rollingStats.mean) : info.cl;
  const todayD = fromISO(today());
  let firstStart = info.nextPeriod;
  while (firstStart < todayD) firstStart = addDays(firstStart, predCl);
  for (let i = 0; i < 6; i++) {
    const startD = addDays(firstStart, i * predCl);
    const endD = addDays(startD, info.pd - 1);
    const row = document.createElement("div");
    row.className = "history-row pred-row";
    const startEl = document.createElement("span");
    startEl.textContent = formatDateLocale(startD);
    const endEl = document.createElement("span");
    endEl.textContent = formatDateLocale(endD);
    const durEl = document.createElement("span");
    durEl.className = "history-dur";
    durEl.textContent = `${info.pd}d`;
    row.appendChild(startEl);
    row.appendChild(endEl);
    row.appendChild(durEl);
    el.appendChild(row);
  }
}

function formatPeriodMonthDay(date, lang) {
  if (lang === "ja" || lang.startsWith("zh")) {
    const month = date.toLocaleDateString(lang, { month: "short" });
    return `${month}${date.getDate()}日`;
  }
  return date.toLocaleDateString(lang, { month: "short", day: "numeric" });
}

function formatPeriodDateRange(startIso, endIso) {
  const start = fromISO(startIso);
  const end = fromISO(endIso);
  const lang = getLanguage();
  const startLabel = formatPeriodMonthDay(start, lang);
  const endLabel = formatPeriodMonthDay(end, lang);
  const year = end.getFullYear();

  if (toISO(start) === toISO(end)) {
    return `${startLabel}, ${year}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${startLabel}–${endLabel}, ${year}`;
  }
  return `${startLabel}, ${start.getFullYear()}–${endLabel}, ${year}`;
}

function formatPeriodDateRangeCompact(startIso, endIso) {
  const start = fromISO(startIso);
  const end = fromISO(endIso);
  const lang = getLanguage();
  const startLabel = formatPeriodMonthDay(start, lang);
  const endLabel = formatPeriodMonthDay(end, lang);
  const shortYear = (date) => `’${String(date.getFullYear()).slice(-2)}`;

  if (toISO(start) === toISO(end))
    return `${startLabel}, ${shortYear(start)}`;
  if (start.getFullYear() === end.getFullYear()) {
    return `${startLabel}–${endLabel}, ${shortYear(end)}`;
  }
  return `${startLabel}, ${shortYear(start)}–${endLabel}, ${shortYear(end)}`;
}

function getPeriodEndDate(startDateStr) {
  const start = fromISO(startDateStr);
  let hasFlow = false;
  let lastFlow = start;
  for (let i = 0; i < 20; i++) {
    const d = addDays(start, i);
    const dStr = toISO(d);
    if (state.logs[dStr]?.flow) {
      hasFlow = true;
      lastFlow = d;
    } else if (hasFlow) {
      // allow a 1-day gap, then stop
      if (!state.logs[toISO(addDays(d, 1))]?.flow) break;
    }
  }
  return hasFlow
    ? toISO(lastFlow)
    : toISO(addDays(start, getPredictionPeriodDuration() - 1));
}

function createHistoryDailyChart(periodDays, startStr, endStr) {
  const svgNS = "http://www.w3.org/2000/svg";
  const width = 120;
  const height = 30;
  const sidePadding = 5;
  const plotTop = 3;
  const plotBottom = 27;
  const plotHeight = plotBottom - plotTop;
  const usableWidth = width - sidePadding * 2;
  const pointSpacing =
    periodDays.length <= 1
      ? 0
      : Math.min(15, usableWidth / (periodDays.length - 1));
  const seriesWidth = pointSpacing * Math.max(periodDays.length - 1, 0);
  const seriesStart = (width - seriesWidth) / 2;
  const xForIndex = (index) =>
    periodDays.length <= 1
      ? width / 2
      : seriesStart + index * pointSpacing;
  const makeSvgElement = (tag, attributes = {}) => {
    const element = document.createElementNS(svgNS, tag);
    Object.entries(attributes).forEach(([name, value]) =>
      element.setAttribute(name, String(value))
    );
    return element;
  };

  const chart = makeSvgElement("svg", {
    class: "history-daily-chart",
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": `${t("flow")}, ${t("pain")}, ${t("mood")}: ${formatPeriodDateRange(startStr, endStr)}`,
  });
  const title = makeSvgElement("title");
  title.textContent = `${t("flow")}, ${t("pain")}, ${t("mood")} — ${formatPeriodDateRange(startStr, endStr)}`;
  chart.appendChild(title);
  chart.appendChild(
    makeSvgElement("rect", {
      class: "history-daily-chart-bg",
      x: 0.5,
      y: 0.5,
      width: width - 1,
      height: height - 1,
      rx: 4,
    })
  );
  [11, 19].forEach((y) =>
    chart.appendChild(
      makeSvgElement("line", {
        class: "history-daily-chart-divider",
        x1: 4,
        y1: y,
        x2: width - 4,
        y2: y,
      })
    )
  );

  const barWidth = Math.max(2, Math.min(8.5, pointSpacing * 0.57 || 8.5));
  periodDays.forEach((day, index) => {
    if (!(day.flow > 0)) return;
    const flowLevel = Math.min(day.flow, 3);
    const barHeight = (flowLevel / 3) * plotHeight;
    chart.appendChild(
      makeSvgElement("rect", {
        class: "history-daily-chart-flow",
        x: xForIndex(index) - barWidth / 2,
        y: plotBottom - barHeight,
        width: barWidth,
        height: barHeight,
        opacity: 0.18 + flowLevel * 0.23,
        rx: 1,
      })
    );
  });

  const addLineSeries = (key, className) => {
    const segments = [];
    const points = [];
    let segment = [];
    const flushSegment = () => {
      if (segment.length) segments.push(segment);
      segment = [];
    };

    periodDays.forEach((day, index) => {
      const value = day[key];
      if (value == null) {
        flushSegment();
        return;
      }
      const maximum = key === "pain" ? 10 : 100;
      const normalized = Math.max(0, Math.min(value / maximum, 1));
      const point = {
        x: xForIndex(index),
        y: plotBottom - normalized * plotHeight,
        value,
      };
      segment.push(point);
      points.push(point);
    });
    flushSegment();

    segments.forEach((pointsInSegment) => {
      if (pointsInSegment.length < 2) return;
      const pathData = pointsInSegment
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        )
        .join(" ");
      chart.append(
        makeSvgElement("path", {
          class: "history-daily-chart-line-halo",
          d: pathData,
        }),
        makeSvgElement("path", {
          class: `history-daily-chart-line ${className}`,
          d: pathData,
        })
      );
    });

    points.forEach((point) => {
      const pointClass =
        key === "mood"
          ? point.value < 35
            ? "history-daily-chart-point--mood-low"
            : point.value > 65
              ? "history-daily-chart-point--mood-high"
              : "history-daily-chart-point--mood-neutral"
          : "history-daily-chart-point--pain";
      chart.appendChild(
        makeSvgElement("circle", {
          class: `history-daily-chart-point ${pointClass}`,
          cx: point.x,
          cy: point.y,
          r: 1.2,
        })
      );
    });
  };

  addLineSeries("pain", "history-daily-chart-line--pain");
  addLineSeries("mood", "history-daily-chart-line--mood");
  return chart;
}

function createHistoryPatternKey() {
  const key = document.createElement("span");
  key.className = "history-pattern-key";
  key.setAttribute("aria-label", t("history_daily_pattern"));
  [
    ["flow", "history-pattern-key-item--flow"],
    ["pain", "history-pattern-key-item--pain"],
    ["mood", "history-pattern-key-item--mood"],
  ].forEach(([labelKey, className]) => {
    const item = document.createElement("span");
    item.className = `history-pattern-key-item ${className}`;
    item.textContent = t(labelKey);
    key.appendChild(item);
  });
  return key;
}

function buildHistoryRow(c, options = {}) {
  const {
    isCurrentCycle = false,
    shiftedStarts = null,
    rollingAvg = null,
    dailyChart = false,
  } = options;
  const row = document.createElement("div");
  row.className = "history-row";
  if (dailyChart) row.classList.add("history-row--chart");
  if (!isCurrentCycle && shiftedStarts?.has(c.start)) {
    row.classList.add("history-row--shifted");
  }
  const endStr = getPeriodEndDate(c.start);
  const durDays = diffDays(fromISO(c.start), fromISO(endStr)) + 1;

  const dateEl = document.createElement("span");
  dateEl.className = "history-date";
  dateEl.textContent = formatPeriodDateRangeCompact(c.start, endStr);
  dateEl.title = formatPeriodDateRange(c.start, endStr);

  const durEl = document.createElement("span");
  durEl.className = "history-dur";
  durEl.textContent = `${durDays}d`;

  const lenEl = document.createElement("span");
  lenEl.className = "history-len";
  const col = c.length < 26 ? "#34D399" : c.length > 32 ? "#FF6B4A" : "#A78BFA";
  lenEl.style.cssText = `background:${col}22;color:${col}`;
  lenEl.textContent = isCurrentCycle ? "—" : `${parseInt(c.length)}d`;
  if (isCurrentCycle) {
    lenEl.title = t("history_current");
    lenEl.setAttribute("aria-label", t("history_current"));
  }
  if (!isCurrentCycle && shiftedStarts?.has(c.start) && rollingAvg != null) {
    const shiftDays = Math.abs(c.length - rollingAvg);
    lenEl.title = tp("cycle_shift_tooltip", shiftDays, { days: shiftDays });
  }

  const periodDays = Array.from({ length: durDays }, (_, index) => {
    const log = state.logs[toISO(addDays(fromISO(c.start), index))] || {};
    return {
      flow: getFlowLevelFromLog(log),
      pain: getPainValueFromLog(log),
      mood: getMoodValueFromLog(log),
    };
  });

  if (dailyChart) {
    row.append(
      dateEl,
      durEl,
      lenEl,
      createHistoryDailyChart(periodDays, c.start, endStr)
    );
    return row;
  }

  const flowEl = document.createElement("span");
  flowEl.className = "history-flow-spark";
  flowEl.setAttribute("aria-label", `Flow pattern: ${formatPeriodDateRange(c.start, endStr)}`);
  periodDays.forEach((day) => {
    const bar = document.createElement("span");
    const level = day.flow > 0 ? day.flow : 0;
    bar.style.height = level ? `${25 + level * 25}%` : "0.125rem";
    bar.style.opacity = level ? String(0.35 + level * 0.2) : "0.15";
    flowEl.appendChild(bar);
  });

  const painEl = document.createElement("span");
  painEl.className = "history-pain";
  const painValues = periodDays
    .map((day) => day.pain)
    .filter((value) => value != null);
  if (painValues.length) {
    const peakPain = Math.max(...painValues);
    painEl.textContent = peakPain === 0 ? "0" : String(peakPain);
    painEl.title = peakPain === 0 ? t("log_no_pain") : `${t("pain")} ${peakPain}/10`;
  } else {
    painEl.textContent = "—";
    painEl.title = t("log_not_recorded");
  }

  const moodEl = document.createElement("span");
  moodEl.className = "history-mood";
  const moodValues = periodDays
    .map((day) => day.mood)
    .filter((value) => value != null);
  if (moodValues.length) {
    const averageMood =
      moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length;
    moodEl.textContent = moodIconFromValue(averageMood);
    moodEl.title = moodLabelFromValue(averageMood);
  } else {
    moodEl.textContent = "";
    moodEl.title = t("log_not_recorded");
  }

  row.append(dateEl, durEl, lenEl, flowEl, painEl, moodEl);
  return row;
}

function showHistoryFullPage() {
  const existing = document.getElementById("history-fullpage-overlay");
  if (existing) existing.remove();

  // Prevent body from scrolling behind the overlay
  document.body.style.overflow = "hidden";

  const overlay = document.createElement("div");
  overlay.id = "history-fullpage-overlay";
  overlay.className = "history-fullpage-overlay";

  const header = document.createElement("div");
  header.className = "history-fullpage-header";
  const title = document.createElement("span");
  title.textContent = t("cycle_history");
  const closeBtn = document.createElement("button");
  closeBtn.className = "history-fullpage-close";
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.addEventListener("click", () => {
    overlay.remove();
    document.body.style.overflow = "";
  });
  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "history-fullpage-body";

  // Column labels pinned at the top of the scrollable body
  const subheader = document.createElement("div");
  subheader.className =
    "history-fullpage-subheader history-col-labels--chart";
  [
    t("history_col_dates"),
    t("history_col_period"),
    t("history_col_cycle"),
  ].forEach((label) => {
    const s = document.createElement("span");
    s.textContent = label;
    subheader.appendChild(s);
  });
  subheader.appendChild(createHistoryPatternKey());
  body.appendChild(subheader);

  if (!state.cycleHistory || state.cycleHistory.length === 0) {
    const p = document.createElement("p");
    p.style.cssText = "color:var(--text-muted);font-size:0.875rem;padding:1rem 0";
    p.textContent = t("no_cycle_history");
    body.appendChild(p);
  } else {
    const shiftedStarts = new Set(
      getShiftedCycles(state.cycleHistory).map((s) => s.start)
    );
    const rollingStats = getRollingStatisticalCycleData(fromISO(today()), 1);
    const rollingAvg = rollingStats ? Math.round(rollingStats.mean) : null;
    [...state.cycleHistory].reverse().forEach((c, idx) =>
      body.appendChild(
        buildHistoryRow(c, {
          isCurrentCycle: idx === 0 && isPeriodEpisodeActive(c.start),
          shiftedStarts,
          rollingAvg,
          dailyChart: true,
        })
      )
    );
  }

  overlay.appendChild(header);
  overlay.appendChild(body);
  document.body.appendChild(overlay);
}

function shareRecentPeriodHistory() {
  if (!state.cycleHistory?.length) {
    showToast(t("share_history_empty"));
    return;
  }

  const rows = [...state.cycleHistory]
    .slice(-6)
    .reverse()
    .map((c) => {
      const end = getPeriodEndDate(c.start);
      const dur = diffDays(fromISO(c.start), fromISO(end)) + 1;
      return `${formatPeriodDateRange(c.start, end)}  (${dur}d)`;
    });

  const subject = t("share_history_subject");
  const body = [t("share_history_intro"), "", ...rows].join("\n");
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Keep mailto URLs under common client limits (~2000 chars is plenty for 6 rows).
  window.location.href = mailto;
}

/** Optional flow/pain/mood summary over a period's days. */
function summarizeCycleSymptoms(startStr, endStr) {
  const start = fromISO(startStr);
  const days = diffDays(start, fromISO(endStr)) + 1;
  let heavyDays = 0, peakPain = null, painCount = 0;
  const moodCounts = { low: 0, neutral: 0, happy: 0 };
  for (let i = 0; i < days; i++) {
    const log = state.logs[toISO(addDays(start, i))];
    if (!log) continue;
    if (getFlowLevelFromLog(log) === 3) heavyDays++;
    const painVal = getPainValueFromLog(log);
    if (painVal != null) {
      peakPain = peakPain == null ? painVal : Math.max(peakPain, painVal);
      painCount++;
    }
    const moodVal = getMoodValueFromLog(log);
    if (moodVal != null) {
      if (moodVal < 35) moodCounts.low++;
      else if (moodVal > 65) moodCounts.happy++;
      else moodCounts.neutral++;
    }
  }
  const parts = [`Heavy flow: ${heavyDays}d`];
  if (painCount > 0)
    parts.push(peakPain === 0 ? "Pain: none recorded" : `Peak pain: ${peakPain}/10`);
  const typicalMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  if (typicalMood?.[1] > 0) parts.push(`Mood: mostly ${typicalMood[0]}`);
  return parts.join(" · ");
}

function collectCycleNotes(startStr, endStr) {
  const start = fromISO(startStr);
  const days = diffDays(start, fromISO(endStr)) + 1;
  const notes = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    const note = state.logs[toISO(date)]?.note?.trim();
    if (!note) continue;
    notes.push(
      `${date.toLocaleDateString(getLanguage(), { month: "short", day: "numeric" })}: ${note}`
    );
  }
  return notes.length ? notes.join(" · ") : "—";
}

function buildPrintSummaryContent(options = {}) {
  const includeSymptoms = !!options.includeSymptoms;
  const includeNotes = !!options.includeNotes;

  const wrap = document.createElement("div");

  const title = document.createElement("div");
  title.className = "print-summary__title";
  title.textContent = t("print_summary_title");
  wrap.appendChild(title);

  const generated = document.createElement("div");
  generated.className = "print-summary__generated";
  generated.textContent = t("print_summary_generated", {
    date: new Date().toLocaleDateString(getLanguage(), {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });
  wrap.appendChild(generated);

  const histTitle = document.createElement("div");
  histTitle.className = "print-summary__section-title";
  histTitle.textContent = t("cycle_history");
  wrap.appendChild(histTitle);

  if (!state.cycleHistory?.length) {
    const p = document.createElement("p");
    p.textContent = t("no_cycle_history");
    wrap.appendChild(p);
  } else {
    const table = document.createElement("table");
    table.className = "print-summary__table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    const headings = [t("history_col_dates"), t("history_col_period")];
    if (includeSymptoms) headings.push(t("print_summary_col_symptoms"));
    if (includeNotes) headings.push("Notes");
    headings.forEach((label) => {
      const th = document.createElement("th");
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    [...state.cycleHistory].reverse().forEach((c) => {
      const endStr = getPeriodEndDate(c.start);
      const durDays = diffDays(fromISO(c.start), fromISO(endStr)) + 1;

      const tr = document.createElement("tr");
      const dateTd = document.createElement("td");
      dateTd.textContent = formatPeriodDateRange(c.start, endStr);
      const durTd = document.createElement("td");
      durTd.textContent = `${durDays}d`;
      tr.appendChild(dateTd);
      tr.appendChild(durTd);
      if (includeSymptoms) {
        const symTd = document.createElement("td");
        symTd.textContent = summarizeCycleSymptoms(c.start, endStr);
        tr.appendChild(symTd);
      }
      if (includeNotes) {
        const notesTd = document.createElement("td");
        notesTd.textContent = collectCycleNotes(c.start, endStr);
        tr.appendChild(notesTd);
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
  }

  if (includeSymptoms) {
    const disclaimer = document.createElement("div");
    disclaimer.className = "print-summary__disclaimer";
    disclaimer.textContent = t("print_summary_disclaimer");
    wrap.appendChild(disclaimer);
  }

  return wrap;
}

/** Opens privacy choices; both sensitive options default off every time. */
function printCycleSummary() {
  if (!state.cycleHistory?.length) {
    showToast(t("share_history_empty"));
    return;
  }
  const symptoms = document.getElementById("print-include-symptoms");
  const notes = document.getElementById("print-include-notes");
  if (symptoms) symptoms.checked = false;
  if (notes) notes.checked = false;
  document.getElementById("print-options-overlay")?.classList.add("visible");
  setTimeout(() => symptoms?.focus(), 0);
}

function closePrintOptions() {
  document.getElementById("print-options-overlay")?.classList.remove("visible");
}

function confirmPrintCycleSummary() {
  const container = document.getElementById("print-summary");
  if (!container) return;
  const options = {
    includeSymptoms: !!document.getElementById("print-include-symptoms")?.checked,
    includeNotes: !!document.getElementById("print-include-notes")?.checked,
  };
  container.replaceChildren(buildPrintSummaryContent(options));
  closePrintOptions();
  // Let the browser paint the freshly-built content before opening the dialog.
  setTimeout(() => window.print(), 50);
}

function renderPeriodProfile() {
  const card = document.getElementById("period-profile-card");
  const stats = document.getElementById("period-profile-stats");
  const tracks = document.getElementById("period-profile-tracks");
  if (!card || !stats || !tracks) return;
  if (!state.cycleHistory?.length) {
    card.hidden = true;
    return;
  }

  const latest = state.cycleHistory[state.cycleHistory.length - 1];
  const endStr = getPeriodEndDate(latest.start);
  const duration = diffDays(fromISO(latest.start), fromISO(endStr)) + 1;
  if (duration < 1) {
    card.hidden = true;
    return;
  }

  const rows = [];
  for (let i = 0; i < duration; i++) {
    const dateStr = toISO(addDays(fromISO(latest.start), i));
    const log = state.logs[dateStr] || {};
    rows.push({
      dateStr,
      flow: getFlowLevelFromLog(log),
      flowEstimated: !!log.flowEstimated,
      pain: getPainValueFromLog(log),
      mood: getMoodValueFromLog(log),
    });
  }
  if (!rows.some((row) => row.flow != null && row.flow > 0)) {
    card.hidden = true;
    return;
  }

  card.hidden = false;
  stats.replaceChildren();
  tracks.replaceChildren();
  document.getElementById("period-profile-date").textContent =
    formatPeriodDateRange(latest.start, endStr);
  document.getElementById("period-profile-caption").textContent =
    "Latest recorded period";

  const addStat = (value, label) => {
    const box = document.createElement("div");
    box.className = "profile-stat";
    const strong = document.createElement("strong");
    strong.textContent = value;
    const span = document.createElement("span");
    span.textContent = label;
    box.append(strong, span);
    stats.appendChild(box);
  };

  const flowRows = rows.filter((row) => row.flow != null && row.flow > 0);
  const heavyDays = flowRows.filter((row) => row.flow === 3).length;
  const peakFlow = Math.max(...flowRows.map((row) => row.flow));
  const peakFlowDay = rows.findIndex((row) => row.flow === peakFlow) + 1;
  addStat(`${duration}d`, "Duration");
  addStat(String(heavyDays), "Heavy-flow days");
  addStat(`Day ${peakFlowDay}`, "Peak flow");

  const painRows = rows.filter((row) => row.pain != null);
  if (painRows.length) {
    const peakPain = Math.max(...painRows.map((row) => row.pain));
    addStat(peakPain === 0 ? "None" : `${peakPain}/10`, "Peak pain");
  }

  const moodRows = rows.filter((row) => row.mood != null);
  if (moodRows.length) {
    const counts = { Low: 0, Neutral: 0, Happy: 0 };
    moodRows.forEach((row) => {
      if (row.mood < 35) counts.Low++;
      else if (row.mood > 65) counts.Happy++;
      else counts.Neutral++;
    });
    const typical = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    addStat(typical, "Typical mood");
  }

  const addTrack = (label, values, renderCell) => {
    const row = document.createElement("div");
    row.className = "profile-track";
    const rowLabel = document.createElement("div");
    rowLabel.className = "profile-track-label";
    rowLabel.textContent = label;
    const days = document.createElement("div");
    days.className = "profile-track-days";
    days.style.setProperty("--profile-days", String(values.length));
    values.forEach((value, index) => {
      const cell = document.createElement("div");
      cell.className = "profile-day";
      cell.setAttribute("aria-label", `${label}, day ${index + 1}`);
      renderCell(cell, value, index);
      days.appendChild(cell);
    });
    row.append(rowLabel, days);
    tracks.appendChild(row);
  };

  addTrack("Flow", rows, (cell, row, index) => {
    if (row.flow > 0) cell.classList.add(`profile-day--flow-${row.flow}`);
    cell.textContent = String(index + 1);
    const flowLabel =
      row.flow == null ? t("log_not_recorded") : flowWordLabelFromValue(row.flow);
    cell.title = row.flowEstimated
      ? `Day ${index + 1}: estimated ${flowLabel}`
      : `Day ${index + 1}: ${flowLabel}`;
  });
  if (painRows.length) {
    addTrack("Pain", rows, (cell, row) => {
      if (row.pain == null) {
        cell.textContent = "—";
        return;
      }
      cell.classList.add("profile-day--pain");
      cell.style.setProperty("--pain-alpha", String(Math.max(0.12, row.pain / 10)));
      cell.textContent = row.pain === 0 ? "0" : String(row.pain);
    });
  }
  if (moodRows.length) {
    addTrack("Mood", rows, (cell, row) => {
      if (row.mood == null) {
        cell.textContent = "—";
        return;
      }
      if (row.mood < 35) {
        cell.classList.add("profile-day--mood-low");
        cell.textContent = "😔";
      } else if (row.mood > 65) {
        cell.classList.add("profile-day--mood-high");
        cell.textContent = "😊";
      } else {
        cell.classList.add("profile-day--mood-neutral");
        cell.textContent = "😐";
      }
    });
  }

  const totalPeriods = state.cycleHistory.length;
  const hasEstimatedFlow = rows.some((row) => row.flowEstimated);
  document.getElementById("period-profile-footnote").textContent =
    `Peak flow was recorded on Day ${peakFlowDay}. Based on ${totalPeriods} recorded period${totalPeriods === 1 ? "" : "s"}; missing symptoms are not treated as zero.${hasEstimatedFlow ? " Some flow days are estimated." : ""}`;
}

function fillStatsBlock(prefix, statsData) {
  const block = document.getElementById(`${prefix}-stats-block`);
  if (!block) return false;
  if (!statsData) {
    block.style.display = "none";
    return false;
  }
  block.style.display = "";
  safeText(`${prefix}-count`, String(statsData.count));
  safeText(`${prefix}-mean`, `${Math.round(statsData.mean)}d`);
  safeText(
    `${prefix}-std-dev`,
    statsData.stdDeviation !== null ? `±${statsData.stdDeviation}d` : "—"
  );
  safeText(`${prefix}-range`, `${statsData.min}–${statsData.max}d`);
  safeText(`${prefix}-variation`, `±${statsData.variation}d`);
  const regularityEl = document.getElementById(`${prefix}-regularity`);
  if (regularityEl) {
    const isRegular =
      statsData.stdDeviation !== null && statsData.stdDeviation < 1.5;
    regularityEl.textContent = isRegular ? t("stat_regular") : t("stat_variable");
    regularityEl.style.color = isRegular
      ? "var(--fertile-green)"
      : "var(--amber)";
  }
  return true;
}

function updateInsights() {
  const info = getCycleInfo();
  if (!info) return;
  renderPeriodProfile();

  const rollingStats = getRollingStatisticalCycleData(fromISO(today()), 1);
  const rollingDetailed = getRollingStatisticalCycleData(fromISO(today()), 3);
  const overallStats = getOverallStatisticalCycleData(3);

  safeText(
    "avg-cycle-rolling",
    (rollingStats ? Math.round(rollingStats.mean) : info.cl) + "d"
  );
  safeText(
    "avg-cycle-overall",
    overallStats ? Math.round(overallStats.mean) + "d" : "—"
  );
  safeText("avg-period", info.pd + "d");
  safeText(
    "tracked-cycles",
    state.cycleHistory?.length ? String(state.cycleHistory.length) : "—"
  );
  const fertileDaysStat = document.getElementById("fertile-days-stat");
  if (fertileDaysStat) fertileDaysStat.hidden = !isFertilityVisible();
  safeText("fertile-window", info.fertileEnd - info.fertileStart + 1);

  const statsPanel = document.getElementById("cycle-stats-panel");
  const hasRolling = fillStatsBlock("rolling", rollingDetailed || rollingStats);
  const hasOverall = fillStatsBlock("overall", overallStats);
  if (statsPanel) {
    statsPanel.style.display = hasRolling || hasOverall ? "" : "none";
  }

  const spreadFlag = document.getElementById("rolling-spread-flag");
  const spreadInfo = getRollingSpreadInfo();
  if (spreadFlag) {
    if (spreadInfo?.level) {
      spreadFlag.style.display = "";
      spreadFlag.className =
        spreadInfo.level === "irregular"
          ? "stats-flag stats-flag--irregular"
          : "stats-flag stats-flag--caution";
      spreadFlag.textContent =
        spreadInfo.level === "irregular"
          ? t("cycle_spread_irregular_short", { spread: spreadInfo.spread })
          : t("cycle_spread_caution_short", { spread: spreadInfo.spread });
    } else {
      spreadFlag.style.display = "none";
    }
  }

  const hist = document.getElementById("cycle-history");
  const histCount = document.getElementById("history-count");
  const shareBtn = document.getElementById("history-share-btn");
  if (!state.cycleHistory || state.cycleHistory.length === 0) {
    hist.innerHTML = "";
    const p = document.createElement("p");
    p.style.cssText = "color:var(--text-muted);font-size:0.875rem";
    p.textContent = t("no_cycle_history");
    hist.appendChild(p);
    if (histCount) histCount.textContent = "";
    if (shareBtn) shareBtn.hidden = true;
    return;
  }
  hist.innerHTML = "";
  const total = state.cycleHistory.length;
  const shown = Math.min(6, total);
  const shiftedStarts = new Set(
    getShiftedCycles(state.cycleHistory).map((c) => c.start)
  );
  const rollingAvg = rollingStats ? Math.round(rollingStats.mean) : null;
  [...state.cycleHistory]
    .slice(-shown)
    .reverse()
    .forEach((c, idx) =>
      hist.appendChild(
        buildHistoryRow(c, {
          isCurrentCycle: idx === 0 && isPeriodEpisodeActive(c.start),
          shiftedStarts,
          rollingAvg,
          dailyChart: true,
        })
      )
    );
  if (histCount) {
    histCount.textContent = t("history_showing", { shown, total });
  }
  if (shareBtn) {
    shareBtn.hidden = false;
    shareBtn.setAttribute("aria-label", t("share_history"));
    shareBtn.title = t("share_history");
  }

  renderPredictionsTab();
}

function initializePainChartControls() {
  // Symptom chart UI is not mounted in index.html — kept for future use.
  const monthSelect = document.getElementById("pain-view-month");
  if (!monthSelect) return;
  const yearSelect = document.getElementById("pain-view-year");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Set to 'All Months' by default to show full year
  if (monthSelect) monthSelect.value = "";

  // Populate year dropdown with last 5 years
  if (yearSelect) {
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      option.style.cssText = "background: #1a1a2e; color: white;";
      yearSelect.appendChild(option);
    }
    yearSelect.value = String(currentYear);
  }
}

let activeChartFilter = "all";

function setChartFilter(filter) {
  if (activeChartFilter === filter) {
    activeChartFilter = "all";
  } else {
    activeChartFilter = filter;
  }
  updateChartLegendUI();
  updatePainChart();
}

function updateChartLegendUI() {
  const items = ["period", "ovulation", "flow", "pain", "mood"];
  items.forEach((item) => {
    const el = document.getElementById("legend-" + item);
    if (!el) return;
    if (activeChartFilter === "all") {
      el.style.opacity = "1";
      el.style.backgroundColor = "transparent";
      el.setAttribute("aria-pressed", "true");
    } else if (activeChartFilter === item) {
      el.style.opacity = "1";
      el.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      el.setAttribute("aria-pressed", "true");
    } else {
      el.style.opacity = "0.3";
      el.style.backgroundColor = "transparent";
      el.setAttribute("aria-pressed", "false");
    }
  });
}

// Symptom chart — code kept for future use; UI not mounted in index.html.
// Re-enable initializePainChartControls() in init() when chart HTML is added back.

function updatePainChart() {
  renderPainChart();
}

function renderPainChart() {
  const canvas = document.getElementById("pain-chart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();

  // If canvas is hidden or no width, skip rendering
  if (rect.width === 0) {
    setTimeout(() => renderPainChart(), 100);
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = rect.width;
  const height = 300;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.height = height + "px";
  ctx.scale(dpr, dpr);

  const padding = { top: 25, right: 0, bottom: 40, left: 0 };
  const chartWidth = width; // Fill container fully
  const chartHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Get selected month and year
  const monthSelect = document.getElementById("pain-view-month");
  const yearSelect = document.getElementById("pain-view-year");
  const selectedMonthValue = monthSelect ? monthSelect.value : "";
  const selectedYear = yearSelect
    ? parseInt(yearSelect.value)
    : new Date().getFullYear();

  // Get data for selected period
  const isYearView = selectedMonthValue === "";
  const data = isYearView
    ? getPainDataYear(selectedYear)
    : getPainDataMonth(selectedYear, parseInt(selectedMonthValue));



  // Draw grid lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
  }

  // Draw axes
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartHeight);
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  ctx.stroke();

  // Draw bars and markers
  const barWidth = chartWidth / data.length;

  data.forEach((point, i) => {
    const x = padding.left + i * barWidth + barWidth / 2;
    const baseY = padding.top + chartHeight;

    // Draw period background (only in month view, not year view)
    if (
      point.isPeriod &&
      !isYearView &&
      (activeChartFilter === "all" || activeChartFilter === "period")
    ) {
      ctx.fillStyle = "rgba(255, 61, 107, 0.15)";
      ctx.fillRect(
        padding.left + i * barWidth,
        padding.top,
        barWidth,
        chartHeight
      );
    }

    // Draw ovulation marker (only in month view, not year view)
    if (
      point.isOvulation &&
      !isYearView &&
      (activeChartFilter === "all" || activeChartFilter === "ovulation")
    ) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
      ctx.fillRect(
        padding.left + i * barWidth,
        padding.top,
        barWidth,
        chartHeight
      );
    }

    // Draw symptom bars
    const symptoms = [];
    if (
      point.hasFlow &&
      (activeChartFilter === "all" || activeChartFilter === "flow")
    )
      symptoms.push({
        color: "#FF3D6B",
        intensity: point.flowIntensity || 1,
      });
    if (
      point.hasPain &&
      (activeChartFilter === "all" || activeChartFilter === "pain")
    )
      symptoms.push({
        color: "#FF6B4A",
        intensity: point.painIntensity || 1,
      });
    if (
      point.hasMood &&
      (activeChartFilter === "all" || activeChartFilter === "mood")
    )
      symptoms.push({
        isGradient: true,
        gradientColors: ["#8B7FE8", "#2ECC71"], // Purple (bottom) to Green (top)
        intensity: point.moodIntensity,
      });

    if (symptoms.length > 0) {
      // Fix segment width to always be 1/3 of the allocated day width
      const segmentWidth = (barWidth * 0.7) / 3;
      // Center the group of actual symptoms within the day's barWidth
      const groupWidth = symptoms.length * segmentWidth;
      const startX = padding.left + i * barWidth + (barWidth - groupWidth) / 2;

      symptoms.forEach((symptom, idx) => {
        const barHeight = chartHeight * symptom.intensity;

        if (symptom.isGradient) {
          // Determine gradient scale based on the total possible height
          const grad = ctx.createLinearGradient(
            0,
            baseY,
            0,
            baseY - chartHeight
          );
          grad.addColorStop(0, symptom.gradientColors[0]);
          grad.addColorStop(1, symptom.gradientColors[1]);
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = symptom.color;
        }

        ctx.fillRect(
          startX + idx * segmentWidth,
          baseY - barHeight,
          segmentWidth * 0.9,
          barHeight
        );
      });
    }
  });

  // Draw labels — skip some when too crowded
  ctx.fillStyle = "#999";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";

  // Show every Nth label so they don't overlap (min ~18px per label)
  const step = Math.ceil((data.length * 18) / chartWidth);

  data.forEach((point, i) => {
    if (i % step !== 0) return;
    const x = padding.left + i * barWidth + barWidth / 2;
    ctx.fillText(point.label, x, padding.top + chartHeight + 20);
  });
}

function getPainDataMonth(year, month) {
  const data = [];
  if (year === undefined || month === undefined) {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const info = getCycleInfo();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    const dayType = getDayType(dateStr);
    const log = state.logs[dateStr] || {};
    const flowLevel = getFlowLevelFromLog(log);
    const painValue = getPainValueFromLog(log);
    const moodValue = getMoodValueFromLog(log);

    data.push({
      label: String(d),
      hasFlow: flowLevel !== null,
      flowIntensity: flowLevel === null ? 0 : flowLevel / 3,
      hasPain: painValue !== null,
      painIntensity: painValue === null ? 0 : painValue / 10,
      hasMood: moodValue !== null,
      moodValue,
      moodIntensity: moodValue === null ? 0 : Math.max(0.1, moodValue / 100),
      isPeriod: dayType.includes("period"),
      isOvulation: dayType === "ovulation",
    });
  }

  return data;
}

function getPainDataYear(year) {
  const data = [];
  if (year === undefined) {
    const now = new Date();
    year = now.getFullYear();
  }

  for (let m = 0; m < 12; m++) {
    const monthStart = new Date(year, m, 1);
    const monthEnd = new Date(year, m + 1, 0);

    let flowSum = 0;
    let flowCount = 0;
    let painSum = 0;
    let painCount = 0;
    let moodSum = 0;
    let moodCount = 0;
    let periodDays = 0;
    let totalDays = monthEnd.getDate();

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(m + 1).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const log = state.logs[dateStr] || {};
      const dayType = getDayType(dateStr);
      const flowLevel = getFlowLevelFromLog(log);
      const painValue = getPainValueFromLog(log);
      const moodValue = getMoodValueFromLog(log);

      if (flowLevel !== null) {
        flowSum += flowLevel;
        flowCount++;
      }
      if (painValue !== null) {
        painSum += painValue;
        painCount++;
      }
      if (moodValue !== null) {
        moodSum += moodValue;
        moodCount++;
      }
      if (dayType.includes("period")) periodDays++;
    }

    const avgFlow = flowCount > 0 ? flowSum / flowCount : null;
    const avgPain = painCount > 0 ? painSum / painCount : null;
    const avgMood = moodCount > 0 ? moodSum / moodCount : null;

    data.push({
      label: monthStart.toLocaleString(getLanguage(), { month: "short" }),
      hasFlow: flowCount > 0,
      hasPain: painCount > 0,
      hasMood: moodCount > 0,
      flowValue: avgFlow,
      painValue: avgPain,
      moodValue: avgMood,
      flowIntensity: avgFlow === null ? 0 : avgFlow / 3,
      painIntensity: avgPain === null ? 0 : avgPain / 10,
      moodIntensity: avgMood === null ? 0 : Math.max(0.1, avgMood / 100),
      isPeriod: periodDays > 0,
      isOvulation: false,
    });
  }

  return data;
}

function downloadChart() {
  const originalCanvas = document.getElementById("pain-chart");
  if (!originalCanvas) return;

  try {
    const monthSelect = document.getElementById("pain-view-month");
    const yearSelect = document.getElementById("pain-view-year");
    const selectedMonth = monthSelect?.value || "";
    const selectedYear = yearSelect?.value || new Date().getFullYear();

    // Create month/year label
    let periodLabel;
    if (selectedMonth === "") {
      periodLabel = t("chart_full_year", { year: selectedYear });
    } else {
      const monthName = new Date(
        selectedYear,
        parseInt(selectedMonth)
      ).toLocaleString(getLanguage(), { month: "long" });
      periodLabel = t("chart_month_year", { month: monthName, year: selectedYear });
    }

    // Create a new canvas with header and footer
    const headerHeight = 100;
    const footerHeight = 40;
    const exportCanvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;

    exportCanvas.width = originalCanvas.width;
    exportCanvas.height =
      originalCanvas.height + (headerHeight + footerHeight) * dpr;

    const ctx = exportCanvas.getContext("2d");

    // Fill background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Load and draw logo
    const logo = new Image();
    logo.src = "icons/favicon-128x128.png";
    logo.onload = () => {
      // Draw logo (centered at top)
      const logoSize = 32 * dpr;
      const centerX = exportCanvas.width / 2;
      ctx.drawImage(logo, centerX - logoSize / 2, 20 * dpr, logoSize, logoSize);

      // Draw "My Cycle Keeper" text below logo
      ctx.fillStyle = "#A78BFA";
      ctx.font = `${16 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("My Cycle Keeper", centerX, 70 * dpr);

      // Draw period label (subtle, top right)
      ctx.font = `${13 * dpr}px sans-serif`;
      ctx.fillStyle = "#666";
      ctx.textAlign = "right";
      ctx.fillText(periodLabel, exportCanvas.width - 20 * dpr, 30 * dpr);

      // Draw original chart
      ctx.drawImage(originalCanvas, 0, headerHeight * dpr);

      // Draw footer
      ctx.fillStyle = "#333";
      ctx.fillRect(
        0,
        headerHeight * dpr + originalCanvas.height,
        exportCanvas.width,
        footerHeight * dpr
      );
      ctx.fillStyle = "#666";
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        APP_SHARE_URL,
        centerX,
        headerHeight * dpr + originalCanvas.height + 25 * dpr
      );

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const monthName =
          selectedMonth === ""
            ? "full-year"
            : new Date(selectedYear, parseInt(selectedMonth)).toLocaleString(
                "default",
                { month: "short" }
              );
        a.download = `cycle-tracking_${monthName}-${selectedYear}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };

    // Fallback if logo fails to load
    logo.onerror = () => {
      const centerX = exportCanvas.width / 2;

      // Draw "My Cycle Keeper" text
      ctx.fillStyle = "#A78BFA";
      ctx.font = `${16 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("My Cycle Keeper", centerX, 40 * dpr);

      // Draw period label
      ctx.font = `${13 * dpr}px sans-serif`;
      ctx.fillStyle = "#666";
      ctx.textAlign = "right";
      ctx.fillText(periodLabel, exportCanvas.width - 20 * dpr, 30 * dpr);

      // Draw original chart
      ctx.drawImage(originalCanvas, 0, headerHeight * dpr);

      // Draw footer
      ctx.fillStyle = "#333";
      ctx.fillRect(
        0,
        headerHeight * dpr + originalCanvas.height,
        exportCanvas.width,
        footerHeight * dpr
      );
      ctx.fillStyle = "#666";
      ctx.font = `${11 * dpr}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        `Private & Encrypted • ${APP_SHARE_URL}`,
        centerX,
        headerHeight * dpr + originalCanvas.height + 25 * dpr
      );

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const monthName =
          selectedMonth === ""
            ? "full-year"
            : new Date(selectedYear, parseInt(selectedMonth)).toLocaleString(
                "default",
                { month: "short" }
              );
        a.download = `cycle-tracking_${monthName}-${selectedYear}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
  } catch (error) {
    console.error("🚨 Chart download error:", error);
    showModal({
      icon: "⚠️",
      title: t("download_failed_title"),
      msg: t("download_failed_msg"),
      confirmText: t("ok"),
    });
  }
}

function renderCalendar() {
  const grid = document.getElementById("cal-grid");
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const todayStr = today();

  // Safe month label using Intl — no user input
  document.getElementById("cal-month-label").textContent = new Date(
    year,
    month,
    1
  ).toLocaleString(getLanguage(), { month: "long", year: "numeric" });

  // Generate localized weekday headers
  const weekdaysEl = document.getElementById("cal-weekdays");
  if (weekdaysEl) {
    weekdaysEl.innerHTML = "";
    const formatter = new Intl.DateTimeFormat(getLanguage(), { weekday: "short" });
    for (let i = 0; i < 7; i++) {
      const d = new Date(2023, 0, i + 1); // Jan 1 2023 is Sunday
      const el = document.createElement("div");
      el.className = "cal-weekday";
      el.textContent = formatter.format(d);
      weekdaysEl.appendChild(el);
    }
  }

  grid.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement("div");
    el.className = "cal-day empty";
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    const cell = document.createElement("div");
    const dayType = getDayType(dateStr);
    const log = state.logs[dateStr];
    const flowLevel = getFlowLevelFromLog(log);
    let cls = "cal-day";
    if (dayType === "period") cls += " period";
    else if (dayType === "predicted-period") cls += " predicted-period";
    else if (dayType === "ovulation" && isFertilityVisible()) cls += " ovulation";
    else if (dayType === "fertile" && isFertilityVisible()) cls += " fertile";
    if (dateStr === todayStr) cls += " today";
    if (dateStr === selectedDate) cls += " selected-log";
    if (flowLevel !== null) cls += ` flow-${flowLevel}`;
    else if (log) cls += " has-log";
    cell.className = cls;
    cell.textContent = d; // safe: numeric only
    cell.dataset.date = dateStr; // used internally only
    cell.tabIndex = 0; // Make focusable
    cell.setAttribute("role", "button");
    const flowSuffix =
      flowLevel !== null
        ? `, ${[t("flow_spotting"), t("flow_light"), t("flow_medium"), t("flow_heavy")][flowLevel]}`
        : "";
    cell.setAttribute(
      "aria-label",
      `${d}, ${
        dayType === "period"
          ? t("calendar_day_period")
          : dayType === "ovulation" && isFertilityVisible()
          ? t("calendar_day_ovulation")
          : dayType === "fertile" && isFertilityVisible()
          ? t("calendar_day_fertile")
          : dayType === "predicted-period"
          ? t("calendar_day_period_possible")
          : t("calendar_day_regular")
      }${flowSuffix}`
    );
    cell.addEventListener("click", () => selectDay(dateStr));
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectDay(dateStr);
      }
    });
    grid.appendChild(cell);
  }
}

function changeMonth(dir) {
  const logModal = document.getElementById("log-modal-overlay");
  if (logModal && logModal.classList.contains("visible")) {
    return;
  }

  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + dir, 1);
  renderCalendar();
}

function closeLogPanel() {
  const logModal = document.getElementById("log-modal-overlay");
  if (logModal) {
    logModal.classList.remove("visible");
  }

  // Re-enable calendar nav buttons
  const prevBtn = document.getElementById("cal-prev");
  const nextBtn = document.getElementById("cal-next");
  if (prevBtn) prevBtn.classList.remove("nav-disabled");
  if (nextBtn) nextBtn.classList.remove("nav-disabled");

  // Return focus to the calendar date that was selected (accessibility standard)
  const previousDate = selectedDate;
  selectedDate = null;
  renderCalendar();

  if (previousDate) {
    // Use setTimeout to ensure calendar has rendered
    setTimeout(() => {
      const dateCell = document.querySelector(
        `.cal-day[data-date="${previousDate}"]`
      );
      if (dateCell) {
        dateCell.focus();
      }
    }, 0);
  }
}

function selectDay(dateStr) {
  // Validate dateStr format before using
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
  selectedDate = dateStr;
  renderCalendar();
  const modal = document.getElementById("log-modal-overlay");
  modal.classList.add("visible");

  // Disable calendar nav buttons while log panel is open
  const prevBtn = document.getElementById("cal-prev");
  const nextBtn = document.getElementById("cal-next");
  if (prevBtn) prevBtn.classList.add("nav-disabled");
  if (nextBtn) nextBtn.classList.add("nav-disabled");
  const d = fromISO(dateStr);
  document.getElementById("log-panel-date").textContent = d.toLocaleDateString(
    getLanguage(),
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );

  const log = state.logs[dateStr] || {};
  const flowLevel = getFlowLevelFromLog(log);
  currentFlowEstimated = !!log.flowEstimated;
  updateFlowButtonVisual(
    flowLevel === null ? 1 : flowLevel,
    flowLevel !== null
  );

  const painValue = getPainValueFromLog(log);
  updatePainButtonVisual(
    painValue === null ? 5 : painValue,
    painValue !== null
  );

  const moodValue = getMoodValueFromLog(log);
  updateMoodButtonVisual(
    moodValue === null ? 50 : moodValue,
    moodValue !== null
  );

  // Safe value — textContent for note
  const noteEl = document.getElementById("log-note");
  noteEl.value = (log.note || "").slice(0, 500);
  updateNoteCount();
  updateLogEditorUI();
  toggleLogSection("flow");

  // "Force new cycle" is a one-time action for the next save, not a stored
  // property of the log — always reset when switching days. Only show the
  // option at all when there's a period day within the gap-tolerance window
  // (i.e. when the app would otherwise treat this as a continuation) —
  // showing it unconditionally is confusing when it's obviously a new cycle.
  const forceNewCycleEl = document.getElementById("log-force-new-cycle");
  if (forceNewCycleEl) forceNewCycleEl.checked = false;
  const showForceNewCycle = isSameMenses(dateStr);
  const forceNewCycleRow = document.getElementById("log-new-cycle-row");
  const forceNewCycleHint = document.getElementById("log-new-cycle-hint");
  if (forceNewCycleRow) forceNewCycleRow.style.display = showForceNewCycle ? "" : "none";
  if (forceNewCycleHint) forceNewCycleHint.style.display = showForceNewCycle ? "" : "none";

  // Move focus into modal immediately (accessibility standard for modal dialogs)
  setTimeout(() => {
    const firstButton = document.querySelector("#log-section-flow .log-section-toggle");
    if (firstButton) {
      firstButton.focus();
    }
  }, 0);
}

async function saveLog() {
  if (!selectedDate || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) return;
  const hadFlow = !!state.logs[selectedDate]?.flow;
  const log = {};
  if (currentFlowSet) {
    applyFlowLevelToLog(log, currentFlowValue);
    if (currentFlowEstimated && log.flow) log.flowEstimated = true;
  }

  if (currentPainSet) {
    log.pain = normalizePainValue(currentPainValue, 5);
  }

  if (currentMoodSet) {
    log.mood = normalizeMoodValue(currentMoodValue, 50);
  }

  const rawNote = document.getElementById("log-note").value;
  log.note = rawNote.slice(0, 500).replace(/[<>]/g, ""); // strip < > as extra guard

  const forceNewCycle = getForceNewCycleFlag();
  state.logs[selectedDate] = log;
  if (log.flow) {
    updateCycleHistory(selectedDate, forceNewCycle);
    recalculatePeriodDuration();
  }

  const didAutoFill = !hadFlow && log.flow
    ? applyAutoFill(selectedDate, log.flow, forceNewCycle)
    : false;

  cleanupEmptyLogs();
  if (hadFlow && !log.flow) {
    rebuildCycleHistoryFromLogs();
    recalculatePeriodDuration();
  }
  await save();

  renderCalendar();
  updateStatusCard();
  updateInsights();
  if (navigator.vibrate) navigator.vibrate(40);

  if (didAutoFill) {
    try { showAutoFillBanner(getAutoFillDayCount()); } catch (_) {}
  }
}

function updateCycleHistory(dateStr, forceNewCycle = false) {
  if (!state.cycleHistory) state.cycleHistory = [];

  // Bleeding gap tolerance: if this flow date is within 1 day of an already-
  // logged flow day, it belongs to the same menses — skip creating a new cycle.
  // `forceNewCycle` (the log panel's "This is a new period" checkbox) bypasses
  // this for cases the heuristic gets wrong (e.g. spotting shortly before the
  // real flow starts).
  if (!forceNewCycle && isSameMenses(dateStr)) return;

  const hist = state.cycleHistory;
  if (hist.length > 0) {
    const last = hist[hist.length - 1];
    if (last.start === dateStr) return;
    const len = diffDays(fromISO(last.start), fromISO(dateStr));
    // A date earlier than the last recorded start isn't a new cycle — likely a
    // backfilled/corrected log for the current or a past episode. Ignore rather
    // than corrupt the sequential history with a negative-length entry.
    if (len <= 0) return;
    // Always advance to a new cycle, even if the gap is unusually short/long
    // (out-of-range lengths are excluded from rolling/overall stats by
    // isValidCycleLength in cycles.js, but the episode itself must still be
    // recorded — otherwise lastPeriodStart goes stale and late-period /
    // prediction logic silently breaks for anyone with a long cycle gap).
    hist[hist.length - 1].length = len;
    hist.push({ start: dateStr, length: state.cycleLength });
    recalculateCycleLength(hist);
    recalculatePeriodDuration();
    state.lastPeriodStart = dateStr;
  } else {
    hist.push({ start: dateStr, length: state.cycleLength });
    state.lastPeriodStart = dateStr;
  }
}

async function savePeriodDuration() {
  const pd = parseInt(document.getElementById("s-period-dur").value);
  if (isNaN(pd) || pd < 1 || pd > 10) {
    showModal({
      icon: "⚠️",
      title: t("invalid_duration_title"),
      msg: t("invalid_duration_msg"),
      cancelText: "",
      confirmText: t("ok"),
    });
    return;
  }
  state.periodDuration = pd;
  await save();
  updateStatusCard();
  renderCalendar();
  updateInsights();
  showToast(t("settings_saved_toast"));
}

async function saveTolerance() {
  const raw = document.getElementById("s-tolerance").value.trim();
  const val = raw === "" ? null : parseInt(raw);
  if (val !== null && (isNaN(val) || val < 0 || val > 5)) return;
  state.toleranceDays = val;
  await save();
  renderCalendar();
  showToast(t("settings_saved_toast"));
}

async function buildBackupBundle() {
  const salt = await getOrCreateSalt();
  const enc = await encryptData(state, sessionPin, salt);
  const saltB64 = btoa(String.fromCharCode(...salt));
  return JSON.stringify({ enc, salt: saltB64, v: 1 });
}

function parseBackupBundleText(text) {
  const bundle = JSON.parse(text);
  if (bundle.v !== 1) throw new Error("invalid_version");
  const backupSalt = Uint8Array.from(atob(bundle.salt), (c) => c.charCodeAt(0));
  return { bundle, backupSalt };
}

async function updateDriveBackupUI() {
  const statusEl = document.getElementById("drive-backup-status");
  const connectBtn = document.getElementById("btn-drive-connect");
  const syncBtn = document.getElementById("btn-drive-sync");
  const disconnectBtn = document.getElementById("btn-drive-disconnect");
  const autoRow = document.getElementById("drive-auto-row");
  const autoHint = document.getElementById("drive-auto-hint");
  const notConfigured = document.getElementById("drive-not-configured");

  if (!statusEl) return;

  if (!isDriveConfigured()) {
    if (notConfigured) notConfigured.classList.remove("hidden");
    statusEl.textContent = t("drive_not_configured");
    statusEl.className = "backup-status backup-status--warn";
    if (connectBtn) connectBtn.classList.add("hidden");
    if (syncBtn) syncBtn.classList.add("hidden");
    if (disconnectBtn) disconnectBtn.classList.add("hidden");
    if (autoRow) autoRow.classList.add("hidden");
    if (autoHint) autoHint.classList.add("hidden");
    return;
  }
  if (notConfigured) notConfigured.classList.add("hidden");

  const connected = await isDriveConnected();
  if (!connected) {
    resetDisconnectButton();
    statusEl.textContent = t("drive_status_not_connected");
    statusEl.className = "backup-status";
    if (connectBtn) connectBtn.classList.remove("hidden");
    if (syncBtn) syncBtn.classList.add("hidden");
    if (disconnectBtn) disconnectBtn.classList.add("hidden");
    if (autoRow) autoRow.classList.add("hidden");
    if (autoHint) autoHint.classList.add("hidden");
    return;
  }

  const lastSync = await getDriveLastSyncTime();
  if (lastSync) {
    statusEl.textContent = t("drive_status_last_backup", { date: formatDateLocale(lastSync) });
    statusEl.className = "backup-status backup-status--ok";
  } else {
    statusEl.textContent = t("drive_status_never_synced");
    statusEl.className = "backup-status backup-status--warn";
  }

  if (connectBtn) connectBtn.classList.add("hidden");
  if (syncBtn) syncBtn.classList.remove("hidden");
  if (disconnectBtn) disconnectBtn.classList.remove("hidden");
  if (autoRow) autoRow.classList.remove("hidden");
  if (autoHint) autoHint.classList.remove("hidden");

  const autoCb = document.getElementById("drive-auto-backup");
  if (autoCb) autoCb.checked = await isDriveAutoBackupEnabled();
}

async function performDriveBackupUpload(showSuccessToast = true) {
  if (!sessionPin) {
    if (showSuccessToast) throw new Error("not_unlocked");
    return;
  }
  if (!(await isDriveConnected())) {
    if (showSuccessToast) throw new Error("not_connected");
    return;
  }
  const bundle = await buildBackupBundle();
  const syncDate = await uploadDriveBackup(bundle);
  await setInDB(BACKUP_KEY, syncDate);
  backupReminderShownThisSession = true;
  updateBackupStatus();
  updateDriveBackupUI();
  if (showSuccessToast) showToast(t("drive_sync_success_toast"));
}

function driveSyncErrorMessage(err) {
  const code = String(err?.message || "");
  if (code === "reconnect_required") return t("drive_reconnect_msg");
  if (code === "not_connected") return t("drive_sync_not_connected");
  if (code === "not_unlocked") return t("drive_sync_not_unlocked");
  if (code === "offline") return t("drive_sync_offline");
  if (code.startsWith("drive_verify_failed") || code.startsWith("drive_upload_failed")) {
    return t("drive_sync_failed_msg");
  }
  return t("drive_sync_failed_msg");
}

async function connectGoogleDrive() {
  if (!isDriveConfigured()) {
    showModal({
      icon: "☁️",
      title: t("drive_section_title"),
      msg: t("drive_not_configured"),
      cancelText: "",
      confirmText: t("ok"),
    });
    return;
  }
  try {
    await startDriveConnect();
  } catch (err) {
    showModal({
      icon: "⚠️",
      title: t("drive_sync_failed_title"),
      msg: t("drive_sync_failed_msg"),
      cancelText: "",
      confirmText: t("ok"),
    });
  }
}

async function syncGoogleDriveNow() {
  if (!sessionPin) return;
  try {
    await performDriveBackupUpload(true);
  } catch (err) {
    showModal({
      icon: "⚠️",
      title: t("drive_sync_failed_title"),
      msg: driveSyncErrorMessage(err),
      cancelText: "",
      confirmText: t("ok"),
    });
    updateDriveBackupUI();
  }
}

let _disconnectArmed = false;
let _disconnectArmTimer = null;
let _disconnectInProgress = false;

function resetDisconnectButton() {
  _disconnectArmed = false;
  clearTimeout(_disconnectArmTimer);
  const btn = document.getElementById("btn-drive-disconnect");
  if (!btn) return;
  btn.classList.remove("danger-btn");
  btn.classList.add("apply-btn", "btn--secondary");
  btn.textContent = t("drive_disconnect_btn");
}

async function performDriveDisconnect() {
  if (_disconnectInProgress) return;
  _disconnectInProgress = true;
  _disconnectArmed = false;
  clearTimeout(_disconnectArmTimer);
  const btn = document.getElementById("btn-drive-disconnect");
  if (btn) {
    btn.disabled = true;
    btn.textContent = t("drive_disconnecting");
  }
  try {
    cancelScheduledDriveBackupUpload();
    await disconnectDrive();
    resetDisconnectButton();
    await updateDriveBackupUI();
    showToast(t("drive_disconnected_toast"));
  } catch (err) {
    console.error("[Drive] disconnect failed:", err);
    resetDisconnectButton();
    await updateDriveBackupUI();
    showToast(t("drive_disconnect_failed"));
  } finally {
    if (btn) btn.disabled = false;
    _disconnectInProgress = false;
  }
}

function disconnectGoogleDrive() {
  if (_disconnectInProgress) return;
  if (!_disconnectArmed) {
    _disconnectArmed = true;
    const btn = document.getElementById("btn-drive-disconnect");
    if (btn) {
      btn.textContent = t("drive_disconnect_confirm_btn");
      btn.classList.remove("btn--secondary");
      btn.classList.add("danger-btn");
    }
    showToast(t("drive_disconnect_tap_again"), 3500);
    clearTimeout(_disconnectArmTimer);
    _disconnectArmTimer = setTimeout(resetDisconnectButton, 8000);
    return;
  }
  void performDriveDisconnect();
}

async function toggleDriveAutoBackup() {
  const cb = document.getElementById("drive-auto-backup");
  if (!cb) return;
  await setDriveAutoBackup(cb.checked);
  if (cb.checked && sessionPin) {
    scheduleDriveBackupUpload(() => performDriveBackupUpload(false));
  } else {
    cancelScheduledDriveBackupUpload();
  }
}

async function maybeShowDriveOAuthError() {
  const err = await consumeDriveOAuthError();
  if (!err) return;
  const msgKey = getDriveOAuthErrorKey(err);
  let msg = t(msgKey);
  const detail = getDriveOAuthErrorDetail(err);
  if (detail && msgKey === "drive_sync_failed_msg") {
    msg = `${msg}\n\n(${detail})`;
  } else if (detail && msgKey === "drive_oauth_invalid_grant") {
    msg = `${msg}\n\nGoogle: ${detail}`;
  }
  showModal({
    icon: "⚠️",
    title: t("drive_sync_failed_title"),
    msg,
    cancelText: "",
    confirmText: t("ok"),
  });
}

async function maybeCompleteDriveConnectFlow() {
  if (await consumeDriveShowConnectedToast()) {
    updateDriveBackupUI();
    showToast(t("drive_connected_toast"));
    return;
  }

  if (!(await consumeDrivePendingRestore())) {
    updateDriveBackupUI();
    return;
  }

  if (!(await isDriveConnected())) {
    updateDriveBackupUI();
    return;
  }

  showModal({
    icon: "☁️",
    title: t("drive_restore_found_title"),
    msg: t("drive_restore_found_msg"),
    confirmText: t("drive_restore_confirm"),
    cancelText: t("drive_restore_skip"),
    onConfirm: async () => {
      try {
        const text = await downloadDriveBackup();
        if (!text) {
          showToast(t("drive_sync_failed_msg"));
          updateDriveBackupUI();
          return;
        }
        const { bundle, backupSalt } = parseBackupBundleText(text);
        _showImportPinModal(bundle, backupSalt);
      } catch (_) {
        showModal({
          icon: "⚠️",
          title: t("drive_sync_failed_title"),
          msg: t("drive_sync_failed_msg"),
          cancelText: "",
          confirmText: t("ok"),
        });
      }
      updateDriveBackupUI();
    },
    onCancel: () => {
      updateDriveBackupUI();
      showToast(t("drive_connected_toast"));
    },
  });
}

async function updateBackupStatus() {
  const el = document.getElementById("backup-status");
  if (!el) return;
  const lastBackup = await getFromDB(BACKUP_KEY);
  if (!lastBackup) {
    el.textContent = t("backup_never");
    el.className = "backup-status backup-status--warn";
    return;
  }
  const days = Math.floor((new Date() - fromISO(lastBackup)) / 86400000);
  if (days === 0) {
    el.textContent = t("backup_today");
    el.className = "backup-status backup-status--ok";
  } else if (days === 1) {
    el.textContent = t("backup_yesterday");
    el.className = "backup-status backup-status--ok";
  } else if (days <= 30) {
    el.textContent = tp("backup_days_ago", days);
    el.className = "backup-status backup-status--ok";
  } else {
    el.textContent = tp("backup_overdue", days);
    el.className = "backup-status backup-status--warn";
  }
}

function loadSettingsFields() {
  const pdInput = document.getElementById("s-period-dur");
  if (pdInput) pdInput.value = state.periodDuration;

  const tolInput = document.getElementById("s-tolerance");
  if (tolInput) tolInput.value = state.toleranceDays != null ? state.toleranceDays : "";

  const cbFertility = document.getElementById("s-show-fertility");
  if (cbFertility) cbFertility.checked = isFertilityVisible();

  const cbCyclePhases = document.getElementById("s-show-cycle-phases");
  if (cbCyclePhases) cbCyclePhases.checked = isCyclePhaseTimelineVisible();

  const afInput = document.getElementById("s-autofill-days");
  if (afInput) {
    afInput.value =
      state.autoFillDays != null ? String(state.autoFillDays) : "";
    afInput.placeholder = t("settings_autofill_auto");
  }

  calculateStorageUsage();
  updateBackupStatus();
  updateDriveBackupUI();
}

async function toggleFertility() {
  const cb = document.getElementById("s-show-fertility");
  if (!cb) return;
  state.showFertility = cb.checked;
  await save();
  renderCalendar();
  updateStatusCard();
  updateInsights();
}

async function toggleCyclePhaseTimeline() {
  const cb = document.getElementById("s-show-cycle-phases");
  if (!cb) return;
  state.showCyclePhases = cb.checked;
  await save();
  updateStatusCard();
}

async function saveAutoFillDays() {
  const input = document.getElementById("s-autofill-days");
  const raw = input?.value.trim() ?? "";
  if (raw === "") {
    state.autoFillDays = null;
  } else {
    const val = parseInt(raw);
    if (isNaN(val) || val < 0 || val > 10) return;
    state.autoFillDays = val;
  }
  await save();
  showToast(t("settings_saved_toast"));
}

function recalculateCycleHistoryWithConfirm() {
  showModal({
    icon: "🔄",
    title: t("settings_recalc_confirm_title"),
    msg: t("settings_recalc_confirm_msg"),
    confirmText: t("settings_recalc_confirm_btn"),
    cancelText: t("cancel"),
    onConfirm: async () => {
      rebuildCycleHistoryFromLogs();
      await save();
      renderCalendar();
      updateStatusCard();
      updateInsights();
      showToast(t("settings_recalc_done_toast"));
    },
  });
}

let _autoFillBannerDismiss = null;

function showAutoFillBanner(n) {
  const banner = document.getElementById("autofill-banner");
  const msg = document.getElementById("autofill-banner-msg");
  const link = document.getElementById("autofill-banner-settings-link");
  const backupLink = document.getElementById("autofill-banner-backup-link");
  if (!banner || !msg) return;
  msg.textContent = tp("autofill_banner_msg", n);
  link.onclick = (e) => { e.preventDefault(); dismissAutoFillBanner(); switchTab("settings"); };
  if (backupLink) backupLink.onclick = (e) => { e.preventDefault(); dismissAutoFillBanner(); exportData(); };
  banner.classList.remove("hidden");
  // Dismiss when clicking anywhere outside the banner
  setTimeout(() => {
    _autoFillBannerDismiss = (e) => {
      if (!banner.contains(e.target)) dismissAutoFillBanner();
    };
    document.addEventListener("click", _autoFillBannerDismiss);
  }, 0);
}

function dismissAutoFillBanner() {
  const banner = document.getElementById("autofill-banner");
  if (banner) banner.classList.add("hidden");
  if (_autoFillBannerDismiss) {
    document.removeEventListener("click", _autoFillBannerDismiss);
    _autoFillBannerDismiss = null;
  }
}

function exportToDrip() {
  const logs = state.logs || {};
  const count = Object.keys(logs).filter(d => {
    const l = logs[d];
    return l.flow || l.spotting || l.pain != null || l.mood != null || (l.note && l.note.trim());
  }).length;

  if (count === 0) {
    showModal({
      icon: "📭",
      title: "No data to export",
      msg: "Log some cycle data first, then come back to export.",
      confirmText: t("ok"),
      cancelText: "",
    });
    return;
  }

  showModal({
    icon: "📤",
    title: "Export to drip CSV",
    msg: `Export ${count} days of data as a drip-compatible CSV?\n\nPain and mood are converted to drip\'s flag format; the original values are preserved in the note columns so nothing is lost.`,
    confirmText: "Export",
    cancelText: t("cancel"),
    onConfirm: () => {
      const csv = buildDripCsv(logs);
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `drip-export_${today()}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  });
}

async function exportData() {
  if (!sessionPin) return;
  showModal({
    icon: "📦",
    title: t("export_backup_title"),
    msg: t("export_backup_msg"),
    confirmText: t("export"),
    cancelText: t("cancel"),
    onConfirm: async () => {
      try {
        const bundle = await buildBackupBundle();
        const blob = new Blob([bundle], {
          type: "application/octet-stream",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `mycyclekeeper_backup_${today()}.bin`;
        a.click();
        URL.revokeObjectURL(a.href);
        await setInDB(BACKUP_KEY, today());
        backupReminderShownThisSession = true;
        updateBackupStatus();
      } catch (error) {
        console.error("🚨 Export error:", error);
        showModal({
          icon: "⚠️",
          title: t("export_failed_title"),
          msg: t("export_failed_msg"),
          confirmText: t("ok"),
        });
      }
    },
  });
}

let _importPinBuffer = "";
let _importOnSuccessCallback = null;
let _importPinContext = null;
let _importPinSubmitting = false;

function _clearImportPinContext() {
  _importPinBuffer = "";
  _importPinContext = null;
  _importPinSubmitting = false;
}

function _handleImportPinKeyboardInput(key) {
  if (!_importPinContext) return;
  _importPinInput(
    key,
    _importPinContext.bundle,
    _importPinContext.backupSalt
  );
}

function _restoreModalBox() {
  _clearImportPinContext();
  const box = document.querySelector("#modal-overlay .modal-box");
  if (!box) return;
  const icon = document.createElement("div");
  icon.className = "modal-icon"; icon.id = "modal-icon"; icon.textContent = "⚠️";
  const title = document.createElement("div");
  title.className = "modal-title"; title.id = "modal-title";
  const msg = document.createElement("div");
  msg.className = "modal-msg"; msg.id = "modal-msg";
  const btns = document.createElement("div");
  btns.className = "modal-btns";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "modal-btn secondary"; cancelBtn.id = "modal-cancel";
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "modal-btn primary"; confirmBtn.id = "modal-confirm";
  btns.appendChild(cancelBtn);
  btns.appendChild(confirmBtn);
  box.replaceChildren(icon, title, msg, btns);
}

function _showImportPinModal(bundle, backupSalt) {
  _importPinBuffer = "";
  _importPinContext = { bundle, backupSalt };
  _importPinSubmitting = false;
  const overlay = document.getElementById("modal-overlay");
  const box = overlay.querySelector(".modal-box");

  const iconEl = document.createElement("div");
  iconEl.className = "modal-icon";
  iconEl.textContent = "🔑";

  const titleEl = document.createElement("div");
  titleEl.className = "modal-title";
  titleEl.textContent = t("enter_backup_pin_title");

  const msgEl = document.createElement("div");
  msgEl.className = "modal-msg";
  msgEl.id = "ipin-msg";
  msgEl.textContent = t("enter_backup_pin_msg");

  const dotsWrap = document.createElement("div");
  dotsWrap.id = "ipin-dots";
  dotsWrap.style.cssText =
    "display:flex;gap:0.75rem;justify-content:center;margin:1rem 0";
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("div");
    dot.className = "pin-dot";
    dot.id = "ipd" + i;
    dotsWrap.appendChild(dot);
  }

  const padWrap = document.createElement("div");
  padWrap.style.cssText =
    "display:grid;grid-template-columns:repeat(3,4.25rem);gap:0.625rem;justify-content:center;margin-bottom:0.875rem";
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].forEach((k) => {
    if (k === "") {
      padWrap.appendChild(document.createElement("div"));
      return;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "num-btn";
    btn.style.cssText = "width:4.25rem;height:4.25rem";
    btn.textContent = k;
    btn.addEventListener("click", () =>
      _importPinInput(k, bundle, backupSalt)
    );
    padWrap.appendChild(btn);
  });

  const btnsDiv = document.createElement("div");
  btnsDiv.className = "modal-btns";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "modal-btn secondary";
  cancelBtn.textContent = t("cancel");
  cancelBtn.addEventListener("click", () => {
    overlay.classList.remove("visible");
    _clearImportPinContext();
    _restoreModalBox();
  });
  btnsDiv.appendChild(cancelBtn);

  box.replaceChildren(iconEl, titleEl, msgEl, dotsWrap, padWrap, btnsDiv);
  overlay.classList.add("visible");
  setTimeout(() => padWrap.querySelector("button")?.focus(), 0);
}

function _importPinInput(key, bundle, backupSalt) {
  if (_importPinSubmitting) return;
  if (key === "⌫") {
    _importPinBuffer = _importPinBuffer.slice(0, -1);
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById("ipd" + i);
      if (el) el.classList.toggle("filled", i < _importPinBuffer.length);
    }
    return;
  }
  if (!/^\d$/.test(key)) return;
  if (_importPinBuffer.length >= 4) return;
  _importPinBuffer += key;
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("ipd" + i);
    if (el) el.classList.toggle("filled", i < _importPinBuffer.length);
  }
  if (_importPinBuffer.length === 4) {
    _importPinSubmitting = true;
    setTimeout(() => _submitImportPin(bundle, backupSalt), 150);
  }
}

async function _submitImportPin(bundle, backupSalt) {
  const enteredPin = _importPinBuffer;
  try {
    const restored = await decryptData(bundle.enc, enteredPin, backupSalt);
    if (!restored) {
      const msgEl = document.getElementById("ipin-msg");
      if (msgEl) {
        msgEl.textContent = t("incorrect_pin_simple");
        msgEl.style.color = "var(--danger, #f87171)";
      }
      _importPinBuffer = "";
      for (let i = 0; i < 4; i++) {
        const el = document.getElementById("ipd" + i);
        if (el) el.classList.remove("filled");
      }
      _importPinSubmitting = false;
      return;
    }
    // Decryption succeeded — restore data, keep current session PIN and salt
    state = restored;
    setCyclesState(state);
    setPeriodMarkingState(state);
    await save(); // re-encrypts with current sessionPin + current salt
    document.getElementById("modal-overlay").classList.remove("visible");
    _clearImportPinContext();
    _restoreModalBox();

    if (_importOnSuccessCallback) {
      const onSuccess = _importOnSuccessCallback;
      _importOnSuccessCallback = null;
      await onSuccess();
      return;
    }

    renderCalendar();
    updateStatusCard();
    updateInsights();
    showModal({
      icon: "✅",
      title: t("restored_title"),
      msg: t("restored_msg"),
      cancelText: "",
      confirmText: t("ok"),
    });
  } catch {
    const msgEl = document.getElementById("ipin-msg");
    if (msgEl) {
      msgEl.textContent = t("incorrect_pin_simple");
      msgEl.style.color = "var(--danger, #f87171)";
    }
    _importPinBuffer = "";
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById("ipd" + i);
      if (el) el.classList.remove("filled");
    }
    _importPinSubmitting = false;
  }
}

async function importData() {
  _pickAndImportBackup();
}

async function importDataOnboarding() {
  if (setupPin.length < 4) return;
  sessionPin = setupPin;
  _importOnSuccessCallback = async () => {
    await _finishOnboardingAfterImport(
      t("restored_title"),
      t("restored_msg")
    );
  };
  _pickAndImportBackup();
}

async function _applyDripCsvToState(parsed) {
  const mergedLogs = { ...parsed.logs };
  for (const date in mergedLogs) {
    const l = mergedLogs[date];
    if (!l.flow && !l.spotting && l.pain == null && l.mood == null && !(l.note && l.note.trim())) {
      delete mergedLogs[date];
    }
  }

  const { cycleHistory, lastPeriodStart } = buildCycleHistoryFromLogs(
    mergedLogs,
    state.cycleLength || 28
  );

  state.logs = mergedLogs;
  state.cycleHistory = cycleHistory;
  if (lastPeriodStart) state.lastPeriodStart = lastPeriodStart;
  if (cycleHistory.length) {
    recalculateCycleLength(cycleHistory);
    recalculatePeriodDuration();
  }

  setCyclesState(state);
  setPeriodMarkingState(state);
  await save();
  return Object.keys(mergedLogs).length;
}

async function _finishOnboardingAfterImport(successTitle, successMsg, dayCount) {
  try {
    const salt = await getOrCreateSalt();
    const pinHash = await hashPin(setupPin, salt);
    await setInDB(PINHASH_KEY, pinHash);
    await finishOnboarding();
    showModal({
      icon: "✅",
      title: successTitle,
      msg: typeof successMsg === "function" ? successMsg(dayCount) : successMsg,
      cancelText: "",
      confirmText: t("ok"),
    });
  } catch (error) {
    console.error("🚨 Onboarding import error:", error);
    showModal({
      icon: "⚠️",
      title: t("setup_error_title"),
      msg: t("setup_error_msg"),
      confirmText: t("ok"),
    });
  }
}

let _csvImportOnboarding = false;

function showCsvImportPanel({ onboarding = false } = {}) {
  _csvImportOnboarding = onboarding;
  if (onboarding && setupPin.length >= 4) sessionPin = setupPin;
  const overlay = document.getElementById("csv-import-overlay");
  if (overlay) {
    overlay.classList.remove("hidden");
    applyI18n();
  }
}

function closeCsvImportPanel() {
  document.getElementById("csv-import-overlay")?.classList.add("hidden");
}

function chooseCsvImportFile() {
  closeCsvImportPanel();
  _pickDripCsvFile({ onboarding: _csvImportOnboarding });
}

function _pickDripCsvFile({ onboarding = false } = {}) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,text/csv,text/comma-separated-values,text/plain";
  input.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseDripCsv(await file.text());
      if (parsed.error) {
        showModal({
          icon: "❌",
          title: t("drip_import_failed_title"),
          msg: parsed.error,
          cancelText: "",
          confirmText: t("ok"),
        });
        return;
      }
      if (parsed.dayCount === 0) {
        showModal({
          icon: "❌",
          title: t("drip_import_empty_title"),
          msg: t("drip_import_empty_msg"),
          cancelText: "",
          confirmText: t("ok"),
        });
        return;
      }

      if (onboarding) {
        if (setupPin.length < 4) return;
        sessionPin = setupPin;
        const dayCount = await _applyDripCsvToState(parsed);
        await _finishOnboardingAfterImport(
          t("drip_import_done_title"),
          (n) => t("drip_import_done_msg", { days: n }),
          dayCount
        );
        return;
      }

      showModal({
        icon: "📂",
        title: t("drip_import_title"),
        msg: t("drip_import_found", {
          days: parsed.dayCount,
          periods: parsed.periodCount,
        }),
        confirmText: t("drip_import_merge"),
        cancelText: t("drip_import_replace"),
        onConfirm: async () => {
          const merged = { ...parsed.logs, ...(state.logs || {}) };
          for (const date in merged) {
            const l = merged[date];
            if (!l.flow && !l.spotting && l.pain == null && l.mood == null && !(l.note && l.note.trim())) {
              delete merged[date];
            }
          }
          const applied = await _applyDripCsvToState({
            ...parsed,
            logs: merged,
            dayCount: Object.keys(merged).length,
          });
          renderCalendar();
          updateStatusCard();
          updateInsights();
          showToast(t("drip_import_done_msg", { days: applied }));
        },
        onCancel: async () => {
          const applied = await _applyDripCsvToState(parsed);
          renderCalendar();
          updateStatusCard();
          updateInsights();
          showToast(t("drip_import_done_msg", { days: applied }));
        },
      });
    } catch {
      showModal({
        icon: "❌",
        title: t("drip_import_failed_title"),
        msg: t("drip_import_failed_msg"),
        cancelText: "",
        confirmText: t("ok"),
      });
    }
  });
  input.click();
}

async function importDripCsvOnboarding() {
  if (setupPin.length < 4) return;
  showCsvImportPanel({ onboarding: true });
}

function importDripCsv() {
  showCsvImportPanel({ onboarding: false });
}

function _pickAndImportBackup() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".bin";
  input.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { bundle, backupSalt } = parseBackupBundleText(text);
      _showImportPinModal(bundle, backupSalt);
    } catch (err) {
      if (err?.message === "invalid_version") {
        showModal({
          icon: "❌",
          title: t("invalid_backup_title"),
          msg: t("invalid_backup_msg"),
          cancelText: "",
          confirmText: t("ok"),
        });
        return;
      }
      showModal({
        icon: "❌",
        title: t("import_failed_title"),
        msg: t("import_failed_msg"),
        cancelText: "",
        confirmText: t("ok"),
      });
    }
  });
  input.click();
}


async function calculateStorageUsage() {
  try {
    const bytes = await calculateDBStorageUsage();
    const sizeKB = (bytes / 1024).toFixed(2);
    const usageSpan = document.getElementById("storage-usage");
    if (usageSpan) {
      usageSpan.textContent = t("storage_used", { sizeKB });
    }
  } catch (error) {
    console.warn("⚠️ Could not calculate storage:", error);
    const usageSpan = document.getElementById("storage-usage");
    if (usageSpan) {
      usageSpan.textContent = t("storage_unknown");
    }
  }
}

function confirmClear() {
  showModal({
    icon: "🗑️",
    title: t("erase_title"),
    msg: t("erase_msg"),
    confirmText: t("erase_confirm"),
    cancelText: t("cancel"),
    onConfirm: async () => {
      try {
        await clearDB();
        location.reload();
      } catch (error) {
        console.error("🚨 Clear error:", error);
        showModal({
          icon: "⚠️",
          title: t("erase_failed_title"),
          msg: t("erase_failed_msg"),
          confirmText: t("ok"),
        });
      }
    },
  });
}

let changePinStage = "new"; // 'new' | 'confirm'
let changePinFirst = "";
let changePinBuffer = "";

function showChangePinModal() {
  changePinStage = "new";
  changePinFirst = "";
  changePinBuffer = "";
  _renderChangePinModal();
}

function _renderChangePinModal() {
  const isConfirm = changePinStage === "confirm";
  const overlay = document.getElementById("modal-overlay");
  const box = overlay.querySelector(".modal-box");

  // Safe DOM construction — no user data in innerHTML, only static UI
  const iconEl = document.createElement("div");
  iconEl.className = "modal-icon";
  iconEl.textContent = "🔑";
  const titleEl = document.createElement("div");
  titleEl.className = "modal-title";
  titleEl.textContent = isConfirm ? t("confirm_new_pin") : t("enter_new_pin");
  const msgEl = document.createElement("div");
  msgEl.className = "modal-msg";
  msgEl.id = "cpin-msg";
  msgEl.textContent = isConfirm
    ? t("reenter_pin_msg")
    : t("choose_pin_msg");

  const dotsWrap = document.createElement("div");
  dotsWrap.id = "cpin-dots";
  dotsWrap.style.cssText =
    "display:flex;gap:0.75rem;justify-content:center;margin:1rem 0";
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("div");
    dot.className = "pin-dot";
    dot.id = "cpd" + i;
    dotsWrap.appendChild(dot);
  }

  const padWrap = document.createElement("div");
  padWrap.style.cssText =
    "display:grid;grid-template-columns:repeat(3,4.25rem);gap:0.625rem;justify-content:center;margin-bottom:0.875rem";
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].forEach((k) => {
    if (k === "") {
      padWrap.appendChild(document.createElement("div"));
      return;
    }
    const btn = document.createElement("div");
    btn.className = "num-btn";
    btn.style.cssText = "width:4.25rem;height:4.25rem";
    btn.textContent = k;
    btn.addEventListener("click", () => changePinInput(k));
    padWrap.appendChild(btn);
  });

  const btnsDiv = document.createElement("div");
  btnsDiv.className = "modal-btns";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "modal-btn secondary";
  cancelBtn.textContent = t("cancel");
  cancelBtn.addEventListener("click", () => {
    document.getElementById("modal-overlay").classList.remove("visible");
    _restoreModalBox();
  });
  btnsDiv.appendChild(cancelBtn);

  box.replaceChildren(iconEl, titleEl, msgEl, dotsWrap, padWrap, btnsDiv);
  overlay.classList.add("visible");
}

function changePinInput(key) {
  if (key === "⌫") {
    changePinBuffer = changePinBuffer.slice(0, -1);
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById("cpd" + i);
      if (el) el.classList.toggle("filled", i < changePinBuffer.length);
    }
    return;
  }
  if (changePinBuffer.length >= 4) return;
  changePinBuffer += key;
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById("cpd" + i);
    if (el) el.classList.toggle("filled", i < changePinBuffer.length);
  }
  if (changePinBuffer.length === 4) {
    setTimeout(() => _submitChangePinStep(), 150);
  }
}

async function _submitChangePinStep() {
  if (changePinStage === "new") {
    changePinFirst = changePinBuffer;
    changePinBuffer = "";
    changePinStage = "confirm";
    _renderChangePinModal();
  } else {
    if (changePinBuffer !== changePinFirst) {
      const msgEl = document.getElementById("cpin-msg");
      if (msgEl) {
        msgEl.textContent = t("pins_no_match");
        msgEl.style.color = "var(--danger)";
      }
      changePinBuffer = "";
      changePinFirst = "";
      changePinStage = "new";
      setTimeout(() => _renderChangePinModal(), 900);
      return;
    }
    // PINs match — re-derive key, re-encrypt, update HMAC
    const newPin = changePinBuffer;
    try {
      const salt = await getOrCreateSalt();
      const newHash = await hashPin(newPin, salt);
      await setInDB(PINHASH_KEY, newHash);
      sessionPin = newPin;
      await save(); // re-encrypts all data with new PIN
      document.getElementById("modal-overlay").classList.remove("visible");
      _restoreModalBox();
      showModal({
        icon: "✅",
        title: t("pin_changed_title"),
        msg: t("pin_changed_msg"),
        cancelText: "",
        confirmText: t("ok"),
      });
    } catch (error) {
      console.error("🚨 PIN change error:", error);
      showModal({
        icon: "⚠️",
        title: t("pin_change_failed_title"),
        msg: t("pin_change_failed_msg"),
        cancelText: "",
        confirmText: t("ok"),
      });
    }
  }
}

function switchTab(tab) {
  const allowed = ["calendar", "insights", "settings", "about", "support"];
  if (!allowed.includes(tab)) return;
  currentTab = tab;

  // Sync navigation state
  setNavigationState(tab === "support" ? "about" : tab, viewMonth);

  // Remove active from bottom nav items
  [
    "bnav-calendar",
    "bnav-insights",
    "bnav-settings",
    "bnav-about",
    "bnav-support",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  // Show/hide view panels
  const calView = document.getElementById("view-calendar");
  const insView = document.getElementById("view-insights");
  const setView = document.getElementById("view-settings");
  const aboutView = document.getElementById("view-about");
  const isAboutMode = tab === "about" || tab === "support";
  if (calView) calView.style.display = tab === "calendar" ? "block" : "none";
  if (insView) insView.style.display = tab === "insights" ? "block" : "none";
  if (setView) setView.style.display = tab === "settings" ? "block" : "none";
  if (aboutView) aboutView.style.display = isAboutMode ? "block" : "none";
  if (insView)
    insView.className =
      "insights-wrap" + (tab === "insights" ? " visible" : "");
  if (setView)
    setView.className =
      "settings-wrap" + (tab === "settings" ? " visible" : "");
  if (aboutView) {
    aboutView.className = "settings-wrap" + (isAboutMode ? " visible" : "");
    aboutView.classList.toggle("support-mode", tab === "support");
    // Add official version notice if not already present
    if (isAboutMode && !document.getElementById("official-version-notice")) {
      const notice = document.createElement("div");
      notice.id = "official-version-notice";
      notice.style.cssText = "margin:1.5rem 0 0 0;padding:0.75rem 1.25rem;background:#221a33;color:#A78BFA;border-radius:8px;font-size:0.9rem;text-align:center;opacity:0.92;";
      notice.innerHTML =
        'Upstream open source: <a href="https://yourcyclekeeper.web.app" target="_blank" rel="noopener" class="accessibility-link">yourcyclekeeper.web.app</a> &nbsp;·&nbsp; <a href="https://github.com/pythonime-lab/yourcyclekeeper" target="_blank" rel="noopener" class="accessibility-link">Your Cycle Keeper on GitHub</a>';
      aboutView.appendChild(notice);
    }
  }

  // Add active to current tab button
  if (tab === "calendar") {
    const bnav = document.getElementById("bnav-calendar");
    if (bnav) bnav.classList.add("active");
  }
  if (tab === "insights") {
    const bnav = document.getElementById("bnav-insights");
    if (bnav) bnav.classList.add("active");
    updateInsights();
  }
  if (tab === "settings") {
    const bnav = document.getElementById("bnav-settings");
    if (bnav) bnav.classList.add("active");
    loadSettingsFields();
  }
  if (tab === "about") {
    const bnav = document.getElementById("bnav-about");
    if (bnav) bnav.classList.add("active");
  }
  if (tab === "support") {
    const bnav = document.getElementById("bnav-support");
    if (bnav) bnav.classList.add("active");
  }
  // Hide log panel when switching tabs
  const logModal = document.getElementById("log-modal-overlay");
  if (logModal) logModal.classList.remove("visible");
}

async function init() {
  try {
    // Initialize IndexedDB
    await initIndexedDB();
    wireDriveDb({
      getFromDB: (key) => window.getFromDB(key),
      setInDB: (key, value) => window.setInDB(key, value),
      deleteFromDB: (key) => window.deleteFromDB(key),
    });

    await handleDriveOAuthReturn();

    // Setup event listeners now that DOM exists
    setupEventListeners();

    // Initialize keyboard navigation
    initKeyboardNavigation({
      pinInput,
      pinDelete,
      setupPinInput,
      setupPinDelete,
      changePinInput,
      importPinInput: _handleImportPinKeyboardInput,
      closeLogPanel,
      renderCalendar,
    });

    const hasData = !!(await getFromDB(STORE_KEY));
    const hasSalt = !!(await getFromDB(SALT_KEY));
    const hasPinHash = !!(await getFromDB(PINHASH_KEY));

    // Register Service Worker (only on http/https, not file://)
    if (
      "serviceWorker" in navigator &&
      (location.protocol === "http:" || location.protocol === "https:")
    ) {
      const swUrl = `service-worker.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log("Service Worker registered:", reg);
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });

      // A newly activated worker may claim this page at any time. Reloading an
      // unlocked page would discard the memory-only PIN and immediately show
      // the lock screen again, so defer that refresh until the app next locks.
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        const u = new URL(window.location.href);
        if (u.searchParams.has("code") || u.searchParams.has("error")) return;
        if (serviceWorkerReloading) return;
        if (sessionPin || unlockInProgress || pinBuffer.length > 0) {
          serviceWorkerReloadPending = true;
          if (!serviceWorkerReloadDeadlineTimer) {
            serviceWorkerReloadDeadlineTimer = setTimeout(() => {
              if (serviceWorkerReloadPending && !serviceWorkerReloading) {
                lockApp();
              }
            }, SERVICE_WORKER_RELOAD_MAX_DELAY_MS);
          }
          return;
        }
        serviceWorkerReloading = true;
        window.location.reload();
      });
    } else if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported in this browser");
    } else {
      console.log(
        "Service Worker skipped (running on file:// protocol - use http:// or https:// for production)"
      );
    }

    if (hasData && hasSalt && hasPinHash) {
      // Returning user: show lock screen
      document.getElementById("lock-screen").classList.remove("hidden");
      const lockSub = document.getElementById("lock-sub");
      if (
        lockSub &&
        (await hasPendingDriveOAuthExchange())
      ) {
        lockSub.textContent = t("drive_oauth_enter_pin");
      } else if (lockSub) {
        lockSub.textContent = t("unlock_subtitle");
      }
    } else {
      // First time: show onboarding
      document.getElementById("lock-screen").classList.add("hidden");
      document.getElementById("onboarding").classList.remove("hidden");
    }
  } catch (error) {
    console.error("🚨 Initialization error:", error);
    showModal({
      icon: "⚠️",
      title: t("db_error_title"),
      msg: t("db_error_msg"),
      confirmText: t("refresh"),
      onConfirm: () => location.reload(),
    });
    return;
  }

  updateFlowButtonVisual(1, false);
  updatePainButtonVisual(5, false);
  updateMoodButtonVisual(50, false);
  // initializePainChartControls(); // disabled — symptom chart UI not in index.html
  applyI18n();
  _initLangSwitcher();
  loadTheme();
  _updateMonthDropdown();
}

function _initLangSwitcher() {
  const sel = document.getElementById("lang-switcher");
  if (!sel) return;
  sel.value = getLanguage();
  sel.addEventListener("change", () => {
    setLanguage(sel.value);
    applyI18n();
    _updateMonthDropdown();
    // Re-render dynamic content with new language
    updateStatusCard();
    renderCalendar();
    updateInsights();
    updateNoteCount();
    if (document.getElementById("lock-sub")) {
      document.getElementById("lock-sub").textContent = t("unlock_subtitle");
    }
  });
}

function _updateMonthDropdown() {
  const sel = document.getElementById("pain-view-month");
  if (!sel) return;
  const lang = getLanguage();
  const currentValue = sel.value;
  // Update all month options (index 1–12, value 0–11)
  for (let i = 0; i < 12; i++) {
    const option = sel.options[i + 1]; // skip "All Months" at index 0
    if (!option) continue;
    option.textContent = new Date(2000, i, 1).toLocaleString(lang, { month: "long" });
  }
  sel.value = currentValue;
}

// Wait for DOM to be ready before initializing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      console.error("🚨 Fatal initialization error:", err);
    });
  });
} else {
  // DOM is already loaded
  init().catch((err) => {
    console.error("🚨 Fatal initialization error:", err);
  });
}

function switchInsightTab(tabId) {
  const tabs = ['history', 'predictions', 'how'];

  tabs.forEach(tab => {
    const btn = document.getElementById('tab-btn-' + tab);
    const content = document.getElementById('insight-tab-' + tab);
    if (!btn || !content) return;
    if (tab === tabId) {
      btn.classList.add('active');
      content.style.display = 'block';
    } else {
      btn.classList.remove('active');
      content.style.display = 'none';
    }
  });

  if (tabId === 'predictions') renderPredictionsTab();
}

function switchSettingsTab(tabId) {
  const tabs = ['cycle', 'layout', 'security'];
  tabs.forEach(tab => {
    const btn = document.getElementById('tab-btn-settings-' + tab);
    const content = document.getElementById('settings-tab-' + tab);
    if (!btn || !content) return;
    
    if (tab === tabId) {
      btn.classList.add('active');
      content.classList.add('active');
    } else {
      btn.classList.remove('active');
      content.classList.remove('active');
    }
  });
}

function switchAboutTab(tabId) {
  const tabs = ['developer', 'privacy', 'disclaimer'];
  tabs.forEach(tab => {
    const btn = document.getElementById(`tab-btn-about-${tab}`);
    const content = document.getElementById(`about-tab-${tab}`);
    if (!btn || !content) return;
    if (tab === tabId) {
      btn.classList.add('active');
      content.classList.add('active');
    } else {
      btn.classList.remove('active');
      content.classList.remove('active');
    }
  });
}

// ── PWA install prompt ───────────────────────────────────────────────────────
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById("btn-install-pwa");
  if (btn) btn.classList.remove("hidden");
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById("btn-install-pwa");
  if (btn) btn.classList.add("hidden");
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (document.getElementById("print-options-overlay")?.classList.contains("visible")) {
    closePrintOptions();
    document.getElementById("history-print-btn")?.focus();
    return;
  }
  if (document.getElementById("log-modal-overlay")?.classList.contains("visible")) {
    closeLogPanel();
  }
});

function triggerInstall() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(() => {
    deferredInstallPrompt = null;
    const btn = document.getElementById("btn-install-pwa");
    if (btn) btn.classList.add("hidden");
  });
}

// Expose functions to window for HTML onclick handlers
window.switchInsightTab = switchInsightTab;
window.switchSettingsTab = switchSettingsTab;
window.switchAboutTab = switchAboutTab;
window.pinInput = pinInput;
window.pinDelete = pinDelete;
window.forgotPinFlow = forgotPinFlow;
window.setupPinInput = setupPinInput;
window.setupPinDelete = setupPinDelete;
window.startApp = startApp;
window.proceedToOnboardSetup = proceedToOnboardSetup;
window.backToOnboardPin = backToOnboardPin;
window.importDataOnboarding = importDataOnboarding;
window.importDripCsvOnboarding = importDripCsvOnboarding;
window.importDripCsv = importDripCsv;
window.showCsvImportPanel = showCsvImportPanel;
window.closeCsvImportPanel = closeCsvImportPanel;
window.chooseCsvImportFile = chooseCsvImportFile;
window.changeMonth = changeMonth;
window.closeLogPanel = closeLogPanel;
window.showFlowModal = showFlowModal;
window.showPainModal = showPainModal;
window.showMoodModal = showMoodModal;
window.saveLog = saveLog;
window.deleteLog = deleteLog;
window.deleteLogWithConfirm = deleteLogWithConfirm;
window.resetLogWithConfirm = resetLogWithConfirm;
window.toggleLogSection = toggleLogSection;
window.selectFlowValue = selectFlowValue;
window.selectPainValue = selectPainValue;
window.selectMoodValue = selectMoodValue;
window.previewInlinePain = previewInlinePain;
window.clearLogField = clearLogField;
window.updateLogEditorUI = updateLogEditorUI;
window.scheduleAutoSaveNote = scheduleAutoSaveNote;
window.downloadChart = downloadChart;
window.setChartFilter = setChartFilter;
window.updatePainChart = updatePainChart;
window.updateNoteCount = updateNoteCount;
window.savePeriodDuration = savePeriodDuration;
window.saveTolerance = saveTolerance;
window.toggleFertility = toggleFertility;
window.toggleCyclePhaseTimeline = toggleCyclePhaseTimeline;
window.saveAutoFillDays = saveAutoFillDays;
window.recalculateCycleHistoryWithConfirm = recalculateCycleHistoryWithConfirm;
window.dismissAutoFillBanner = dismissAutoFillBanner;
window.showHistoryFullPage = showHistoryFullPage;
window.shareRecentPeriodHistory = shareRecentPeriodHistory;
window.printCycleSummary = printCycleSummary;
window.closePrintOptions = closePrintOptions;
window.confirmPrintCycleSummary = confirmPrintCycleSummary;
window.showChangePinModal = showChangePinModal;
window.exportToDrip = exportToDrip;
window.triggerInstall = triggerInstall;
window.exportData = exportData;
window.closeAppModal = closeAppModal;
window.connectGoogleDrive = connectGoogleDrive;
window.disconnectGoogleDrive = disconnectGoogleDrive;
window.syncGoogleDriveNow = syncGoogleDriveNow;
window.toggleDriveAutoBackup = toggleDriveAutoBackup;
window.importData = importData;
window.confirmClear = confirmClear;
window.switchTab = switchTab;
window.setTheme = setTheme;
window.changeLanguage = (lang) => {
  setLanguage(lang);
  applyI18n();
  updateStatusCard();
  renderCalendar();
  updateInsights();
  const lockSub = document.getElementById("lock-sub");
  if (lockSub) lockSub.textContent = t("unlock_subtitle");
};
