import { fromISO, diffDays } from "../dateUtils.js";

const MAX_GAP = 2;

/**
 * Group flow days into period ranges (gap ≤ 2 days). Spotting-only days are ignored.
 * @param {Record<string, { flow?: number, spotting?: boolean, pain?: number, mood?: number, note?: string }>} logs
 * @returns {Array<{ start: string, end: string }>}
 */
export function getFlowPeriods(logs) {
  const flowDates = Object.keys(logs || {})
    .filter((date) => logs[date].flow !== undefined && logs[date].flow !== null)
    .sort();

  if (flowDates.length === 0) {
    return [];
  }

  const periods = [];
  let groupStart = flowDates[0];
  let groupEnd = flowDates[0];

  for (let i = 1; i < flowDates.length; i++) {
    const prev = fromISO(groupEnd);
    const curr = fromISO(flowDates[i]);
    const gap = diffDays(prev, curr);

    if (gap <= MAX_GAP) {
      groupEnd = flowDates[i];
    } else {
      periods.push({ start: groupStart, end: groupEnd });
      groupStart = flowDates[i];
      groupEnd = flowDates[i];
    }
  }

  periods.push({ start: groupStart, end: groupEnd });
  return periods;
}

/**
 * @param {Array<{ start: string, end: string }>} periods
 * @param {string} date
 * @returns {{ start: string, end: string } | null}
 */
export function findPeriodForDate(periods, date) {
  for (const period of periods) {
    if (date >= period.start && date <= period.end) {
      return period;
    }
  }
  return null;
}

/**
 * Dates with at least one exportable field, sorted ascending.
 * @param {Record<string, { flow?: number, spotting?: boolean, pain?: number, mood?: number, note?: string }>} logs
 * @returns {string[]}
 */
export function listExportableDates(logs) {
  return Object.keys(logs || {})
    .filter((date) => {
      const log = logs[date];
      return (
        log.flow != null ||
        log.spotting ||
        log.pain != null ||
        log.mood != null ||
        (log.note && log.note.trim())
      );
    })
    .sort();
}

/**
 * @param {"drip"|"plain"} kind
 * @param {string} todayIso
 * @returns {string}
 */
export function exportFilename(kind, todayIso) {
  return `mycyclekeeper-${kind}-${todayIso}.csv`;
}

/**
 * Trigger a browser download of text content. No-op when `document` is unavailable.
 * @param {string} filename
 * @param {string} text
 * @param {string} mimeType
 */
export function downloadTextFile(filename, text, mimeType) {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
