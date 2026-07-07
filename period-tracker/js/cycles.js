// Cycle prediction and period type determination
import {
  addDays,
  addMonths,
  diffDays,
  fromISO,
  toISO,
  today,
} from "./dateUtils.js";

export const ROLLING_WINDOW_MONTHS = 6;
export const SHIFT_THRESHOLD_DAYS = 3;
/** Mild flag when shortest–longest spread in rolling window exceeds this. */
export const SPREAD_CAUTION_DAYS = 7;
/** Irregularity flag — Cleveland Clinic: cycle length varies by >9 days. */
export const SPREAD_IRREGULAR_DAYS = 9;

// These will be set by the main app to reference the global state
let state = null;
export function setState(stateObj) {
  state = stateObj;
}

function isValidCycleLength(len) {
  return typeof len === "number" && len > 14 && len < 60;
}

/** Completed cycles exclude the current (ongoing) cycle — the last history entry. */
export function getCompletedCycles(hist) {
  if (!hist || hist.length <= 1) return [];
  return hist.slice(0, -1);
}

export function getCyclesInRollingWindow(hist, refDate = fromISO(today())) {
  const cutoff = addMonths(refDate, -ROLLING_WINDOW_MONTHS);
  return getCompletedCycles(hist).filter((c) => fromISO(c.start) >= cutoff);
}

/**
 * Computes descriptive statistics from an array of cycle lengths.
 * Uses corrected (sample) standard deviation.
 */
export function getCycleLengthStats(cycleLengths) {
  if (!cycleLengths || cycleLengths.length === 0) return null;
  const sorted = [...cycleLengths].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean =
    Math.round(
      (cycleLengths.reduce((s, n) => s + n, 0) / cycleLengths.length) * 100
    ) / 100;
  const mid = cycleLengths.length / 2;
  const median =
    cycleLengths.length % 2 === 1
      ? sorted[Math.floor(mid)]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  let stdDeviation = null;
  if (cycleLengths.length > 1) {
    const sumSq = cycleLengths.reduce((s, n) => s + Math.pow(n - mean, 2), 0);
    stdDeviation =
      Math.round(Math.sqrt(sumSq / (cycleLengths.length - 1)) * 100) / 100;
  }
  return { mean, median, min, max, stdDeviation };
}

function buildStatisticalData(cycles, requireMin = 3) {
  const validLengths = cycles
    .filter((c) => isValidCycleLength(c.length))
    .map((c) => c.length);
  if (validLengths.length < requireMin) return null;

  const stats = getCycleLengthStats(validLengths);
  const variation =
    stats.stdDeviation === null || stats.stdDeviation < 1.5 ? 1 : 2;
  const spread = stats.max - stats.min;
  let spreadLevel = null;
  if (spread > SPREAD_IRREGULAR_DAYS) spreadLevel = "irregular";
  else if (spread > SPREAD_CAUTION_DAYS) spreadLevel = "caution";

  return {
    ...stats,
    variation,
    count: validLengths.length,
    spread,
    spreadLevel,
  };
}

/** All completed cycles — used for all-time stats display. */
export function getOverallStatisticalCycleData(requireMin = 3) {
  if (!state?.cycleHistory) return null;
  return buildStatisticalData(getCompletedCycles(state.cycleHistory), requireMin);
}

/** Last 6 months of completed cycles — used for predictions. */
export function getRollingStatisticalCycleData(
  refDate = fromISO(today()),
  requireMin = 1
) {
  if (!state?.cycleHistory) return null;
  return buildStatisticalData(
    getCyclesInRollingWindow(state.cycleHistory, refDate),
    requireMin
  );
}

/**
 * Backward-compatible alias — returns rolling-window stats when available.
 * @deprecated Prefer getRollingStatisticalCycleData or getOverallStatisticalCycleData.
 */
export function getStatisticalCycleData() {
  return (
    getRollingStatisticalCycleData(fromISO(today()), 3) ||
    getOverallStatisticalCycleData(3)
  );
}

