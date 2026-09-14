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

/**
 * Fertile-window day offsets from cycle start (Calendar Rhythm / Standard
 * Days Method). `fertileEnd` is clamped to never fall before `fertileStart`
 * — for very short cycles (cl < 19) the raw formula would otherwise invert
 * (e.g. cl=17 gives start=8, end=6), silently hiding the fertile window.
 */
function getFertileWindowOffsets(cl) {
  const fertileStart = Math.max(8, cl - 18);
  const fertileEnd = Math.max(fertileStart, cl - 11);
  const ovulationDay = cl - 14;
  return { fertileStart, fertileEnd, ovulationDay };
}

/** Completed cycles have a later recorded start on or before the reference date. */
export function getCompletedCycles(hist, refDate = fromISO(today())) {
  if (!hist || hist.length <= 1) return [];
  return hist.filter((cycle, index) => {
    const next = hist[index + 1];
    return next && fromISO(next.start) <= refDate;
  });
}

export function getCyclesInRollingWindow(hist, refDate = fromISO(today())) {
  const cutoff = addMonths(refDate, -ROLLING_WINDOW_MONTHS);
  return getCompletedCycles(hist, refDate).filter((c) => fromISO(c.start) >= cutoff);
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
  // Prediction-window padding in days, derived from actual cycle-length
  // variability rather than a coarse regular/irregular flag. Clamped to the
  // same 0–5 range users can pick manually in Settings (toleranceDays).
  const variation =
    stats.stdDeviation === null
      ? 1
      : Math.max(1, Math.min(5, Math.round(stats.stdDeviation)));
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
export function getOverallStatisticalCycleData(
  requireMin = 3,
  refDate = fromISO(today())
) {
  if (!state?.cycleHistory) return null;
  return buildStatisticalData(
    getCompletedCycles(state.cycleHistory, refDate),
    requireMin
  );
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

export function getPredictionCycleLength(refDate = fromISO(today())) {
  const rolling = getRollingStatisticalCycleData(refDate, 1);
  if (rolling) return Math.round(rolling.mean);
  const overall = getOverallStatisticalCycleData(1, refDate);
  if (overall) return Math.round(overall.mean);
  return state?.cycleLength ?? 28;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

/** Resolve recorded cycle starts and bleeding without turning predictions into facts. */
export function getRecordedCycleContext(refDate = fromISO(today())) {
  if (!state) return null;
  const refIso = toISO(refDate);
  const logs = state.logs || {};
  const historyStarts = uniqueSorted(
    (state.cycleHistory || []).map((cycle) => cycle?.start)
  );
  const storedStarts = uniqueSorted([
    ...historyStarts,
    state.lastPeriodStart,
  ]).filter((start) => !logs[start]?.flowEstimated);

  const flowDates = Object.keys(logs)
    .filter((date) => logs[date]?.flow)
    .sort();
  const groups = [];
  let group = [];
  for (const date of flowDates) {
    if (
      group.length &&
      diffDays(fromISO(group[group.length - 1]), fromISO(date)) > 2
    ) {
      groups.push(group);
      group = [];
    }
    group.push(date);
  }
  if (group.length) groups.push(group);

  const episodes = [];
  const storedStartsInsideFlow = new Set();
  for (const dates of groups) {
    const firstReal = dates.find((date) => logs[date]?.flowEstimated !== true);
    if (!firstReal) continue;
    const end = dates[dates.length - 1];
    const storedInGroup = storedStarts.filter(
      (start) => start >= firstReal && start <= end && logs[start]?.flow
    );
    storedInGroup.forEach((start) => storedStartsInsideFlow.add(start));
    const historyInGroup = historyStarts.filter(
      (start) => start >= firstReal && start <= end && logs[start]?.flow
    );
    // A lone stored start may simply be the old onset after an earlier day was
    // backfilled. Two stored starts inside one connected group preserve the
    // user's explicit "new period" split.
    const splitStarts =
      historyInGroup.length > 1 ? historyInGroup.slice(1) : [];
    const starts = uniqueSorted([firstReal, ...splitStarts]);
    starts.forEach((start, index) => {
      const nextStart = starts[index + 1];
      const segmentDates = dates.filter(
        (date) => date >= start && (!nextStart || date < nextStart)
      );
      if (segmentDates.length) {
        episodes.push({ start, end: segmentDates[segmentDates.length - 1] });
      }
    });
  }

  const recordedStarts = uniqueSorted([
    ...storedStarts.filter((start) => !storedStartsInsideFlow.has(start)),
    ...episodes.map((episode) => episode.start),
  ]);
  const usableStarts = recordedStarts.filter((start) => start <= refIso);
  const futureStarts = recordedStarts.filter((start) => start > refIso);
  const cycleStartIso = usableStarts.at(-1) || null;
  const currentEpisode = cycleStartIso
    ? episodes.find(
        (episode) =>
          episode.start === cycleStartIso &&
          episode.start <= refIso &&
          refIso <= episode.end
      )
    : null;

  return {
    cycleStart: cycleStartIso ? fromISO(cycleStartIso) : null,
    periodStart: currentEpisode ? fromISO(currentEpisode.start) : null,
    periodEnd: currentEpisode ? fromISO(currentEpisode.end) : null,
    isRecordedPeriod: !!currentEpisode,
    periodDay: currentEpisode
      ? diffDays(fromISO(currentEpisode.start), refDate) + 1
      : null,
    futureRecordedStart: futureStarts.length ? fromISO(futureStarts[0]) : null,
  };
}

/** True when a history row's recorded period episode covers the reference day. */
export function isPeriodEpisodeActive(
  startDateStr,
  refDate = fromISO(today())
) {
  const context = getRecordedCycleContext(refDate);
  if (!context?.isRecordedPeriod) return false;
  const rowStart = fromISO(startDateStr);
  return (
    rowStart >= context.periodStart &&
    rowStart <= context.periodEnd
  );
}

function getPredictionVariation(refDate = fromISO(today())) {
  const rollingDetailed = getRollingStatisticalCycleData(refDate, 3);
  if (rollingDetailed) return rollingDetailed.variation;
  const overallDetailed = getOverallStatisticalCycleData(3, refDate);
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
  const refIso = toISO(refDate);
  const flowDates = Object.keys(state.logs)
    .filter((d) => d >= cutoff && d <= refIso && state.logs[d]?.flow)
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
  if (getRecordedCycleContext(refDate)?.isRecordedPeriod) {
    counted = episodes.slice(0, -1);
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
export function getPredictionPeriodDuration(refDate = fromISO(today())) {
  const rolling = getRollingAveragePeriodDuration(refDate);
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

function getCurrentCycleAnchor(refDate = fromISO(today())) {
  const context = getRecordedCycleContext(refDate);
  if (!context?.cycleStart) return null;
  return {
    cycleStart: context.cycleStart,
    cl: getPredictionCycleLength(refDate),
    context,
  };
}

export function getCycleInfo(refDate = fromISO(today())) {
  if (!state) return null;
  const context = getRecordedCycleContext(refDate);
  if (!context?.cycleStart) {
    if (context?.futureRecordedStart) {
      const cl = getPredictionCycleLength(refDate);
      const pd = getPredictionPeriodDuration(refDate);
      const { fertileStart, fertileEnd, ovulationDay } =
        getFertileWindowOffsets(cl);
      return {
        cycleStart: null,
        cycleDay: null,
        nextPeriod: null,
        daysUntilNext: null,
        cl,
        pd,
        fertileStart,
        fertileEnd,
        ovulationDay,
        phase: null,
        phaseColor: "",
        isLate: false,
        daysLate: 0,
        expectedPeriodStart: null,
        isRecordedPeriod: false,
        periodStart: null,
        periodEnd: null,
        periodDay: null,
        futureRecordedStart: context.futureRecordedStart,
        hasDateConflict: true,
      };
    }
    return null;
  }

  const anchor = getCurrentCycleAnchor(refDate);
  const { cycleStart, cl } = anchor;
  const pd = getPredictionPeriodDuration(refDate);

  const cycleDay = diffDays(cycleStart, refDate) + 1;
  const nextPeriod = addDays(cycleStart, cl);
  const daysUntilNext = diffDays(refDate, nextPeriod);
  const daysLate = Math.max(0, -daysUntilNext);
  const isLate = !context.isRecordedPeriod && daysLate > 0;
  const expectedPeriodStart = isLate ? nextPeriod : null;

  const { fertileStart, fertileEnd, ovulationDay } = getFertileWindowOffsets(cl);

  let phase = "Luteal";
  let phaseColor = "var(--lavender)";
  if (context.isRecordedPeriod) {
    phase = "Menstruation";
    phaseColor = "var(--rose)";
  } else if (isLate) {
    phase = "Late";
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
    isRecordedPeriod: context.isRecordedPeriod,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    periodDay: context.periodDay,
    futureRecordedStart: context.futureRecordedStart,
    hasDateConflict: false,
  };
}

export function calculatePredictions(refDate = fromISO(today())) {
  if (!state) return [];

  const anchor = getCurrentCycleAnchor(refDate);
  if (!anchor) return [];

  const { cycleStart, cl } = anchor;
  const variation =
    state.toleranceDays != null
      ? parseInt(state.toleranceDays)
      : getPredictionVariation(refDate);
  const pd = getPredictionPeriodDuration(refDate);
  const {
    fertileStart: fertStartOff,
    fertileEnd: fertEndOff,
    ovulationDay: ovOffset,
  } = getFertileWindowOffsets(cl);
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

  // Tolerance padding around a prediction — same meaning, weaker confidence.
  if (d > todayD) {
    for (const p of preds) {
      if (p.variation > 0) {
        const varStart = addDays(p.periodStart, -p.variation);
        const varEnd = addDays(p.periodEnd, p.variation);
        if (d >= varStart && d <= varEnd) return "tolerance-period";
      }
    }
  }

  return "normal";
}

export function isPredictedFuturePeriod(dateStr) {
  const type = getDayType(dateStr);
  return type === "predicted-period" || type === "tolerance-period";
}
