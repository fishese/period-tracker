import { toISO, fromISO, addDays } from "../../dateUtils.js";

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseMyCalDate(str) {
  const m = str.trim().match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mon === undefined) return null;
    return new Date(parseInt(m[3], 10), mon, parseInt(m[2], 10));
  }
  const iso = str.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]);
  return null;
}

function parseLine(line) {
  const tabIdx = line.indexOf("\t");
  if (tabIdx === -1) return null;
  const dateStr = line.slice(0, tabIdx).trim();
  const content = line.slice(tabIdx + 1).trim();
  const date = parseMyCalDate(dateStr);
  if (!date) return null;
  return { iso: toISO(date), content };
}

function parsePeriodEvents(lines) {
  const events = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const typeMatch = trimmed.match(/Period\s+(Starts?|Ends?)/i);
    if (!typeMatch) continue;
    const dateStr = trimmed
      .replace(/Period\s+(Starts?|Ends?)/i, "")
      .replace(/\t/g, " ")
      .trim()
      .replace(/[,\t]+$/, "")
      .trim();
    const date = parseMyCalDate(dateStr);
    if (!date) continue;
    const type = /start/i.test(typeMatch[1]) ? "start" : "end";
    events.push({ iso: toISO(date), type });
  }

  events.sort((a, b) => a.iso.localeCompare(b.iso));

  const periods = [];
  let openStart = null;
  for (const ev of events) {
    if (ev.type === "start") {
      if (openStart) {
        periods.push({ start: openStart, end: openStart, hasSourceFlow: false });
      }
      openStart = ev.iso;
    } else if (openStart) {
      periods.push({ start: openStart, end: ev.iso, hasSourceFlow: false });
      openStart = null;
    } else {
      periods.push({ start: ev.iso, end: ev.iso, hasSourceFlow: false });
    }
  }
  if (openStart) {
    periods.push({ start: openStart, end: openStart, hasSourceFlow: false });
  }
  return periods;
}

function parseSymptomsValue(raw) {
  const result = { flowLevels: [], spotting: false, leftovers: [] };
  const body = raw.startsWith("Symptoms:") ? raw.slice("Symptoms:".length) : raw;

  for (const group of body.split(";")) {
    const trimmed = group.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^(\+{1,4})(.*)$/);
    if (!m) continue;
    const prefix = m[1];
    const level = prefix.length;
    const names = m[2].split(",").map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      if (name === "Flow") {
        result.flowLevels.push(level);
      } else if (name === "Spotting") {
        result.spotting = true;
        result.leftovers.push(`symptom(${prefix}):Spotting`);
      } else {
        result.leftovers.push(`symptom(${prefix}):${name}`);
      }
    }
  }

  return result;
}

function ensureDay(days, iso) {
  if (!days[iso]) {
    days[iso] = { leftovers: [] };
  } else if (!days[iso].leftovers) {
    days[iso].leftovers = [];
  }
  return days[iso];
}

function periodContainsDate(period, iso) {
  let current = fromISO(period.start);
  const end = fromISO(period.end);
  while (current <= end) {
    if (toISO(current) === iso) return true;
    current = addDays(current, 1);
  }
  return false;
}

function updatePeriodSourceFlow(periods, days) {
  for (const period of periods) {
    let hasFlow = false;
    for (const [iso, day] of Object.entries(days)) {
      if (day.flow !== undefined && periodContainsDate(period, iso)) {
        hasFlow = true;
        break;
      }
    }
    period.hasSourceFlow = hasFlow;
  }
}

/**
 * Parse a My Calendar text export into the shared ImportPreview model.
 *
 * @returns {{ preview: import("../import-core.js").ImportPreview }} | {{ error: string }}
 */
export function parseMyCalendarText(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  const periods = parsePeriodEvents(lines);
  if (periods.length === 0) {
    return {
      error: 'No periods found. Each line needs a date and "Period Starts" or "Period Ends".',
    };
  }

  const days = {};
  const unmappedMoods = [];

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;

    const { iso, content } = parsed;

    if (/^Symptoms:/i.test(content)) {
      const symptoms = parseSymptomsValue(content);
      const day = ensureDay(days, iso);
      if (symptoms.flowLevels.length > 0) {
        day.flow = Math.max(...symptoms.flowLevels);
      }
      if (symptoms.spotting) {
        day.spotting = true;
      }
      if (symptoms.leftovers.length > 0) {
        day.leftovers.push(...symptoms.leftovers);
      }
      continue;
    }

    if (/^Moods:/i.test(content)) {
      const label = content.slice("Moods:".length).trim();
      if (label) {
        unmappedMoods.push({ date: iso, label });
        const day = ensureDay(days, iso);
        day.leftovers.push(`Moods:${label}`);
      }
      continue;
    }

    if (/^Temperature:/i.test(content)) {
      const day = ensureDay(days, iso);
      day.leftovers.push(content);
      continue;
    }
  }

  updatePeriodSourceFlow(periods, days);

  return {
    preview: {
      source: "mycalendar",
      periods,
      days,
      unmappedMoods,
    },
  };
}
