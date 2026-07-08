// Log cleanup and period marking logic
import { fromISO, addDays, toISO } from "./dateUtils.js";

let state = null;
export function setState(stateObj) {
  state = stateObj;
}

/**
 * Returns true if dateStr is a continuation of an existing menses rather than
 * the start of a new cycle. A flow day is considered the same menses when
 * there is already a flow log within maxBreakInBleeding days before it.
 * This mirrors drip's isMensesStart gap-tolerance logic.
 */
export function isSameMenses(dateStr, maxBreakInBleeding = 1) {
  if (!state || !state.logs) return false;
  const date = fromISO(dateStr);
  for (let gap = 1; gap <= maxBreakInBleeding + 1; gap++) {
    const prior = toISO(addDays(date, -gap));
    const log = state.logs[prior];
    if (log && log.flow) return true;
  }
  return false;
}

export function cleanupEmptyLogs() {
  if (!state) return;

  for (const dateStr in state.logs) {
    const log = state.logs[dateStr];
    const empty =
      !log.flow &&
      !log.spotting &&
      !log.pain &&
      (log.mood === undefined || log.mood === null) &&
      !(log.note && log.note.trim());
    if (empty) delete state.logs[dateStr];
  }
}