export function getPredictionCycleLength() {
  const rolling = getRollingStatisticalCycleData(fromISO(today()), 1);
  if (rolling) return Math.round(rolling.mean);
  const overall = getOverallStatisticalCycleData(1);
  if (overall) return Math.round(overall.mean);
  return state?.cycleLength ?? 28;
}

/** Last flow day of the episode that began on lastPeriodStart. */
function getLastPeriodBleedingEnd() {
  if (!state?.lastPeriodStart || !state?.logs) return null;

  const startD = fromISO(state.lastPeriodStart);
  let lastFlow = null;
  for (let i = 0; i < 20; i++) {
    const dStr = toISO(addDays(startD, i));
    if (state.logs[dStr]?.flow) {
      lastFlow = dStr;
    } else if (lastFlow) {
      const nextStr = toISO(addDays(fromISO(dStr), 1));
      if (!state.logs[nextStr]?.flow) break;
    }
  }
  return lastFlow;
}

/** True when bleeding has ended but the next period has not been logged yet. */
function isOpenCycleAfterBleeding() {
  const bleedingEnd = getLastPeriodBleedingEnd();
  if (!bleedingEnd) return false;

  const todayD = fromISO(today());
  if (todayD <= fromISO(bleedingEnd)) return false;

  const laterFlow = Object.keys(state.logs)
    .filter((d) => d > bleedingEnd && state.logs[d].flow)
    .sort()[0];
  if (!laterFlow) return true;

  return diffDays(fromISO(bleedingEnd), fromISO(laterFlow)) <= 2;
}

/** Most recent expected period start that has passed without being logged. */
function getMissedPeriodExpectedStart() {
  if (!state?.lastPeriodStart || !isOpenCycleAfterBleeding()) return null;

  const cl = getPredictionCycleLength();
  const todayD = fromISO(today());
  let expected = addDays(fromISO(state.lastPeriodStart), cl);

  while (addDays(expected, cl) <= todayD) {
    expected = addDays(expected, cl);
  }

  return todayD >= expected ? expected : null;
}

/** True when a history row's period episode is still actively bleeding. */
export function isPeriodEpisodeActive(startDateStr) {
  if (!state?.logs || startDateStr !== state.lastPeriodStart) return false;

  const startD = fromISO(startDateStr);
  const todayD = fromISO(today());
  let lastFlow = null;

  for (let i = 0; i < 20; i++) {
    const d = addDays(startD, i);
    const dStr = toISO(d);
    if (state.logs[dStr]?.flow) {
      lastFlow = d;
    } else if (lastFlow) {
      const nextStr = toISO(addDays(d, 1));
      if (!state.logs[nextStr]?.flow) break;
    }
  }

  return lastFlow != null && todayD <= lastFlow;
}

function getPredictionVariation() {
  const rollingDetailed = getRollingStatisticalCycleData(fromISO(today()), 3);
  if (rollingDetailed) return rollingDetailed.variation;
  const overallDetailed = getOverallStatisticalCycleData(3);
  if (overallDetailed) return overallDetailed.variation;
  return 0;
}

/** Recompute state.cycleLength from the 6-month rolling window when data exists. */
export function recalculateCycleLength(hist, refDate = fromISO(today())) {
  if (!state) return null;
  const rolling = buildStatisticalData(
    getCyclesInRollingWindow(hist, refDate),
    1
  );
  if (rolling) state.cycleLength = Math.round(rolling.mean);
  return state.cycleLength;
}

export function getShiftedCycles(hist, refDate = fromISO(today())) {
  const rolling = getRollingStatisticalCycleData(refDate, 1);
  if (!rolling) return [];

  const avg = Math.round(rolling.mean);
  return getCyclesInRollingWindow(hist, refDate)
    .filter((c) => isValidCycleLength(c.length))
    .filter((c) => Math.abs(c.length - avg) > SHIFT_THRESHOLD_DAYS)
    .map((c) => ({
      start: c.start,
      length: c.length,
      shift: c.length - avg,
      average: avg,
    }));
}

