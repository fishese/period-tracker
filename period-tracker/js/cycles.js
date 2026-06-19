// Cycle prediction and period type determination
import { addDays, diffDays, fromISO, toISO, today } from "./dateUtils.js";

// These will be set by the main app to reference the global state
let state = null;
export function setState(stateObj) {
  state = stateObj;
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

/**
 * Derives statistical cycle data from the tracked history.
 * Returns null if fewer than 3 valid cycles are recorded.
 * variation: ±1 day if the cycle is regular (stdDev < 1.5), ±2 days otherwise.
 */
export function getStatisticalCycleData() {
  if (!state || !state.cycleHistory) return null;
  const validLengths = state.cycleHistory
    .map((c) => c.length)
    .filter((l) => typeof l === "number" && l > 14 && l < 60);
  if (validLengths.length < 3) return null;
  const stats = getCycleLengthStats(validLengths);
  const variation =
    stats.stdDeviation === null || stats.stdDeviation < 1.5 ? 1 : 2;
  return { ...stats, variation, count: validLengths.length };
}

export function getCycleInfo() {
  if (!state.lastPeriodStart) return null;

  const todayD = fromISO(today());
  const statsData = getStatisticalCycleData();
  const cl = statsData ? Math.round(statsData.mean) : state.cycleLength;
  const pd = state.periodDuration;

  // Always derive cycleStart from state.lastPeriodStart — the same source
  // calculatePredictions() uses, updated by applySettings() whenever the
  // user edits settings.
  let cycleStart = fromISO(state.lastPeriodStart);
  if (cycleStart > todayD) {
    while (cycleStart > todayD) cycleStart = addDays(cycleStart, -cl);
  } else {
    while (addDays(cycleStart, cl) <= todayD)
      cycleStart = addDays(cycleStart, cl);
  }

  const cycleDay = diffDays(cycleStart, todayD) + 1;
  const nextPeriod = addDays(cycleStart, cl);

  const daysUntilNext = diffDays(todayD, nextPeriod);

  const fertileStart = Math.max(8, cl - 18);
  const fertileEnd = cl - 11;
  const ovulationDay = cl - 14;

  // Check ovulation before fertile window and before follicular so it is
  // reachable even for short cycles where ovulationDay < fertileStart.
  let phase = "Luteal";
  let phaseColor = "var(--lavender)";
  if (cycleDay >= 1 && cycleDay <= pd) {
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
  };
}

export function calculatePredictions() {
  if (!state || !state.lastPeriodStart) return [];

  const statsData = getStatisticalCycleData();
  // Use statistically-derived mean cycle length when available (≥3 cycles);
  // otherwise fall back to the user-set/running-average cycleLength.
  const cl = statsData ? Math.round(statsData.mean) : state.cycleLength;
  const variation = (state.toleranceDays != null)
    ? parseInt(state.toleranceDays)
    : (statsData ? statsData.variation : 0);
  const pd = state.periodDuration;
  const ovOffset = cl - 14;
  const fertStartOff = Math.max(8, cl - 18);
  const fertEndOff = cl - 11;
  const base = fromISO(state.lastPeriodStart);
  const predictions = [];

  for (let i = 0; i < 6; i++) {
    const periodStart = addDays(base, cl * i);
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

  const preds = calculatePredictions();
  if (preds.length === 0) return "normal";

  const d = fromISO(dateStr);
  const todayD = fromISO(today());

  // First pass: hard types always take priority over the variation window.
  for (const p of preds) {
    if (d >= p.periodStart && d <= p.periodEnd) return "period";
    if (toISO(d) === toISO(p.ovulation)) return "ovulation";
    if (d >= p.fertileStart && d <= p.fertileEnd) return "fertile";
  }

  // Second pass: variation window — only for future days when stats are available.
  // Returns "predicted-period" (styled as a dashed hint) for days that fall
  // within ±variation days of a predicted period window.
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
  const d = fromISO(dateStr);
  const todayD = fromISO(today());
  if (d <= todayD) return false;
  return getDayType(dateStr) === "period";
}
