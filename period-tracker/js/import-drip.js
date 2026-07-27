"use strict";

export { buildCycleHistoryFromLogs } from "./import/adapters/drip.js";
export { parseDripCsvToPreview } from "./import/adapters/drip.js";

import { previewToLogs } from "./import/import-core.js";
import { parseDripCsvToPreview } from "./import/adapters/drip.js";

/**
 * Legacy API — wraps previewToLogs for callers not yet migrated to ImportPreview.
 */
export function parseDripCsv(csvText) {
  const result = parseDripCsvToPreview(csvText);
  if (result.error) {
    return { error: result.error };
  }

  const { logs } = previewToLogs(result.preview);
  const periodCount = Object.values(logs).filter((l) => l.flow).length;

  return { logs, periodCount, dayCount: Object.keys(logs).length };
}