export function getMostRecentShift(hist, refDate = fromISO(today())) {
  const completed = getCyclesInRollingWindow(hist, refDate);
  if (completed.length === 0) return null;

  const rolling = getRollingStatisticalCycleData(refDate, 1);
  if (!rolling) return null;

  const avg = Math.round(rolling.mean);
  const last = completed[completed.length - 1];
  const shift = last.length - avg;
  if (Math.abs(shift) > SHIFT_THRESHOLD_DAYS) {
    return { start: last.start, length: last.length, shift, average: avg };
  }
  return null;
}

export function getRollingSpreadInfo(refDate = fromISO(today())) {
  const rolling = getRollingStatisticalCycleData(refDate, 2);
  if (!rolling || rolling.spread == null) return null;
  return {
    spread: rolling.spread,
    min: rolling.min,
    max: rolling.max,
    level: rolling.spreadLevel,
    count: rolling.count,
  };
}

export function getRollingAveragePeriodDuration(refDate = fromISO(today())) {
  if (!state?.logs) return null;

  const cutoff = toISO(addMonths(refDate, -ROLLING_WINDOW_MONTHS));
  const flowDates = Object.keys(state.logs)
    .filter((d) => d >= cutoff && state.logs[d]?.flow)
    .sort();
  if (flowDates.length === 0) return null;

  const maxGap = 2;
  const episodes = [];
  let episode = [flowDates[0]];
  for (let i = 1; i < flowDates.length; i++) {
    const gap = diffDays(
      fromISO(episode[episode.length - 1]),
      fromISO(flowDates[i])
    );
    if (gap <= maxGap) {
      episode.push(flowDates[i]);
    } else {
      episodes.push(episode);
      episode = [flowDates[i]];
    }
  }
  episodes.push(episode);

  // Skip the current episode while bleeding is still in progress.
  let counted = episodes;
  if (episodes.length > 1 && state.lastPeriodStart) {
    const lastStart = episodes[episodes.length - 1][0];
    if (isPeriodEpisodeActive(lastStart)) {
      counted = episodes.slice(0, -1);
    }
  }
  if (counted.length === 0) return null;

  const durations = counted.map(
    (ep) => diffDays(fromISO(ep[0]), fromISO(ep[ep.length - 1])) + 1
  );
  const avg = Math.round(
    durations.reduce((s, n) => s + n, 0) / durations.length
  );
  return Math.max(1, Math.min(10, avg));
}

/** Rolling 6-month average period length for predictions and auto-fill. */
export function getPredictionPeriodDuration() {
  const rolling = getRollingAveragePeriodDuration();
  if (rolling != null) return rolling;
  return state?.periodDuration ?? 5;
}

/** Recompute state.periodDuration from logged flow in the rolling window. */
export function recalculatePeriodDuration(refDate = fromISO(today())) {
  if (!state) return null;
  const rolling = getRollingAveragePeriodDuration(refDate);
  if (rolling != null) state.periodDuration = rolling;
  return state.periodDuration;
}

/** Walk forward from lastPeriodStart to the start of the current cycle. */
function getCurrentCycleAnchor() {
  if (!state?.lastPeriodStart) return null;

  const todayD = fromISO(today());
  const cl = getPredictionCycleLength();
  let cycleStart = fromISO(state.lastPeriodStart);
  if (cycleStart > todayD) {
    while (cycleStart > todayD) cycleStart = addDays(cycleStart, -cl);
  } else {
    while (addDays(cycleStart, cl) <= todayD)
      cycleStart = addDays(cycleStart, cl);
  }
  return { cycleStart, cl };
}

