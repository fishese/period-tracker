import {
  getFlowPeriods,
  findPeriodForDate,
  listExportableDates,
} from "../export-core.js";

const HEADER = "period_start,period_end,date,flow,pain,mood,notes";

/**
 * RFC 4180 field escaping for CSV notes column.
 * @param {string} value
 * @returns {string}
 */
function escapeCsvField(value) {
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * @param {{ flow?: number, spotting?: boolean, pain?: number, mood?: number, note?: string }} log
 * @returns {string}
 */
function formatFlowCell(log) {
  if (log.flow != null) {
    return String(log.flow);
  }
  if (log.spotting) {
    return "spotting";
  }
  return "";
}

/**
 * Build plain CSV export string from logs (oldest → newest).
 * @param {Record<string, { flow?: number, spotting?: boolean, pain?: number, mood?: number, note?: string }>} logs
 * @returns {string}
 */
export function buildPlainCsv(logs) {
  const periods = getFlowPeriods(logs);
  const dates = listExportableDates(logs);

  const rows = dates.map((date) => {
    const log = logs[date];
    const period = findPeriodForDate(periods, date);
    const periodStart = period ? period.start : "";
    const periodEnd = period ? period.end : "";
    const flow = formatFlowCell(log);
    const pain = log.pain != null ? String(log.pain) : "";
    const mood = log.mood != null ? String(log.mood) : "";
    const noteText = log.note && log.note.trim() ? log.note.trim() : "";
    const notes = noteText ? escapeCsvField(noteText) : "";

    return [periodStart, periodEnd, date, flow, pain, mood, notes].join(",");
  });

  return [HEADER, ...rows].join("\n");
}
