import { toISO, fromISO, addDays } from "../dateUtils.js";

/**
 * @typedef {{
 *   source: string,
 *   periods: Array<{ start: string, end: string, hasSourceFlow: boolean }>,
 *   days: Record<string, {
 *     flow?: 1|2|3|4,
 *     spotting?: boolean,
 *     mood?: number,
 *     pain?: number,
 *     note?: string,
 *     leftovers: string[]
 *   }>,
 *   unmappedMoods: Array<{ date: string, label: string }>
 * }} ImportPreview
 */

export function parseFlowPattern(str) {
  const trimmed = String(str).trim();
  if (!trimmed) {
    return { error: "Pattern is empty" };
  }

  const pattern = [];
  for (const part of trimmed.split(",")) {
    const token = part.trim();
    if (!token) {
      return { error: "Invalid pattern" };
    }
    const value = Number(token);
    if (!Number.isInteger(value) || value < 0 || value > 4) {
      return { error: `Invalid flow value: ${token}` };
    }
    pattern.push(value);
  }

  return { pattern };
}

export function applyFlowPattern(preview, { pattern, mode }) {
  const out = structuredClone(preview);
  if (!pattern?.length) {
    return out;
  }

  const anySourceFlow = out.periods.some((period) => period.hasSourceFlow);
  const effectiveMode = anySourceFlow ? mode : "overwrite";

  for (const period of out.periods) {
    const shouldApply =
      effectiveMode === "overwrite" ||
      (effectiveMode === "fill-gaps" && !period.hasSourceFlow);
    if (!shouldApply) {
      continue;
    }

    let offset = 0;
    let current = fromISO(period.start);
    const endDate = fromISO(period.end);

    while (current <= endDate) {
      const dateKey = toISO(current);
      const value = pattern[Math.min(offset, pattern.length - 1)];

      if (!out.days[dateKey]) {
        out.days[dateKey] = { leftovers: [] };
      }
      const day = out.days[dateKey];
      if (!day.leftovers) {
        day.leftovers = [];
      }

      if (value === 0) {
        day.spotting = true;
        delete day.flow;
      } else {
        day.flow = value;
        delete day.spotting;
      }

      current = addDays(current, 1);
      offset += 1;
    }
  }

  return out;
}

export function previewToLogs(preview) {
  const logs = {};
  const leftoverReport = [];

  for (const [date, day] of Object.entries(preview.days || {})) {
    const log = {};
    if (day.flow !== undefined) {
      log.flow = day.flow;
    }
    if (day.spotting) {
      log.spotting = true;
    }
    if (day.mood !== undefined) {
      log.mood = day.mood;
    }
    if (day.pain !== undefined) {
      log.pain = day.pain;
    }

    const leftovers = day.leftovers || [];
    for (const detail of leftovers) {
      leftoverReport.push({ date, detail });
    }

    const noteParts = [];
    if (day.note) {
      noteParts.push(day.note);
    }
    if (leftovers.length > 0) {
      noteParts.push(leftovers.join("; "));
    }
    if (noteParts.length > 0) {
      log.note = noteParts.join("\n").slice(0, 500);
    }

    if (Object.keys(log).length > 0) {
      logs[date] = log;
    }
  }

  return {
    logs,
    unmappedMoods: preview.unmappedMoods || [],
    leftoverReport,
  };
}

function csvEscape(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildReportCsv(report) {
  const rows = [["date", "kind", "detail"]];

  for (const { date, label } of report.unmappedMoods || []) {
    rows.push([date, "unmapped_mood", label]);
  }
  for (const { date, detail } of report.leftovers || []) {
    rows.push([date, "leftover", detail]);
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function buildReportText(report) {
  const lines = [];

  if (report.summary) {
    lines.push("Import report");
    if (report.summary.source) {
      lines.push(`Source: ${report.summary.source}`);
    }
    lines.push("");
  }

  const moods = report.unmappedMoods || [];
  if (moods.length > 0) {
    lines.push("Unmapped moods");
    for (const { date, label } of moods) {
      lines.push(`${date} — ${label}`);
    }
    lines.push("");
  }

  const leftovers = report.leftovers || [];
  if (leftovers.length > 0) {
    lines.push("Leftovers");
    for (const { date, detail } of leftovers) {
      lines.push(`${date}: ${detail}`);
    }
  }

  return lines.join("\n");
}

export function countPreview(preview) {
  const periods = preview.periods?.length ?? 0;
  const periodsWithFlow =
    preview.periods?.filter((period) => period.hasSourceFlow).length ?? 0;

  let daysWithFlow = 0;
  let daysWithMood = 0;
  let daysWithLeftovers = 0;

  for (const day of Object.values(preview.days || {})) {
    if (day.flow !== undefined) {
      daysWithFlow += 1;
    }
    if (day.mood !== undefined) {
      daysWithMood += 1;
    }
    if (day.leftovers?.length > 0) {
      daysWithLeftovers += 1;
    }
  }

  return {
    periods,
    periodsWithFlow,
    daysWithFlow,
    daysWithMood,
    daysWithLeftovers,
    unmappedMoodCount: preview.unmappedMoods?.length ?? 0,
  };
}