export function getCycleInfo() {
  if (!state.lastPeriodStart) return null;

  const todayD = fromISO(today());
  const anchor = getCurrentCycleAnchor();
  if (!anchor) return null;
  const { cycleStart, cl } = anchor;
  const pd = getPredictionPeriodDuration();

  const expectedPeriodStart = getMissedPeriodExpectedStart();
  const daysLate =
    expectedPeriodStart != null ? diffDays(expectedPeriodStart, todayD) : 0;
  const isLate = daysLate > 0;

  const cycleDay = diffDays(cycleStart, todayD) + 1;
  const nextPeriod = addDays(cycleStart, cl);
  const daysUntilNext = diffDays(todayD, nextPeriod);

  const fertileStart = Math.max(8, cl - 18);
  const fertileEnd = cl - 11;
  const ovulationDay = cl - 14;

  let phase = "Luteal";
  let phaseColor = "var(--lavender)";
  if (state.logs[today()]?.flow) {
    phase = "Menstruation";
    phaseColor = "var(--rose)";
  } else if (isLate) {
    phase = "Late";
    phaseColor = "var(--rose)";
  } else if (cycleDay >= 1 && cycleDay <= pd) {
    phase = "Menstruation";
    phaseColor = "var(--rose)";
  } else if (cycleDay === ovulationDay) {
    phase = "Ovulation Day";
    phaseColor = "var(--ovulation)";
  } else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    phase = "Fertile Window";
    phaseColor = "var(--fertile-green)";
  } else if (cycleDay < fertileStart) {
    phase = "Follicular";
    phaseColor = "var(--amber)";
  }

  return {
    cycleStart,
    cycleDay,
    nextPeriod,
    daysUntilNext,
    cl,
    pd,
    fertileStart,
    fertileEnd,
    ovulationDay,
    phase,
    phaseColor,
    isLate,
    daysLate,
    expectedPeriodStart,
  };
}

export function calculatePredictions() {
  if (!state || !state.lastPeriodStart) return [];

  const anchor = getCurrentCycleAnchor();
  if (!anchor) return [];

  const { cycleStart, cl } = anchor;
  const variation =
    state.toleranceDays != null
      ? parseInt(state.toleranceDays)
      : getPredictionVariation();
  const pd = getPredictionPeriodDuration();
  const ovOffset = cl - 14;
  const fertStartOff = Math.max(8, cl - 18);
  const fertEndOff = cl - 11;
  const predictions = [];

  for (let i = 0; i < 6; i++) {
    const periodStart = addDays(cycleStart, cl * i);
    const periodEnd = addDays(periodStart, pd - 1);
    const ovulation = addDays(periodStart, ovOffset);
    const fertileStart = addDays(periodStart, fertStartOff);
    const fertileEnd = addDays(periodStart, fertEndOff);
    predictions.push({
      periodStart,
      periodEnd,
      ovulation,
      fertileStart,
      fertileEnd,
      variation,
    });
  }
  return predictions;
}

export function getDayType(dateStr) {
  if (!state) return "normal";

  const d = fromISO(dateStr);
  const todayD = fromISO(today());

  // Logged flow on past/today dates — predictions must not override actual logs.
  if (d <= todayD && state.logs[dateStr]?.flow) return "period";

  const preds = calculatePredictions();
  if (preds.length === 0) return "normal";

  for (const p of preds) {
    if (d >= p.periodStart && d <= p.periodEnd) {
      return state.logs[dateStr]?.flow ? "period" : "predicted-period";
    }
    if (toISO(d) === toISO(p.ovulation)) return "ovulation";
    if (d >= p.fertileStart && d <= p.fertileEnd) return "fertile";
  }

  if (d > todayD) {
    for (const p of preds) {
      if (p.variation > 0) {
        const varStart = addDays(p.periodStart, -p.variation);
        const varEnd = addDays(p.periodEnd, p.variation);
        if (d >= varStart && d <= varEnd) return "predicted-period";
      }
    }
  }

  return "normal";
}

export function isPredictedFuturePeriod(dateStr) {
  return getDayType(dateStr) === "predicted-period";
}
